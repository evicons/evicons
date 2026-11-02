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
