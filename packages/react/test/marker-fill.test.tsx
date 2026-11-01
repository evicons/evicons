// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Marker } from '../src/icons/marker.js'

// Filled-mode contract (design guide section 9): the first <path> is the pin.
const PIN = 'svg > path:first-of-type'
const SIGN = 'svg > :not(path:first-of-type)'

test.each([
  ['without a title', undefined],
  ['with a title', 'Charging station'],
])(`"${PIN}" selects the pin and "${SIGN}" the sign, %s`, (_, title) => {
  const svg = render(<Marker title={title} />).container.querySelector('svg')!
  const paths = [...svg.querySelectorAll(':scope > path')]
  expect(paths).toHaveLength(2)
  const [pin, sign] = paths
  expect(pin.getAttribute('d')).toMatch(/^m12 22/)

  expect(svg.parentElement!.querySelector(PIN)).toBe(pin)
  expect(pin.matches(SIGN)).toBe(false)
  expect(sign.matches(PIN)).toBe(false)
  expect(sign.matches(SIGN)).toBe(true)
  if (title !== undefined) {
    // React renders <title> as the first child, so `:first-child` would miss the pin.
    expect(svg.firstElementChild!.tagName.toLowerCase()).toBe('title')
    expect(pin.matches('svg > :first-child')).toBe(false)
  }
})
