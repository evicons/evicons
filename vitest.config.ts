import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    exclude: [...configDefaults.exclude, 'tests/visual/**', 'tests/consumer/**', 'tests/consumer-next/**', 'site/**'],
  },
})
