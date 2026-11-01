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

const markerImages = (page: Page) => page.evaluate(() => window.__evMap?.listImages().sort() ?? [])
const expectedImages = [
  'ev-ac',
  'ev-available',
  'ev-available-selected',
  'ev-dc',
  'ev-faulted',
  'ev-faulted-selected',
  'ev-occupied',
  'ev-occupied-selected',
  'ev-out-of-service',
  'ev-out-of-service-selected',
  'ev-unknown',
  'ev-unknown-selected',
]

test('map page loads with canvas, 12 marker images and the legend', async ({ page }) => {
  const errors = collectErrors(page)
  await stubTiles(page)
  await page.goto('/map')
  const canvas = page.locator('canvas.maplibregl-canvas')
  await expect(canvas).toBeVisible()
  // The map fills its frame (a collapsed container would still have a canvas).
  expect((await canvas.boundingBox())!.height).toBeGreaterThan(300)
  await expect.poll(() => markerImages(page)).toEqual(expectedImages)
  await expect(page.locator('[data-map]')).toHaveAttribute('data-map-state', 'ready')
  await expect(page.locator('[data-legend-entry]')).toHaveCount(7)
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
  await expect.poll(() => markerImages(page)).toHaveLength(12)
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

test('blocked tiles: notice instead of a blank map, markers, legend and stations stay', async ({ page }) => {
  const errors = collectErrors(page)
  await page.route(TILES, (route) => route.abort())
  await page.goto('/map')
  await expect(page.getByText('Map tiles could not be loaded')).toBeVisible()
  await expect(page.locator('[data-map]')).toHaveAttribute('data-map-state', 'offline')
  await expect(page.locator('[data-legend-entry]')).toHaveCount(7)
  await expect(page.locator('[data-station]')).toHaveCount(12)
  // The markers are drawn on a plain background instead of the tiles.
  await expect.poll(() => markerImages(page)).toEqual(expectedImages)
  await page.locator('[data-station="demo-01"]').click()
  await expect(page.locator('.maplibregl-popup')).toContainText('Riverside Car Park')
  // The only console errors are the blocked requests themselves.
  expect(errors.length).toBeGreaterThan(0)
  for (const error of errors) expect(error).toMatch(/Failed to load resource: net::ERR_FAILED/)
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
  await expect(page.locator('.maplibregl-ctrl-attrib')).toContainText('OpenStreetMap')
  expect(errors).toEqual([])
})
