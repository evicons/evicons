// Renders the checked-in raster images of the brand and the site:
//   site/public/og.png               1200 × 630, from the page src/pages/og.astro
//   site/public/favicon-32.png       32 × 32, from public/favicon.svg (light variant, transparent)
//   site/public/favicon.ico          the same 32 × 32 PNG in an ICO container (for clients that ask for /favicon.ico)
//   site/public/apple-touch-icon.png 180 × 180, the mark on white
//   brand/logo-on-light.png          1600 px wide, dark lockup on transparent
//   brand/logo-on-dark.png           1600 px wide, light lockup on transparent
// Run from the repository root after `npm run build:icons && npm run build -w @evicons/react`:
//   node site/scripts/render-og.mjs
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { dev } from 'astro'

process.env.ASTRO_TELEMETRY_DISABLED = '1'

const site = fileURLToPath(new URL('..', import.meta.url))
const repo = fileURLToPath(new URL('../..', import.meta.url))
const port = 4329

const ink = { light: '#18181b', dark: '#f4f4f5', accent: '#2563eb' }

const svgPage = (svg, { width, height, color, background = 'transparent', padding = 0 }) => `<!doctype html>
<style>
  html, body { margin: 0; background: ${background}; }
  body { width: ${width}px; height: ${height}px; display: grid; place-items: center; color: ${color}; }
  svg { width: ${width - 2 * padding}px; height: ${height - 2 * padding}px; display: block; }
</style>
${svg}`

const browser = await chromium.launch()
const shoot = async (html, path, { width, height, transparent = true }) => {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  await page.setContent(html)
  await page.screenshot({ path, omitBackground: transparent, clip: { x: 0, y: 0, width, height } })
  await page.close()
  console.log(`wrote ${path.replace(repo, '')}`)
}

// Favicons from the favicon source (its own <style> picks the light colour here).
const favicon = await readFile(`${site}public/favicon.svg`, 'utf8')
await shoot(svgPage(favicon, { width: 32, height: 32, color: ink.accent }), `${site}public/favicon-32.png`, {
  width: 32,
  height: 32,
})
// ICO with one PNG image: 6-byte header, one 16-byte directory entry, then the PNG data.
const png = await readFile(`${site}public/favicon-32.png`)
const ico = Buffer.alloc(22)
ico.writeUInt16LE(0, 0) // reserved
ico.writeUInt16LE(1, 2) // type: icon
ico.writeUInt16LE(1, 4) // one image
ico.writeUInt8(32, 6) // width
ico.writeUInt8(32, 7) // height
ico.writeUInt8(0, 8) // no palette
ico.writeUInt8(0, 9) // reserved
ico.writeUInt16LE(1, 10) // colour planes
ico.writeUInt16LE(32, 12) // bits per pixel
ico.writeUInt32LE(png.length, 14) // image size
ico.writeUInt32LE(22, 18) // image offset
await writeFile(`${site}public/favicon.ico`, Buffer.concat([ico, png]))
console.log('wrote /site/public/favicon.ico')

const mark = await readFile(`${repo}brand/logo-mark.svg`, 'utf8')
await shoot(
  svgPage(mark, { width: 180, height: 180, color: ink.accent, background: '#ffffff', padding: 18 }),
  `${site}public/apple-touch-icon.png`,
  { width: 180, height: 180, transparent: false },
)

// Lockup PNGs for places without SVG support.
const logo = await readFile(`${repo}brand/logo.svg`, 'utf8')
const [, , vbW, vbH] = logo.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number)
const logoHeight = Math.round((1600 * vbH) / vbW)
for (const [name, color] of [
  ['logo-on-light', ink.light],
  ['logo-on-dark', ink.dark],
]) {
  await shoot(svgPage(logo, { width: 1600, height: logoHeight, color }), `${repo}brand/${name}.png`, {
    width: 1600,
    height: logoHeight,
  })
}

// Social image from the Astro page, served by a temporary dev server.
const server = await dev({ root: site, logLevel: 'warn', devToolbar: { enabled: false }, server: { port } })
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto(`http://localhost:${port}/og`, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: `${site}public/og.png` })
  console.log('wrote /site/public/og.png')
} finally {
  await server.stop()
  await browser.close()
}
