import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from '@playwright/test'
import { MarkerCharging } from '../../packages/react/src/icons/marker-charging.ts'

// Filled-mode CSS from the README and design guide section 9: the first <path> is the pin.
const CSS = `.marker { color: #dc2626 }
.marker svg > path:first-of-type { fill: currentColor; }
.marker svg > :not(path:first-of-type) { stroke: #fff; }`

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
    expect(paths[0]).toEqual({ d: expect.stringMatching(/^m12 22/), fill: RED, stroke: RED })
    expect(paths[1]).toMatchObject({ fill: 'none', stroke: WHITE })
  })
}
