import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// The small solid bolt (design guide, exception "solid-sign") is an outline that the 1.5 stroke fills.
// At its widest point the outline leaves a pinhole that shows from about 48 px; a short stroke between
// the two inner corners of the steps closes it. Every small bolt must carry that stroke.
const ICONS = join(import.meta.dirname, '..', 'icons')
const bolt = /([Mm])([\d.]+)[ ,]?([\d.]+)(?:\s|-)[^"Z]*?3-4[^"Z]*?Z([^"]*)/

describe('small solid bolt', () => {
  const names = readdirSync(ICONS)
    .filter((f) => f.endsWith('.json'))
    .filter((f) => (JSON.parse(readFileSync(join(ICONS, f), 'utf8')).exceptions ?? []).includes('solid-sign'))
    .map((f) => f.slice(0, -5))

  it('is used by the solid-sign icons', () => {
    expect(names.length).toBeGreaterThanOrEqual(12)
  })

  for (const name of names) {
    it(`${name}: the bolt has the closing stroke between its inner corners`, () => {
      const svg = readFileSync(join(ICONS, `${name}.svg`), 'utf8')
      const match = svg.match(bolt)
      expect(match, 'small bolt path').not.toBeNull()
      // After Z the pen is back at the start (x, y); the stroke starts 1.25 left and 3.5 down and goes .75 right,
      // 1 up. SVGO writes it relative or absolute, whichever is shorter.
      const x = Number(match![2])
      const y = Number(match![3])
      const absolute = `M${String(x - 1.25).replace(/^0\./, '.')} ${String(y + 3.5).replace(/^0\./, '.')}l.75-1`
      expect([`m-1.25 3.5.75-1`, absolute]).toContain(match![4])
    })
  }
})
