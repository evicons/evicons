import { useId, useState, type ReactNode } from 'react'
import type { Category } from '../../lib/icons'
import { categories, presets, sizes, strokes } from './util'

export type Background = 'light' | 'dark'

interface Props {
  query: string
  onQuery: (value: string) => void
  category: Category | 'all'
  onCategory: (value: Category | 'all') => void
  size: number
  onSize: (value: number) => void
  stroke: number
  onStroke: (value: number) => void
  colour: string
  onColour: (value: string) => void
  custom: string
  background: Background | null
  onBackground: (value: Background) => void
  filled: boolean
  onFilled: (value: boolean) => void
  showFilled: boolean
}

const segment =
  'min-w-9 rounded-md px-2.5 py-1 text-sm tabular-nums text-muted hover:text-fg aria-pressed:bg-bg aria-pressed:text-fg aria-pressed:shadow-sm'

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted" aria-hidden="true">
        {label}
      </span>
      <div
        role="group"
        aria-label={label}
        className="flex items-center gap-0.5 rounded-lg border border-border bg-surface p-0.5"
      >
        {children}
      </div>
    </div>
  )
}

export default function Controls(props: Props) {
  const { query, onQuery, category, onCategory, size, onSize, stroke, onStroke, colour, onColour, custom } = props
  const { background, onBackground, filled, onFilled, showFilled } = props
  const isCustom = !presets.some((preset) => preset.value === colour)
  // Below `md` the appearance controls fold into a "Customise" section, so the icons start higher up.
  const [customise, setCustomise] = useState(false)
  const customiseId = useId()
  const colourLabel = presets.find((preset) => preset.value === colour)?.label ?? colour

  return (
    <div className="space-y-4">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m15.5 15.5 5 5" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Search icons (en, de, fr)"
          aria-label="Search icons"
          autoComplete="off"
          spellCheck={false}
          className="h-11 w-full rounded-lg border border-border bg-bg pl-10 pr-3 text-base text-fg placeholder:text-muted focus:border-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-accent"
        />
      </div>

      <div role="group" aria-label="Category" className="flex flex-wrap gap-2">
        {categories.map((chip) => (
          <button
            key={chip.id}
            type="button"
            aria-pressed={category === chip.id}
            onClick={() => onCategory(chip.id)}
            className="rounded-full border border-border px-3 py-1 text-sm text-muted hover:text-fg aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-fg"
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="button"
          aria-expanded={customise}
          aria-controls={customiseId}
          onClick={() => setCustomise(!customise)}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-fg hover:bg-surface md:hidden"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            aria-hidden="true"
            className={['motion-safe:transition-transform', customise ? 'rotate-90' : ''].join(' ')}
          >
            <path d="m9 6 6 6-6 6" />
          </svg>
          Customise
          <span className="text-xs tabular-nums text-muted">
            {size} px · {stroke} · {colourLabel}
          </span>
        </button>

        <div
          id={customiseId}
          className={[
            customise ? 'flex' : 'hidden',
            'basis-full flex-wrap items-center gap-x-6 gap-y-3 md:contents',
          ].join(' ')}
        >
          <Group label="Size">
            {sizes.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={size === value}
                onClick={() => onSize(value)}
                className={segment}
              >
                {value}
              </button>
            ))}
          </Group>

          <Group label="Stroke">
            {strokes.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={stroke === value}
                onClick={() => onStroke(value)}
                className={segment}
              >
                {value}
              </button>
            ))}
          </Group>

          <Group label="Colour">
            {presets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                aria-pressed={colour === preset.value}
                aria-label={preset.label}
                title={preset.label}
                onClick={() => onColour(preset.value)}
                className="flex size-8 items-center justify-center rounded-md aria-pressed:bg-bg aria-pressed:shadow-sm"
              >
                <span
                  className={[
                    'size-5 rounded-full border border-border',
                    preset.value === 'currentColor' ? 'bg-[linear-gradient(135deg,var(--fg)_50%,var(--bg)_50%)]' : '',
                  ].join(' ')}
                  style={preset.value === 'currentColor' ? undefined : { background: preset.value }}
                />
              </button>
            ))}
            <label
              className={[
                'relative flex size-8 cursor-pointer items-center justify-center rounded-md focus-within:outline-2 focus-within:outline-accent',
                isCustom ? 'bg-bg shadow-sm' : '',
              ].join(' ')}
              title="Custom colour"
            >
              <span
                className="size-5 rounded-full border border-border"
                style={{
                  background: `conic-gradient(red, yellow, lime, aqua, blue, magenta, red)`,
                }}
              />
              <input
                type="color"
                value={isCustom ? colour : custom}
                onChange={(event) => onColour(event.target.value)}
                aria-label="Custom colour"
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              />
            </label>
          </Group>

          <Group label="Background">
            {(['light', 'dark'] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={background === value}
                onClick={() => onBackground(value)}
                className={`${segment} capitalize`}
              >
                {value}
              </button>
            ))}
          </Group>
        </div>

        {showFilled && (
          <button
            type="button"
            role="switch"
            aria-checked={filled}
            onClick={() => onFilled(!filled)}
            className="group flex items-center gap-2 text-sm text-muted hover:text-fg"
          >
            <span className="relative h-5 w-9 rounded-full border border-border bg-surface motion-safe:transition-colors group-aria-checked:border-accent group-aria-checked:bg-accent">
              <span className="absolute left-0.5 top-0.5 size-3.5 rounded-full bg-muted motion-safe:transition-transform group-aria-checked:translate-x-4 group-aria-checked:bg-white" />
            </span>
            Filled
          </button>
        )}
      </div>
    </div>
  )
}
