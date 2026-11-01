import { defineConfig, devices } from '@playwright/test'

// Visual regression of preview/dist/regression.html. Reference snapshots are generated in the
// container mcr.microsoft.com/playwright:v<@playwright/test version>-noble (same as CI).
export default defineConfig({
  testDir: 'tests/visual',
  outputDir: 'test-results',
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], deviceScaleFactor: 1, viewport: { width: 400, height: 400 } },
    },
  ],
})
