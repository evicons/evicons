import mdx from '@astrojs/mdx'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://evicons.dev',
  output: 'static',
  // One index.html per path, served by nginx via `try_files $uri $uri/index.html`.
  build: { format: 'directory' },
  // One URL form everywhere: no trailing slash (nginx redirects /path/ to /path).
  trailingSlash: 'never',
  integrations: [
    react(),
    mdx(),
    // sitemap-index.xml + sitemap-0.xml; the OG render template and the error page are not pages to index.
    sitemap({ filter: (page) => !/\/(og|404)\/?$/.test(new URL(page).pathname) }),
  ],
  markdown: {
    // Code blocks in the docs and the changelog: light and dark theme, switched by data-theme (global.css).
    shikiConfig: {
      themes: { light: 'github-light-default', dark: 'github-dark-default' },
      transformers: [
        {
          // The light theme's comment grey (#6E7781) is 4.2:1 on the code background; GitHub's darker grey passes AA.
          name: 'evicons:comment-contrast',
          span(node) {
            const style = node.properties.style
            if (typeof style === 'string') node.properties.style = style.replace('color:#6E7781;', 'color:#59636E;')
          },
        },
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
    // MapLibre GL (about 1 MB) is a lazy chunk loaded only by the /map page.
    build: { chunkSizeWarningLimit: 1100 },
  },
})
