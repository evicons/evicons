import { createServer } from 'node:net'
import { chromium, expect, test } from '@playwright/test'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'

// Lighthouse against the static build served by `astro preview`: mobile (the default config: emulated phone,
// simulated slow 4G, 4× CPU slowdown) for /, /icons and /docs, desktop (Lighthouse's desktop preset) for /. Runs in its own Playwright project after the other tests
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

const runs = [
  { path: '/', formFactor: 'mobile' },
  { path: '/icons', formFactor: 'mobile' },
  { path: '/docs', formFactor: 'mobile' },
  { path: '/', formFactor: 'desktop' },
] as const

for (const { path, formFactor } of runs) {
  test(`lighthouse ${formFactor} ${path}: ≥ ${floor} in every category`, async ({ baseURL }) => {
    const port = await freePort()
    const browser = await chromium.launch({ args: [`--remote-debugging-port=${port}`] })
    try {
      const result = await lighthouse(
        new URL(path, baseURL).href,
        { port, output: 'json', logLevel: 'error', onlyCategories: [...categories] },
        formFactor === 'desktop' ? desktopConfig : undefined,
      )
      expect(result, 'lighthouse returned no result').toBeTruthy()
      const { lhr } = result!
      expect(lhr.runtimeError, JSON.stringify(lhr.runtimeError)).toBeUndefined()
      expect(lhr.configSettings.formFactor).toBe(formFactor)
      expect(lhr.configSettings.throttlingMethod).toBe('simulate')
      const scores = Object.fromEntries(categories.map((id) => [id, Math.round((lhr.categories[id]?.score ?? 0) * 100)]))
      const cls = lhr.audits['cumulative-layout-shift']?.numericValue
      console.log(`lighthouse ${formFactor} ${path}: ${JSON.stringify(scores)} CLS ${cls}`)
      // Cold load on a throttled connection: the preloaded font and fixed-size icons keep the layout still.
      expect(cls, 'cumulative layout shift').toBe(0)
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
