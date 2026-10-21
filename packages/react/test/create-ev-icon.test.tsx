// @vitest-environment jsdom
import { createRef, type ReactElement } from 'react'
import { render as rtlRender } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { expect, test, vi } from 'vitest'
import { createEvIcon } from '../src/create-ev-icon.js'

const TestRing = createEvIcon('TestRing', 'test-ring', [['circle', { cx: '12', cy: '12', r: '9' }]])
const render = (el: ReactElement) => rtlRender(el).container

test('defaults', () => {
  const svg = render(<TestRing />).querySelector('svg')!
  expect(svg).toHaveAttribute('width', '24')
  expect(svg).toHaveAttribute('height', '24')
  expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
  expect(svg).toHaveAttribute('stroke-width', '1.5')
  expect(svg).toHaveAttribute('stroke', 'currentColor')
  expect(svg).toHaveAttribute('fill', 'none')
  expect(svg).toHaveAttribute('aria-hidden', 'true')
  expect(svg).not.toHaveAttribute('role')
  expect(svg).toHaveClass('evicon', 'evicon-test-ring')
})

test('size, strokeWidth, className, passthrough, ref', () => {
  const ref = createRef<SVGSVGElement>()
  const onClick = vi.fn()
  const svg = render(
    <TestRing ref={ref} size={16} strokeWidth={2} className="x" data-test="y" onClick={onClick} />,
  ).querySelector('svg')!
  expect(svg).toHaveAttribute('width', '16')
  expect(svg).toHaveAttribute('height', '16')
  expect(svg).toHaveAttribute('stroke-width', '2')
  expect(svg).toHaveClass('evicon', 'evicon-test-ring', 'x')
  expect(svg).toHaveAttribute('data-test', 'y')
  svg.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  expect(onClick).toHaveBeenCalledTimes(1)
  expect(ref.current).toBe(svg)
  expect(ref.current).toBeInstanceOf(SVGSVGElement)
})

test('falsy props', () => {
  const svg = render(<TestRing strokeWidth={0} size={undefined} />).querySelector('svg')!
  expect(svg).toHaveAttribute('stroke-width', '0')
  expect(svg).toHaveAttribute('width', '24')
  expect(svg).toHaveAttribute('height', '24')
})

test('title labels the icon', () => {
  const svg = render(<TestRing title="Charging" />).querySelector('svg')!
  const title = svg.firstElementChild!
  expect(title.tagName.toLowerCase()).toBe('title')
  expect(title).toHaveTextContent('Charging')
  expect(title.id).not.toBe('')
  expect(svg).toHaveAttribute('role', 'img')
  expect(svg).toHaveAttribute('aria-labelledby', title.id)
  expect(svg).not.toHaveAttribute('aria-hidden')
})

test('aria-label wins over title', () => {
  const svg = render(<TestRing aria-label="Label" title="T" />).querySelector('svg')!
  expect(svg).toHaveAttribute('aria-label', 'Label')
  expect(svg).not.toHaveAttribute('aria-labelledby')
  expect(svg).toHaveAttribute('role', 'img')
  expect(svg).not.toHaveAttribute('aria-hidden')
  expect(svg.querySelector('title')).not.toBeNull()
})

test('aria-labelledby from user is kept', () => {
  const svg = render(<TestRing aria-labelledby="ext" title="T" />).querySelector('svg')!
  expect(svg).toHaveAttribute('aria-labelledby', 'ext')
  expect(svg).toHaveAttribute('role', 'img')
  expect(svg).not.toHaveAttribute('aria-hidden')
})

test('explicit aria-hidden overrides', () => {
  const svg = render(<TestRing aria-hidden={false} />).querySelector('svg')!
  expect(svg).not.toHaveAttribute('aria-hidden', 'true')
})

test('explicit role overrides', () => {
  const svg = render(<TestRing title="T" role="presentation" />).querySelector('svg')!
  expect(svg).toHaveAttribute('role', 'presentation')
})

test('children come after node', () => {
  const svg = render(
    <TestRing title="T">
      <rect width="1" height="1" />
    </TestRing>,
  ).querySelector('svg')!
  expect([...svg.children].map((c) => c.tagName.toLowerCase())).toEqual(['title', 'circle', 'rect'])
})

test('absolute stroke works without numeric size', () => {
  const svg = render(<TestRing size="1em" absoluteStrokeWidth />).querySelector('svg')!
  expect(svg).toHaveAttribute('width', '1em')
  expect(svg).toHaveAttribute('stroke-width', '1.5')
  const kids = [...svg.children]
  expect(kids.length).toBeGreaterThan(0)
  for (const c of kids) expect(c).toHaveAttribute('vector-effect', 'non-scaling-stroke')
})

test('no vector-effect by default', () => {
  const svg = render(<TestRing />).querySelector('svg')!
  expect(svg.querySelector('circle')).not.toHaveAttribute('vector-effect')
})

test('ssr ids are unique', () => {
  const html = renderToString(
    <>
      <TestRing title="a" />
      <TestRing title="b" />
    </>,
  )
  const ids = [...html.matchAll(/<title id="([^"]+)"/g)].map((m) => m[1])
  expect(ids).toHaveLength(2)
  expect(ids[0]).not.toBe(ids[1])
  for (const id of ids) expect(html).toContain(`aria-labelledby="${id}"`)
})

test('displayName', () => expect(TestRing.displayName).toBe('TestRing'))
