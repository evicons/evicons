import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://evicons.dev',
  output: 'static',
  // One index.html per path, served by nginx via `try_files $uri $uri/index.html`.
  build: { format: 'directory' },
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
})
