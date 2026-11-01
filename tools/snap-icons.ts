import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { formatError, lintIcons, loadIcons } from './lint-icons.ts'
import type { IconMeta } from './lib/meta.ts'
import { parseIcon, type IconNode } from './lib/svg.ts'

/**
 * Renders icons from `icons/` into one PNG for review: per icon a light and a dark row,
 * columns per size; markers additionally in filled mode (design guide section 9).
 * Usage: node tools/snap-icons.ts <out.png> [name...]   (no names = all icons)
 */

const SIZES = [16, 20, 24, 96] as const
const MARKER_SIZES = [24, 32, 40, 96] as const
const THEMES = [
  { id: 'light', bg: '#fff', fg: '#111' },
  { id: 'dark', bg: '#111', fg: '#eee' },
] as const

type Icon = ReturnType<typeof loadIcons>[number]

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function svg(node: IconNode, size: number): string {
  const inner = node
    .map(([tag, attrs]) => `<${tag}${Object.entries(attrs).map(([k, v]) => ` ${k}="${esc(v)}"`).join('')}/>`)
    .join('')
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`
}

export function snapHtml(icons: Icon[]): string {
  const blocks = icons
    .map((icon) => {
      const marker = icon.meta.category === 'marker'
      const sizes = marker ? MARKER_SIZES : SIZES
      const rows = THEMES.map((t) => {
        const outline = sizes.map((s) => `<div class="cell">${svg(icon.node, s)}</div>`).join('')
        const filled = marker
          ? `<div class="sep"></div>${sizes.map((s) => `<div class="cell filled">${svg(icon.node, s)}</div>`).join('')}`
          : ''
        return `<div class="row" style="background:${t.bg};color:${t.fg}"><div class="theme">${t.id}</div>${outline}${filled}</div>`
      }).join('')
      const head = sizes.map((s) => `<div class="cell">${s}</div>`).join('')
      const headFilled = marker ? `<div class="sep"></div>${sizes.map((s) => `<div class="cell">${s} filled</div>`).join('')}` : ''
      return `<section><h2>${esc(icon.name)}</h2><div class="row head"><div class="theme"></div>${head}${headFilled}</div>${rows}</section>`
    })
    .join('')
  const css = `body{margin:0;padding:16px;background:#fff;color:#111;font:12px/1.3 system-ui,sans-serif;display:inline-block}
h2{font-size:13px;margin:12px 0 4px}
.row{display:flex;align-items:center;gap:16px;padding:8px 12px}
.head{color:#666;padding-block:0}
.theme{width:36px;color:inherit;opacity:.6}
.cell{min-width:96px;display:flex;justify-content:center;align-items:center}
.sep{width:1px;align-self:stretch;background:rgba(128,128,128,.5)}
.filled{color:#2563eb}.filled svg>path:first-of-type{fill:currentColor}.filled svg>:not(path:first-of-type){stroke:#fff}`
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${blocks}</body></html>`
}

const ICONS_DIR = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'icons')

/** Loads one icon without touching the rest of `icons/` (loadIcons reads every file). */
function loadIcon(name: string): Icon {
  const svg = readFileSync(join(ICONS_DIR, `${name}.svg`), 'utf8')
  const meta = JSON.parse(readFileSync(join(ICONS_DIR, `${name}.json`), 'utf8')) as IconMeta
  return { name, svg, node: parseIcon(svg), meta }
}

async function main(argv: string[]): Promise<number> {
  const [out, ...names] = argv
  if (!out || out.startsWith('--')) {
    console.error('usage: node tools/snap-icons.ts <out.png> [name...]')
    return 2
  }
  const iconsDir = ICONS_DIR
  // Only the requested icons must be clean; a half-drawn icon elsewhere must not block a snapshot.
  const wanted = new Set(names.flatMap((n) => [`${n}.svg`, `${n}.json`]))
  const errors = lintIcons(iconsDir, { release: false }).filter((e) => names.length === 0 || wanted.has(e.file))
  if (errors.length > 0) {
    for (const e of errors) console.error(formatError(e))
    return 1
  }
  const unknown = names.filter((n) => !existsSync(join(iconsDir, `${n}.svg`)) || !existsSync(join(iconsDir, `${n}.json`)))
  if (unknown.length > 0) {
    console.error(`unknown icon(s): ${unknown.join(', ')}`)
    return 1
  }
  const icons = names.length > 0 ? names.map(loadIcon) : loadIcons(iconsDir)

  const outPath = resolve(out)
  mkdirSync(dirname(outPath), { recursive: true })
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 800, height: 600 } })
    await page.setContent(snapHtml(icons))
    await page.locator('body').screenshot({ path: outPath })
  } finally {
    await browser.close()
  }
  console.log(`${outPath} (${icons.length} icon${icons.length === 1 ? '' : 's'})`)
  return 0
}

if (import.meta.main) {
  process.exitCode = await main(process.argv.slice(2))
}
