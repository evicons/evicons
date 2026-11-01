import { memo, type KeyboardEvent } from 'react'
import type { IconEntry } from '../../lib/icons'

interface Props {
  icon: IconEntry
  inner: string
  size: number
  stroke: number
  colour: string
  filled: boolean
  selected: boolean
  tabbable: boolean
  onOpen: (name: string, card: HTMLButtonElement) => void
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
}

// Inline SVG from the source file; React owns the root attributes, the shapes are static markup.
function IconCard({ icon, inner, size, stroke, colour, filled, selected, tabbable, onOpen, onKeyDown }: Props) {
  return (
    <li className="list-none">
      <button
        type="button"
        data-icon-card={icon.name}
        aria-current={selected ? 'true' : undefined}
        tabIndex={tabbable ? 0 : -1}
        onClick={(event) => onOpen(icon.name, event.currentTarget)}
        onKeyDown={onKeyDown}
        className={[
          'flex h-28 w-full flex-col items-center justify-start gap-2 rounded-lg border px-2 pt-4 text-(--pv-fg) transition-colors hover:bg-(--pv-hover)',
          selected ? 'border-accent ring-1 ring-accent' : 'border-transparent',
        ].join(' ')}
      >
        <span className={['flex size-12 items-center justify-center', filled ? 'marker-filled' : ''].join(' ')}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={colour === 'currentColor' ? undefined : { color: colour }}
            dangerouslySetInnerHTML={{ __html: inner }}
          />
        </span>
        <span className="line-clamp-2 h-7 w-full text-center font-mono text-[11px] leading-[14px] text-(--pv-muted)">
          {icon.name}
        </span>
      </button>
    </li>
  )
}

export default memo(IconCard)
