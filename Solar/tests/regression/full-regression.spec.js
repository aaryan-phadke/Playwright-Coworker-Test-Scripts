// DA-1272 — Full automation regression.
// Each test logs in independently and is isolated, so a single failure does not
// cascade to "did not run" status for downstream tests.

const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { DashboardPage } = require('../../pages/DashboardPage');
const { users } = require('../../fixtures/test-data');

test.describe('Full regression — authenticated journey', () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAndWait(users.validUser.email, users.validUser.password);
    const dashboard = new DashboardPage(page);
    await dashboard.expectLoaded();
  });

  test('TC-REG-001 — landing page is reachable', async ({ page }) => {
    await expect(page).not.toHaveURL(/\/signin/i);
  });

  test('TC-REG-002 — GIS View nav element is present', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await expect(dashboard.gisViewNav).toBeVisible({ timeout: 10_000 });
  });

  test('TC-REG-003 — Report nav element is present', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await expect(dashboard.reportNav).toBeVisible({ timeout: 10_000 });
  });

  test('TC-REG-004 — Assets nav element is present', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await expect(dashboard.assetsNav).toBeVisible({ timeout: 10_000 });
  });

  test('TC-REG-005 — Maintenance nav element is present', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await expect(dashboard.maintenanceNav).toBeVisible({ timeout: 10_000 });
  });

  test('TC-REG-006 — Tickets nav element is present', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await expect(dashboard.ticketsNav).toBeVisible({ timeout: 10_000 });
  });

  test('TC-REG-007 — Notifications nav element is present', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await expect(dashboard.notificationsNav).toBeVisible({ timeout: 10_000 });
  });

  test('TC-REG-008 — KPI tiles render on the dashboard', async ({ page }) => {
    // Asset Performance Overview shows: Installed Capacity, Total Generation, PR, Grid Availability, Plant Availability
    await expect(page.getByRole('heading', { name: /installed capacity/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /total generation/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^pr$/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /grid availability/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /plant availability/i })).toBeVisible();
  });

  test('TC-REG-009 — logout terminates the session', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.logout();
    // After logout (UI or cookie fallback) we should be back on /signin
    expect(/\/signin|\/login|\/$/i.test(page.url())).toBeTruthy();
  });
});
