import { defineConfig, devices } from '@playwright/test'

// Smoke tests for the evicons.dev site against the static build served by `astro preview`.
// Run from the repo root: `npm run test:site` (after `npm run build:site`).
// SITE_PORT picks another port when 4321 is taken (e.g. a second checkout running its own preview).
const port = Number(process.env.SITE_PORT ?? 4321)

export default defineConfig({
  testDir: 'tests',
  // Playwright specs only; tests/*.test.tsx are Vitest unit tests (vitest.config.ts).
  testMatch: '*.spec.ts',
  outputDir: '../test-results/site',
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never', outputFolder: '../playwright-report/site' }]] : 'list',
  use: { baseURL: `http://localhost:${port}` },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: 'lighthouse.spec.ts' },
    // Lighthouse measures timings: run it alone, after the other tests.
    { name: 'lighthouse', testMatch: 'lighthouse.spec.ts', dependencies: ['chromium'] },
  ],
  webServer: {
    command: `npm run preview -- --port ${port} --ignore-lock`,
    cwd: import.meta.dirname,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
