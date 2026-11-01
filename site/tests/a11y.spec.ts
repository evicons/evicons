import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// axe-core on every page, light and dark: no serious or critical violations.
// /icons is checked with the icon panel open, /map with the tiles blocked (no network needed).
const pages: { path: string; ready: (page: Page) => Promise<void> }[] = [
  { path: '/', ready: async () => {} },
  {
    path: '/icons?icon=plug-ccs2',
    ready: async (page) => {
      await expect(page.locator('[data-gallery][data-ready]')).toBeAttached()
      await expect(page.locator('[data-icon-panel]')).toBeVisible()
    },
  },
  { path: '/docs', ready: async () => {} },
  {
    path: '/map',
    ready: async (page) => {
      await expect(page.getByText('Map tiles could not be loaded')).toBeVisible()
      await expect(page.locator('[data-station]').first()).toBeVisible()
    },
  },
  { path: '/brand', ready: async () => {} },
  { path: '/changelog', ready: async () => {} },
  { path: '/imprint', ready: async () => {} },
]

for (const scheme of ['light', 'dark'] as const) {
  for (const { path, ready } of pages) {
    test(`${path} has no serious or critical axe violations (${scheme})`, async ({ page }) => {
      await page.route('**/tiles.openfreemap.org/**', (route) => route.abort())
      // Reduced motion: the icon strip on / stands still, so every icon is checked in place.
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await ready(page)
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze()
      const blocking = results.violations
        .filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map((v) => ({ id: v.id, impact: v.impact, help: v.help, targets: v.nodes.map((n) => n.target.join(' ')) }))
      expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([])
    })
  }
}
