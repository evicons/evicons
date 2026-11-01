import { expect, test } from '@playwright/test'

test('home renders hero and install line', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toContainText('Outline icons for EV charging')
  await expect(page.getByText('npm i @evicons/react', { exact: true })).toBeVisible()
})

test('no console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(err.message))
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  expect(errors).toEqual([])
})

test('home renders @evicons/react icons from the workspace package', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('svg.evicon.evicon-plug-ccs2')).toHaveCount(1)
  expect(await page.locator('svg.evicon').count()).toBeGreaterThanOrEqual(10)
})

test('theme toggle switches data-theme and remembers the choice', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')
  const html = page.locator('html')
  const toggle = page.getByRole('button', { name: 'Toggle colour theme' })
  await expect(html).toHaveAttribute('data-theme', 'light')
  await expect(toggle.locator('.theme-glyph-light')).toBeVisible()
  await toggle.click()
  await expect(html).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(html).toHaveAttribute('data-theme', 'dark')
  await expect(toggle.locator('.theme-glyph-dark')).toBeVisible()
  await expect(toggle.locator('.theme-glyph-light')).toBeHidden()
})

test('theme toggle is correct in dark mode before hydration', async ({ page }) => {
  // Block the island bundles: only the inline head script runs.
  await page.route('**/_astro/*.js', (route) => route.abort())
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  const toggle = page.getByRole('button', { name: 'Toggle colour theme' })
  await expect(toggle.locator('.theme-glyph-dark')).toBeVisible()
  await expect(toggle.locator('.theme-glyph-light')).toBeHidden()
})

test('copy button copies the install line and announces it', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  const button = page.getByRole('button', { name: 'Copy install command' })
  await button.click()
  await expect(button).toHaveText('Copied')
  await expect(page.locator('[data-copy-status]')).toHaveText('Copied to clipboard')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('npm i @evicons/react')
})

test('copy button announces a failure and keeps its width', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('denied')) },
    })
  })
  await page.goto('/')
  const button = page.getByRole('button', { name: 'Copy install command' })
  const before = (await button.boundingBox())!.width
  await button.click()
  await expect(button).toHaveText('Copy failed')
  await expect(page.locator('[data-copy-status]')).toHaveText('Copy failed')
  expect((await button.boundingBox())!.width).toBe(before)
})

test('canonical URLs have no trailing slash; the 404 page is not indexed', async ({ page, request }) => {
  await page.goto('/icons')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://evicons.dev/icons')
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://evicons.dev/icons')
  await page.goto('/')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://evicons.dev/')
  const notFound = await request.get('/this-page-does-not-exist')
  expect(notFound.status()).toBe(404)
  const body = await notFound.text()
  expect(body).toContain('<meta name="robots" content="noindex">')
  expect(body).not.toContain('rel="canonical"')
  expect(body).not.toContain('og:url')
})

test('header and footer links have no dead internal targets', async ({ page, request }) => {
  await page.goto('/')
  const hrefs = await page.locator('header a[href^="/"], footer a[href^="/"]').evaluateAll((links) =>
    links.map((a) => a.getAttribute('href')!),
  )
  expect(hrefs).toEqual(expect.arrayContaining(['/icons', '/docs', '/map', '/brand', '/changelog', '/imprint']))
  for (const href of new Set(hrefs)) {
    expect((await request.get(href)).status(), href).toBe(200)
  }
})

test('status demo icons take their colour from CSS', async ({ page }) => {
  await page.goto('/')
  const colour = (name: string) =>
    page.locator(`svg.evicon-${name}`).evaluate((el) => getComputedStyle(el).color)
  expect(await colour('status-available')).toBe('rgb(22, 163, 74)')
  expect(await colour('status-occupied')).toBe('rgb(245, 158, 11)')
  expect(await colour('status-faulted')).toBe('rgb(220, 38, 38)')
})

test('brand page offers the logo as SVG and PNG downloads', async ({ page, request }) => {
  await page.goto('/brand')
  const downloads = page.locator('main a[download]')
  await expect(downloads.filter({ hasText: 'SVG' }).first()).toBeVisible()
  await expect(downloads.filter({ hasText: 'PNG' }).first()).toBeVisible()
  const hrefs = await downloads.evaluateAll((links) => links.map((a) => a.getAttribute('href')!))
  expect(hrefs).toEqual(expect.arrayContaining(['/brand/logo.svg', '/brand/logo-on-light.png']))
  for (const href of hrefs) {
    const response = await request.get(href)
    expect(response.status(), href).toBe(200)
    expect((await response.body()).length, href).toBeGreaterThan(100)
  }
})

test('favicons and the social image are served', async ({ request }) => {
  for (const path of ['/favicon.svg', '/favicon-32.png', '/favicon.ico', '/apple-touch-icon.png', '/og.png']) {
    expect((await request.get(path)).status(), path).toBe(200)
  }
  // ICO header: reserved 0, type 1 (icon), one image.
  const ico = await (await request.get('/favicon.ico')).body()
  expect([...ico.subarray(0, 6)]).toEqual([0, 0, 1, 0, 1, 0])
})

test('head has icons and an absolute social image', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute('href', '/favicon.svg')
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/apple-touch-icon.png')
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://evicons.dev/og.png')
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
  for (const alt of ['meta[property="og:image:alt"]', 'meta[name="twitter:image:alt"]']) {
    await expect(page.locator(alt)).toHaveAttribute('content', 'EVicons: outline icons for EV charging')
  }
})

test('header shows the logo linking home', async ({ page }) => {
  await page.goto('/brand')
  const home = page.locator('header a[href="/"]')
  await expect(home).toHaveAccessibleName('EVicons')
  await expect(home.locator('svg')).toBeVisible()
})
