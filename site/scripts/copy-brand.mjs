// Copies the logo files from brand/ into site/public/brand/ before `astro dev` and `astro build`,
// so /brand/logo.svg etc. are served as real files (no symlinks in the repository).
// site/public/brand/ is generated and git-ignored; brand/ is the source.
import { copyFile, mkdir, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const from = fileURLToPath(new URL('../../brand/', import.meta.url))
const to = fileURLToPath(new URL('../public/brand/', import.meta.url))

const files = (await readdir(from)).filter((name) => /\.(svg|png)$/.test(name))
if (files.length === 0) throw new Error(`No logo files in ${from}`)

await mkdir(to, { recursive: true })
for (const name of files) await copyFile(from + name, to + name)
console.log(`copy-brand: ${files.length} files to site/public/brand/`)
