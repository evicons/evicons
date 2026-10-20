import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { lintIcons, loadIcons } from '../tools/lint-icons.ts'
import { validateMeta } from '../tools/lib/meta.ts'
import { parseIcon } from '../tools/lib/svg.ts'

const FIXTURES = join(import.meta.dirname, 'fixtures')
const VALID = join(FIXTURES, 'icons-valid')
const invalid = (name: string) => join(FIXTURES, 'icons-invalid', name)
const FOREIGN = invalid('foreign-attrs')
const OUT_OF_BOUNDS = invalid('out-of-bounds')
const UNAPPROVED = invalid('unapproved')

// [fixture dir, expected error subset, fails only for this one reason?]
const CASES: Array<[string, Record<string, unknown>, boolean]> = [
  [invalid('root-attrs'), { file: 'bad.svg', element: 'svg', attribute: 'stroke-width' }, true],
  [FOREIGN, { file: 'bad.svg', element: 'path', attribute: 'fill' }, false],
  [invalid('disallowed-tag'), { file: 'bad.svg', element: 'text' }, true],
  [invalid('text-content'), { file: 'bad.svg', message: expect.stringMatching(/text content/i) }, true],
  [OUT_OF_BOUNDS, { file: 'bad.svg', element: 'circle', message: expect.stringMatching(/live area/i) }, true],
  [invalid('not-optimized'), { file: 'bad.svg', message: expect.stringMatching(/svgo/i) }, true],
  [invalid('missing-meta'), { file: 'bad.svg', message: expect.stringMatching(/missing metadata/i) }, true],
  [invalid('orphan-meta'), { file: 'bad.json', message: expect.stringMatching(/missing svg/i) }, true],
  [invalid('bad-name'), { file: 'Bad_Name.svg', message: expect.stringMatching(/kebab-case/i) }, true],
  [invalid('invalid-meta'), { file: 'bad.json', message: expect.stringMatching(/tags\.fr/) }, true],
  [invalid('connector-without-standard'), { file: 'bad.json', message: expect.stringMatching(/standard/) }, true],
  [invalid('unknown-exception'), { file: 'bad.json', message: expect.stringMatching(/unknown exception/i) }, true],
  [invalid('duplicate-pascal'), { file: 'plug.json', message: expect.stringMatching(/Ac2/) }, true],
  [UNAPPROVED, { file: 'bad.json', message: expect.stringMatching(/approvedBy/) }, false],
]

test('valid fixture passes', () => expect(lintIcons(VALID, { release: false })).toEqual([]))

test('valid fixture passes in release mode', () => expect(lintIcons(VALID, { release: true })).toEqual([]))

test.each(CASES)('%s fails', (dir, expected) => {
  expect(lintIcons(dir, { release: dir.endsWith('unapproved') })).toContainEqual(expect.objectContaining(expected))
})

test.each(CASES.filter(([, , only]) => only))('%s fails only for its intended rule', (dir) => {
  expect(lintIcons(dir, { release: dir.endsWith('unapproved') })).toHaveLength(1)
})

test('unapproved fails only for approval in release mode', () => {
  expect(lintIcons(UNAPPROVED, { release: true }).every((e) => /approved/.test(e.message))).toBe(true)
})

test('reports file, element and attribute', () => {
  const errs = lintIcons(FOREIGN, { release: false })
  expect(errs).toContainEqual(expect.objectContaining({ file: 'bad.svg', element: 'path', attribute: 'fill' }))
  expect(errs).toContainEqual(expect.objectContaining({ file: 'bad.svg', element: 'g' }))
  expect(errs).toContainEqual(expect.objectContaining({ file: 'bad.svg', attribute: 'id' }))
  expect(errs).toContainEqual(expect.objectContaining({ file: 'bad.svg', element: 'path', attribute: 'style' }))
})

test('unapproved passes without release flag', () => expect(lintIcons(UNAPPROVED, { release: false })).toEqual([]))

test('bbox counts half stroke', () => {
  // r=10.5 -> edge at 1.5, minus 0.875 stroke half -> 0.625 < 1 -> error
  expect(lintIcons(OUT_OF_BOUNDS, { release: false })[0].message).toMatch(/live area/i)
})

describe('parseIcon', () => {
  test('returns direct child elements as an icon node', () => {
    const src = '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/></svg>'
    expect(parseIcon(src)).toEqual([
      ['circle', { cx: '12', cy: '12', r: '9' }],
      ['path', { d: 'M8 12h8' }],
    ])
  })

  test('does not throw on disallowed content', () => {
    expect(() => parseIcon('<svg><g><text>AC</text></g></svg>')).not.toThrow()
  })
})

describe('validateMeta', () => {
  const base = {
    category: 'status',
    meaning: { en: 'Out of order', de: 'Außer Betrieb' },
    tags: { en: ['broken'], de: ['defekt'], fr: ['en panne'] },
    since: '0.1.0',
    aliases: [],
    provenance: { createdBy: 'ai', approvedBy: null, approvedOn: null },
  }

  test('accepts a complete record', () => expect(validateMeta(base, 'out-of-order')).toEqual([]))

  test('rejects non-objects', () => expect(validateMeta(null, 'x')).not.toEqual([]))

  test('rejects unknown keys', () => {
    expect(validateMeta({ ...base, colour: 'red' }, 'x')).toContainEqual(expect.stringMatching(/colour/))
  })

  test('rejects invalid since and createdBy', () => {
    const errs = validateMeta({ ...base, since: '1', provenance: { ...base.provenance, createdBy: 'bot' } }, 'x')
    expect(errs).toContainEqual(expect.stringMatching(/since/))
    expect(errs).toContainEqual(expect.stringMatching(/createdBy/))
  })

  test('rejects non-kebab aliases', () => {
    expect(validateMeta({ ...base, aliases: ['FooBar'] }, 'x')).toContainEqual(expect.stringMatching(/aliases/))
  })

  test('requires standard for connectors', () => {
    expect(validateMeta({ ...base, category: 'connector' }, 'x')).toContainEqual(expect.stringMatching(/standard/))
    const ok = { ...base, category: 'connector', standard: { norm: 'IEC 62196-2 Type 2', source: 'IEC 62196-2:2022' } }
    expect(validateMeta(ok, 'x')).toEqual([])
  })
})

test('loadIcons returns name, svg, node and meta', () => {
  const icons = loadIcons(VALID)
  expect(icons).toHaveLength(1)
  expect(icons[0].name).toBe('test-ring')
  expect(icons[0].node).toEqual([['circle', { cx: '12', cy: '12', r: '9' }]])
  expect(icons[0].meta.category).toBe('status')
  expect(icons[0].svg).toContain('<circle')
})
