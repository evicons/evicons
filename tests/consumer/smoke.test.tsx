// @vitest-environment node
// Runs against the built package: `npm run build` first. Resolves `@evicons/react`
// through the workspace link, so the package `exports` map (→ dist) is exercised.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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
