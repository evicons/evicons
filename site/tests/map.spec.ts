import { expect, test, type Page } from '@playwright/test'

// The map demo. OpenFreeMap is the only external source; by default the tests answer its style
// request with a minimal local style, so they do not depend on the network. Set EVICONS_LIVE_TILES=1
// to run the extra test against the real tiles.
const TILES = '**/tiles.openfreemap.org/**'
// Same attribution as the OpenFreeMap tiles, on an empty source.
const attribution =
  '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank">&copy; OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
const stubStyle = {
  version: 8,
  sources: { openmaptiles: { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, attribution } },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#f8f4f0' } },
    // The attribution control only lists sources that a layer uses.
    { id: 'points', type: 'circle', source: 'openmaptiles' },
  ],
}

async function stubTiles(page: Page) {
  await page.route(TILES, (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(stubStyle) }),
  )
}

function collectErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(err.message))
  return errors
}

// The test hook exists only under automation (navigator.webdriver).
const markerImages = (page: Page) => page.evaluate(() => window.__evMap?.listImages().sort() ?? [])
const renderedStations = (page: Page) => page.evaluate(() => window.__evMap?.renderedStations() ?? 0)
const renderedClusters = (page: Page) => page.evaluate(() => window.__evMap?.renderedClusters() ?? [])

async function clickPin(page: Page, id: string) {
  const point = await page.evaluate((id) => window.__evMap!.pinPoint(id), id)
  await page.mouse.click(point!.x, point!.y)
}
const expectedImages = [
  'ev-ac',
  'ev-available',
  'ev-available-selected',
  'ev-dc',
  'ev-faulted',
  'ev-faulted-selected',
  'ev-marker-cluster',
  'ev-marker-cluster-40',
  'ev-occupied',
  'ev-occupied-selected',
  'ev-out-of-service',
  'ev-out-of-service-selected',
  'ev-unknown',
  'ev-unknown-selected',
]

