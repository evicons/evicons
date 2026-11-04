import { expect, test } from '@playwright/test'

test('the icon strip shows every icon once, hidden from assistive technology', async ({ page }) => {
  await page.goto('/')
  const strip = page.locator('[data-icon-strip]')
  await expect(strip).toHaveAttribute('aria-hidden', 'true')
  await expect(strip.locator('[tabindex], a, button')).toHaveCount(0)
  const lists = strip.locator('ul')
  await expect(lists).toHaveCount(2)
  await expect(lists.nth(0).locator('li')).toHaveCount(83)
  await expect(lists.nth(1).locator('li')).toHaveCount(83)
  // Screen readers get one sentence instead of 142 strip entries.
  await expect(page.locator('section[aria-label="Icon strip"] .sr-only')).toHaveText('All 83 icons')
  // Every <use> points at a symbol defined on the page, drawn from the SVG sources.
  const missing = await strip.evaluate((el) =>
    [...el.querySelectorAll('use')].map((u) => u.getAttribute('href')!).filter((href) => !document.querySelector(href)),
  )
  expect(missing).toEqual([])
  await expect(lists.nth(0).locator('li[title="plug-ccs2"]')).toHaveCount(1)
})

test('the icon strip moves, pauses on hover and with the pause button, and stops with reduced motion', async ({ page }) => {
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

  const pause = page.getByRole('button', { name: 'Pause motion' })
  await expect(pause).toHaveAttribute('aria-pressed', 'false')
  await pause.click()
  await expect(pause).toHaveAttribute('aria-pressed', 'true')
  await page.mouse.move(0, 0)
  expect(await state()).toBe('paused')
  await pause.press('Enter')
  await expect(pause).toHaveAttribute('aria-pressed', 'false')
  expect(await state()).toBe('running')

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(track).toHaveCSS('animation-name', 'none')
  await expect(page.locator('[data-icon-strip] ul').nth(1)).toBeHidden()
  await expect(pause).toBeHidden()
})

test('the icon count on the landing page comes from the icon data', async ({ page }) => {
  await page.goto('/icons')
  await expect(page.locator('[data-gallery][data-ready]')).toBeAttached()
  const gallery = await page.locator('[data-icon-card]').count()
  await page.goto('/')
  expect(Number(await page.locator('[data-tagline] [data-icon-count]').textContent())).toBe(gallery)
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', new RegExp(`— ${gallery} icons,`))
  await expect(page.locator('[data-strip-caption]')).toContainText(`All ${gallery} icons`)
  await expect(page.locator('[data-icon-strip] ul').first().locator('li')).toHaveCount(gallery)
})

test('desktop hero shows the 3 × 3 icon cluster in EV blue, hidden on phones', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  const cluster = page.locator('[data-hero-cluster]')
  await expect(cluster).toBeVisible()
  await expect(cluster).toHaveAttribute('aria-hidden', 'true')
  const names = await cluster.locator('svg.evicon').evaluateAll((svgs) =>
    svgs.map((svg) => [...svg.classList].find((c) => c.startsWith('evicon-'))!.slice(7)),
  )
  expect(names).toEqual([
    'charging-station',
    'plug-ccs2',
    'plug-type-2',
    'status-available',
    'marker-charging',
    'car-electric',
    'power-kw',
    'charging-card',
    'fast-charging',
  ])
  const first = cluster.locator('svg.evicon').first()
  await expect(first).toHaveAttribute('width', '48')
  expect(await first.evaluate((el) => getComputedStyle(el).color)).toBe('rgb(37, 99, 235)')
  await page.setViewportSize({ width: 1023, height: 900 })
  await expect(cluster).toBeHidden()
})

