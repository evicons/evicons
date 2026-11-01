// Client-safe helpers for the gallery (no node: imports).
import type { Category, IconEntry } from '../../lib/icons'

export const categories: { id: Category | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'connector', label: 'Connectors' },
  { id: 'station', label: 'Stations' },
  { id: 'power', label: 'Power' },
  { id: 'vehicle', label: 'Vehicles' },
  { id: 'energy', label: 'Energy' },
  { id: 'status', label: 'Status' },
  { id: 'payment', label: 'Payment' },
  { id: 'marker', label: 'Markers' },
]

export const sizes = [16, 20, 24, 32, 48] as const
export const strokes = [1, 1.5, 2] as const

export const presets: { label: string; value: string }[] = [
  { label: 'currentColor', value: 'currentColor' },
  { label: 'EV blue', value: '#2563eb' },
  { label: 'available green', value: '#16a34a' },
  { label: 'occupied amber', value: '#d97706' },
  { label: 'faulted red', value: '#dc2626' },
]

/** Lower case without diacritics, so "Téléphone" matches "telephone". */
export function normalise(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/** One normalised search string per icon: name, component name, meaning (en) and all tags. */
export function haystack(icon: IconEntry): string {
  return normalise(
    [icon.name, icon.pascal, icon.meaning.en, ...icon.tags.en, ...icon.tags.de, ...icon.tags.fr].join('\n'),
  )
}

/** The markup inside the root <svg>, so React can own the root attributes (size, stroke, colour). */
export function innerSvg(svg: string): string {
  return svg
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .trim()
}

/** A short accessible name for the code example, taken from the meaning. */
export function shortTitle(icon: IconEntry, all: IconEntry[]): string {
  const cut = (text: string) =>
    text
      .split(/:|,| \(/)[0]!
      .replace(/ (connector|socket)$/, '')
      .trim()
  // "Map marker: the charging point is available" → the matching status title, "Available".
  if (icon.category === 'marker' && icon.meaning.en.startsWith('Map marker:')) {
    const status = all.find((other) => other.name === icon.name.replace(/^marker-/, 'status-'))
    if (status) return cut(status.meaning.en)
  }
  return cut(icon.meaning.en)
}

export function isMarker(icon: IconEntry): boolean {
  return icon.category === 'marker'
}
