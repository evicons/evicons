import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

// Icon pages (/icons/<name>, /de/icons/<name>), the German landing page and the sitemap.
const meta = JSON.parse(readFileSync(new URL('../../packages/svg/icons.json', import.meta.url), 'utf8')) as Record<
  string,
  { meaning: { en: string; de: string } }
>
const names = Object.keys(meta)

test('every icon has an English and a German page, each linking the other', async ({ request }) => {
  expect(names.length).toBeGreaterThanOrEqual(43)
  for (const name of names) {
    for (const [path, lang] of [
      [`/icons/${name}`, 'en'],
      [`/de/icons/${name}`, 'de'],
    ] as const) {
      const response = await request.get(path)
      expect(response.status(), path).toBe(200)
      const html = await response.text()
      expect(html, path).toContain(`<html lang="${lang}"`)
      expect(html, path).toContain(`<link rel="canonical" href="https://evicons.dev${path}">`)
      expect(html, path).toContain(`hreflang="en" href="https://evicons.dev/icons/${name}"`)
      expect(html, path).toContain(`hreflang="de" href="https://evicons.dev/de/icons/${name}"`)
      expect(html, path).toContain(`hreflang="x-default" href="https://evicons.dev/icons/${name}"`)
      // The meaning is in the HTML (quotes are escaped as entities, so compare up to the first quote).
      expect(html, path).toContain(meta[name]!.meaning[lang].split('"')[0]!.replace(/&/g, '&amp;'))
    }
  }
})

test('icon page: title, heading, structured data and the SVG as an image', async ({ page, request }) => {
  await page.goto('/icons/plug-type-2')
  await expect(page).toHaveTitle('Type 2 connector icon – SVG and React | EVicons')
  await expect(page.locator('h1')).toHaveText('Type 2 connector icon')
  const description = await page.locator('meta[name="description"]').getAttribute('content')
  expect(description!.length).toBeLessThanOrEqual(170)
  await expect(page.locator('img[src="/svg/plug-type-2.svg"]')).toHaveAttribute('alt', /Type 2 connector/)
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!) as Record<
    string,
    unknown
  >[]
  const image = ld.find((entry) => entry['@type'] === 'ImageObject')!
  expect(image).toMatchObject({
    contentUrl: 'https://evicons.dev/svg/plug-type-2.svg',
    license: 'https://opensource.org/license/mit',
    creator: { name: 'Landolsi Digital' },
  })
  expect(ld.find((entry) => entry['@type'] === 'BreadcrumbList')).toBeTruthy()
  const svg = await request.get('/svg/plug-type-2.svg')
  expect(svg.status()).toBe(200)
  expect(await svg.text()).toContain('viewBox="0 0 24 24"')
  // The download button points at the static file.
  await expect(page.getByRole('link', { name: 'Download SVG' })).toHaveAttribute('href', '/svg/plug-type-2.svg')
})

test('German icon page is German and switches to English', async ({ page }) => {
  await page.goto('/de/icons/charging-station')
  await expect(page).toHaveTitle('Ladesäule Icon – SVG und React | EVicons')
  await expect(page.locator('h1')).toHaveText('Ladesäule Icon')
  await expect(page.getByRole('button', { name: 'Shell-Code kopieren' })).toHaveText('Kopieren')
  await page.getByRole('link', { name: 'EN, English' }).click()
  await expect(page).toHaveURL(/\/icons\/charging-station$/)
})

test('related icons and prev/next stay in the category', async ({ page }) => {
  await page.goto('/icons/plug-type-2')
  const more = page.locator('section[aria-labelledby="more"] a')
  await expect(more).toHaveCount(3)
  for (const href of await more.evaluateAll((links) => links.map((l) => l.getAttribute('href')))) {
    expect(href).toMatch(/^\/icons\/plug-/)
  }
  await expect(page.locator('a[rel="prev"]')).toHaveAttribute('href', '/icons/plug-schuko')
})

test('German landing page lists every icon with its German page', async ({ page }) => {
  await page.goto('/de')
  await expect(page.locator('html')).toHaveAttribute('lang', 'de')
  await expect(page.locator('h1')).toHaveText('Icons für E-Mobilität und Ladestationen.')
  await expect(page.locator('a[href^="/de/icons/"]')).toHaveCount(names.length)
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', 'https://evicons.dev/')
})

test('the gallery page links every icon page for crawlers', async ({ page }) => {
  await page.goto('/icons')
  await expect(page.locator('section[aria-labelledby="icon-pages"] a[href^="/icons/"]')).toHaveCount(names.length)
})

test('sitemap lists the icon pages in both languages with hreflang', async ({ request }) => {
  const xml = await (await request.get('/sitemap-0.xml')).text()
  for (const name of names) {
    expect(xml).toContain(`<loc>https://evicons.dev/icons/${name}</loc>`)
    expect(xml).toContain(`<loc>https://evicons.dev/de/icons/${name}</loc>`)
  }
  expect(xml).toContain('hreflang="de" href="https://evicons.dev/de/icons/plug-type-2"')
  expect(xml).toContain('<loc>https://evicons.dev/de</loc>')
})

test('icon pages and /de fit a 390 px phone without sideways scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 })
  for (const path of ['/de', '/icons/plug-ccs2', '/de/icons/charging-station', '/de/icons/marker-out-of-service']) {
    await page.goto(path)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, path).toBeLessThanOrEqual(0)
  }
})
