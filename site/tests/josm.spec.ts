import { expect, test } from '@playwright/test'

// The JOSM map paint style: the zip JOSM loads, the plain style and its icons. Content types here come from
// `astro preview`, which has none for .mapcss; nginx serves it as text/plain (docker.spec.ts).
test('/josm/evicons.zip is a ZIP archive', async ({ request }) => {
  const response = await request.get('/josm/evicons.zip')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toBe('application/zip')
  const body = await response.body()
  expect(body.subarray(0, 2).toString('latin1')).toBe('PK')
  expect(body.includes(Buffer.from('evicons.mapcss'))).toBe(true)
  expect(body.includes(Buffer.from('icons/marker-dc.svg'))).toBe(true)
})

test('/josm/evicons.mapcss is the style, with its icons by absolute URL', async ({ request }) => {
  const response = await request.get('/josm/evicons.mapcss')
  expect(response.status()).toBe(200)
  // Empty under `astro preview`, text/plain under nginx; never an HTML page.
  expect(response.headers()['content-type'] ?? '').toMatch(/^(text\/plain.*)?$/)
  const text = await response.text()
  expect(text).toContain('title: "EVicons: EV charging";')
  // JOSM resolves relative icon paths only inside a zip, so the plain file uses absolute URLs.
  expect(text).not.toMatch(/"icons\//)
  const icons = [...new Set([...text.matchAll(/"https:\/\/evicons\.dev\/josm\/(icons\/[a-z0-9-]+\.svg)"/g)].map((m) => m[1]!))]
  expect(icons.length).toBeGreaterThan(10)
  for (const path of icons) {
    const icon = await request.get(`/josm/${path}`)
    expect(icon.status(), path).toBe(200)
    expect(icon.headers()['content-type'], path).toContain('image/svg+xml')
  }
})

test('/josm/icons/marker-dc.svg has its colours baked in', async ({ request }) => {
  const response = await request.get('/josm/icons/marker-dc.svg')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('image/svg+xml')
  const svg = await response.text()
  expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)
  expect(svg).not.toContain('currentColor')
  expect(svg).toContain('fill="#2563eb"')
})
