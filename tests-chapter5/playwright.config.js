const { defineConfig, devices } = require('@playwright/test')

module.exports = defineConfig({
  testDir: './tests',
  timeout: 10000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      name: 'Backend',
      command: 'node setup/start-test-backend.js',
      url: 'http://localhost:4000',
      timeout: 120000,
      reuseExistingServer: false,
      stdout: 'pipe',
      env: {
        ...process.env,
        MONGOMS_DEBUG: '1',
      }
    },
    {
      command: 'npm run dev',
      cwd: '../library-frontend',
      url: 'http://localhost:5173',
      timeout: 120000,
      reuseExistingServer: false,
    },
  ],
})
