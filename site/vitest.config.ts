import { defineConfig } from 'vitest/config'

// Unit tests of the site (separate from the root config, which excludes site/**).
// Run from the repo root: `npm run test:site:unit` (after `npm run build`, the snippets import the built packages).
export default defineConfig({
  root: import.meta.dirname,
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
  },
})
