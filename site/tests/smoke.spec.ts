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
