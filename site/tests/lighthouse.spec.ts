import { createServer } from 'node:net'
import { chromium, expect, test } from '@playwright/test'
import lighthouse from 'lighthouse'

// Lighthouse, mobile (its default: emulated phone, simulated slow 4G and 4× CPU slowdown), against the
// static build served by `astro preview`. Runs in its own Playwright project after the other tests
// (playwright.config.ts), so their load does not distort the timings.
const categories = ['performance', 'accessibility', 'best-practices', 'seo'] as const
const floor = 95

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as { port: number }
      server.close(() => resolve(port))
    })
  })
}

test.describe.configure({ mode: 'serial', timeout: 180_000 })

for (const path of ['/', '/icons', '/docs']) {
  test(`lighthouse mobile ${path}: ≥ ${floor} in every category`, async ({ baseURL }) => {
    const port = await freePort()
    const browser = await chromium.launch({ args: [`--remote-debugging-port=${port}`] })
    try {
      const result = await lighthouse(
        new URL(path, baseURL).href,
        { port, output: 'json', logLevel: 'error', onlyCategories: [...categories] },
      )
      expect(result, 'lighthouse returned no result').toBeTruthy()
      const { lhr } = result!
      expect(lhr.runtimeError, JSON.stringify(lhr.runtimeError)).toBeUndefined()
      expect(lhr.configSettings.formFactor).toBe('mobile')
      expect(lhr.configSettings.throttlingMethod).toBe('simulate')
      const scores = Object.fromEntries(categories.map((id) => [id, Math.round((lhr.categories[id]?.score ?? 0) * 100)]))
      console.log(`lighthouse ${path}: ${JSON.stringify(scores)}`)
      // On failure, name the audits that cost points.
      const failing = Object.values(lhr.audits)
        .filter((audit) => audit.score !== null && audit.score < 0.9 && audit.scoreDisplayMode !== 'informative')
        .map((audit) => `${audit.id}: ${audit.displayValue ?? audit.score}`)
      for (const id of categories) expect(scores[id], `${id} on ${path}; audits below 0.9: ${failing.join(', ')}`).toBeGreaterThanOrEqual(floor)
    } finally {
      await browser.close()
    }
  })
}
