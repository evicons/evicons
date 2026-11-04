// The JOSM style of this build, from the @evicons/svg package (the same source as the gallery and /icons.json).
// Server only. Built once per build: the three /josm/ endpoints share it, so they carry the same version.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { loadIconDetails, loadIcons } from './icons'
import { buildJosmStyle, josmZip, type JosmStyle } from './josm'

let cache: { style: JosmStyle; zip: Uint8Array } | undefined

/** Build date `YYYY-MM-DD`: SOURCE_DATE_EPOCH (seconds) when set, for reproducible builds; otherwise today (UTC). */
function buildDate(): string {
  const epoch = process.env.SOURCE_DATE_EPOCH
  return (epoch ? new Date(Number(epoch) * 1000) : new Date()).toISOString().slice(0, 10)
}

export function josmStyle(): { style: JosmStyle; zip: Uint8Array } {
  if (cache) return cache
  const { version } = JSON.parse(
    readFileSync(createRequire(import.meta.url).resolve('@evicons/svg/package.json'), 'utf8'),
  ) as { version: string }
  const details = loadIconDetails()
  const icons = Object.fromEntries(loadIcons().map((icon) => [icon.name, { svg: icon.svg, osm: details[icon.name]!.osm }]))
  const style = buildJosmStyle({ icons, version, date: buildDate() })
  cache = { style, zip: josmZip(style) }
  return cache
}
