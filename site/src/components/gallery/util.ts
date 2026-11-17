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
    // Not a combining mark, so NFD leaves it: "ladowanie" should still find "ładowanie".
    .replaceAll('ł', 'l')
}

/** Normalised search text per icon: `names` (file and component name) and `text` (meaning and the tags in every language). */
export function haystack(icon: IconEntry): { names: string; text: string } {
  return {
    names: normalise(`${icon.name}\n${icon.pascal}`),
    text: normalise([icon.meaning.en, ...Object.values(icon.tags).flat()].join('\n')),
  }
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * How well an icon matches the (normalised) search terms: 0 = not at all, 1 = every term starts a word,
 * 2 = every term is a whole word. Names match anywhere ("type2" finds PlugType2); meaning and tags match
 * only at the start of a word, because with seven tag languages a plain substring search finds "car" in
 * "recarga" and "app" in "mappa".
 */
export function searchRank(hay: { names: string; text: string }, terms: string[]): 0 | 1 | 2 {
  let rank: 0 | 1 | 2 = 2
  for (const term of terms) {
    const start = `(^|[^\\p{L}\\p{N}])${escapeRegExp(term)}`
    if (new RegExp(`${start}($|[^\\p{L}\\p{N}])`, 'u').test(hay.text)) continue
    if (hay.names.includes(term) || new RegExp(start, 'u').test(hay.text)) rank = 1
    else return 0
  }
  return rank
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
