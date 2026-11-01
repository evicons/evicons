import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { optimize } from 'svgo'
import { expect, test } from 'vitest'
import { svgoConfig } from '../tools/svgo.config.ts'
import { parseSvg } from '../tools/lib/svg.ts'
import type { INode } from 'svgson'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ICONS = join(ROOT, 'icons')
const LUCIDE = join(ROOT, 'node_modules/lucide-static/icons')

/** Attributes that define an element's geometry, per tag. */
const GEOMETRY: Record<string, readonly string[]> = {
  path: ['d'],
  circle: ['cx', 'cy', 'r'],
  ellipse: ['cx', 'cy', 'rx', 'ry'],
  rect: ['x', 'y', 'width', 'height', 'rx', 'ry'],
  line: ['x1', 'y1', 'x2', 'y2'],
  polyline: ['points'],
  polygon: ['points'],
}

/** Normalizes with the project SVGO config, then returns one key per geometry element. */
function elementKeys(svg: string): string[] {
  const keys: string[] = []
  const walk = (node: INode) => {
    for (const child of node.children) {
      if (child.type !== 'element') continue
      const geometry = GEOMETRY[child.name]
      if (geometry) {
        keys.push(`${child.name}|${geometry.map((a) => `${a}=${child.attributes[a] ?? ''}`).join('|')}`)
      }
      walk(child)
    }
  }
  walk(parseSvg(optimize(svg, svgoConfig).data))
  return keys
}

test('no icon element is a literal copy of a Lucide element', () => {
  const lucide = new Map<string, string>()
  const lucideFiles = readdirSync(LUCIDE).filter((f) => f.endsWith('.svg'))
  expect(lucideFiles.length).toBeGreaterThan(1000)
  for (const file of lucideFiles) {
    for (const key of elementKeys(readFileSync(join(LUCIDE, file), 'utf8'))) {
      if (!lucide.has(key)) lucide.set(key, file)
    }
  }

  const ours = readdirSync(ICONS).filter((f) => f.endsWith('.svg'))
  expect(ours.length).toBeGreaterThan(0)
  const copies: string[] = []
  for (const file of ours) {
    for (const key of elementKeys(readFileSync(join(ICONS, file), 'utf8'))) {
      const match = lucide.get(key)
      if (match) copies.push(`${file}: ${key} (lucide-static ${match})`)
    }
  }
  expect(copies).toEqual([])
}, 60_000)
