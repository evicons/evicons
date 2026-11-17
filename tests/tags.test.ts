import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { TAG_LANGUAGES } from '../tools/lib/meta.ts'

const dir = 'icons'
const icons = readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => [f.slice(0, -5), JSON.parse(readFileSync(join(dir, f), 'utf8')) as { tags: Record<string, string[]> }] as const)

// The schema keeps it, es, nl and pl optional (for test fixtures); every real icon carries all seven languages.
test.each(icons)('%s has search tags in every language', (_name, meta) => {
  expect(Object.keys(meta.tags)).toEqual([...TAG_LANGUAGES])
  for (const lang of TAG_LANGUAGES) {
    const tags = meta.tags[lang]!
    expect(tags.length, lang).toBeGreaterThan(0)
    expect(new Set(tags).size, `${lang}: duplicates`).toBe(tags.length)
    for (const tag of tags) expect(tag, lang).toBe(tag.trim().toLowerCase())
  }
})
