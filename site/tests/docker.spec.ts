import { execFileSync, spawnSync } from 'node:child_process'
import { createServer } from 'node:net'
import { expect, test } from '@playwright/test'

// The production image (site/Dockerfile, nginx): builds from the allow-listed repo context and serves the
// static pages with real per-path index.html files, the 404 page and the sitemap. Locally the test is
// skipped when Docker is not available; in CI it must run.
const repo = new URL('../..', import.meta.url).pathname
// One tag per run, removed again in afterAll (the build cache stays, so the next build is quick).
const image = `evicons-site:test-${process.pid}`
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

test.describe('docker image', () => {
  test.describe.configure({ mode: 'serial', timeout: 600_000 })
  test.skip(!dockerAvailable && !process.env.CI, 'Docker is not available (docker info failed): image test skipped')

  let container = ''
  let origin = ''

  test.beforeAll(async () => {
    test.setTimeout(600_000)
    execFileSync('docker', ['build', '-f', 'site/Dockerfile', '-t', image, '.'], { cwd: repo, stdio: 'pipe' })
    const port = await freePort()
    container = execFileSync('docker', ['run', '-d', '--rm', '-p', `127.0.0.1:${port}:80`, image], {
      encoding: 'utf8',
    }).trim()
    origin = `http://127.0.0.1:${port}`
    // Wait for nginx.
    for (let i = 0; i < 50; i++) {
      try {
        if ((await fetch(origin)).ok) return
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
    throw new Error(`Container ${container} did not answer on ${origin}`)
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
})
