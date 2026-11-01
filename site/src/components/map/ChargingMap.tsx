import 'maplibre-gl/dist/maplibre-gl.css'
import type { ExpressionSpecification, Map as MapLibreMap, Offset, Popup, StyleSpecification } from 'maplibre-gl'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
// MapLibre 6 runs its tile worker from a separate module file next to its own bundle; after bundling
// that path is gone, so the worker is bundled by Vite (as a hashed .js asset) and its URL set below.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { loadMarkerImage, markerImage } from '../../lib/marker-image'
import {
  connectorIcon,
  currentInfo,
  mapStatuses,
  stations,
  statusColour,
  statusInfo,
  type Connector,
  type Station,
} from './stations'

// OpenFreeMap is the only external source of the site, and only this page loads it.
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'
// Start on Rosenheim (Upper Bavaria), fitted to the demo stations: zoom 12.5 to 13 on a desktop
// map, a little less on a phone, so every pin is in view. No animation.
const BOUNDS: [[number, number], [number, number]] = [
  [Math.min(...stations.map((s) => s.lng)), Math.min(...stations.map((s) => s.lat))],
  [Math.max(...stations.map((s) => s.lng)), Math.max(...stations.map((s) => s.lat))],
]
/** Give up on the tile style after this long and draw the markers on a plain background. */
const STYLE_TIMEOUT = 15_000

// Marker sizes in CSS px (README: 24 to 40). The selected pin gets its own, larger image
// rather than `icon-size`, so it stays sharp.
const PIN = 32
const PIN_SELECTED = 40
const BADGE = 24

type Phase = 'loading' | 'ready' | 'offline'
type MapLibre = typeof import('maplibre-gl')
type Origin = 'map' | 'list'

declare global {
  interface Window {
    /** Debug hook for the tests: the marker images registered on the map. */
    __evMap?: { listImages: () => string[] }
  }
}

/**
 * Offset that puts the tip of a pin of `size` px on the point (anchor `bottom`). In the 24-unit
 * grid the tip is at y 22 and the head is a circle around (12, 10) with radius 7.5.
 */
const pinOffset = (size: number): [number, number] => [0, size / 12]

/** Offset of the AC/DC badge: its tip sits on the pin head, up and to the right (45°). */
function badgeOffset(pin: number): [number, number] {
  const s = pin / 24
  const r = 7.5 * s + 0.75 * s // head radius plus half the stroke
  return [r * Math.SQRT1_2, -12 * s - r * Math.SQRT1_2 + BADGE / 12]
}

function iconImage(selected: string | null): ExpressionSpecification {
  return [
    'case',
    ['==', ['get', 'id'], selected ?? ''],
    ['concat', 'ev-', ['get', 'status'], '-selected'],
    ['concat', 'ev-', ['get', 'status']],
  ]
}

function iconOffset(selected: string | null, pin: (size: number) => [number, number]): ExpressionSpecification {
  return ['case', ['==', ['get', 'id'], selected ?? ''], ['literal', pin(PIN_SELECTED)], ['literal', pin(PIN)]]
}

/** Popup offsets per anchor: clear of the selected pin, whichever side the popup opens on. */
const popupOffset: Offset = {
  center: [0, 0],
  top: [0, 6],
  bottom: [0, -(PIN_SELECTED + 2)],
  left: [PIN_SELECTED / 2, -PIN_SELECTED / 2],
  right: [-PIN_SELECTED / 2, -PIN_SELECTED / 2],
  'top-left': [PIN_SELECTED / 4, 0],
  'top-right': [-PIN_SELECTED / 4, 0],
  'bottom-left': [PIN_SELECTED / 4, -(PIN_SELECTED + 2)],
  'bottom-right': [-PIN_SELECTED / 4, -(PIN_SELECTED + 2)],
}

