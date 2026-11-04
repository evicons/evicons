import { useEffect, useId, useState, type KeyboardEvent, type Ref } from 'react'
import type { EvIconComponent } from '@evicons/react'
import type { IconEntry } from '../../lib/icons'
import CodeTabs, { type Snippet } from './CodeTabs'
import { innerSvg, isMarker } from './util'

type ReactIcons = typeof import('@evicons/react')

// Loaded on first use: the cards are inline SVG, only the panel needs the React components.
let modulePromise: Promise<ReactIcons> | undefined
const loadReactIcons = () => (modulePromise ??= import('@evicons/react'))

interface Props {
  icon: IconEntry
  title: string
  size: number
  stroke: number
  colour: string
  filled: boolean
  onFilled: (value: boolean) => void
  onClose: () => void
  headingRef: Ref<HTMLHeadingElement>
  panelRef: Ref<HTMLDivElement>
  /** Small screens: a modal bottom sheet. From `md` up: a region beside the grid, focus stays on the cards. */
  modal: boolean
}

function snippets(icon: IconEntry, title: string, size: number, stroke: number, colour: string): Snippet[] {
  const props = [
    `size={${size}}`,
    stroke !== 1.5 ? `strokeWidth={${stroke}}` : '',
    colour !== 'currentColor' ? `color="${colour}"` : '',
    `title="${title}"`,
  ].filter(Boolean)
  return [
    {
      id: 'react',
      label: 'React',
      code: `import { ${icon.pascal} } from '@evicons/react'\n\n<${icon.pascal} ${props.join(' ')} />`,
      wrap: true,
    },
    { id: 'svg', label: 'SVG', code: icon.svg },
    {
      id: 'sprite',
      label: 'Sprite',
      code: [
        `<!-- Copy sprite.svg from @evicons/svg to your app's public folder -->`,
        `<svg width="${size}" height="${size}" aria-hidden="true"><use href="/sprite.svg#evicon-${icon.name}" /></svg>`,
      ].join('\n'),
      wrap: true,
    },
  ]
}

