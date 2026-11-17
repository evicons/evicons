// @vitest-environment node
// Runs against the built package: `npm run build` first. Resolves `@evicons/vue`
// through the workspace link, so the package `exports` map (→ dist) is exercised.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { afterAll, expect, test } from 'vitest'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const iconsJson = JSON.parse(readFileSync(join(ROOT, 'packages/svg/icons.json'), 'utf8')) as Record<
  string,
  { pascal: string }
>

const TMP_BASE = join(ROOT, '.tmp-tests')
mkdirSync(TMP_BASE, { recursive: true })
const tmp = mkdtempSync(join(TMP_BASE, 'smoke-vue-'))
afterAll(() => rmSync(tmp, { recursive: true, force: true }))

async function bundle(contents: string): Promise<string> {
  const result = await build({
    stdin: { contents, resolveDir: ROOT, loader: 'js' },
    bundle: true,
    treeShaking: true,
    format: 'esm',
    platform: 'neutral',
    external: ['vue', 'vue/*'],
    write: false,
    logLevel: 'silent',
  })
  return result.outputFiles[0]!.text
}

const ssr = (component: unknown, props: Record<string, unknown> = {}) =>
  renderToString(createSSRApp({ render: () => h(component as never, props) }))

test('single import bundles only that icon', async () => {
  const out = await bundle("import { PlugType2 } from '@evicons/vue'; console.log(PlugType2)")
  expect(out).toContain('plug-type-2')
  const others = Object.keys(iconsJson).filter((n) => n !== 'plug-type-2')
  for (const other of others) expect(out).not.toMatch(new RegExp(`["']${other}["']`))
  for (const other of others) expect(out).not.toContain(iconsJson[other]!.pascal)
})

test('deep import works and renders', async () => {
  const out = await bundle("export { PlugType2 } from '@evicons/vue/icons/plug-type-2'")
  for (const other of Object.keys(iconsJson).filter((n) => n !== 'plug-type-2')) {
    expect(out).not.toMatch(new RegExp(`["']${other}["']`))
  }
  const file = join(tmp, 'deep.mjs')
  writeFileSync(file, out)
  const mod = (await import(pathToFileURL(file).href)) as { PlugType2: unknown }
  const html = await ssr(mod.PlugType2, { title: 'Type 2' })
  expect(html).toContain('role="img"')
  expect(html).toContain('evicon-plug-type-2')
  expect(html).toContain('Type 2</title>')
})

test('every icon renders on the server', async () => {
  expect(typeof (globalThis as { document?: unknown }).document).toBe('undefined')
  const mod = (await import('@evicons/vue')) as Record<string, unknown>
  for (const [name, { pascal }] of Object.entries(iconsJson)) {
    const html = await ssr(mod[pascal])
    expect(html, name).toContain(`class="evicon evicon-${name}"`)
    expect(html, name).toContain('aria-hidden="true"')
  }
})

function nodeEval(code: string, type: 'module' | 'commonjs'): string {
  return execFileSync(process.execPath, [`--input-type=${type}`, '-e', code], { cwd: ROOT, encoding: 'utf8' }).trim()
}

test('package.json is exported (ESM and CJS resolution)', () => {
  const expected = join(ROOT, 'packages/vue/package.json')
  expect(nodeEval("console.log(require.resolve('@evicons/vue/package.json'))", 'commonjs')).toBe(expected)
  expect(fileURLToPath(nodeEval("console.log(import.meta.resolve('@evicons/vue/package.json'))", 'module'))).toBe(expected)
})

test('plain Node ESM loads the package and a deep import', () => {
  const out = nodeEval(
    "const a = await import('@evicons/vue'); const b = await import('@evicons/vue/icons/plug-type-2'); console.log(typeof a.PlugType2, b.default === b.PlugType2)",
    'module',
  )
  expect(out).toBe('object true')
})

test('types resolve under moduleResolution node10 rules', () => {
  const dir = join(ROOT, 'packages/vue')
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as {
    main: string
    types: string
    typesVersions: Record<string, Record<string, string[]>>
    exports: Record<string, string | Record<string, string>>
  }
  expect(existsSync(join(dir, pkg.main))).toBe(true)
  expect(existsSync(join(dir, pkg.types))).toBe(true)
  const mapping = pkg.typesVersions['*']!['icons/*']!
  expect(existsSync(join(dir, mapping[0]!.replace('*', 'plug-type-2')))).toBe(true)
  for (const [subpath, target] of Object.entries(pkg.exports)) {
    if (typeof target === 'string') continue
    expect(Object.keys(target)[0], subpath).toBe('types')
    expect(target.default, subpath).toBeDefined()
  }
})
