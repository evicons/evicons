import { expect, test, type Page } from '@playwright/test'

// The gallery island renders on the server; wait for hydration before interacting with it.
async function open(page: Page, path = '/icons') {
  await page.goto(path)
  await expect(page.locator('[data-gallery][data-ready]')).toBeAttached()
}

const cards = (page: Page) => page.locator('[data-icon-card]')
const search = (page: Page) => page.getByRole('searchbox', { name: 'Search icons' })

test('shows all 43 icons', async ({ page }) => {
  await open(page)
  await expect(cards(page)).toHaveCount(43)
})

test('search "ccs" finds only plug-ccs2', async ({ page }) => {
  await open(page)
  await search(page).fill('ccs')
  await expect(cards(page)).toHaveCount(1)
  await expect(cards(page).first()).toHaveAttribute('data-icon-card', 'plug-ccs2')
})

test('search matches German tags', async ({ page }) => {
  await open(page)
  await search(page).fill('Stecker')
  await expect.poll(() => cards(page).count()).toBeGreaterThanOrEqual(4)
  await expect.poll(() => cards(page).count()).toBeLessThan(43)
})

test('search ignores case and accents', async ({ page }) => {
  await open(page)
  await search(page).fill('TELEPHONE')
  await expect(page.locator('[data-icon-card="app-charging"]')).toBeVisible()
  await search(page).fill('téléphone')
  await expect(page.locator('[data-icon-card="app-charging"]')).toBeVisible()
})

test('search without a match shows the empty state', async ({ page }) => {
  await open(page)
  await search(page).fill('zzz')
  await expect(page.getByText('No icons match')).toBeVisible()
  await expect(cards(page)).toHaveCount(0)
})

test('Markers chip shows the 8 markers', async ({ page }) => {
  await open(page)
  await page.getByRole('group', { name: 'Category' }).getByRole('button', { name: 'Markers' }).click()
  await expect(cards(page)).toHaveCount(8)
})

test('clicking an icon opens the panel with the React import and updates the URL', async ({ page }) => {
  await open(page)
  await page.locator('[data-icon-card="plug-ccs2"]').click()
  const panel = page.getByRole('dialog')
  await expect(panel).toContainText("import { PlugCcs2 } from '@evicons/react'")
  await expect(panel).toContainText('<PlugCcs2 size={24} title="CCS Combo 2" />')
  await expect(page).toHaveURL(/\?icon=plug-ccs2$/)
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(page).toHaveURL(/\/icons\/?$/)
})

test('deep link ?icon=status-queue opens the panel', async ({ page }) => {
  await open(page, '/icons?icon=status-queue')
  const panel = page.getByRole('dialog')
  await expect(panel).toBeVisible()
  await expect(panel.getByRole('heading', { level: 2 })).toHaveText('status-queue')
})

test('SVG and Sprite tabs show the markup', async ({ page }) => {
  await open(page, '/icons?icon=plug-ccs2')
  const panel = page.getByRole('dialog')
  await panel.getByRole('tab', { name: 'SVG' }).click()
  await expect(panel.getByRole('tabpanel')).toContainText('<svg xmlns="http://www.w3.org/2000/svg"')
  await panel.getByRole('tab', { name: 'Sprite' }).click()
  await expect(panel.getByRole('tabpanel')).toContainText(
    '<svg width="24" height="24"><use href="/sprite.svg#evicon-plug-ccs2" /></svg>',
  )
})

test('keyboard: arrows move focus, Enter opens, Escape closes', async ({ page }) => {
  await open(page)
  const first = cards(page).nth(0)
  await first.focus()
  await page.keyboard.press('ArrowRight')
  await expect(cards(page).nth(1)).toBeFocused()
  await page.keyboard.press('ArrowLeft')
  await expect(first).toBeFocused()
  const name = await first.getAttribute('data-icon-card')
  await page.keyboard.press('Enter')
  const panel = page.getByRole('dialog')
  await expect(panel.getByRole('heading', { level: 2 })).toHaveText(name!)
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(first).toBeFocused()
})

test('filled markers follow the CSS contract, also with a title', async ({ page }) => {
  await open(page)
  await page.getByRole('group', { name: 'Category' }).getByRole('button', { name: 'Markers' }).click()
  await page.getByRole('switch', { name: 'Filled' }).click()

  const card = page.locator('[data-icon-card="marker-available"] svg')
  expect(
    await card
      .locator('path')
      .first()
      .evaluate((el) => getComputedStyle(el).fill),
  ).not.toBe('none')
  expect(
    await card
      .locator('path')
      .nth(1)
      .evaluate((el) => getComputedStyle(el).stroke),
  ).toBe('rgb(255, 255, 255)')

  // The panel preview is the React component with `title`: <title> is the first child of the <svg>.
  await page.locator('[data-icon-card="marker-available"]').click()
  const preview = page.locator('[data-preview] svg.evicon-marker-available')
  await expect(preview.locator('title')).toHaveCount(1)
  expect(
    await preview
      .locator('path')
      .first()
      .evaluate((el) => getComputedStyle(el).fill),
  ).not.toBe('none')
  expect(
    await preview
      .locator('path')
      .nth(1)
      .evaluate((el) => getComputedStyle(el).stroke),
  ).toBe('rgb(255, 255, 255)')
})

test('size, stroke and colour controls apply to the cards', async ({ page }) => {
  await open(page)
  await page.getByRole('group', { name: 'Size' }).getByRole('button', { name: '48' }).click()
  await page.getByRole('group', { name: 'Stroke' }).getByRole('button', { name: '2' }).click()
  await page.getByRole('group', { name: 'Colour' }).getByRole('button', { name: 'EV blue' }).click()
  const svg = page.locator('[data-icon-card="plug-ccs2"] svg')
  await expect(svg).toHaveAttribute('width', '48')
  await expect(svg).toHaveAttribute('stroke-width', '2')
  expect(await svg.evaluate((el) => getComputedStyle(el).color)).toBe('rgb(37, 99, 235)')
})

test('gallery has no console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(err.message))
  await open(page, '/icons?icon=plug-ccs2')
  await expect(page.locator('[data-preview] svg.evicon')).toBeVisible()
  expect(errors).toEqual([])
})
