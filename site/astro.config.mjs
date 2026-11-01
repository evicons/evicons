import mdx from '@astrojs/mdx'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://evicons.dev',
  output: 'static',
  // One index.html per path, served by nginx via `try_files $uri $uri/index.html`.
  build: { format: 'directory' },
  // One URL form everywhere: no trailing slash (nginx redirects /path/ to /path).
  trailingSlash: 'never',
  integrations: [react(), mdx()],
  markdown: {
    // Code blocks in the docs and the changelog: light and dark theme, switched by data-theme (global.css).
    shikiConfig: { themes: { light: 'github-light-default', dark: 'github-dark-default' } },
  },
  vite: {
    plugins: [tailwindcss()],
    // MapLibre GL (about 1 MB) is a lazy chunk loaded only by the /map page.
    build: { chunkSizeWarningLimit: 1100 },
  },
})
