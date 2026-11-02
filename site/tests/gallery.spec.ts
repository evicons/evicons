import { expect, test, type Page } from '@playwright/test'

// The gallery island renders on the server; wait for hydration before interacting with it.
async function open(page: Page, path = '/icons') {
  await page.goto(path)
  await expect(page.locator('[data-gallery][data-ready]')).toBeAttached()
}

const cards = (page: Page) => page.locator('[data-icon-card]')
const search = (page: Page) => page.getByRole('searchbox', { name: 'Search icons' })
// From `md` up the panel is a region beside the grid, below it a modal dialog (see the mobile tests).
const panelOf = (page: Page) => page.locator('[data-icon-panel]')

test('shows all 54 icons', async ({ page }) => {
  await open(page)
  await expect(cards(page)).toHaveCount(54)
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
  await expect.poll(() => cards(page).count()).toBeLessThan(54)
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

test('Markers chip shows the 10 markers', async ({ page }) => {
  await open(page)
  await page.getByRole('group', { name: 'Category' }).getByRole('button', { name: 'Markers' }).click()
  await expect(cards(page)).toHaveCount(10)
})

test('clicking an icon opens the panel with the React import and updates the URL', async ({ page }) => {
  await open(page)
  await page.locator('[data-icon-card="plug-ccs2"]').click()
  const panel = panelOf(page)
  await expect(panel).toHaveAttribute('role', 'region')
  await expect(panel).not.toHaveAttribute('aria-modal', /.*/)
  await expect(page.getByRole('region', { name: 'plug-ccs2' })).toBeVisible()
  await expect(panel).toContainText("import { PlugCcs2 } from '@evicons/react'")
  await expect(panel).toContainText('<PlugCcs2 size={24} title="CCS Combo 2" />')
  await expect(page).toHaveURL(/\?icon=plug-ccs2$/)
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(page).toHaveURL(/\/icons\/?$/)
})

test('deep link ?icon=status-queue opens the panel', async ({ page }) => {
  await open(page, '/icons?icon=status-queue')
  const panel = panelOf(page)
  await expect(panel).toBeVisible()
  await expect(panel.getByRole('heading', { level: 2 })).toHaveText('status-queue')
})

test('SVG and Sprite tabs show the markup', async ({ page }) => {
  await open(page, '/icons?icon=plug-ccs2')
  const panel = panelOf(page)
  await panel.getByRole('tab', { name: 'SVG' }).click()
  await expect(panel.getByRole('tabpanel')).toContainText('<svg xmlns="http://www.w3.org/2000/svg"')
  await panel.getByRole('tab', { name: 'Sprite' }).click()
  await expect(panel.getByRole('tabpanel')).toHaveText(
    [
      "<!-- Copy sprite.svg from @evicons/svg to your app's public folder -->",
      '<svg width="24" height="24" aria-hidden="true"><use href="/sprite.svg#evicon-plug-ccs2" /></svg>',
    ].join('\n'),
  )
})

test('Escape in the search field closes the panel and keeps the query', async ({ page }) => {
  await open(page)
  await search(page).fill('ccs')
  await page.locator('[data-icon-card="plug-ccs2"]').click()
  await expect(panelOf(page)).toBeVisible()
  await search(page).focus()
  await page.keyboard.press('Escape')
  await expect(panelOf(page)).toBeHidden()
  await expect(search(page)).toHaveValue('ccs')
  await expect(search(page)).toBeFocused()
})

test('Filled switches currentColor to EV blue and back', async ({ page }) => {
  await open(page)
  await page.getByRole('group', { name: 'Category' }).getByRole('button', { name: 'Markers' }).click()
  const colours = page.getByRole('group', { name: 'Colour' })
  const pin = page.locator('[data-icon-card="marker-available"] svg path').first()
  await expect(colours.getByRole('button', { name: 'currentColor' })).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('switch', { name: 'Filled' }).click()
  await expect(colours.getByRole('button', { name: 'EV blue' })).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(() => pin.evaluate((el) => getComputedStyle(el).fill)).toBe('rgb(37, 99, 235)')

  await page.getByRole('switch', { name: 'Filled' }).click()
  await expect(colours.getByRole('button', { name: 'currentColor' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('[data-icon-card="marker-available"] svg')).not.toHaveAttribute('style', /color/)

  // A colour the user picked stays when Filled goes off again.
  await page.getByRole('switch', { name: 'Filled' }).click()
  await colours.getByRole('button', { name: 'faulted red' }).click()
  await page.getByRole('switch', { name: 'Filled' }).click()
  await expect(colours.getByRole('button', { name: 'faulted red' })).toHaveAttribute('aria-pressed', 'true')
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
  const panel = panelOf(page)
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

test.describe('mobile', () => {
  test.use({
    viewport: { width: 360, height: 740 },
    hasTouch: true,
    isMobile: true,
  })

  test('grid has 3 columns at 360 px and the appearance controls are folded', async ({ page }) => {
    await open(page)
    const columns = await page
      .getByRole('list', { name: 'Icons' })
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)
    expect(columns).toBe(3)
    const customise = page.getByRole('button', { name: /Customise/ })
    await expect(customise).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByRole('group', { name: 'Size' })).toBeHidden()
    await customise.click()
    await expect(customise).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('group', { name: 'Size' })).toBeVisible()
  })

  test('the bottom sheet is modal: the page behind is inert and Tab stays in the sheet', async ({ page }) => {
    await open(page)
    await page.locator('[data-icon-card="plug-ccs2"]').click()
    const sheet = page.getByRole('dialog', { name: 'plug-ccs2' })
    await expect(sheet).toHaveAttribute('aria-modal', 'true')
    await expect(sheet.getByRole('heading', { level: 2 })).toBeFocused()
    expect(
      await page
        .locator('header')
        .first()
        .evaluate((el) => (el as HTMLElement).inert),
    ).toBe(true)
    expect(await search(page).evaluate((el) => el.closest('[inert]') !== null)).toBe(true)
    expect(await sheet.evaluate((el) => el.closest('[inert]'))).toBeNull()

    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab')
      expect(await sheet.evaluate((el) => el.contains(document.activeElement)), `Tab ${i + 1}`).toBe(true)
    }
    await page.keyboard.press('Shift+Tab')
    expect(await sheet.evaluate((el) => el.contains(document.activeElement))).toBe(true)

    await sheet.getByRole('button', { name: 'Close' }).click()
    await expect(sheet).toBeHidden()
    expect(await page.locator('[inert]').count()).toBe(0)
    await expect(page.locator('[data-icon-card="plug-ccs2"]')).toBeFocused()
  })

  test('card names wrap inside the card at 360 px, also bidirectional-charging', async ({ page }) => {
    await open(page)
    const clipped = await page
      .locator('[data-icon-card] span:last-child')
      .evaluateAll((spans) => spans.filter((el) => el.scrollWidth > el.clientWidth).map((el) => el.textContent))
    expect(clipped).toEqual([])
    // The long name breaks onto the second line and stays within the two-line label.
    const label = page.locator('[data-icon-card="bidirectional-charging"] span:last-child')
    await expect(label).toHaveText('bidirectional-charging')
    expect(await label.evaluate((el) => el.scrollHeight <= el.clientHeight)).toBe(true)
  })

  test('the sheet header stays in view and one-line snippets wrap', async ({ page }) => {
    await open(page, '/icons?icon=marker-out-of-service')
    const sheet = page.getByRole('dialog', { name: 'marker-out-of-service' })
    await sheet.getByRole('tab', { name: 'Sprite' }).click()
    await sheet.evaluate((el) => el.scrollTo(0, el.scrollHeight))
    await expect(sheet.getByRole('button', { name: 'Close' })).toBeInViewport({
      ratio: 1,
    })
    const code = sheet.getByRole('tabpanel')
    expect(await code.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  })
})
