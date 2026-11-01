import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import type { Category, IconEntry } from '../../lib/icons'
import Controls, { type Background } from './Controls'
import IconCard from './IconCard'
import IconPanel from './IconPanel'
import { haystack, innerSvg, isMarker, normalise, presets, shortTitle } from './util'

type Theme = 'light' | 'dark'

// Filled markers need a real colour: with currentColor the pin turns white on dark and the white sign disappears.
const filledColour = '#2563eb'
const desktop = '(min-width: 768px)'

/**
 * Make everything outside `keep` inert (the siblings of `keep` and of each of its ancestors), except `except`.
 * Returns a function that undoes it.
 */
function inertOutside(keep: HTMLElement, except: (el: Element) => boolean): () => void {
  const changed: HTMLElement[] = []
  for (let node: HTMLElement | null = keep; node && node !== document.body; node = node.parentElement) {
    for (const sibling of Array.from(node.parentElement?.children ?? [])) {
      if (sibling === node || !(sibling instanceof HTMLElement) || sibling.inert || except(sibling)) continue
      sibling.inert = true
      changed.push(sibling)
    }
  }
  return () => changed.forEach((el) => (el.inert = false))
}

function setIconParam(name: string | null) {
  const url = new URL(location.href)
  if (name) url.searchParams.set('icon', name)
  else url.searchParams.delete('icon')
  history.replaceState(history.state, '', url)
}

