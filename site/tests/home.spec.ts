import { expect, test } from '@playwright/test'

test('the icon strip shows every icon once, with a hidden copy for the loop', async ({ page }) => {
  await page.goto('/')
  const strip = page.locator('[data-icon-strip]')
  await expect(strip).toHaveAttribute('aria-label', 'All 43 icons')
  const lists = strip.locator('ul')
  await expect(lists).toHaveCount(2)
  await expect(lists.nth(0).locator('li')).toHaveCount(43)
  await expect(lists.nth(1).locator('li')).toHaveCount(43)
  await expect(lists.nth(1)).toHaveAttribute('aria-hidden', 'true')
  // Every <use> points at a symbol defined on the page, drawn from the SVG sources.
  const missing = await strip.evaluate((el) =>
    [...el.querySelectorAll('use')].map((u) => u.getAttribute('href')!).filter((href) => !document.querySelector(href)),
  )
  expect(missing).toEqual([])
  await expect(lists.nth(0)).toContainText('plug-ccs2')
})

test('the icon strip moves, pauses on hover and focus, and stops with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  const track = page.locator('.icon-strip-track')
  const state = () => track.evaluate((el) => getComputedStyle(el).animationPlayState)
  await expect(track).toHaveCSS('animation-name', /icon-strip/)
  expect(await state()).toBe('running')
  await page.locator('[data-icon-strip]').hover()
  expect(await state()).toBe('paused')
  await page.mouse.move(0, 0)
  expect(await state()).toBe('running')
  await page.locator('[data-icon-strip]').focus()
  expect(await state()).toBe('paused')

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(track).toHaveCSS('animation-name', 'none')
  await expect(page.locator('[data-icon-strip] ul').nth(1)).toBeHidden()
})

test('the landing page does not shift while loading', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.addInitScript(() => {
    ;(window as unknown as { cls: number }).cls = 0
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
        if (!entry.hadRecentInput) (window as unknown as { cls: number }).cls += entry.value
      }
    }).observe({ type: 'layout-shift', buffered: true })
  })
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
  expect(await page.evaluate(() => (window as unknown as { cls: number }).cls)).toBeLessThan(0.01)
})

test('three feature cards with the spec titles, connectors and map markers', async ({ page }) => {
  await page.goto('/')
  const titles = page.locator('article.feature h3')
  await expect(titles).toHaveText(['Standards-checked connectors', 'Status by shape', 'Map markers'])
  for (const name of ['plug-type-2', 'plug-ccs2', 'plug-chademo', 'plug-schuko']) {
    await expect(page.locator(`article.feature svg.evicon-${name}`)).toHaveCount(1)
  }
  // Filled pins: the first path takes the pin colour, the sign is white.
  const pin = page.locator('.map-mock svg.evicon-marker-available > path').first()
  expect(await pin.evaluate((el) => getComputedStyle(el).fill)).toBe('rgb(22, 163, 74)')
  await expect(page.locator('article.feature a[href="/map"]')).toBeVisible()
  // Cards in one row have the same height (desktop).
  const heights = await page.locator('article.feature').evaluateAll((cards) => cards.map((c) => c.clientHeight))
  expect(new Set(heights).size).toBe(1)
})

test('the market section names both sites as plain text links', async ({ page }) => {
  await page.goto('/')
  const section = page.locator('section[aria-labelledby="market"]')
  await expect(section.getByRole('heading', { level: 2 })).toHaveText('Made for the German charging market')
  await expect(section).toContainText('Built by the team behind ladejetzt.de and charge.tn')
  await expect(section.locator('a[href="https://ladejetzt.de"]')).toHaveText('ladejetzt.de')
  await expect(section.locator('a[href="https://charge.tn"]')).toHaveText('charge.tn')
  await expect(section.locator('img')).toHaveCount(0)
})

test('structured data, robots.txt and the sitemap', async ({ page, request }) => {
  await page.goto('/')
  const data = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!)
  expect(data).toMatchObject({
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: 'EVicons',
    codeRepository: 'https://github.com/evicons/evicons',
    programmingLanguage: 'TypeScript',
    license: 'https://opensource.org/license/mit',
  })
  const robots = await (await request.get('/robots.txt')).text()
  expect(robots).toContain('Sitemap: https://evicons.dev/sitemap-index.xml')
  const index = await request.get('/sitemap-index.xml')
  expect(index.status()).toBe(200)
  expect(await index.text()).toContain('https://evicons.dev/sitemap-0.xml')
  const urls = [...(await (await request.get('/sitemap-0.xml')).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  expect(urls.sort()).toEqual(
    ['/', '/brand', '/changelog', '/docs', '/icons', '/imprint', '/map'].map((p) => `https://evicons.dev${p}`).sort(),
  )
  // Error pages carry no structured data.
  expect(await (await request.get('/nope')).text()).not.toContain('application/ld+json')
})

test('imprint names the company, links landolsi.de and has the privacy note', async ({ page }) => {
  await page.goto('/imprint')
  const main = page.locator('main')
  await expect(main).toContainText('Landolsi Digital')
  await expect(main.locator('a[href="https://landolsi.de"]')).toBeVisible()
  await expect(main).toContainText('Imprint text follows.')
  await expect(main).toContainText('no cookies')
  await expect(main).toContainText('OpenFreeMap')
})

test('the landing page fits a 390 px screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
})
