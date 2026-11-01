import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import type { Category, IconEntry } from '../../lib/icons'
import Controls, { type Background } from './Controls'
import IconCard from './IconCard'
import IconPanel from './IconPanel'
import { haystack, innerSvg, isMarker, normalise, presets, shortTitle } from './util'

type Theme = 'light' | 'dark'

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
  const [custom, setCustom] = useState('#7c3aed')
  // null: follow the site theme until a background is chosen.
  const [background, setBackground] = useState<Background | null>(null)
  const [siteTheme, setSiteTheme] = useState<Theme | null>(null)
  const [filled, setFilled] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [focusIndex, setFocusIndex] = useState(0)

  const gridRef = useRef<HTMLUListElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLButtonElement | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Derived once per page load, not per keystroke.
  const index = useMemo(
    () =>
      icons.map((icon) => ({ icon, text: haystack(icon), inner: innerSvg(icon.svg), title: shortTitle(icon, icons) })),
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
    observer.observe(html, { attributes: true, attributeFilter: ['data-theme'] })

    const name = new URL(location.href).searchParams.get('icon')
    if (name && byName.has(name)) setSelected(name)
    setReady(true)
    return () => observer.disconnect()
  }, [byName])

  useEffect(() => {
    if (focusIndex >= visible.length) setFocusIndex(Math.max(0, visible.length - 1))
  }, [visible.length, focusIndex])

  const close = useCallback(() => {
    setSelected(null)
    setIconParam(null)
    const opener = openerRef.current
    if (opener?.isConnected) opener.focus()
    else searchRef.current?.querySelector('input')?.focus()
  }, [])

  const open = useCallback((name: string, card: HTMLButtonElement) => {
    openerRef.current = card
    setSelected(name)
    setIconParam(name)
    // On small screens the panel is a bottom sheet over the grid: move focus into it.
    if (!matchMedia('(min-width: 768px)').matches) requestAnimationFrame(() => headingRef.current?.focus())
  }, [])

  useEffect(() => {
    if (!selected) return
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selected, close])

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
    if (!presets.some((preset) => preset.value === value)) setCustom(value)
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
          onFilled={setFilled}
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
                className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-1"
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
            <div className="fixed inset-0 z-30 bg-black/40 md:hidden" aria-hidden="true" onClick={close} />
            <IconPanel
              icon={current.icon}
              title={current.title}
              size={size}
              stroke={stroke}
              colour={colour}
              filled={filled}
              onFilled={setFilled}
              onClose={close}
              headingRef={headingRef}
            />
          </>
        )}
      </div>
    </div>
  )
}
