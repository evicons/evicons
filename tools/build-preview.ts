import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { loadIcons } from './lint-icons.ts'
import type { IconNode } from './lib/svg.ts'

export type PreviewOptions = { iconsDir: string; outDir: string }

const LUCIDE = ['car', 'map-pin', 'zap', 'plug', 'battery-charging', 'circle-check'] as const
const SIZES = [16, 20, 24] as const
/** Markers are checked at map-pin sizes, not at 16 px (design guide section 9). */
const MARKER_SIZES = [24, 32, 40] as const
const MARKER_MAP_SIZE = 32
const STROKES = ['1.5', '1.75', '2'] as const

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function nodeToMarkup(node: IconNode): string {
  return node
    .map(([tag, attrs]) => `<${tag}${Object.entries(attrs).map(([k, v]) => ` ${k}="${esc(v)}"`).join('')}/>`)
    .join('')
}

/** EVicon inline SVG. Stroke width comes from CSS (`.ev`), so the switcher can override it. */
function evSvg(node: IconNode, name: string, variant: string, size: number): string {
  return `<svg class="ev" data-icon="${esc(name)}" data-variant="${variant}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${nodeToMarkup(node)}</svg>`
}

/** Lucide reference inline SVG, read from lucide-static at build time (never stored in the repo). */
function lucideSvg(name: string, size: number, root: string): string {
  const file = join(root, 'node_modules/lucide-static/icons', `${name}.svg`)
  const src = readFileSync(file, 'utf8')
  const inner = /<svg[^>]*>([\s\S]*)<\/svg>/.exec(src)?.[1]?.trim()
  if (inner === undefined) throw new Error(`Cannot parse Lucide icon ${name}`)
  return `<svg class="lu" data-lucide="${name}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`
}

// Grid lines as one path (no ids, so nothing can collide across the page).
const GRID_PATH = Array.from({ length: 25 }, (_, i) => `M${i} 0V24M0 ${i}H24`).join('')
const GRID = `<svg class="grid" viewBox="0 0 24 24" aria-hidden="true"><path d="${GRID_PATH}" fill="none" stroke="currentColor" stroke-width="0.04" opacity="0.25"/><rect x="1" y="1" width="22" height="22" fill="none" stroke="#e5484d" stroke-width="0.08"/></svg>`

const CSS = `
:root{--ev-stroke:1.5;--bg:#fff;--fg:#16181d;--muted:#5d6370;--line:#dfe2e8;--card:#fafbfc}
*{box-sizing:border-box}
body{margin:0;padding:24px;font:14px/1.4 system-ui,sans-serif;background:var(--bg);color:var(--fg)}
h1{font-size:20px;margin:0 0 12px}h2{font-size:16px;margin:32px 0 12px}
.ev{stroke-width:var(--ev-stroke)}
.toolbar{display:flex;gap:8px;align-items:center;margin-bottom:16px}
.toolbar button{font:inherit;padding:4px 12px;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--fg);cursor:pointer}
.toolbar button[aria-pressed=true]{background:var(--fg);color:var(--bg)}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(520px,1fr));gap:16px}
.card{border:1px solid var(--line);border-radius:10px;padding:16px;background:var(--card)}
.card h3{margin:0;font-size:15px}.meta{color:var(--muted);font-size:12px;margin:2px 0}
.big{position:relative;width:192px;height:192px;margin:12px 0;border:1px solid var(--line);background:#fff;color:#16181d}
.big .ev,.big .grid{position:absolute;inset:0;width:100%;height:100%}
.rows{display:grid;grid-template-columns:auto 1fr 1fr;gap:6px 12px;align-items:center}
.rows .label{color:var(--muted);font-size:12px}
.pane{display:flex;gap:14px;align-items:center;padding:8px;border-radius:6px;min-height:40px}
.refs{display:flex;gap:6px;flex-wrap:nowrap;align-items:center;padding-left:14px;border-left:1px solid currentColor;border-left-color:rgba(128,128,128,.5)}
.light{background:#fff;color:#16181d;border:1px solid var(--line)}
.dark{background:#16181d;color:#f2f4f8;border:1px solid #16181d}
.ctx{display:inline-flex;gap:6px;align-items:center;margin-top:10px}
.overlay{display:flex;gap:16px;flex-wrap:wrap}
.ovitem{position:relative;width:24px;height:24px;color:var(--fg)}
.ovitem .badge{position:absolute;right:-4px;bottom:-4px;display:block;line-height:0}
.ovitem>.ev{display:block}
.ovwrap{text-align:center;font-size:12px;color:var(--muted)}
.fillpane{display:inline-flex;gap:14px;align-items:center;padding-left:14px;border-left:1px solid rgba(128,128,128,.5)}
.filled svg>path:first-of-type{fill:currentColor}.filled svg>:not(path:first-of-type){stroke:#fff}.filled svg>[fill]{fill:#fff}
.maps{display:flex;gap:16px;flex-wrap:wrap}
.mapwrap{font-size:12px;color:var(--muted)}
.map-mock{position:relative;width:360px;border-radius:8px;overflow:hidden;background:#e4e6e9;margin-top:4px}
.map-mock .road{position:absolute;background:#c3c7cd}
.map-mock .ev{position:absolute}
.c-green{color:#1f9d55}.c-blue{color:#2563eb}.c-amber{color:#d97706}.c-red{color:#dc2626}.c-grey{color:#6b7280}
`