function fallbackStyle(background: string): StyleSpecification {
  return { version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': background } }] }
}

const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

/** The 12 marker images: one pin per status (normal and selected) and the AC/DC badges. */
function markerImages(): Promise<[string, HTMLImageElement][]> {
  const urls: [string, string][] = []
  for (const status of mapStatuses) {
    const colour = cssVar(`--status-${status}`)
    urls.push([`ev-${status}`, markerImage(`marker-${status}`, colour, PIN)])
    urls.push([`ev-${status}-selected`, markerImage(`marker-${status}`, colour, PIN_SELECTED)])
  }
  const accent = cssVar('--accent')
  urls.push(['ev-ac', markerImage('marker-ac', accent, BADGE)], ['ev-dc', markerImage('marker-dc', accent, BADGE)])
  return Promise.all(urls.map(async ([id, url]) => [id, await loadMarkerImage(url)] as [string, HTMLImageElement]))
}

function countConnectors(connectors: Connector[]): [Connector, number][] {
  const counts = new Map<Connector, number>()
  for (const c of connectors) counts.set(c, (counts.get(c) ?? 0) + 1)
  return [...counts]
}

function StationCard({ station, headingRef }: { station: Station; headingRef: React.Ref<HTMLHeadingElement> }) {
  const { label, icon: StatusIcon } = statusInfo[station.status]
  return (
    <div className="space-y-2 pr-5 text-sm" data-station-card={station.id}>
      <h3 ref={headingRef} tabIndex={-1} className="text-base leading-tight focus:outline-none">
        {station.name}
      </h3>
      <p className="flex items-center gap-1.5">
        <span style={{ color: statusColour(station.status) }} className="inline-flex">
          <StatusIcon size={20} aria-hidden="true" />
        </span>
        <span data-station-status>{label}</span>
      </p>
      <p>
        <span className="rounded bg-accent px-1.5 py-0.5 text-xs font-semibold text-accent-fg">
          {currentInfo[station.current].label}
        </span>{' '}
        up to {station.kW} kW
      </p>
      <ul className="space-y-1" aria-label="Connectors">
        {countConnectors(station.connectors).map(([connector, count]) => {
          const Plug = connectorIcon[connector]
          return (
            <li key={connector} className="flex items-center gap-1.5">
              <Plug size={20} aria-hidden="true" />
              <span>{count > 1 ? `${count} × ${connector}` : connector}</span>
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-muted">Demo data — fictional charge point</p>
    </div>
  )
}

function stationSummary(station: Station) {
  return `${statusInfo[station.status].label} · ${currentInfo[station.current].label} ${station.kW} kW`
}

/** The map island; `children` (the static legend) goes below the map. */
export default function ChargingMap({ children }: { children?: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const libRef = useRef<MapLibre | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const popupRef = useRef<Popup | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const openerRef = useRef<HTMLButtonElement | null>(null)
  const originRef = useRef<Origin>('map')
  const [phase, setPhase] = useState<Phase>('loading')
  // Bumped after each style load (tile style, then maybe the fallback): the selection is re-applied.
  const [styleVersion, setStyleVersion] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [popupNode, setPopupNode] = useState<HTMLDivElement | null>(null)

  const byId = useMemo(() => new Map(stations.map((s) => [s.id, s])), [])
  const current = selected ? byId.get(selected) : undefined

  // Create the map once; MapLibre is loaded on demand, so only this page downloads it.
  useEffect(() => {
    let cancelled = false
    let map: MapLibreMap | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    setPopupNode(document.createElement('div'))

    ;(async () => {
      const mod = await import('maplibre-gl')
      const maplibre = (mod as { default?: MapLibre }).default ?? mod
      const container = containerRef.current
      if (cancelled || !container) return
      libRef.current = maplibre
      maplibre.setWorkerUrl(workerUrl)

      map = new maplibre.Map({
        container,
        style: STYLE_URL,
        bounds: BOUNDS,
        fitBoundsOptions: { padding: { top: 56, bottom: 24, left: 24, right: 24 }, maxZoom: 13 },
        cooperativeGestures: true,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        // The style's sources credit OpenFreeMap and OpenStreetMap; `{}` drops the default MapLibre
        // link and keeps the control compact on narrow maps.
        attributionControl: {},
        fadeDuration: reduceMotion ? 0 : 300,
      })
      mapRef.current = map
      map.touchZoomRotate.disableRotation()
      map.keyboard.disableRotation()
      map.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right')
      window.__evMap = {
        listImages: () => {
          try {
            return map ? map.listImages().filter((id) => id.startsWith('ev-')) : []
          } catch {
            return [] // the style is still loading
          }
        },
      }

      const images = markerImages()
      let styleLoaded = false
      let tilesLoaded = false
      let offline = false

      const goOffline = () => {
        if (offline || !map) return
        offline = true
        clearTimeout(timer)
        setPhase('offline')
        // Keep the markers: a plain background instead of the tiles.
        map.setStyle(fallbackStyle(cssVar('--surface') || '#fafafa'))
      }
      timer = setTimeout(() => {
        if (!styleLoaded) goOffline()
      }, STYLE_TIMEOUT)

      map.on('error', (event) => {
        // Before the style has loaded, or before any tile has arrived, an error means no map.
        const sourceError = 'sourceId' in event || 'tile' in event
        if (!styleLoaded || (sourceError && !tilesLoaded)) goOffline()
      })
      map.on('sourcedata', (event) => {
        if (event.sourceId === 'openmaptiles' && event.tile) tilesLoaded = true
      })

      // Runs for the tile style and again for the fallback style (setStyle drops images and layers).
      map.on('style.load', async () => {
        if (!map) return
        if (!offline) {
          styleLoaded = true
          clearTimeout(timer)
        }
        const decoded = await images
        if (cancelled || !map) return
        for (const [id, img] of decoded) if (!map.hasImage(id)) map.addImage(id, img, { pixelRatio: 2 })
        if (!map.getSource('ev-stations')) {
          map.addSource('ev-stations', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: stations.map((s) => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
                properties: { id: s.id, status: s.status, current: s.current },
              })),
            },
          })
        }
        if (!map.getLayer('ev-current')) {
          map.addLayer({
            id: 'ev-current',
            type: 'symbol',
            source: 'ev-stations',
            layout: {
              'icon-image': ['concat', 'ev-', ['get', 'current']],
              'icon-anchor': 'bottom',
              'icon-offset': iconOffset(null, badgeOffset),
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
            },
          })
        }
        if (!map.getLayer('ev-stations')) {
          map.addLayer({
            id: 'ev-stations',
            type: 'symbol',
            source: 'ev-stations',
            layout: {
              'icon-image': iconImage(null),
              'icon-anchor': 'bottom',
              'icon-offset': iconOffset(null, pinOffset),
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
            },
          })
        }
        if (!offline) setPhase('ready')
        setStyleVersion((v) => v + 1)
      })

      for (const layer of ['ev-stations', 'ev-current']) {
        map.on('click', layer, (event) => {
          const id = event.features?.[0]?.properties?.id
          if (typeof id === 'string') {
            originRef.current = 'map'
            setSelected(id)
          }
        })
        map.on('mouseenter', layer, () => {
          if (map) map.getCanvas().style.cursor = 'pointer'
        })
        map.on('mouseleave', layer, () => {
          if (map) map.getCanvas().style.cursor = ''
        })
      }
    })().catch(() => {
      if (!cancelled) setPhase('offline')
    })

    return () => {
      cancelled = true
      clearTimeout(timer)
      map?.remove()
      mapRef.current = null
      delete window.__evMap
    }
  }, [])

  // Selection: highlight the pin and show the popup.
  useEffect(() => {
    const map = mapRef.current
    const maplibre = libRef.current
    if (!map || !maplibre || styleVersion === 0 || !popupNode) return
    if (map.getLayer('ev-stations')) {
      map.setLayoutProperty('ev-stations', 'icon-image', iconImage(selected))
      map.setLayoutProperty('ev-stations', 'icon-offset', iconOffset(selected, pinOffset))
      map.setLayoutProperty('ev-current', 'icon-offset', iconOffset(selected, badgeOffset))
    }
    const station = selected ? byId.get(selected) : undefined
    if (!station) {
      popupRef.current?.remove()
      return
    }
    {
      let popup = popupRef.current
      if (!popup) {
        popup = new maplibre.Popup({ offset: popupOffset, maxWidth: '18rem', focusAfterOpen: false })
        popup.setDOMContent(popupNode)
        popup.on('close', () => {
          setSelected(null)
          if (originRef.current === 'list') openerRef.current?.focus()
        })
        popupRef.current = popup
      }
      const center: [number, number] = [station.lng, station.lat]
      popup.setLngLat(center)
      if (!popup.isOpen()) {
        popup.addTo(map)
        popup.getElement()?.addEventListener('keydown', (event) => {
          if (event.key === 'Escape') {
            event.stopPropagation()
            popupRef.current?.remove()
          }
        })
      }
      if (originRef.current === 'list') {
        const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
        if (reduceMotion) map.jumpTo({ center })
        else map.easeTo({ center, duration: 400 })
        containerRef.current?.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' })
        headingRef.current?.focus({ preventScroll: true })
      }
    }
  }, [selected, styleVersion, popupNode, byId])

  function openFromList(id: string, button: HTMLButtonElement) {
    originRef.current = 'list'
    openerRef.current = button
    if (selected === id) {
      headingRef.current?.focus({ preventScroll: true })
      return
    }
    setSelected(id)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]" data-map data-map-state={phase}>
      <div className="relative h-[60vh] min-h-[22rem] max-h-[40rem] overflow-hidden rounded-lg border border-border bg-surface">
        {/* Not `absolute`: MapLibre sets `position: relative` on its container. */}
        <div ref={containerRef} className="h-full w-full" />
        {phase === 'loading' && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted">
            Loading map…
          </p>
        )}
        {phase === 'offline' && (
          <div
            role="status"
            className="absolute left-3 right-14 top-3 z-10 rounded-md border border-border bg-bg/95 px-3 py-2 text-sm shadow-sm sm:right-auto sm:max-w-sm"
            data-map-notice
          >
            <p className="font-medium">Map tiles could not be loaded</p>
            <p className="text-muted">The markers, the legend and the station list still work.</p>
          </div>
        )}
      </div>

      <div className="lg:col-start-1">{children}</div>

      <section aria-labelledby="stations-heading" className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <h2 id="stations-heading" className="text-base">
          Stations
        </h2>
        <p className="mt-1 text-sm text-muted">Select a station to show it on the map.</p>
        <ul className="mt-3 divide-y divide-border rounded-lg border border-border" data-stations>
          {stations.map((station) => {
            const { marker: Marker } = statusInfo[station.status]
            const isSelected = selected === station.id
            return (
              <li key={station.id}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-surface ${
                    isSelected ? 'bg-surface' : ''
                  }`}
                  aria-pressed={isSelected}
                  data-station={station.id}
                  onClick={(event) => openFromList(station.id, event.currentTarget)}
                >
                  <span className="marker-filled inline-flex shrink-0" style={{ color: statusColour(station.status) }}>
                    {Marker && <Marker size={24} aria-hidden="true" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium text-fg">{station.name}</span>
                    <span className="block text-muted">{stationSummary(station)}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      {popupNode && current && createPortal(<StationCard station={current} headingRef={headingRef} />, popupNode)}
    </div>
  )
}
