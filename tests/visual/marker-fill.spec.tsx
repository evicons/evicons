import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from '@playwright/test'
import { MarkerCharging } from '../../packages/react/src/icons/marker-charging.ts'

// Filled-mode CSS from the README and design guide section 9: the first <path> is the pin.
const CSS = `.marker { color: #dc2626 }
.marker svg > path:first-of-type { fill: currentColor; }
.marker svg > :not(path:first-of-type) { stroke: #fff; }
.marker svg > [fill] { fill: #fff; }`
// Hollow pin: white head, the outline and the solid bolt in the marker colour.
const HOLLOW = `.marker { color: #dc2626 }
.marker svg > path:first-of-type { fill: #fff; }`

const RED = 'rgb(220, 38, 38)'
const WHITE = 'rgb(255, 255, 255)'

for (const title of [undefined, 'Charging station']) {
  test(`filled marker CSS fills the pin and draws the sign white ${title ? 'with' : 'without'} a <title>`, async ({ page }) => {
    const markup = renderToStaticMarkup(createElement(MarkerCharging, { size: 40, title }))
    await page.setContent(`<style>${CSS}</style><span class="marker">${markup}</span>`)
    const paths = await page.locator('svg > path').evaluateAll((els) =>
      els.map((el) => {
        const s = getComputedStyle(el)
        return { d: el.getAttribute('d'), fill: s.fill, stroke: s.stroke }
      }),
    )
    expect(paths).toHaveLength(2)
    expect(paths[0]).toEqual({ d: expect.stringMatching(/^M2.5 21.5/), fill: RED, stroke: RED })
    // the solid bolt is white inside as well
    expect(paths[1]).toMatchObject({ fill: WHITE, stroke: WHITE })
  })
}

test('hollow marker CSS keeps the solid bolt in the marker colour', async ({ page }) => {
  const markup = renderToStaticMarkup(createElement(MarkerCharging, { size: 40 }))
  await page.setContent(`<style>${HOLLOW}</style><span class="marker">${markup}</span>`)
  const paths = await page.locator('svg > path').evaluateAll((els) =>
    els.map((el) => {
      const s = getComputedStyle(el)
      return { fill: s.fill, stroke: s.stroke }
    }),
  )
  expect(paths).toEqual([
    { fill: WHITE, stroke: RED },
    { fill: RED, stroke: RED },
  ])
})
