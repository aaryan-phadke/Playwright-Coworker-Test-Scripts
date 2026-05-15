// @ts-check
const { defineConfig, devices } = require('@playwright/test');
require('dotenv').config();

/**
 * Playwright configuration for Sorigin AMS Web Portal automation.
 * JIRA: DA-1106 — Web Portal Automation Testing (Solar login)
 *
 * Covers acceptance criteria:
 *   - DA-1128 Playwright execution for modified modules
 *   - DA-1129 Cross-browser validation (Chrome, Firefox, Edge)
 *   - DA-1130 End-to-end regression testing after merge
 *   - DA-1131 Execution report generation
 *   - DA-1271 Role-based access validation
 *   - DA-1272 Full automation regression
 */
module.exports = defineConfig({
  testDir: './tests',

  // Run tests in parallel within a file
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in source code
  forbidOnly: !!process.env.CI,

  // Retry on CI, no retries locally to surface flaky tests faster
  retries: process.env.CI ? 2 : 1,

  // Limit parallel workers on CI for stability
  workers: process.env.CI ? 2 : undefined,

  // ---- DA-1131 reporters ----
  // HTML report for human review, JUnit for CI ingestion, JSON for custom dashboards
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'reports/junit-results.xml' }],
    ['json', { outputFile: 'reports/test-results.json' }],
    ['list'],
  ],

  // Shared settings for all the projects below
  use: {
    baseURL: process.env.BASE_URL || 'https://ams.sorigin.app',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    ignoreHTTPSErrors: true,
  },

  // Default test timeout
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },

  // ---- DA-1129 cross-browser projects ----
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'msedge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    // Optional mobile coverage — uncomment to enable
    // { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    // { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],

  outputDir: 'test-results/',
});
