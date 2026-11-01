import { defineConfig } from 'vitest/config'

// Smoke tests against the built package (`packages/react/dist`). Run `npm run build` first.
export default defineConfig({
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    environment: 'node',
    include: ['tests/consumer/**/*.test.tsx'],
  },
})
