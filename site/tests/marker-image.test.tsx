// The map draws markers as images (site/src/lib/marker-image.ts): the pin in the status colour, the whole sign white.
import { expect, test } from 'vitest'
import { fillMarker } from '../src/lib/marker-image'
import markerCharging from '@evicons/svg/marker-charging.svg?raw'

test('fillMarker fills the pin and draws the sign white, the solid bolt included', () => {
  const svg = fillMarker(markerCharging, '#16a34a', 32)
  expect(svg).toContain('width="64" height="64"')
  expect(svg).not.toContain('currentColor')
  const paths = [...svg.matchAll(/<path [^>]*>/g)].map((m) => m[0])
  expect(paths).toHaveLength(2)
  expect(paths[0]).toMatch(/^<path fill="#16a34a" stroke="#16a34a" d="M2.5 21.5/)
  expect(paths[1]).toContain('fill="#fff"')
})

test('the ring is a white copy of the pin under the filled one', () => {
  const svg = fillMarker(markerCharging, '#16a34a', 40, { ring: true })
  const paths = [...svg.matchAll(/<path [^>]*>/g)].map((m) => m[0])
  expect(paths).toHaveLength(3)
  expect(paths[0]).toBe('<path d="M2.5 21.5V12a9.5 9.5 0 1 1 9.5 9.5Z" stroke-width="4"/>')
  expect(paths[1]).toMatch(/^<path fill="#16a34a"/)
})
