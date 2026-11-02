import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { lintIcons, loadIcons, MARKER_NAME_ERROR, MARKER_PIN_ERROR, MARKER_SIGN_ERROR } from '../tools/lint-icons.ts'
import { validateMeta } from '../tools/lib/meta.ts'
import { parseIcon } from '../tools/lib/svg.ts'

const FIXTURES = join(import.meta.dirname, 'fixtures')
const VALID = join(FIXTURES, 'icons-valid')
const TMP_BASE = join(import.meta.dirname, '..', '.tmp-tests')
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
  [invalid('negative-size'), { file: 'bad.svg', element: 'rect', attribute: 'width', message: expect.stringMatching(/greater than 0/) }, true],
  [invalid('tiny-circle'), { file: 'bad.svg', element: 'circle', attribute: 'r', message: expect.stringMatching(/ring/i) }, true],
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

test('dots drawn as zero-length or arc paths and circles with r >= 1 pass', () => {
  expect(lintIcons(join(FIXTURES, 'icons-dots'), { release: false })).toEqual([])
})

test('unapproved passes without release flag', () => expect(lintIcons(UNAPPROVED, { release: false })).toEqual([]))

test.each([
  ['zero width', '<rect width="0" height="12" x="6" y="6"/>', 'width', /greater than 0/],
  ['zero height', '<rect width="12" height="0" x="6" y="6"/>', 'height', /greater than 0/],
  ['negative height', '<rect width="12" height="-1" x="6" y="6"/>', 'height', /greater than 0/],
  ['negative rx', '<rect width="12" height="12" x="6" y="6" rx="-1"/>', 'rx', /negative/],
  ['negative ry', '<rect width="12" height="12" x="6" y="6" ry="-0.5"/>', 'ry', /negative/],
])('rect with %s fails', (_, shape, attribute, message) => {
  const dir = mkdtempSync(join(tmpdir(), 'evicons-lint-'))
  try {
    const root = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24">'
    writeFileSync(join(dir, 'bad.svg'), `${root}\n  ${shape}\n</svg>\n`)
    copyFileSync(invalid('negative-size/bad.json'), join(dir, 'bad.json'))
    expect(lintIcons(dir, { release: false })).toContainEqual(
      expect.objectContaining({ file: 'bad.svg', element: 'rect', attribute, message: expect.stringMatching(message) }),
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('rect with zero corner radius passes the size rule', () => {
  const dir = mkdtempSync(join(tmpdir(), 'evicons-lint-'))
  try {
    const root = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24">'
    writeFileSync(join(dir, 'ok.svg'), `${root}\n  <rect width="12" height="12" x="6" y="6" rx="0"/>\n</svg>\n`)
    copyFileSync(invalid('negative-size/bad.json'), join(dir, 'ok.json'))
    const errs = lintIcons(dir, { release: false })
    expect(errs.filter((e) => e.element === 'rect')).toEqual([])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('bbox counts half stroke', () => {
  // r=10.5 -> edge at 1.5, minus 0.875 stroke half -> 0.625 < 1 -> error
  expect(lintIcons(OUT_OF_BOUNDS, { release: false })[0].message).toMatch(/live area/i)
})

test('marker category requires the standard pin path as first element', () => {
  expect(MARKER_PIN_ERROR).toBe('marker: first element must be the standard pin path (design guide section 9)')
  // bolt drawn before the pin; pin path without Z; bolt only, no pin
  for (const fixture of ['marker-wrong-order', 'marker-open', 'marker-no-pin']) {
    const errors = lintIcons(invalid(fixture), { release: false })
    expect(errors).toEqual([expect.objectContaining({ file: 'marker-bad.svg', element: 'path', message: MARKER_PIN_ERROR })])
  }
})

test('marker sign elements must lie inside the pin head', () => {
  // a dot at (5, 21): inside the pin's bounding box, but outside the head
  const errors = lintIcons(invalid('marker-sign-outside'), { release: false })
  expect(errors).toEqual([expect.objectContaining({ file: 'marker-bad.svg', element: 'path', message: MARKER_SIGN_ERROR })])
})

test('marker file names and category marker go together', () => {
  // marker-x.svg with category station, pin-x.svg with category marker
  const errors = lintIcons(invalid('marker-wrong-category'), { release: false })
  expect(errors).toEqual([
    expect.objectContaining({ file: 'marker-x.json', message: MARKER_NAME_ERROR }),
    expect.objectContaining({ file: 'pin-x.json', message: MARKER_NAME_ERROR }),
  ])
})

test('the ten real markers pass the marker rules', () => {
  const markers = readdirSync(join(import.meta.dirname, '..', 'icons')).filter((f) => /^marker(-.*)?\.svg$/.test(f))
  expect(markers).toHaveLength(10)
  const errors = lintIcons(join(import.meta.dirname, '..', 'icons'), { release: true })
  expect(errors.filter((e) => e.message.startsWith('marker:'))).toEqual([])
})

test('valid marker passes', () => {
  expect(lintIcons(join(VALID, 'marker-ok'), { release: false })).toEqual([])
})

test('category energy is accepted', () => {
  expect(lintIcons(join(VALID, 'energy-ok'), { release: false })).toEqual([])
})

test('marker rule only applies to category marker', () => {
  // the same bolt-before-pin drawing is fine for any other category
  mkdirSync(TMP_BASE, { recursive: true })
  const dir = mkdtempSync(join(TMP_BASE, 'lint-'))
  try {
    const wrong = invalid('marker-wrong-order')
    copyFileSync(join(wrong, 'marker-bad.svg'), join(dir, 'bad.svg'))
    const meta = JSON.parse(readFileSync(join(wrong, 'marker-bad.json'), 'utf8'))
    writeFileSync(join(dir, 'bad.json'), JSON.stringify({ ...meta, category: 'energy' }))
    expect(lintIcons(dir, { release: false })).toEqual([])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
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
  expect(icons.map((i) => i.name)).toEqual(['test-bolt', 'test-ring'])
  const ring = icons[1]
  expect(ring.node).toEqual([['circle', { cx: '12', cy: '12', r: '9' }]])
  expect(ring.meta.category).toBe('status')
  expect(ring.svg).toContain('<circle')
})
