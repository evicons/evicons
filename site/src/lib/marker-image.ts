// Filled map markers for map libraries, after the MapLibre recipe in the README ("Map markers").
// Map libraries draw markers as images, where page CSS does not apply: fill the SVG text instead.
import markerAc from '@evicons/svg/marker-ac.svg?raw'
import markerAvailable from '@evicons/svg/marker-available.svg?raw'
import markerCharging from '@evicons/svg/marker-charging.svg?raw'
import markerDc from '@evicons/svg/marker-dc.svg?raw'
import markerFaulted from '@evicons/svg/marker-faulted.svg?raw'
import markerOccupied from '@evicons/svg/marker-occupied.svg?raw'
import markerOutOfService from '@evicons/svg/marker-out-of-service.svg?raw'
import markerUnknown from '@evicons/svg/marker-unknown.svg?raw'

const sources = {
  'marker-ac': markerAc,
  'marker-available': markerAvailable,
  'marker-charging': markerCharging,
  'marker-dc': markerDc,
  'marker-faulted': markerFaulted,
  'marker-occupied': markerOccupied,
  'marker-out-of-service': markerOutOfService,
  'marker-unknown': markerUnknown,
} as const

export type MarkerName = keyof typeof sources

/**
 * Fill a marker SVG: the first `<path>` (the pin) in `colour`, the sign in white.
 * The SVG is drawn at twice `size`, for `map.addImage(id, img, { pixelRatio: 2 })`.
 */
export function fillMarker(svg: string, colour: string, size = 32): string {
  return svg
    .replace('width="24" height="24"', `width="${size * 2}" height="${size * 2}"`)
    .replace('stroke="currentColor"', 'stroke="#fff"')
    .replace('<path ', `<path fill="${colour}" stroke="${colour}" `)
}

/** Data URL of a filled marker; `size` is the size on the map in CSS px (24 to 40). */
export function markerImage(name: MarkerName, colour: string, size = 32): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fillMarker(sources[name], colour, size))}`
}

/** Decode a marker data URL into an image for `map.addImage`. */
export async function loadMarkerImage(url: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.src = url
  await img.decode()
  return img
}
