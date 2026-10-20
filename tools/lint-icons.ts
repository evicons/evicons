import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { optimize } from 'svgo'
import { svgPathBbox } from 'svg-path-bbox'
import type { INode } from 'svgson'
import { validateMeta, type IconMeta } from './lib/meta.ts'
import { isKebabCase, toPascalCase } from './lib/names.ts'
import { isAllowedTag, parseIcon, parseSvg, type AllowedTag, type IconNode } from './lib/svg.ts'
import { svgoConfig } from './svgo.config.ts'

export type LintError = { file: string; element?: string; attribute?: string; message: string }

export const ROOT_ATTRIBUTES: Readonly<Record<string, string>> = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: '24',
  height: '24',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '1.75',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
}

const STROKE_WIDTH = 1.75
const LIVE_AREA = { min: 1, max: 23 }
const EPSILON = 1e-9

/** Allowed attributes per element; `required` must be present, `optional` may be. */
const ELEMENT_ATTRIBUTES: Record<AllowedTag, { required: string[]; optional: string[] }> = {
  path: { required: ['d'], optional: [] },
  circle: { required: ['cx', 'cy', 'r'], optional: [] },
  rect: { required: ['x', 'y', 'width', 'height'], optional: ['rx', 'ry'] },
  line: { required: ['x1', 'y1', 'x2', 'y2'], optional: [] },
  polyline: { required: ['points'], optional: [] },
  ellipse: { required: ['cx', 'cy', 'rx', 'ry'], optional: [] },
}

type BBox = [minX: number, minY: number, maxX: number, maxY: number]

function lintRoot(file: string, root: INode, errors: LintError[]): void {
  if (root.name !== 'svg') {
    errors.push({ file, element: root.name, message: 'root element must be <svg>' })
    return
  }
  for (const [attribute, expected] of Object.entries(ROOT_ATTRIBUTES)) {
    const actual = root.attributes[attribute]
    if (actual === undefined) {
      errors.push({ file, element: 'svg', attribute, message: `missing root attribute, expected "${expected}"` })
    } else if (actual !== expected) {
      errors.push({ file, element: 'svg', attribute, message: `must be "${expected}", got "${actual}"` })
    }
  }
  for (const attribute of Object.keys(root.attributes)) {
    if (!(attribute in ROOT_ATTRIBUTES)) {
      errors.push({ file, element: 'svg', attribute, message: 'attribute not allowed on root <svg>' })
    }
  }
}

function numbers(value: string): number[] {
  return value
    .trim()
    .split(/[\s,]+/)
    .filter((s) => s !== '')
    .map(Number)
}

/** Geometric bounding box of one allowed element, or null if its geometry is unusable. */
function elementBBox(tag: AllowedTag, a: Record<string, string>): BBox | null {
  const n = (key: string) => Number(a[key])
  let box: BBox
  switch (tag) {
    case 'path':
      box = svgPathBbox(a.d)
      break
    case 'circle':
      box = [n('cx') - n('r'), n('cy') - n('r'), n('cx') + n('r'), n('cy') + n('r')]
      break
    case 'ellipse':
      box = [n('cx') - n('rx'), n('cy') - n('ry'), n('cx') + n('rx'), n('cy') + n('ry')]
      break
    case 'rect':
      box = [n('x'), n('y'), n('x') + n('width'), n('y') + n('height')]
      break
    case 'line':
      box = [Math.min(n('x1'), n('x2')), Math.min(n('y1'), n('y2')), Math.max(n('x1'), n('x2')), Math.max(n('y1'), n('y2'))]
      break
    case 'polyline': {
      const p = numbers(a.points)
      if (p.length < 4 || p.length % 2 !== 0) return null
      const xs = p.filter((_, i) => i % 2 === 0)
      const ys = p.filter((_, i) => i % 2 === 1)
      box = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]
      break
    }
  }
  return box.every(Number.isFinite) ? box : null
}

/** Lints descendants of an element that must not have any, so their own problems surface too. */
function lintNested(file: string, el: INode, errors: LintError[]): void {
  for (const child of el.children) {
    if (child.type === 'element') lintElement(file, child, errors, true)
  }
}

