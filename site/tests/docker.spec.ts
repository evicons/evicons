import { execFileSync, spawnSync } from 'node:child_process'
import { createServer } from 'node:net'
import { expect, test } from '@playwright/test'

// The production image (site/Dockerfile, nginx): builds from the allow-listed repo context and serves the
// static pages with real per-path index.html files, the 404 page and the sitemap. Locally the test is
// skipped when Docker is not available; in CI it must run.
const repo = new URL('../..', import.meta.url).pathname
// One tag per run, removed again in afterAll (the build cache stays, so the next build is quick).
const image = `evicons-site:test-${process.pid}`
// Statistics (OpenPanel): a dummy client ID, and a dead upstream (port 9, nothing listens) so no event leaves
// the container; the proxy then answers 502.
const clientId = '00000000-0000-0000-0000-000000000000'
const statsEnv = ['-e', `PUBLIC_OPENPANEL_CLIENT_ID=${clientId}`, '-e', 'OPENPANEL_API_URL=http://127.0.0.1:9']
const dockerAvailable = spawnSync('docker', ['info'], { stdio: 'ignore' }).status === 0

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as { port: number }
      server.close(() => resolve(port))
    })
  })
}

async function start(env: string[]): Promise<{ container: string; origin: string }> {
  const port = await freePort()
  const container = execFileSync('docker', ['run', '-d', '--rm', '-p', `127.0.0.1:${port}:80`, ...env, image], {
    encoding: 'utf8',
  }).trim()
  const origin = `http://127.0.0.1:${port}`
  // Wait for nginx.
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(origin)).ok) return { container, origin }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error(`Container ${container} did not answer on ${origin}`)
}

