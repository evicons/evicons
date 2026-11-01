import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { expect, test } from '@playwright/test'
import { buildPreview } from '../../tools/build-preview.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = join(ROOT, 'preview/dist')

test.beforeAll(() => buildPreview({ iconsDir: join(ROOT, 'icons'), outDir: OUT }))

test('icons render unchanged', async ({ page }) => {
  await page.goto(pathToFileURL(join(OUT, 'regression.html')).href)
  await expect(page).toHaveScreenshot('icons.png', { fullPage: true, animations: 'disabled' })
})