const SCRIPT = `
document.querySelectorAll('[data-stroke]').forEach(function(b){b.addEventListener('click',function(){
document.documentElement.style.setProperty('--ev-stroke',b.getAttribute('data-stroke'));
document.querySelectorAll('[data-stroke]').forEach(function(o){o.setAttribute('aria-pressed',String(o===b))})})})
`

const page = (title: string, body: string, css: string, script = '') =>
  `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${css}</style></head><body>${body}${script ? `<script>${script}</script>` : ''}</body></html>\n`

type Icon = ReturnType<typeof loadIcons>[number]

function card(icon: Icon, root: string): string {
  const { name, node, meta } = icon
  const norm = meta.standard ? `${esc(meta.standard.norm)}` : 'no norm'
  const approved = meta.provenance.approvedBy
    ? `approved by ${esc(meta.provenance.approvedBy)} on ${esc(meta.provenance.approvedOn ?? '?')}`
    : 'not yet approved'
  const rows = SIZES.map((s) => {
    const lucide = LUCIDE.map((l) => lucideSvg(l, s, root))
    const pane = (theme: string) =>
      `<div class="pane ${theme}">${evSvg(node, name, `${s}-${theme}`, s)}<span class="refs">${lucide.join('')}</span></div>`
    return `<div class="label">${s} px</div>${pane('light')}${pane('dark')}`
  }).join('')
  return `<article class="card"><h3>${esc(name)}</h3>
<div class="meta">${esc(meta.meaning.en)} / ${esc(meta.meaning.de)}</div>
<div class="meta">${esc(meta.category)} · ${norm} · created by ${esc(meta.provenance.createdBy)} · ${approved}</div>
<div class="big">${evSvg(node, name, 'large', 192)}${GRID}</div>
<div class="rows">${rows}</div>
<div class="ctx">${evSvg(node, name, 'context', 16)}<span>Type 2 · 22 kW</span></div></article>`
}

const isMarker = (icon: Icon) => icon.meta.category === 'marker'

function markerCard(icon: Icon): string {
  const { name, node, meta } = icon
  const approved = meta.provenance.approvedBy
    ? `approved by ${esc(meta.provenance.approvedBy)} on ${esc(meta.provenance.approvedOn ?? '?')}`
    : 'not yet approved'
  const rows = MARKER_SIZES.map((s) => {
    const pane = (theme: string) =>
      `<div class="pane ${theme}">${evSvg(node, name, `${s}-${theme}`, s)}<span class="fillpane filled">${tint(evSvg(node, name, `${s}-${theme}-filled`, s), markerColour(name))}</span></div>`
    return `<div class="label">${s} px</div>${pane('light')}${pane('dark')}`
  }).join('')
  return `<article class="card"><h3>${esc(name)}</h3>
<div class="meta">${esc(meta.meaning.en)} / ${esc(meta.meaning.de)}</div>
<div class="meta">${esc(meta.category)} · created by ${esc(meta.provenance.createdBy)} · ${approved}</div>
<div class="big">${evSvg(node, name, 'large', 192)}${GRID}</div>
<div class="rows">${rows}</div></article>`
}

/** Status colour for the map mock. Colour lives in CSS only, never in the SVG. */
function markerColour(name: string): string {
  if (name.includes('available')) return 'green'
  if (name.includes('occupied')) return 'amber'
  if (name.includes('faulted')) return 'red'
  if (name.includes('out-of-service') || name.includes('unknown')) return 'grey'
  return 'blue'
}