function lintElement(file: string, el: INode, errors: LintError[], nested = false): void {
  const element = el.name
  if (!isAllowedTag(element)) {
    errors.push({ file, element, message: `element not allowed; only flat ${Object.keys(ELEMENT_ATTRIBUTES).join(', ')} children of <svg>` })
    lintNested(file, el, errors)
    return
  }
  if (el.children.length > 0) {
    errors.push({ file, element, message: 'element must not have children or text content' })
    lintNested(file, el, errors)
  }

  const { required, optional } = ELEMENT_ATTRIBUTES[element]
  let geometryOk = true
  for (const attribute of Object.keys(el.attributes)) {
    if (!required.includes(attribute) && !optional.includes(attribute)) {
      errors.push({ file, element, attribute, message: 'attribute not allowed; styling belongs in CSS via currentColor' })
    }
  }
  for (const attribute of required) {
    if (el.attributes[attribute] === undefined) {
      errors.push({ file, element, attribute, message: 'missing required attribute' })
      geometryOk = false
    }
  }
  for (const attribute of [...required, ...optional]) {
    const value = el.attributes[attribute]
    if (value === undefined || attribute === 'd' || attribute === 'points') continue
    if (!Number.isFinite(Number(value)) || value.trim() === '') {
      errors.push({ file, element, attribute, message: `must be a plain number, got "${value}"` })
      geometryOk = false
    }
  }
  // Nested geometry may be transformed by its parent, so its bbox is not meaningful.
  if (!geometryOk || nested) return

  let box: BBox | null
  try {
    box = elementBBox(element, el.attributes)
  } catch {
    box = null
  }
  if (box === null) {
    errors.push({ file, element, message: 'geometry could not be parsed' })
    return
  }
  const half = STROKE_WIDTH / 2
  const [minX, minY, maxX, maxY] = [box[0] - half, box[1] - half, box[2] + half, box[3] + half]
  if (minX < LIVE_AREA.min - EPSILON || minY < LIVE_AREA.min - EPSILON || maxX > LIVE_AREA.max + EPSILON || maxY > LIVE_AREA.max + EPSILON) {
    const fmt = (v: number) => String(Math.round(v * 1000) / 1000)
    errors.push({
      file,
      element,
      message: `outside the live area [${LIVE_AREA.min}, ${LIVE_AREA.max}] including half the stroke: x ${fmt(minX)}..${fmt(maxX)}, y ${fmt(minY)}..${fmt(maxY)}`,
    })
  }
}

function lintSvg(file: string, source: string, errors: LintError[]): void {
  let root: INode
  try {
    root = parseSvg(source)
  } catch (err) {
    errors.push({ file, message: `malformed SVG: ${(err as Error).message}` })
    return
  }
  lintRoot(file, root, errors)
  for (const child of root.children) {
    if (child.type === 'element') lintElement(file, child, errors)
    else if (child.type === 'text' && child.value.trim() !== '') {
      errors.push({ file, message: `text content not allowed: "${child.value.trim()}"` })
    }
  }
  if (optimize(source, svgoConfig).data !== source) {
    errors.push({ file, message: 'file is not SVGO-normalised; run `npm run lint:icons -- --fix`' })
  }
}

function listIconFiles(dir: string): { svgs: Set<string>; jsons: Set<string> } {
  const svgs = new Set<string>()
  const jsons = new Set<string>()
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile()) continue
    if (entry.name.endsWith('.svg')) svgs.add(entry.name.slice(0, -4))
    else if (entry.name.endsWith('.json')) jsons.add(entry.name.slice(0, -5))
  }
  return { svgs, jsons }
}

