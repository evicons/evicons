// @vitest-environment node
// Runs against the built package: `npm run build` first. Resolves `@evicons/react`
// through the workspace link, so the package `exports` map (→ dist) is exercised.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { renderToString } from 'react-dom/server'
import { afterAll, expect, test } from 'vitest'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const iconsJson = JSON.parse(readFileSync(join(ROOT, 'packages/svg/icons.json'), 'utf8')) as Record<
  string,
  { pascal: string }
>

const TMP_BASE = join(ROOT, '.tmp-tests')
mkdirSync(TMP_BASE, { recursive: true })
const tmp = mkdtempSync(join(TMP_BASE, 'smoke-'))
afterAll(() => rmSync(tmp, { recursive: true, force: true }))

async function bundle(contents: string): Promise<string> {
  const result = await build({
    stdin: { contents, resolveDir: ROOT, loader: 'js' },
    bundle: true,
    treeShaking: true,
    format: 'esm',
    platform: 'neutral',
    external: ['react', 'react/*'],
    write: false,
    logLevel: 'silent',
  })
  return result.outputFiles[0]!.text
}

test('single import bundles only that icon', async () => {
  const out = await bundle("import { PlugType2 } from '@evicons/react'; console.log(PlugType2)")
  expect(out).toContain('plug-type-2')
  const others = Object.keys(iconsJson).filter((n) => n !== 'plug-type-2')
  expect(others.length).toBeGreaterThan(0)
  for (const other of others) expect(out).not.toMatch(new RegExp(`["']${other}["']`))
  for (const other of others) expect(out).not.toContain(iconsJson[other]!.pascal)
})

test('deep import works', async () => {
  const out = await bundle("export { PlugType2 } from '@evicons/react/icons/plug-type-2'")
  expect(out).toContain('plug-type-2')
  for (const other of Object.keys(iconsJson).filter((n) => n !== 'plug-type-2')) {
    expect(out).not.toMatch(new RegExp(`["']${other}["']`))
  }
  // Write the bundle next to the root node_modules so the external `react` resolves, then render it.
  const file = join(tmp, 'deep.mjs')
  writeFileSync(file, out)
  const mod = (await import(pathToFileURL(file).href)) as typeof import('@evicons/react/icons/plug-type-2')
  const html = renderToString(<mod.PlugType2 title="Type 2" />)
  expect(html).toContain('role="img"')
  expect(html).toContain('evicon-plug-type-2')
  expect(html).toContain('<title')
})

test('renders in node without DOM', async () => {
  expect(typeof (globalThis as { document?: unknown }).document).toBe('undefined')
  const { PlugType2 } = await import('@evicons/react')
  const html = renderToString(<PlugType2 title="Type 2" />)
  expect(html).toContain('role="img"')
  expect(html).toContain('evicon-plug-type-2')
  expect(html).toContain('Type 2</title>')
})

// Resolution outside bundlers is checked in a plain Node process, so Vite's resolver is not involved.
function nodeEval(code: string, type: 'module' | 'commonjs'): string {
  return execFileSync(process.execPath, [`--input-type=${type}`, '-e', code], { cwd: ROOT, encoding: 'utf8' }).trim()
}

test('package.json of both packages is exported (ESM and CJS resolution)', () => {
  for (const pkg of ['@evicons/react', '@evicons/svg']) {
    const expected = join(ROOT, 'packages', pkg.split('/')[1]!, 'package.json')
    expect(nodeEval(`console.log(require.resolve('${pkg}/package.json'))`, 'commonjs')).toBe(expected)
    const url = nodeEval(`console.log(import.meta.resolve('${pkg}/package.json'))`, 'module')
    expect(fileURLToPath(url)).toBe(expected)
  }
})

test('@evicons/svg exports icons.json and osm.json', () => {
  for (const file of ['icons.json', 'osm.json']) {
    expect(nodeEval(`console.log(require.resolve('@evicons/svg/${file}'))`, 'commonjs')).toBe(join(ROOT, 'packages/svg', file))
  }
  const osm = JSON.parse(nodeEval("console.log(JSON.stringify(require('@evicons/svg/osm.json')))", 'commonjs')) as Record<string, string>
  expect(osm['socket:type2']).toBe('plug-type-2')
})

// require(esm) exists from Node 20.19 / 22.12; older runtimes cannot load an ESM-only package with require().
test.skipIf(!(process.features as { require_module?: boolean }).require_module)('require() loads the package and a deep import', () => {
  const out = nodeEval(
    "console.log(typeof require('@evicons/react').PlugType2, typeof require('@evicons/react/icons/plug-type-2').PlugType2)",
    'commonjs',
  )
  expect(out).toBe('object object')
})

// TypeScript 7 no longer ships moduleResolution node10, so this follows node10's lookup rules on the
// manifest: top-level `types` for the root, `typesVersions` for subpaths, and `exports` ignored.
test('types resolve under moduleResolution node10 rules', () => {
  const dir = join(ROOT, 'packages/react')
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as {
    main: string
    types: string
    typesVersions: Record<string, Record<string, string[]>>
    exports: Record<string, string | Record<string, string>>
  }
  expect(existsSync(join(dir, pkg.main))).toBe(true)
  expect(existsSync(join(dir, pkg.types))).toBe(true)
  const mapping = pkg.typesVersions['*']!['icons/*']!
  expect(mapping).toHaveLength(1)
  expect(existsSync(join(dir, mapping[0]!.replace('*', 'plug-type-2')))).toBe(true)
  // Every conditional export has `types` first and a `default` fallback for non-`import` conditions.
  for (const [subpath, target] of Object.entries(pkg.exports)) {
    if (typeof target === 'string') continue
    expect(Object.keys(target)[0], subpath).toBe('types')
    expect(target.default, subpath).toBeDefined()
  }
})
