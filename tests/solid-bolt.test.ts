import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, test } from 'vitest'
import { BOLTS, boltName, polygonVertices } from '../tools/lib/bolts.ts'
import { parseIcon } from '../tools/lib/svg.ts'

// Every lightning bolt is solid (design guide section 2, "Lightning bolt"): one of the canonical bolt
// paths, moved but never scaled, with fill="currentColor", the only fill in EVicons.
const ICONS = join(import.meta.dirname, '..', 'icons')
const names = readdirSync(ICONS)
  .filter((f) => f.endsWith('.svg'))
  .map((f) => f.slice(0, -4))
const meta = (name: string) => JSON.parse(readFileSync(join(ICONS, `${name}.json`), 'utf8'))
const node = (name: string) => parseIcon(readFileSync(join(ICONS, `${name}.svg`), 'utf8'))
const solid = names.filter((name) => (meta(name).exceptions ?? []).includes('solid-sign'))

describe('canonical bolts', () => {
  const box = (shape: ReadonlyArray<readonly [number, number]>) => {
    const xs = shape.map(([x]) => x)
    const ys = shape.map(([, y]) => y)
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]
  }

  test.each([
    ['small', 3, 6.5],
    ['sign', 5.5, 11.5],
    ['full', 9, 18.5],
  ] as const)('%s is %s × %s, starts at its box, and is point-symmetric', (name, width, height) => {
    const shape = BOLTS[name]
    expect(box(shape)).toEqual([0, 0, width, height])
    // A↔D, B↔E, C↔F under a half turn about the box centre
    for (let k = 0; k < 3; k++) {
      expect([width - shape[k + 3][0], height - shape[k + 3][1]]).toEqual([...shape[k]])
    }
  })

  test('the torn pieces are point-symmetric to each other', () => {
    const [upper, lower] = [BOLTS['torn-upper'], BOLTS['torn-lower']]
    expect(box(upper)).toEqual([0, 0, 6, 9.25])
    expect(box(lower)).toEqual([0, 0, 6, 9.25])
    for (let k = 0; k < 3; k++) expect([6 - lower[k][0], 9.25 - lower[k][1]]).toEqual([...upper[k]])
  })

  test('the marker sign is the bolt the owner approved on 2026-11-04', () => {
    expect(boltName('M13.25 6.25 9.25 12.5h2.5L10.75 17.75l4-6.25h-2.5Z')).toBe('sign')
    const pin = node('marker-charging').find(([, a]) => a.fill === 'currentColor')
    expect(polygonVertices(pin![1].d)).toEqual([[13.25, 6.25], [9.25, 12.5], [11.75, 12.5], [10.75, 17.75], [14.75, 11.5], [12.25, 11.5]])
  })

  test.each([
    ['moved', 'm12.75 10.75-2.25 3.5h1.25l-.5 3 2.25-3.5h-1.25Z', 'small'],
    ['absolute', 'M12.75 10.75 10.5 14.25H11.75L11.25 17.25 13.5 13.75H12.25Z', 'small'],
    ['scaled', 'm25.5 21.5-4.5 7h2.5l-1 6 4.5-7h-2.5Z', null],
    ['reordered', 'M10.5 14.25 12.75 10.75 12.25 13.75h1.25l-2.25 3.5.5-3Z', null],
    ['open', 'm12.75 10.75-2.25 3.5h1.25l-.5 3 2.25-3.5h-1.25', null],
    ['two subpaths', 'm12.75 10.75-2.25 3.5h1.25l-.5 3 2.25-3.5h-1.25ZM2 2h1v1Z', null],
    ['curved', 'M12.75 10.75a1 1 0 0 1-2.25 3.5h1.25l-.5 3 2.25-3.5h-1.25Z', null],
  ])('boltName recognises a %s path correctly', (_, d, expected) => {
    expect(boltName(d)).toBe(expected)
  })
})

describe('solid bolts in the icons', () => {
  it('are used by the bolt icons', () => {
    expect(solid.length).toBeGreaterThanOrEqual(43)
  })

  for (const name of solid) {
    it(`${name}: has a canonical bolt with fill="currentColor", and no other element has a fill`, () => {
      const filled = node(name).filter(([, attrs]) => 'fill' in attrs)
      expect(filled.length).toBeGreaterThanOrEqual(1)
      for (const [tag, attrs] of filled) {
        expect(tag).toBe('path')
        expect(attrs.fill).toBe('currentColor')
        expect(boltName(attrs.d), attrs.d).not.toBeNull()
      }
      expect(meta(name).exceptions).toContain('sharp-corner')
    })
  }

  test('icons without solid-sign have no fill and no bolt', () => {
    for (const name of names.filter((n) => !solid.includes(n))) {
      for (const [, attrs] of node(name)) {
        expect('fill' in attrs, name).toBe(false)
        if (attrs.d) expect(boltName(attrs.d), name).toBeNull()
      }
    }
  })

  test('bolt sizes are used where the design guide says', () => {
    const used = (name: string) => node(name).filter(([, a]) => a.fill).map(([, a]) => boltName(a.d))
    expect(used('charging-bolt')).toEqual(['full'])
    expect(used('fast-charging')).toEqual(['full'])
    for (const name of ['marker-charging', 'charging-session', 'plug-in-hybrid']) expect(used(name)).toEqual(['sign'])
    expect(used('power-outage')).toEqual(['torn-upper', 'torn-lower'])
    const small = solid.filter((n) => !['charging-bolt', 'fast-charging', 'marker-charging', 'charging-session', 'plug-in-hybrid', 'power-outage'].includes(n))
    for (const name of small) expect(used(name), name).toEqual(['small'])
  })
})