/** Adds a colour class (and optional inline position) to an `evSvg` result. */
function tint(svg: string, colour: string, style?: string): string {
  return svg.replace('<svg class="ev"', `<svg class="ev c-${colour}"${style ? ` style="${style}"` : ''}`)
}

const ROADS = [
  'left:0;right:0;top:46%;height:6px',
  'left:0;right:0;top:18%;height:3px',
  'top:0;bottom:0;left:22%;width:4px',
  'top:0;bottom:0;left:64%;width:3px',
  'left:0;right:0;top:80%;height:2px',
]

function mapMock(markers: Icon[], mode: 'outline' | 'filled'): string {
  const rows = Math.ceil(markers.length / 4)
  const pins = markers
    .map((m, i) => {
      const row = Math.floor(i / 4)
      const left = 30 + (i % 4) * 80 + (row % 2) * 40
      const top = 30 + row * 70
      return tint(evSvg(m.node, m.name, `map-${mode}`, MARKER_MAP_SIZE), markerColour(m.name), `left:${left}px;top:${top}px`)
    })
    .join('')
  const roads = ROADS.map((r) => `<div class="road" style="${r}"></div>`).join('')
  return `<div class="mapwrap">${mode === 'outline' ? 'Outline' : 'Filled'} (${MARKER_MAP_SIZE} px)<div class="map-mock ${mode}" style="height:${60 + rows * 70}px">${roads}${pins}</div></div>`
}

function markerSection(markers: Icon[]): string {
  if (markers.length === 0) return ''
  return `<section id="markers"><h2>Markers</h2>
<div class="meta">Checked at ${MARKER_SIZES.join(', ')} px. Filled mode (the first <code>&lt;path&gt;</code> is the pin): <code>svg &gt; path:first-of-type { fill: currentColor }</code>, <code>svg &gt; :not(path:first-of-type) { stroke: #fff }</code>, <code>svg &gt; [fill] { fill: #fff }</code> (the solid bolt).</div>
<div class="cards">${markers.map(markerCard).join('')}</div>
<h2>Map mock</h2><div class="maps">${mapMock(markers, 'outline')}${mapMock(markers, 'filled')}</div></section>`
}

function overlaySection(icons: Icon[]): string {
  const station = icons.find((i) => i.name === 'charging-station')
  const statuses = icons.filter((i) => i.name.startsWith('status-'))
  if (!station || statuses.length === 0) return ''
  const items = statuses
    .map(
      (s) =>
        `<div class="ovwrap"><div class="ovitem">${evSvg(station.node, station.name, 'overlay-base', 24)}<span class="badge">${evSvg(s.node, s.name, 'overlay-badge', 12)}</span></div>${esc(s.name)}</div>`,
    )
    .join('')
  return `<h2>Status overlay</h2><div class="overlay">${items}</div>`
}

/** Writes `index.html` (review page) and `regression.html` (icons only, for screenshots) to `outDir`. */
export function buildPreview({ iconsDir, outDir }: PreviewOptions): void {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const icons = existsSync(iconsDir) ? loadIcons(iconsDir) : []

  const toolbar = `<div class="toolbar"><span>Stroke width</span>${STROKES.map((w) => `<button type="button" data-stroke="${w}" aria-pressed="${w === '1.5'}">${w}</button>`).join('')}</div>`
  const body = `<h1>EVicons preview (${icons.length} icons)</h1>${toolbar}<div class="cards">${icons
    .filter((i) => !isMarker(i))
    .map((i) => card(i, root))
    .join('')}</div>${overlaySection(icons)}${markerSection(icons.filter(isMarker))}`

  const regRows = icons
    .map((i) => `<div class="row">${(isMarker(i) ? MARKER_SIZES : [16, 24, 48]).map((s) => evSvg(i.node, i.name, String(s), s)).join('')}</div>`)
    .join('')
  const regCss = `body{margin:0;padding:16px;background:#fff;color:#000}.row{display:flex;gap:16px;align-items:center;margin-bottom:16px}svg{stroke-width:1.5}`

  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'index.html'), page('EVicons preview', body, CSS, SCRIPT))
  writeFileSync(join(outDir, 'regression.html'), page('', regRows, regCss))
}

if (import.meta.main) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const iconsDir = process.argv[2] ? resolve(process.argv[2]) : join(root, 'icons')
  const outDir = join(root, 'preview/dist')
  try {
    buildPreview({ iconsDir, outDir })
    console.log(pathToFileURL(join(outDir, 'index.html')).href)
  } catch (err) {
    console.error((err as Error).message)
    process.exitCode = 1
  }
}
