// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import { MarkerCharging } from '../src/icons/marker-charging.js'

// Filled-mode contract (design guide section 9): the first <path> is the pin.
const PIN = 'svg > path:first-of-type'
const SIGN = 'svg > :not(path:first-of-type)'
// The solid bolt is the only element with a fill of its own; filled mode turns it white.
const SOLID = 'svg > [fill]'

test.each([
  ['without a title', undefined],
  ['with a title', 'Charging station'],
])(`"${PIN}" selects the pin and "${SIGN}" the sign, %s`, (_, title) => {
  const svg = render(<MarkerCharging title={title} />).container.querySelector('svg')!
  const paths = [...svg.querySelectorAll(':scope > path')]
  expect(paths).toHaveLength(2)
  const [pin, sign] = paths
  expect(pin.getAttribute('d')).toMatch(/^M2.5 21.5/)

  expect(svg.parentElement!.querySelector(PIN)).toBe(pin)
  expect(pin.matches(SIGN)).toBe(false)
  expect(sign.matches(PIN)).toBe(false)
  expect(sign.matches(SIGN)).toBe(true)
  expect([...svg.parentElement!.querySelectorAll(SOLID)]).toEqual([sign])
  expect(sign.getAttribute('fill')).toBe('currentColor')
  if (title !== undefined) {
    // React renders <title> as the first child, so `:first-child` would miss the pin.
    expect(svg.firstElementChild!.tagName.toLowerCase()).toBe('title')
    expect(pin.matches('svg > :first-child')).toBe(false)
  }
})
