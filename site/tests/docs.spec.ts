import { expect, test } from '@playwright/test'

test('docs has every section with a working table of contents', async ({ page }) => {
  await page.goto('/docs')
  await expect(page.locator('h1')).toHaveText('Documentation')
  await expect(page.getByRole('heading', { level: 2, name: 'Map markers' })).toHaveAttribute('id', 'markers')
  const toc = page.getByRole('navigation', { name: 'On this page' })
  const targets = await toc.locator('a').evaluateAll((links) => links.map((a) => a.getAttribute('href')!))
  expect(targets).toEqual([
    '#install',
    '#react',
    '#svg',
    '#colouring',
    '#status',
    '#markers',
    '#accessibility',
    '#design',
    '#versioning',
    '#contributing',
  ])
  for (const target of targets) await expect(page.locator(`h2${target}`)).toHaveCount(1)
  await toc.getByRole('link', { name: 'Map markers' }).click()
  await expect(page).toHaveURL(/\/docs#markers$/)
  await expect(page.locator('#markers')).toBeInViewport()
})

test('/docs#markers scrolls to the heading on load', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/docs#markers')
  await expect(page.getByRole('heading', { level: 2, name: 'Map markers' })).toBeInViewport()
})

test('docs ids are unique', async ({ page }) => {
  await page.goto('/docs')
  const ids = await page.locator('[id]').evaluateAll((els) => els.map((el) => el.id))
  expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([])
})

test('code blocks are highlighted, labelled and copyable', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/docs')
  const snippet = page.locator('[data-snippet]').filter({ hasText: 'npm i @evicons/svg' })
  await expect(snippet.locator('.snippet-lang')).toHaveText('Shell')
  await expect(page.locator('[data-snippet] pre.astro-code').first()).toBeVisible()
  const button = snippet.getByRole('button', { name: 'Copy Shell code' })
  await button.click()
  await expect(button).toHaveText('Copied')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('npm i @evicons/svg')
})

test('code blocks follow the dark theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/docs')
  const keyword = page.locator('[data-snippet] pre.astro-code span[style*="--shiki-dark"]').first()
  const colour = await keyword.evaluate((el) => getComputedStyle(el).color)
  const dark = await keyword.evaluate((el) => getComputedStyle(el).getPropertyValue('--shiki-dark').trim())
  const toRgb = (hex: string) => {
    const n = parseInt(hex.slice(1, 7), 16)
    return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
  }
  expect(colour).toBe(toRgb(dark))
})

test('status table and filled markers render from the packages', async ({ page }) => {
  await page.goto('/docs')
  const table = page.locator('table.status-table')
  await expect(table.locator('tbody tr')).toHaveCount(7)
  await expect(table.locator('svg.evicon-status-queue')).toHaveCount(1)
  await expect(table).toContainText('2.15:1')
  const pin = page.locator('.marker-filled svg.evicon-marker-available > path').first()
  expect(await pin.evaluate((el) => getComputedStyle(el).fill)).toBe('rgb(22, 163, 74)')
})

test('changelog renders CHANGELOG.md', async ({ page }) => {
  await page.goto('/changelog')
  await expect(page.locator('h1')).toHaveText('Changelog')
  await expect(page.getByRole('heading', { level: 2, name: /0\.2\.0/ })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: /0\.1\.0/ })).toBeVisible()
  await expect(page.locator('main')).toContainText('marker-charging')
})

test('docs and changelog have no console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(err.message))
  for (const path of ['/docs', '/changelog']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
  }
  expect(errors).toEqual([])
})

test('status table: stacked and readable at 390 px, low-contrast colour flagged', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/docs#status')
  const wrap = page.locator('.table-wrap:has(table.status-table)')
  // No sideways scrolling: everything of a row is visible.
  expect(await wrap.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0)
  const occupied = page.locator('table.status-table tr', { hasText: 'Occupied' })
  // #d97706 is the recommended occupied colour; only the dark-background alternative #f59e0b is below 3:1.
  const first = occupied.locator('td[data-label="Colour"] > span > span').first()
  await expect(first).toContainText('#d97706')
  await expect(first).toContainText('recommended')
  await expect(occupied).toContainText('3.19:1')
  await expect(occupied.locator('.contrast-flag')).toHaveText('Below 3:1: dark backgrounds only')
  await expect(occupied.getByText('Occupied: the charge point is in use')).toBeInViewport({ ratio: 0 })
  await expect(page.locator('table.status-table .contrast-flag')).toHaveCount(1)
})

test('the last docs section becomes current at the bottom of the page', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/docs')
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  const toc = page.getByRole('navigation', { name: 'On this page' })
  await expect(toc.getByRole('link', { name: 'Contributing' })).toHaveAttribute('aria-current', 'location')
  await expect(toc.locator('a[aria-current]')).toHaveCount(1)
})

test('changelog hides the empty Unreleased section and links the docs', async ({ page }) => {
  await page.goto('/changelog')
  await expect(page.getByRole('heading', { name: 'Unreleased' })).toHaveCount(0)
  await expect(page.locator('main a[href="/docs#markers"]')).toHaveText('Map markers')
  await expect(page.locator('main')).not.toContainText('in the README for the CSS rule')
})

test('docs use "charge point" wording and spell out the provenance type', async ({ page }) => {
  await page.goto('/docs')
  const article = page.locator('article.doc')
  await expect(article.locator('section', { hasText: 'map pins with a sign' }).first()).not.toContainText(
    'plain charging point',
  )
  await expect(article.locator('tr', { hasText: 'provenance' }).first()).toContainText('{ createdBy, approvedBy, approvedOn }')
})