function download(icon: IconEntry) {
  const url = URL.createObjectURL(new Blob([`${icon.svg}\n`], { type: 'image/svg+xml' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${icon.name}.svg`
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

function Preview({
  icon,
  Component,
  size,
  stroke,
  title,
}: {
  icon: IconEntry
  Component: EvIconComponent | undefined
  size: number
  stroke: number
  title?: string
}) {
  if (Component) return <Component size={size} strokeWidth={stroke} title={title} />
  // Until the React module has loaded: the same shapes as inline SVG.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: innerSvg(icon.svg) }}
    />
  )
}

const focusable = 'a[href], button:not([disabled]), input:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'

/** Keep Tab inside the modal sheet: wrap from the last focusable element to the first and back. */
function trapTab(event: KeyboardEvent<HTMLDivElement>) {
  if (event.key !== 'Tab') return
  const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(focusable)).filter(
    (el) => el.getClientRects().length > 0,
  )
  const first = items[0]
  const last = items[items.length - 1]
  if (!first || !last) return
  // The heading (focused when the sheet opens) is not in the list: Shift+Tab from it also wraps to the end.
  const active = document.activeElement as HTMLElement | null
  if (event.shiftKey && (active === first || !active || !items.includes(active))) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}

export default function IconPanel(props: Props) {
  const { icon, title, size, stroke, colour, filled, onFilled, onClose, headingRef, panelRef, modal } = props
  const [icons, setIcons] = useState<ReactIcons | null>(null)
  const headingId = useId()
  const marker = isMarker(icon)
  const fill = marker && filled

  useEffect(() => {
    let active = true
    loadReactIcons().then(
      (mod) => active && setIcons(mod),
      () => {},
    )
    return () => {
      active = false
    }
  }, [])

  const Component = icons ? (icons[icon.pascal as keyof ReactIcons] as EvIconComponent | undefined) : undefined
  const colourStyle = colour === 'currentColor' ? undefined : { color: colour }

  return (
    <div
      ref={panelRef}
      data-icon-panel
      role={modal ? 'dialog' : 'region'}
      aria-modal={modal || undefined}
      aria-labelledby={headingId}
      onKeyDown={modal ? trapTab : undefined}
      className="icon-sheet fixed inset-x-0 bottom-0 z-40 max-h-[85vh] overflow-y-auto overscroll-contain rounded-t-2xl border-t border-border px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl md:pb-5 md:sticky md:inset-auto md:top-4 md:z-auto md:max-h-[calc(100vh-2rem)] md:self-start md:rounded-xl md:border md:shadow-none"
    >
      {/* Sticky header: the name and Close stay in view while the sheet scrolls. */}
      <div className="icon-sheet-head sticky top-0 z-10 -mx-5 flex items-start justify-between gap-3 px-5 pb-3 pt-5 md:pb-2">
        <div
          className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-border md:hidden"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <h2 id={headingId} ref={headingRef} tabIndex={-1} className="break-all font-mono text-lg focus:outline-none">
            {icon.name}
          </h2>
          <p className="mt-1 font-mono text-sm text-muted">{icon.pascal}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          title="Close (Esc)"
          className="-mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-fg"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      <div className="mt-1 rounded-lg border border-(--pv-border) bg-(--pv-bg) text-(--pv-fg)">
        <div
          data-preview
          className={['flex h-36 items-center justify-center', fill ? 'marker-filled' : ''].join(' ')}
          style={colourStyle}
        >
          <Preview icon={icon} Component={Component} size={96} stroke={stroke} title={title} />
        </div>
        <div
          className={[
            'flex items-end justify-center gap-5 border-t border-(--pv-border) py-3',
            fill ? 'marker-filled' : '',
          ].join(' ')}
          style={colourStyle}
          aria-hidden="true"
        >
          {[16, 20, 24, 32, 48].map((px) => (
            <span key={px} className="flex flex-col items-center gap-1">
              <Preview icon={icon} Component={Component} size={px} stroke={stroke} />
              <span
                className={[
                  'text-[10px] tabular-nums',
                  px === size ? 'font-semibold text-(--pv-fg)' : 'text-(--pv-muted)',
                ].join(' ')}
              >
                {px}
              </span>
            </span>
          ))}
        </div>
      </div>

      {marker && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <button
            type="button"
            role="switch"
            aria-checked={filled}
            onClick={() => onFilled(!filled)}
            className="group flex items-center gap-2 text-muted hover:text-fg"
          >
            <span className="relative h-5 w-9 rounded-full border border-border bg-surface motion-safe:transition-colors group-aria-checked:border-accent group-aria-checked:bg-accent">
              <span className="absolute left-0.5 top-0.5 size-3.5 rounded-full bg-muted motion-safe:transition-transform group-aria-checked:translate-x-4 group-aria-checked:bg-white" />
            </span>
            Filled
          </button>
          <a href="/docs#markers" className="text-sm">
            Filling markers with CSS
          </a>
        </div>
      )}

      <p className="mt-4 text-sm">{icon.meaning.en}</p>

      <dl className="mt-4 space-y-2 text-sm">
        {(['en', 'de', 'fr'] as const).map((lang) => (
          <div key={lang} className="flex gap-3">
            <dt className="w-6 shrink-0 pt-0.5 font-mono text-xs uppercase text-muted">{lang}</dt>
            <dd className="flex flex-wrap gap-1">
              {icon.tags[lang].map((tag) => (
                <span key={tag} className="rounded bg-surface px-1.5 py-0.5 text-xs text-muted">
                  {tag}
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>

      {icon.standard && (
        <div className="mt-4 text-sm">
          <p>
            <span className="text-muted">Standard: </span>
            {icon.standard.norm}
          </p>
          <details className="mt-1">
            <summary className="cursor-pointer text-muted hover:text-fg">How the drawing was checked</summary>
            <p className="mt-2 break-words text-xs leading-relaxed text-muted">{icon.standard.source}</p>
          </details>
        </div>
      )}

      <div className="mt-5">
        <CodeTabs snippets={snippets(icon, title, size, stroke, colour)} />
      </div>

      <button
        type="button"
        onClick={() => download(icon)}
        data-track="download_svg"
        data-icon={icon.name}
        className="mt-4 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 4v11m-4.5-4.5L12 15l4.5-4.5M5 19h14" />
        </svg>
        Download SVG
      </button>
    </div>
  )
}