test('map page loads with canvas, 14 marker images and the legend', async ({ page }) => {
  const errors = collectErrors(page)
  await stubTiles(page)
  await page.goto('/map')
  const canvas = page.locator('canvas.maplibregl-canvas')
  await expect(canvas).toBeVisible()
  // The map fills its frame (a collapsed container would still have a canvas).
  expect((await canvas.boundingBox())!.height).toBeGreaterThan(300)
  await expect.poll(() => markerImages(page)).toEqual(expectedImages)
  await expect(page.locator('[data-map]')).toHaveAttribute('data-map-state', 'ready')
  // Drawn, not only registered: all 12 pins are rendered once the map is idle, none in a cluster.
  await expect.poll(() => renderedStations(page)).toBe(12)
  expect(await renderedClusters(page)).toEqual([])
  await expect(page.locator('[data-legend-entry]')).toHaveCount(8)
  await expect(page.locator('[data-station]')).toHaveCount(12)
  await expect(page.getByText('Demo data — fictional charge points', { exact: true })).toBeVisible()
  await expect(page.locator('[data-map-intro]')).toContainText('drawn with the marker-* icons: one filled pin')
  await expect(page.locator('[data-privacy-note]')).toContainText('Map tiles are loaded from OpenFreeMap when you open this page')
  await expect(page.locator('[data-privacy-note]')).toContainText('map data © OpenStreetMap contributors')
  const attributionControl = page.locator('.maplibregl-ctrl-attrib')
  await expect(attributionControl).toContainText('OpenFreeMap')
  await expect(attributionControl).toContainText('OpenStreetMap')
  await expect(attributionControl).not.toContainText('MapLibre')
  await expect(page.locator('[data-map-notice]')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('the station list opens the popup with status, connectors and power; Escape returns focus', async ({ page }) => {
  await stubTiles(page)
  await page.goto('/map')
  await expect.poll(() => markerImages(page)).toHaveLength(14)
  const button = page.locator('[data-station="demo-03"]')
  await button.focus()
  await page.keyboard.press('Enter')
  const popup = page.locator('.maplibregl-popup')
  await expect(popup).toBeVisible()
  await expect(popup.getByRole('heading', { level: 3 })).toHaveText('Market Hall')
  await expect(popup.getByRole('heading', { level: 3 })).toBeFocused()
  await expect(popup.locator('[data-station-status]')).toHaveText('Available')
  await expect(popup.locator('svg.evicon-status-available')).toHaveCount(1)
  await expect(popup.getByRole('list', { name: 'Connectors' })).toContainText('CCS2')
  await expect(popup.getByRole('list', { name: 'Connectors' })).toContainText('CHAdeMO')
  await expect(popup).toContainText('up to 150 kW')
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press('Escape')
  await expect(popup).toHaveCount(0)
  await expect(button).toBeFocused()
  await expect(button).toHaveAttribute('aria-pressed', 'false')
})

test('clicking pin A, then pin B opens B; empty space and Escape close the popup', async ({ page }) => {
  await stubTiles(page)
  await page.goto('/map')
  await expect.poll(() => renderedStations(page)).toBe(12)
  const popup = page.locator('.maplibregl-popup')
  await clickPin(page, 'demo-03')
  await expect(popup.getByRole('heading', { level: 3 })).toHaveText('Market Hall')
  // A click inside the popup keeps it open.
  await popup.locator('[data-station-status]').click()
  await expect(popup).toHaveCount(1)
  await clickPin(page, 'demo-08')
  await expect(popup.getByRole('heading', { level: 3 })).toHaveText('Retail Park South')
  await expect(page.locator('[data-station="demo-08"]')).toHaveAttribute('aria-pressed', 'true')
  // Escape works with focus on the map (a pin click), not only inside the popup.
  await page.keyboard.press('Escape')
  await expect(popup).toHaveCount(0)
  await clickPin(page, 'demo-01')
  await expect(popup.getByRole('heading', { level: 3 })).toHaveText('Riverside Car Park')
  // Empty space (bottom-left corner of the map) clears the selection.
  const box = (await page.locator('canvas.maplibregl-canvas').boundingBox())!
  await page.mouse.click(box.x + 12, box.y + box.height - 40)
  await expect(popup).toHaveCount(0)
  await expect(page.locator('[data-station][aria-pressed="true"]')).toHaveCount(0)
})

test('zooming out merges nearby pins into clusters; clicking a cluster zooms in', async ({ page }) => {
  const errors = collectErrors(page)
  await stubTiles(page)
  await page.goto('/map')
  await expect.poll(() => renderedStations(page)).toBe(12)
  const zoomOut = page.getByRole('button', { name: 'Zoom out' })
  for (let i = 0; i < 2; i++) {
    await zoomOut.click()
    await renderedStations(page) // waits until the map is idle
  }
  await expect.poll(async () => (await renderedClusters(page)).length).toBeGreaterThan(0)
  // Every station is drawn once: as its own pin or counted in a cluster.
  const clusters = await renderedClusters(page)
  const single = await renderedStations(page)
  expect(single + clusters.reduce((sum, c) => sum + c.count, 0)).toBe(12)
  const largest = clusters.sort((a, b) => b.count - a.count)[0]!
  await page.mouse.click(largest.x, largest.y)
  await expect.poll(() => renderedStations(page)).toBeGreaterThan(single)
  // A cluster click zooms; it does not select a station.
  await expect(page.locator('.maplibregl-popup')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('zooming out until the stations cluster clears the selection', async ({ page }) => {
  await stubTiles(page)
  await page.goto('/map')
  await expect.poll(() => renderedStations(page)).toBe(12)
  await clickPin(page, 'demo-03')
  const popup = page.locator('.maplibregl-popup')
  await expect(popup).toHaveCount(1)
  const zoomOut = page.getByRole('button', { name: 'Zoom out' })
  for (let i = 0; i < 2; i++) {
    await zoomOut.click()
    await renderedStations(page) // waits until the map is idle
  }
  await expect(popup).toHaveCount(0)
  await expect(page.locator('[data-station][aria-pressed="true"]')).toHaveCount(0)
})

test('blocked tiles: notice instead of a blank map, markers, legend and stations stay', async ({ page }) => {
  const errors = collectErrors(page)
  await page.route(TILES, (route) => route.abort())
  await page.goto('/map')
  await expect(page.getByText('Map tiles could not be loaded')).toBeVisible()
  await expect(page.locator('[data-map]')).toHaveAttribute('data-map-state', 'offline')
  await expect(page.locator('[data-legend-entry]')).toHaveCount(8)
  await expect(page.locator('[data-station]')).toHaveCount(12)
  // The markers are drawn on a plain background instead of the tiles.
  await expect.poll(() => markerImages(page)).toEqual(expectedImages)
  await expect.poll(() => renderedStations(page)).toBe(12)
  await page.locator('[data-station="demo-01"]').click()
  const popup = page.locator('.maplibregl-popup')
  await expect(popup).toContainText('Riverside Car Park')
  // The notice sits above the map frame, so it never covers the popup.
  // Both boxes in one frame: the station click smooth-scrolls the map into view.
  const gap = await page.evaluate(() => {
    const notice = document.querySelector('[data-map-notice="offline"]')!.getBoundingClientRect()
    const frame = document.querySelector('canvas.maplibregl-canvas')!.getBoundingClientRect()
    return frame.top - notice.bottom
  })
  expect(gap).toBeGreaterThanOrEqual(0)
  // The only console errors are the blocked requests themselves.
  expect(errors.length).toBeGreaterThan(0)
  for (const error of errors) expect(error).toMatch(/Failed to load resource: net::ERR_FAILED/)
})

test('MapLibre blocked: "The map could not be loaded", legend and stations stay', async ({ page }) => {
  const errors = collectErrors(page)
  await page.route('**/_astro/maplibre-gl.*.js', (route) => route.abort())
  await page.goto('/map')
  await expect(page.getByText('The map could not be loaded')).toBeVisible()
  await expect(page.locator('[data-map]')).toHaveAttribute('data-map-state', 'failed')
  await expect(page.getByText('Map tiles could not be loaded')).toHaveCount(0)
  await expect(page.locator('[data-legend-entry]')).toHaveCount(8)
  await expect(page.locator('[data-station]')).toHaveCount(12)
  for (const error of errors) expect(error).toMatch(/Failed to load resource: net::ERR_FAILED/)
})

test('the test hook is absent without automation', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()
  // Playwright sets navigator.webdriver; simulate a normal browser.
  await page.addInitScript(() => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }))
  await stubTiles(page)
  await page.goto('/map')
  await expect(page.locator('[data-map]')).toHaveAttribute('data-map-state', 'ready')
  expect(await page.evaluate(() => 'window.__evMap' in window || window.__evMap !== undefined)).toBe(false)
  await context.close()
})

test('MapLibre and the tiles load only on /map', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (request) => requests.push(request.url()))
  await page.route(TILES, (route) => route.abort())
  for (const path of ['/', '/icons', '/docs', '/brand']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
  }
  expect(requests.filter((url) => /maplibre|openfreemap/i.test(url))).toEqual([])
  await page.goto('/map')
  await expect(page.getByText('Map tiles could not be loaded')).toBeVisible()
  expect(requests.some((url) => /\/_astro\/maplibre-gl\.[\w-]+\.js$/.test(url))).toBe(true)
  expect(requests.some((url) => url.startsWith('https://tiles.openfreemap.org/styles/liberty'))).toBe(true)
})

test('live tiles from OpenFreeMap', async ({ page }) => {
  test.skip(!process.env.EVICONS_LIVE_TILES, 'set EVICONS_LIVE_TILES=1 to load the real tiles')
  const errors = collectErrors(page)
  await page.goto('/map')
  await expect.poll(() => markerImages(page), { timeout: 20_000 }).toEqual(expectedImages)
  await expect(page.locator('[data-map]')).toHaveAttribute('data-map-state', 'ready')
  await expect.poll(() => renderedStations(page), { timeout: 20_000 }).toBe(12)
  await expect(page.locator('.maplibregl-ctrl-attrib')).toContainText('OpenStreetMap')
  expect(errors).toEqual([])
})

test('occupied is the darker amber #d97706 on the light map, also in the dark theme', async ({ page }) => {
  await stubTiles(page)
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/map')
  const entry = page.locator('[data-legend-entry="occupied"] > span').first()
  expect(await entry.evaluate((el) => getComputedStyle(el).color)).toBe('rgb(217, 119, 6)')
  // The pins are drawn from the same variable on the root element.
  expect(
    await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--status-occupied').trim()),
  ).toBe('#d97706')
})
