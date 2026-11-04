// Copies static files into site/public/ before `astro dev` and `astro build` (no symlinks in the repository):
//   brand/*.svg|png                 -> site/public/brand/   (/brand/logo.svg etc.)
//   @evicons/svg svg/*.svg           -> site/public/svg/     (/svg/<name>.svg: icon pages, image search, downloads)
//   @openpanel/web tracker.global.js -> site/public/op1.js   (statistics script from our own origin, see Analytics.astro)
// All targets are generated and git-ignored; brand/ and the packages are the sources.
import { copyFile, mkdir, readdir, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

async function copyAll(from, to, pattern, what) {
  const files = (await readdir(from)).filter((name) => pattern.test(name))
  if (files.length === 0) throw new Error(`No ${what} in ${from}`)
  // Start empty, so a renamed or removed file does not linger.
  await rm(to, { recursive: true, force: true })
  await mkdir(to, { recursive: true })
  for (const name of files) await copyFile(join(from, name), join(to, name))
  console.log(`copy-brand: ${files.length} ${what} to ${to.replace(/.*\/site\//, 'site/')}`)
}

const brand = fileURLToPath(new URL('../../brand/', import.meta.url))
const require = createRequire(import.meta.url)
const svgPackage = dirname(require.resolve('@evicons/svg/package.json'))
// @openpanel/web exports only its entry point (dist/index.js); the tracker sits next to it.
const tracker = join(dirname(require.resolve('@openpanel/web')), 'src', 'tracker.global.js')
await copyAll(brand, fileURLToPath(new URL('../public/brand/', import.meta.url)), /\.(svg|png)$/, 'logo files')
await copyAll(join(svgPackage, 'svg'), fileURLToPath(new URL('../public/svg/', import.meta.url)), /\.svg$/, 'icon SVGs')
await copyFile(tracker, fileURLToPath(new URL('../public/op1.js', import.meta.url)))
console.log('copy-brand: OpenPanel tracker to site/public/op1.js')