export default function Gallery({ icons }: { icons: IconEntry[] }) {
  const [ready, setReady] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [size, setSize] = useState(24)
  const [stroke, setStroke] = useState(1.5)
  const [colour, setColour] = useState('currentColor')
  // True while the colour is the EV blue that switching on Filled chose, not one the user picked.
  const [autoColour, setAutoColour] = useState(false)
  const [custom, setCustom] = useState('#7c3aed')
  // null: follow the site theme until a background is chosen.
  const [background, setBackground] = useState<Background | null>(null)
  const [siteTheme, setSiteTheme] = useState<Theme | null>(null)
  const [filled, setFilled] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [focusIndex, setFocusIndex] = useState(0)
  // Below `md` the panel is a modal bottom sheet.
  const [mobile, setMobile] = useState(false)

  const gridRef = useRef<HTMLUListElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLButtonElement | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  // Undoes the modal state of the sheet (inert page, no scrolling); null while the sheet is not modal.
  const unmodalRef = useRef<(() => void) | null>(null)

  // Derived once per page load, not per keystroke.
  const index = useMemo(
    () =>
      icons.map((icon) => ({
        icon,
        text: haystack(icon),
        inner: innerSvg(icon.svg),
        title: shortTitle(icon, icons),
      })),
    [icons],
  )
  const byName = useMemo(() => new Map(index.map((item) => [item.icon.name, item])), [index])

  const visible = useMemo(() => {
    const terms = normalise(query).trim().split(/\s+/).filter(Boolean)
    return index.filter(
      (item) =>
        (category === 'all' || item.icon.category === category) && terms.every((term) => item.text.includes(term)),
    )
  }, [index, query, category])

  const current = selected ? byName.get(selected) : undefined
  const showFilled = category === 'marker'

  useEffect(() => {
    const html = document.documentElement
    const read = () => setSiteTheme(html.dataset.theme === 'dark' ? 'dark' : 'light')
    read()
    const observer = new MutationObserver(read)
    observer.observe(html, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    const wide = matchMedia(desktop)
    const onWidth = () => setMobile(!wide.matches)
    onWidth()
    wide.addEventListener('change', onWidth)

    const name = new URL(location.href).searchParams.get('icon')
    if (name && byName.has(name)) setSelected(name)
    setReady(true)
    return () => {
      observer.disconnect()
      wide.removeEventListener('change', onWidth)
    }
  }, [byName])

  useEffect(() => {
    if (focusIndex >= visible.length) setFocusIndex(Math.max(0, visible.length - 1))
  }, [visible.length, focusIndex])

  const close = useCallback((restoreFocus = true) => {
    setSelected(null)
    setIconParam(null)
    // Lift `inert` now, not after the re-render: an inert card cannot take focus.
    unmodalRef.current?.()
    if (!restoreFocus) return
    const opener = openerRef.current
    if (opener?.isConnected) opener.focus()
    else searchRef.current?.querySelector('input')?.focus()
  }, [])

  const open = useCallback((name: string, card: HTMLButtonElement) => {
    openerRef.current = card
    setSelected(name)
    setIconParam(name)
    // On small screens the panel is a bottom sheet over the grid: move focus into it.
    if (!matchMedia(desktop).matches) requestAnimationFrame(() => headingRef.current?.focus())
  }, [])

  useEffect(() => {
    if (!selected) return
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      // Esc in the search field closes the panel only: no native clearing, focus stays in the field.
      if (event.target instanceof HTMLInputElement && event.target.type === 'search') {
        event.preventDefault()
        close(false)
      } else close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selected, close])

  // Modal sheet: the page behind is inert and does not scroll.
  useEffect(() => {
    const panel = panelRef.current
    if (!selected || !mobile || !panel) return
    const restore = inertOutside(panel, (el) => el === backdropRef.current)
    const root = document.documentElement
    const overflow = root.style.overflow
    root.style.overflow = 'hidden'
    const unmodal = () => {
      if (unmodalRef.current !== unmodal) return
      unmodalRef.current = null
      restore()
      root.style.overflow = overflow
    }
    unmodalRef.current = unmodal
    return unmodal
  }, [selected, mobile])

  const onCardKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>) => {
    const grid = gridRef.current
    if (!grid) return
    const buttons = Array.from(grid.querySelectorAll<HTMLButtonElement>('[data-icon-card]'))
    const from = buttons.indexOf(event.currentTarget)
    const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').length || 1
    const moves: Record<string, number> = {
      ArrowRight: from + 1,
      ArrowLeft: from - 1,
      ArrowDown: from + columns,
      ArrowUp: from - columns,
      Home: 0,
      End: buttons.length - 1,
    }
    const to = moves[event.key]
    if (to === undefined) return
    event.preventDefault()
    const next = Math.min(Math.max(to, 0), buttons.length - 1)
    setFocusIndex(next)
    buttons[next]?.focus()
  }, [])

  function chooseColour(value: string) {
    setColour(value)
    setAutoColour(false)
    if (!presets.some((preset) => preset.value === value)) setCustom(value)
  }

  function changeFilled(value: boolean) {
    setFilled(value)
    if (value && colour === 'currentColor') {
      setColour(filledColour)
      setAutoColour(true)
    } else if (!value && autoColour) {
      if (colour === filledColour) setColour('currentColor')
      setAutoColour(false)
    }
  }

  const effectiveBackground = background ?? siteTheme
  const previewClass = background ? `preview-${background}` : 'preview-auto'

  return (
    <div data-gallery data-ready={ready || undefined} className={previewClass}>
      <div ref={searchRef}>
        <Controls
          query={query}
          onQuery={setQuery}
          category={category}
          onCategory={setCategory}
          size={size}
          onSize={setSize}
          stroke={stroke}
          onStroke={setStroke}
          colour={colour}
          onColour={chooseColour}
          custom={custom}
          background={effectiveBackground}
          onBackground={setBackground}
          filled={filled}
          onFilled={changeFilled}
          showFilled={showFilled}
        />
      </div>

      <div
        className={[
          'mt-6',
          current ? 'md:grid md:grid-cols-[minmax(0,1fr)_20rem] md:gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]' : '',
        ].join(' ')}
      >
        <div className="min-w-0">
          <p className="mb-2 text-sm text-muted" aria-live="polite">
            {visible.length === icons.length ? `${icons.length} icons` : `${visible.length} of ${icons.length} icons`}
          </p>
          <div className="rounded-xl border border-(--pv-border) bg-(--pv-bg) p-2">
            {visible.length > 0 ? (
              <ul
                ref={gridRef}
                aria-label="Icons"
                onFocus={(event) => {
                  const cards = Array.from(event.currentTarget.querySelectorAll('[data-icon-card]'))
                  const at = cards.indexOf(event.target as Element)
                  if (at >= 0) setFocusIndex(at)
                }}
                className="grid grid-cols-3 gap-1 sm:grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))]"
              >
                {visible.map((item, i) => (
                  <IconCard
                    key={item.icon.name}
                    icon={item.icon}
                    inner={item.inner}
                    size={size}
                    stroke={stroke}
                    colour={colour}
                    filled={filled && showFilled && isMarker(item.icon)}
                    selected={item.icon.name === selected}
                    tabbable={i === Math.min(focusIndex, visible.length - 1)}
                    onOpen={open}
                    onKeyDown={onCardKeyDown}
                  />
                ))}
              </ul>
            ) : (
              <div className="flex h-28 flex-col items-center justify-center gap-2 text-(--pv-muted)">
                <p>No icons match</p>
                <button type="button" className="text-sm text-link hover:underline" onClick={() => setQuery('')}>
                  Clear search
                </button>
              </div>
            )}
          </div>
        </div>

        {current && (
          <>
            <div
              ref={backdropRef}
              className="fixed inset-0 z-30 bg-black/40 md:hidden dark:bg-black/70"
              aria-hidden="true"
              onClick={() => close()}
            />
            <IconPanel
              icon={current.icon}
              title={current.title}
              size={size}
              stroke={stroke}
              colour={colour}
              filled={filled}
              onFilled={changeFilled}
              onClose={() => close()}
              headingRef={headingRef}
              panelRef={panelRef}
              modal={mobile}
            />
          </>
        )}
      </div>
    </div>
  )
}
