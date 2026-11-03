// Build-time icon data for the gallery: metadata and SVG sources from the @evicons/svg package.
// Server only (reads files with node:fs); client code imports the types alone.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

export type Category = 'connector' | 'station' | 'power' | 'vehicle' | 'energy' | 'status' | 'payment' | 'marker'

export interface IconEntry {
  name: string
  pascal: string
  category: Category
  /** English only: the gallery island ships these props to the client, and nothing on the site shows `de`. */
  meaning: { en: string }
  tags: { en: string[]; de: string[]; fr: string[] }
  /** The SVG file content, verbatim. */
  svg: string
  standard?: { norm: string; source: string }
}

/** Gallery order: the order of the category chips. */
export const categoryOrder: Category[] = [
  'connector',
  'station',
  'power',
  'vehicle',
  'energy',
  'status',
  'payment',
  'marker',
]

interface RawEntry {
  category: Category
  meaning: { en: string; de: string }
  tags: { en: string[]; de: string[]; fr: string[] }
  pascal: string
  standard?: { norm: string; source: string }
}

let cache: IconEntry[] | undefined

export function loadIcons(): IconEntry[] {
  if (cache) return cache
  // Resolve through the package (workspace link locally, node_modules in Docker), not a fixed path.
  const root = dirname(createRequire(import.meta.url).resolve('@evicons/svg/package.json'))
  const meta = JSON.parse(readFileSync(join(root, 'icons.json'), 'utf8')) as Record<string, RawEntry>
  cache = Object.entries(meta)
    .map(([name, m]): IconEntry => {
      if (!categoryOrder.includes(m.category)) throw new Error(`Unknown category "${m.category}" for ${name}`)
      return {
        name,
        pascal: m.pascal,
        category: m.category,
        meaning: { en: m.meaning.en },
        tags: { en: m.tags.en, de: m.tags.de, fr: m.tags.fr },
        svg: readFileSync(join(root, 'svg', `${name}.svg`), 'utf8').trim(),
        ...(m.standard ? { standard: { norm: m.standard.norm, source: m.standard.source } } : {}),
      }
    })
    .sort(
      (a, b) =>
        categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category) || a.name.localeCompare(b.name, 'en'),
    )
  return cache
}

export interface IconDetails {
  meaning: { en: string; de: string }
  since: string
  aliases: string[]
  /** OpenStreetMap tags the icon stands for (see the docs section "OpenStreetMap"). */
  osm: string[]
}

/** Extra metadata for the icon pages only (kept out of IconEntry, which the gallery ships to the client). */
export function loadIconDetails(): Record<string, IconDetails> {
  const root = dirname(createRequire(import.meta.url).resolve('@evicons/svg/package.json'))
  const meta = JSON.parse(readFileSync(join(root, 'icons.json'), 'utf8')) as Record<
    string,
    { meaning: { en: string; de: string }; since: string; aliases?: string[]; osm?: string[] }
  >
  return Object.fromEntries(
    Object.entries(meta).map(([name, m]) => [
      name,
      { meaning: { en: m.meaning.en, de: m.meaning.de }, since: m.since, aliases: m.aliases ?? [], osm: m.osm ?? [] },
    ]),
  )
}
