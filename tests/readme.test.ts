import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const icons = Object.keys(
  JSON.parse(readFileSync('packages/svg/icons.json', 'utf8')) as Record<string, unknown>,
)

describe.each(['README.md', 'packages/react/README.md'])('%s', (file) => {
  const text = readFileSync(file, 'utf8')
  it('lists every icon as a table cell', () => {
    const missing = icons.filter((name) => !text.includes(`| \`${name}\` |`))
    expect(missing).toEqual([])
  })
})

const osm = JSON.parse(readFileSync('packages/svg/osm.json', 'utf8')) as Record<string, string>
const pascal = Object.fromEntries(
  Object.entries(JSON.parse(readFileSync('packages/svg/icons.json', 'utf8')) as Record<string, { pascal: string }>).map(
    ([name, meta]) => [name, meta.pascal],
  ),
)

// The OpenStreetMap table is written by hand; it must list exactly the tags of osm.json (built from icons/*.json).
describe.each(['README.md', 'site/src/content/docs/07-openstreetmap.mdx'])('%s OpenStreetMap section', (file) => {
  const text = readFileSync(file, 'utf8')
  it('lists every osm.json tag with its icon and component, in osm.json order', () => {
    const rows = [...text.matchAll(/^\| `([^`]+)` \| `([^`]+)` \| `([^`]+)` \|$/gm)]
      .filter((m) => m[1]! in osm || /[:=]/.test(m[1]!)) // tag rows only, not the icon tables
      .map((m) => [m[1], m[2], m[3]])
    expect(rows).toEqual(Object.entries(osm).map(([tag, name]) => [tag, name, pascal[name]]))
  })
  it('maps the same sockets in the React example', () => {
    const entries = [...text.matchAll(/^ {2}'(socket:[a-z0-9_]+)': (\w+),$/gm)].map((m) => [m[1], m[2]])
    const sockets = Object.entries(osm).filter(([tag]) => tag.startsWith('socket:') && tag !== 'socket:unknown')
    expect(entries).toEqual(sockets.map(([tag, name]) => [tag, pascal[name]]))
  })
})
