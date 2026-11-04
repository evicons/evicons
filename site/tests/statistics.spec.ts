import { expect, test } from '@playwright/test'

// Statistics (OpenPanel, see components/Analytics.astro): the default build sets no PUBLIC_OPENPANEL_CLIENT_ID,
// so no page carries the init and nothing is loaded or sent. The build with a client ID and the nginx proxy
// are tested on the Docker image (docker.spec.ts).
test('without a client ID the pages carry no statistics', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (request) => requests.push(new URL(request.url()).pathname))
  for (const path of ['/', '/de', '/icons/plug-type-2', '/privacy']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('script[data-openpanel]'), path).toHaveCount(0)
    expect(await page.evaluate(() => 'op' in window), path).toBe(false)
  }
  expect(requests).not.toContain('/op1.js')
  expect(requests.some((path) => path.startsWith('/api/op'))).toBe(false)
})

test('the tracker is served from our own origin', async ({ request }) => {
  const response = await request.get('/op1.js')
  expect(response.status()).toBe(200)
  expect(await response.text()).toContain('trackAttributes')
})

test('named events sit on the copy and download buttons', async ({ page }) => {
  await page.goto('/icons/plug-type-2')
  for (const name of ['download_svg', 'copy_install', 'copy_react', 'copy_svg', 'copy_sprite']) {
    await expect(page.locator(`main [data-track="${name}"]`), name).toHaveCount(1)
  }
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Copy install command' })).toHaveAttribute('data-track', 'copy_install')
})

test('the gallery panel carries the same events', async ({ page }) => {
  await page.goto('/icons?icon=plug-ccs2')
  const panel = page.locator('[data-icon-panel]')
  await expect(panel).toBeVisible()
  await expect(panel.locator('[data-track="download_svg"]')).toHaveAttribute('data-icon', 'plug-ccs2')
  await expect(panel.locator('[data-track="copy_react"]')).toHaveCount(1)
})