/** Lints every icon (`<name>.svg` + `<name>.json`) in `dir`. Returns all errors found. */
export function lintIcons(dir: string, opts: { release: boolean }): LintError[] {
  const errors: LintError[] = []
  const { svgs, jsons } = listIconFiles(dir)
  const names = [...new Set([...svgs, ...jsons])].sort()
  // PascalCase identifier -> description of its first owner
  const identifiers = new Map<string, string>()

  for (const name of names) {
    const svgFile = `${name}.svg`
    const jsonFile = `${name}.json`

    if (!isKebabCase(name)) {
      errors.push({ file: svgs.has(name) ? svgFile : jsonFile, message: `file name "${name}" must be kebab-case` })
    }
    if (!jsons.has(name)) errors.push({ file: svgFile, message: `missing metadata file ${jsonFile}` })
    if (!svgs.has(name)) errors.push({ file: jsonFile, message: `missing SVG file ${svgFile}` })

    if (svgs.has(name)) lintSvg(svgFile, readFileSync(join(dir, svgFile), 'utf8'), errors)

    if (!jsons.has(name)) continue
    let raw: unknown
    try {
      raw = JSON.parse(readFileSync(join(dir, jsonFile), 'utf8'))
    } catch (err) {
      errors.push({ file: jsonFile, message: `invalid JSON: ${(err as Error).message}` })
      continue
    }
    const metaErrors = validateMeta(raw, name)
    for (const message of metaErrors) errors.push({ file: jsonFile, message })
    if (metaErrors.length > 0) continue
    const meta = raw as IconMeta

    const claims: Array<[string, string]> = [[toPascalCase(name), `icon "${name}"`]]
    for (const alias of meta.aliases) claims.push([toPascalCase(alias), `alias "${alias}" of icon "${name}"`])
    for (const [id, owner] of claims) {
      const existing = identifiers.get(id)
      if (existing) errors.push({ file: jsonFile, message: `PascalCase name "${id}" of ${owner} collides with ${existing}` })
      else identifiers.set(id, owner)
    }

    if (opts.release) {
      if (meta.provenance.approvedBy === null) {
        errors.push({ file: jsonFile, message: 'provenance.approvedBy must be set for a release' })
      }
      if (meta.provenance.approvedOn === null) {
        errors.push({ file: jsonFile, message: 'provenance.approvedOn must be set for a release' })
      }
    }
  }
  return errors
}

/** Loads all icons in `dir`. Call only after `lintIcons` reported no errors. */
export function loadIcons(dir: string): Array<{ name: string; svg: string; node: IconNode; meta: IconMeta }> {
  return [...listIconFiles(dir).svgs].sort().map((name) => {
    const svg = readFileSync(join(dir, `${name}.svg`), 'utf8')
    const meta = JSON.parse(readFileSync(join(dir, `${name}.json`), 'utf8')) as IconMeta
    return { name, svg, node: parseIcon(svg), meta }
  })
}

/** Rewrites every SVG in `dir` with its SVGO-optimised form. Returns the files changed. */
export function fixIcons(dir: string): string[] {
  const changed: string[] = []
  for (const name of [...listIconFiles(dir).svgs].sort()) {
    const path = join(dir, `${name}.svg`)
    const source = readFileSync(path, 'utf8')
    const optimized = optimize(source, svgoConfig).data
    if (optimized !== source) {
      writeFileSync(path, optimized)
      changed.push(`${name}.svg`)
    }
  }
  return changed
}

export function formatError(e: LintError): string {
  const location = [e.element, e.attribute].filter(Boolean).join(' ')
  return location ? `${e.file}: ${location} – ${e.message}` : `${e.file}: ${e.message}`
}

function main(argv: string[]): number {
  const release = argv.includes('--release')
  const fix = argv.includes('--fix')
  const unknown = argv.filter((a) => a.startsWith('--') && a !== '--release' && a !== '--fix')
  if (unknown.length > 0) {
    console.error(`unknown option(s): ${unknown.join(' ')}`)
    console.error('usage: node tools/lint-icons.ts [--release] [--fix] [dir=icons]')
    return 2
  }
  const dir = resolve(argv.find((a) => !a.startsWith('--')) ?? 'icons')

  if (fix) {
    for (const file of fixIcons(dir)) console.log(`fixed ${file}`)
  }
  const errors = lintIcons(dir, { release })
  if (errors.length > 0) {
    for (const e of errors) console.error(formatError(e))
    console.error(`✗ ${errors.length} error(s)`)
    return 1
  }
  console.log(`✓ ${listIconFiles(dir).svgs.size} icons`)
  return 0
}

if (import.meta.main) {
  process.exitCode = main(process.argv.slice(2))
}
