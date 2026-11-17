// @vitest-environment jsdom
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { createEvIcon } from '../src/create-ev-icon.js'

const TestRing = createEvIcon('TestRing', 'test-ring', [['circle', { cx: '12', cy: '12', r: '9' }]])
const render = (props: Record<string, unknown> = {}, slots?: Record<string, () => unknown>) =>
  mount(TestRing, { props, attrs: {}, slots: slots as never, attachTo: document.body }).element as SVGSVGElement

test('defaults', () => {
  const svg = render()
  expect(svg.tagName.toLowerCase()).toBe('svg')
  expect(svg).toHaveAttribute('width', '24')
  expect(svg).toHaveAttribute('height', '24')
  expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
  expect(svg).toHaveAttribute('stroke-width', '1.5')
  expect(svg).toHaveAttribute('stroke', 'currentColor')
  expect(svg).toHaveAttribute('fill', 'none')
  expect(svg).toHaveAttribute('stroke-linecap', 'round')
  expect(svg).toHaveAttribute('stroke-linejoin', 'round')
  expect(svg).toHaveAttribute('aria-hidden', 'true')
  expect(svg).not.toHaveAttribute('role')
  expect(svg).toHaveClass('evicon', 'evicon-test-ring')
  expect(svg.querySelector('circle')).toHaveAttribute('r', '9')
})

test('size, strokeWidth, class, passthrough, listeners', () => {
  const onClick = vi.fn()
  const wrapper = mount(TestRing, {
    props: { size: 16, strokeWidth: 2 },
    attrs: { class: 'x', 'data-test': 'y', style: 'color: red', onClick },
  })
  const svg = wrapper.element as SVGSVGElement
  expect(svg).toHaveAttribute('width', '16')
  expect(svg).toHaveAttribute('height', '16')
  expect(svg).toHaveAttribute('stroke-width', '2')
  expect(svg).toHaveClass('evicon', 'evicon-test-ring', 'x')
  expect(svg).toHaveAttribute('data-test', 'y')
  expect(svg.getAttribute('style')).toContain('color: red')
  svg.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  expect(onClick).toHaveBeenCalledTimes(1)
})

test('falsy props', () => {
  const svg = render({ strokeWidth: 0, size: undefined })
  expect(svg).toHaveAttribute('stroke-width', '0')
  expect(svg).toHaveAttribute('width', '24')
})

test('title labels the icon', () => {
  const svg = render({ title: 'Charging' })
  const title = svg.firstElementChild!
  expect(title.tagName.toLowerCase()).toBe('title')
  expect(title).toHaveTextContent('Charging')
  expect(title.id).not.toBe('')
  expect(svg).toHaveAttribute('role', 'img')
  expect(svg).toHaveAttribute('aria-labelledby', title.id)
  expect(svg).not.toHaveAttribute('aria-hidden')
})

test('aria-label wins over title', () => {
  const svg = mount(TestRing, { props: { title: 'T' }, attrs: { 'aria-label': 'Label' } }).element
  expect(svg).toHaveAttribute('aria-label', 'Label')
  expect(svg).not.toHaveAttribute('aria-labelledby')
  expect(svg).toHaveAttribute('role', 'img')
  expect(svg).not.toHaveAttribute('aria-hidden')
  expect(svg.querySelector('title')).not.toBeNull()
})

test('aria-labelledby from user is kept', () => {
  const svg = mount(TestRing, { props: { title: 'T' }, attrs: { 'aria-labelledby': 'ext' } }).element
  expect(svg).toHaveAttribute('aria-labelledby', 'ext')
  expect(svg).toHaveAttribute('role', 'img')
  expect(svg).not.toHaveAttribute('aria-hidden')
})

test('explicit aria-hidden overrides', () => {
  const svg = mount(TestRing, { attrs: { 'aria-hidden': 'false' } }).element
  expect(svg).not.toHaveAttribute('aria-hidden', 'true')
})

test('explicit role overrides', () => {
  const svg = mount(TestRing, { props: { title: 'T' }, attrs: { role: 'presentation' } }).element
  expect(svg).toHaveAttribute('role', 'presentation')
})

test('slot content comes after node', () => {
  const svg = render({ title: 'T' }, { default: () => h('rect', { width: 1, height: 1 }) })
  expect([...svg.children].map((c) => c.tagName.toLowerCase())).toEqual(['title', 'circle', 'rect'])
})

test('absolute stroke works without numeric size', () => {
  const svg = render({ size: '1em', absoluteStrokeWidth: true })
  expect(svg).toHaveAttribute('width', '1em')
  expect(svg).toHaveAttribute('stroke-width', '1.5')
  const kids = [...svg.children]
  expect(kids.length).toBeGreaterThan(0)
  for (const c of kids) expect(c).toHaveAttribute('vector-effect', 'non-scaling-stroke')
})

test('no vector-effect by default', () => {
  expect(render().querySelector('circle')).not.toHaveAttribute('vector-effect')
})

test('reacts to prop changes', async () => {
  const wrapper = mount(TestRing, { props: { size: 16 } })
  await wrapper.setProps({ size: 32, title: 'Now named' })
  expect(wrapper.element).toHaveAttribute('width', '32')
  expect(wrapper.element).toHaveAttribute('role', 'img')
})

test('ssr ids are unique and match', async () => {
  const app = createSSRApp({ render: () => [h(TestRing, { title: 'a' }), h(TestRing, { title: 'b' })] })
  const html = await renderToString(app)
  const ids = [...html.matchAll(/<title id="([^"]+)"/g)].map((m) => m[1])
  expect(ids).toHaveLength(2)
  expect(ids[0]).not.toBe(ids[1])
  for (const id of ids) expect(html).toContain(`aria-labelledby="${id}"`)
})

test('ssr markup without a name', async () => {
  const html = await renderToString(createSSRApp({ render: () => h(TestRing) }))
  expect(html).toContain('aria-hidden="true"')
  expect(html).toContain('class="evicon evicon-test-ring"')
  expect(html).not.toContain('role=')
})

test('component name', () => expect((TestRing as { name?: string }).name).toBe('TestRing'))

test('kebab-case props in templates', async () => {
  const { compile } = await import('vue')
  const Parent = { components: { TestRing }, render: compile('<TestRing size="1em" stroke-width="2" absolute-stroke-width />') }
  const svg = mount(Parent).element as SVGSVGElement
  expect(svg).toHaveAttribute('width', '1em')
  expect(svg).toHaveAttribute('stroke-width', '2')
  expect(svg.querySelector('circle')).toHaveAttribute('vector-effect', 'non-scaling-stroke')
  expect(svg).not.toHaveAttribute('size')
  expect(svg).not.toHaveAttribute('absolute-stroke-width')
})
