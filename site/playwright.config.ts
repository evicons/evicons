import { defineConfig, devices } from '@playwright/test'

// Smoke tests for the evicons.dev site against the static build served by `astro preview`.
// Run from the repo root: `npm run test:site` (after `npm run build:site`).
const port = 4321

export default defineConfig({
  testDir: 'tests',
  outputDir: '../test-results/site',
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never', outputFolder: '../playwright-report/site' }]] : 'list',
  use: { baseURL: `http://localhost:${port}` },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run preview -- --port ${port} --ignore-lock`,
    cwd: import.meta.dirname,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
