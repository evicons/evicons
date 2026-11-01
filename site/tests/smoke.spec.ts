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
  await expect(html).toHaveAttribute('data-theme', 'light')
  await page.getByRole('button', { name: 'Switch to dark theme' }).click()
  await expect(html).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(html).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible()
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
  for (const path of ['/favicon.svg', '/favicon-32.png', '/apple-touch-icon.png', '/og.png']) {
    expect((await request.get(path)).status(), path).toBe(200)
  }
})

test('head has icons and an absolute social image', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute('href', '/favicon.svg')
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/apple-touch-icon.png')
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://evicons.dev/og.png')
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
})

test('header shows the logo linking home', async ({ page }) => {
  await page.goto('/brand')
  const home = page.locator('header a[href="/"]')
  await expect(home).toHaveAccessibleName('EVicons')
  await expect(home.locator('svg')).toBeVisible()
})
