import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { buildPreview } from '../tools/build-preview.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const VALID = join(ROOT, 'tests/fixtures/icons-valid')
const TMP_BASE = join(ROOT, '.tmp-tests')

let out: string
beforeEach(() => {
  mkdirSync(TMP_BASE, { recursive: true })
  out = mkdtempSync(join(TMP_BASE, 'preview-'))
})
afterEach(() => rmSync(out, { recursive: true, force: true }))

const count = (haystack: string, needle: string) => haystack.split(needle).length - 1

test('renders per icon one large and six small variants', () => {
  buildPreview({ iconsDir: VALID, outDir: out })
  const html = readFileSync(join(out, 'index.html'), 'utf8')
  for (const name of ['test-ring', 'test-bolt']) {
    expect(count(html, `data-icon="${name}" data-variant="large"`)).toBe(1)
    for (const size of [16, 20, 24]) {
      for (const theme of ['light', 'dark']) {
        expect(count(html, `data-icon="${name}" data-variant="${size}-${theme}"`)).toBe(1)
      }
    }
  }
})

test('includes the six Lucide references and the stroke-width switcher', () => {
  buildPreview({ iconsDir: VALID, outDir: out })
  const html = readFileSync(join(out, 'index.html'), 'utf8')
  for (const l of ['car', 'map-pin', 'zap', 'plug', 'battery-charging', 'circle-check']) {
    expect(html).toContain(`data-lucide="${l}"`)
  }
  for (const w of ['1.5', '1.75', '2']) expect(html).toContain(`data-stroke="${w}"`)
  expect(html).toContain('--ev-stroke')
  expect(html).not.toContain('Status overlay')
})

test('regression page has no text outside style and uses 16/24/48 px', () => {
  buildPreview({ iconsDir: VALID, outDir: out })
  const html = readFileSync(join(out, 'regression.html'), 'utf8')
  const text = html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]*>/g, '').replace(/<!doctype html>/i, '')
  expect(text.trim()).toBe('')
  for (const size of [16, 24, 48]) expect(html).toContain(`data-variant="${size}"`)
})

test('missing icons dir yields an empty but valid preview', () => {
  buildPreview({ iconsDir: join(out, 'nope'), outDir: join(out, 'dist') })
  expect(existsSync(join(out, 'dist/index.html'))).toBe(true)
  expect(existsSync(join(out, 'dist/regression.html'))).toBe(true)
})

test('renders the status overlay section when charging-station and status-* exist', () => {
  const dir = join(out, 'icons')
  mkdirSync(dir)
  const names = ['charging-station', 'status-available', 'status-faulted']
  for (const n of names) {
    const src = n === 'charging-station' ? 'test-ring' : 'test-bolt'
    for (const ext of ['svg', 'json']) copyFileSync(join(VALID, `${src}.${ext}`), join(dir, `${n}.${ext}`))
  }
  buildPreview({ iconsDir: dir, outDir: join(out, 'dist') })
  const html = readFileSync(join(out, 'dist/index.html'), 'utf8')
  expect(html).toContain('Status overlay')
  expect(count(html, 'data-variant="overlay-badge"')).toBe(2)
  expect(count(html, 'data-variant="overlay-base"')).toBe(2)
})
