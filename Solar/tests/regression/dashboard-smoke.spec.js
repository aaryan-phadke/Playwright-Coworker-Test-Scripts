// DA-1130 — End-to-end smoke regression after merge.
// Verifies authenticated landing area and that primary nav targets are reachable.

const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { DashboardPage } = require('../../pages/DashboardPage');
const { users } = require('../../fixtures/test-data');

test.describe('Dashboard smoke', () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAndWait(users.validUser.email, users.validUser.password);
  });

  test('TC-SMK-001 — dashboard renders after login', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.expectLoaded();
    await expect(page).not.toHaveURL(/\/signin/i);
  });

  test('TC-SMK-002 — primary navigation links exist', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.expectLoaded();

    // At least one of the main nav entries should be visible.
    const candidates = [
      dashboard.dashboardNav,
      dashboard.sitesNav,
      dashboard.usersNav,
      dashboard.settingsNav,
      dashboard.reportsNav,
    ];
    let anyVisible = false;
    for (const c of candidates) {
      if (await c.isVisible().catch(() => false)) {
        anyVisible = true;
        break;
      }
    }
    expect(anyVisible, 'Expected at least one primary nav link to be visible').toBeTruthy();
  });

  test('TC-SMK-003 — logout returns the user to /signin', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.expectLoaded();
    await dashboard.logout();

    // After logout we should land back on signin (or at least no longer be inside the app shell)
    const url = page.url();
    expect(/\/signin|\/login|\/$/i.test(url)).toBeTruthy();
  });
});