for (const width of [390, 1280]) {
  test(`the landing page does not shift while loading (${width} px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.addInitScript(() => {
      const w = window as unknown as { shifts: { value: number; nodes: string[] }[] }
      w.shifts = []
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as unknown as {
          value: number
          hadRecentInput: boolean
          sources: { node?: Node }[]
        }[]) {
          if (entry.hadRecentInput) continue
          const nodes = entry.sources.map((s) => (s.node as Element | undefined)?.outerHTML?.slice(0, 80) ?? s.node?.nodeName ?? '?')
          w.shifts.push({ value: entry.value, nodes })
        }
      }).observe({ type: 'layout-shift', buffered: true })
    })
    // Warm the cache first: this test is about the page's own layout (strip, cluster, cards), not about how
    // fast the font arrives under test load. The cold load is covered by Lighthouse's CLS (lighthouse.spec.ts).
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    const shifts = await page.evaluate(() => (window as unknown as { shifts: { value: number; nodes: string[] }[] }).shifts)
    expect(shifts, JSON.stringify(shifts, null, 1)).toEqual([])
  })
}

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

test('the market section names both sites as plain text links, body text 16 px', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  const section = page.locator('section[aria-labelledby="market"]')
  await expect(section.getByRole('heading', { level: 2 })).toHaveText('Made for the German charging market')
  await expect(section).toContainText('Built by the team behind ladejetzt.de and charge.tn')
  await expect(section.locator('a[href="https://ladejetzt.de"]')).toHaveText('ladejetzt.de')
  await expect(section.locator('a[href="https://charge.tn"]')).toHaveText('charge.tn')
  await expect(section.locator('img')).toHaveCount(0)
  for (const size of await section.locator('p').evaluateAll((ps) => ps.map((p) => getComputedStyle(p).fontSize))) {
    expect(size).toBe('16px')
  }
})

test('structured data, robots.txt and the sitemap', async ({ page, request }) => {
  await page.goto('/')
  // An array: the site-wide entry first, page-specific entries (icon pages) after it.
  const [data] = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!)
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
  // The main pages and /de; the icon pages (/icons/<name>, /de/icons/<name>) are checked in seo.spec.ts.
  const pages = urls.filter((url) => !/\/icons\/[a-z0-9-]+$/.test(url!))
  expect(pages.sort()).toEqual(
    ['/', '/brand', '/changelog', '/de', '/de/icons', '/docs', '/icons', '/imprint', '/map', '/privacy']
      .map((p) => `https://evicons.dev${p}`)
      .sort(),
  )
  // Error pages carry no structured data.
  expect(await (await request.get('/nope')).text()).not.toContain('application/ld+json')
})

test('imprint and privacy policy carry the legal content and are linked from the footer', async ({ page }) => {
  await page.goto('/imprint')
  const main = page.locator('main')
  await expect(main.locator('p.lead')).toHaveText('Legal notice (German law)')
  await expect(main).toContainText('Landolsi Digital')
  await expect(main).toContainText('Loisachstraße 7')
  await expect(main).toContainText('Kleinunternehmerregelung')
  await expect(main).toContainText('§ 18 Abs. 2 MStV')
  await expect(main.locator('a[href="mailto:abdellatif@landolsi.de"]')).toBeVisible()
  await expect(main.locator('a[href="https://github.com/evicons/evicons/blob/main/LICENSE"]')).toHaveText('LICENSE')
  await page.goto('/privacy')
  await expect(main.locator('p.lead')).toHaveText('Privacy policy (German/EU law)')
  await expect(main).toContainText('keine Cookies')
  await expect(main).toContainText('14 Tagen')
  await expect(main).toContainText('localStorage')
  await expect(main).toContainText('OpenFreeMap')
  // Statistics: cookieless, self-hosted OpenPanel, truncated IP; no claim of "no tracking" any more.
  await expect(main.locator('h2#statistik')).toHaveText('Statistik (OpenPanel)')
  await expect(main).toContainText('eigenen Server in Deutschland')
  await expect(main).toContainText('IP-Adresse kürzen wir vorher')
  await expect(main).not.toContainText('kein Tracking')
  await expect(main).not.toContainText('keine Analysewerkzeuge')
  await expect(page.locator('meta[name="description"]')).not.toHaveAttribute('content', /no tracking/)
  await expect(main).toContainText('Stand: 4. November 2026')
  const footer = page.getByRole('navigation', { name: 'Footer' })
  await expect(footer.getByRole('link', { name: 'Imprint' })).toHaveAttribute('href', '/imprint')
  await expect(footer.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy')
  // /map points to the section about the tiles.
  await page.goto('/map')
  await expect(page.locator('[data-privacy-note] a[href="/privacy#kartenkacheln"]')).toBeVisible()
})

test('the landing page fits a 390 px screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
})