test.describe('docker image', () => {
  test.describe.configure({ mode: 'serial', timeout: 600_000 })
  test.skip(!dockerAvailable && !process.env.CI, 'Docker is not available (docker info failed): image test skipped')

  let container = ''
  let origin = ''

  test.beforeAll(async () => {
    test.setTimeout(600_000)
    execFileSync(
      'docker',
      ['build', '-f', 'site/Dockerfile', '--build-arg', `PUBLIC_OPENPANEL_CLIENT_ID=${clientId}`, '-t', image, '.'],
      { cwd: repo, stdio: 'pipe' },
    )
    ;({ container, origin } = await start(statsEnv))
  })

  test.afterAll(() => {
    if (container) spawnSync('docker', ['rm', '-f', container], { stdio: 'ignore' })
    if (dockerAvailable) spawnSync('docker', ['image', 'rm', '-f', image], { stdio: 'ignore' })
  })

  test('deep link to an icon opens the gallery panel', async ({ page }) => {
    // Static HTML for /icons; the island reads ?icon= and opens the panel (no SPA fallback needed).
    const response = await page.goto(`${origin}/icons?icon=plug-ccs2`)
    expect(response?.status()).toBe(200)
    expect(response?.headers()['cache-control']).toBe('no-cache')
    await expect(page.locator('[data-gallery][data-ready]')).toBeAttached()
    const panel = page.locator('[data-icon-panel]')
    await expect(panel).toBeVisible()
    await expect(panel).toContainText('plug-ccs2')
    await expect(panel).toContainText("import { PlugCcs2 } from '@evicons/react'")
  })

  test('pages, assets, 404 and sitemap', async ({ request }) => {
    for (const path of ['/', '/docs', '/map', '/brand', '/changelog', '/imprint', '/privacy', '/robots.txt', '/sitemap-index.xml']) {
      expect((await request.get(`${origin}${path}`)).status(), path).toBe(200)
    }
    for (const path of ['/brand/logo.svg', '/brand/logo-on-light.png', '/favicon.ico', '/og.png']) {
      expect((await request.get(`${origin}${path}`)).status(), path).toBe(200)
    }
    const docs = await (await request.get(`${origin}/docs`)).text()
    expect(docs.includes('id="markers"'), '/docs has the #markers section').toBe(true)
    const notFound = await request.get(`${origin}/nope`)
    expect(notFound.status()).toBe(404)
    expect((await notFound.text()).includes('Page not found'), '404 page body').toBe(true)
    // One URL form: a trailing slash redirects, relative Location.
    const slash = await request.get(`${origin}/docs/`, { maxRedirects: 0 })
    expect(slash.status()).toBe(301)
    expect(slash.headers()['location']).toBe('/docs')
    // Security headers on every response, the 404 and the redirect included.
    for (const response of [await request.get(`${origin}/`), notFound, slash]) {
      const headers = response.headers()
      expect(headers['x-content-type-options'], response.url()).toBe('nosniff')
      expect(headers['referrer-policy'], response.url()).toBe('strict-origin-when-cross-origin')
      expect(headers['permissions-policy'], response.url()).toBe('camera=(), microphone=(), geolocation=()')
      expect(headers['content-security-policy'], response.url()).toBe(
        "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
      )
      expect(headers['x-frame-options'], response.url()).toBe('DENY')
      expect(headers['strict-transport-security'], response.url()).toBe('max-age=31536000')
    }
    // The 404 page is not cached either.
    expect(notFound.headers()['cache-control']).toBe('no-cache')
    // The JOSM style: nginx has no type for .mapcss in mime.types; /josm/ sets it, keeping the headers.
    const josm: [string, string][] = [
      ['/josm/evicons.mapcss', 'text/plain; charset=utf-8'],
      ['/josm/evicons.zip', 'application/zip'],
      ['/josm/icons/marker-dc.svg', 'image/svg+xml'],
    ]
    for (const [path, type] of josm) {
      const response = await request.get(`${origin}${path}`)
      expect(response.status(), path).toBe(200)
      expect(response.headers()['content-type'], path).toBe(type)
      expect(response.headers()['cache-control'], path).toBe('no-cache')
      expect(response.headers()['x-content-type-options'], path).toBe('nosniff')
    }
    expect((await request.get(`${origin}/josm/nope.svg`)).status()).toBe(404)
    // Hashed assets are cached for a year.
    const asset = docs.match(/\/_astro\/[\w.-]+\.css/)?.[0]
    expect(asset).toBeTruthy()
    expect((await request.get(`${origin}${asset}`)).headers()['cache-control']).toContain('max-age=31536000')
  })

  test('statistics: the init runs only on the real host and sends events through the proxy', async ({ page }) => {
    // On 127.0.0.1 the init is in the page but stops before loading the tracker.
    const scripts: string[] = []
    page.on('request', (request) => scripts.push(new URL(request.url()).pathname))
    await page.goto(`${origin}/`)
    await expect(page.locator('script[data-openpanel]')).toHaveCount(1)
    await page.waitForLoadState('networkidle')
    expect(await page.evaluate(() => 'op' in window)).toBe(false)
    expect(scripts).not.toContain('/op1.js')
    // A public host name, routed to the container: the tracker comes from /op1.js and posts to /api/op/track.
    await page.route('http://evicons.test/**', async (route) => {
      const response = await route.fetch({ url: route.request().url().replace('http://evicons.test', origin) })
      await route.fulfill({ response })
    })
    const event = (name: string) =>
      page.waitForRequest(
        (request) =>
          request.url() === 'http://evicons.test/api/op/track' && request.postData()!.includes(`"name":"${name}"`),
      )
    const tracker = page.waitForResponse('http://evicons.test/op1.js')
    const view = event('screen_view')
    await page.goto('http://evicons.test/icons/plug-type-2')
    expect((await tracker).status()).toBe(200)
    const viewRequest = await view
    expect(viewRequest.method()).toBe('POST')
    expect(viewRequest.headers()['content-type']).toBe('application/json')
    // The dead upstream: 502 from nginx, which keeps running.
    expect((await viewRequest.response())!.status()).toBe(502)
    // A data-track button.
    const copy = event('copy_svg')
    await page.getByRole('button', { name: 'Copy SVG code' }).click()
    await copy
    // ?preview=true: no tracker.
    const previewScripts: string[] = []
    page.on('request', (request) => previewScripts.push(request.url()))
    await page.goto('http://evicons.test/?preview=true')
    await page.waitForLoadState('networkidle')
    expect(previewScripts).not.toContain('http://evicons.test/op1.js')
  })

  test('statistics proxy: POST JSON only, at most 16 KB, security headers, 429 after the limit', async ({
    request,
  }) => {
    const track = `${origin}/api/op/track`
    const json = { 'content-type': 'application/json' }
    const tracker = await request.get(`${origin}/op1.js`)
    expect(tracker.status()).toBe(200)
    expect(tracker.headers()['content-type']).toBe('application/javascript')
    expect((await request.get(track)).status()).toBe(405)
    expect((await request.put(track, { headers: json, data: '{}' })).status()).toBe(405)
    expect((await request.post(track, { headers: { 'content-type': 'text/plain' }, data: '{}' })).status()).toBe(415)
    expect((await request.post(track, { headers: json, data: 'a'.repeat(17 * 1024) })).status()).toBe(413)
    const dead = await request.post(track, { headers: json, data: '{"type":"track"}' })
    expect(dead.status()).toBe(502)
    expect(dead.headers()['cache-control']).toBe('no-store')
    expect(dead.headers()['x-content-type-options']).toBe('nosniff')
    expect(dead.headers()['content-security-policy']).toContain("frame-ancestors 'none'")
    // 120 a minute with a burst of 30: 45 at once hit the limit (keep this test last, it uses up the burst).
    const statuses = await Promise.all(
      Array.from({ length: 45 }, async () => (await request.post(track, { headers: json, data: '{}' })).status()),
    )
    expect(statuses).toContain(429)
    expect(statuses.every((status) => status === 429 || status === 502)).toBe(true)
  })

  test('statistics proxy: without a client ID at run time nginx starts and /api/op/track answers 404', async ({
    request,
  }) => {
    const plain = await start([])
    try {
      expect((await request.get(`${plain.origin}/`)).status()).toBe(200)
      const track = await request.post(`${plain.origin}/api/op/track`, {
        headers: { 'content-type': 'application/json' },
        data: '{}',
      })
      expect(track.status()).toBe(404)
    } finally {
      spawnSync('docker', ['rm', '-f', plain.container], { stdio: 'ignore' })
    }
  })
})
