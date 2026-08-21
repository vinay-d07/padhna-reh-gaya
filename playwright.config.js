const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 30000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // Assumes `npm run dev` is already running in client/ (see e2e/README.md).
  // Not auto-started here since the client depends on backend/lanchain env
  // vars that CI doesn't always have — see the CI workflow for how this is
  // wired up there.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        cwd: './client',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 60000,
      },
});
