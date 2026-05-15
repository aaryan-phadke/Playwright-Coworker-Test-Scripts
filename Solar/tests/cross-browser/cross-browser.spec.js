// DA-1129 — Cross-browser validation (Chrome, Firefox, Edge).
// This file runs against every project defined in playwright.config.js automatically.
// Use `npm run test:cross-browser` to execute all three browsers.

const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { DashboardPage } = require('../../pages/DashboardPage');
const { users, urls } = require('../../fixtures/test-data');

test.describe('Cross-browser validation', () => {
  test(`TC-XB-001 — signin page renders correctly on @browser`, async ({ page, browserName }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.expectLoaded();

    // Capture a per-browser screenshot for the report
    await page.screenshot({
      path: `test-results/screenshots/signin-${browserName}.png`,
      fullPage: true,
    });
  });

  test('TC-XB-002 — login succeeds on @browser', async ({ page, browserName }) => {
    const login = new LoginPage(page);
    const dashboard = new DashboardPage(page);

    await login.goto();
    await login.loginAndWait(users.validUser.email, users.validUser.password);
    await dashboard.expectLoaded();

    await expect(page, `Login should not stay on /signin in ${browserName}`).not.toHaveURL(/\/signin/i);

    await page.screenshot({
      path: `test-results/screenshots/dashboard-${browserName}.png`,
      fullPage: true,
    });
  });

  test('TC-XB-003 — basic page assets load (no console errors) on @browser', async ({ page, browserName }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
    });

    await page.goto(urls.signIn, { waitUntil: 'networkidle' });
    // Filter known noisy third-party errors if any
    const blocking = errors.filter((e) => !/favicon|third[- ]party|analytics/i.test(e));
    expect(blocking, `Unexpected console errors in ${browserName}:\n${blocking.join('\n')}`).toEqual([]);
  });
});
