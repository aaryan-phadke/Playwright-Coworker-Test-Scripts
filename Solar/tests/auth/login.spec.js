// DA-1128 — Playwright execution for modified modules: positive login flow
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { DashboardPage } = require('../../pages/DashboardPage');
const { users, urls } = require('../../fixtures/test-data');

test.describe('Sorigin AMS — Login (positive flows)', () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.expectLoaded();
  });

  test('TC-LOGIN-001 — signin page renders with email, password, and submit', async ({ page }) => {
    const login = new LoginPage(page);
    await expect(page).toHaveURL(/\/signin/i);
    await expect(login.emailInput).toBeEnabled();
    await expect(login.passwordInput).toBeEnabled();
    // The Sign in button is intentionally disabled until both fields are filled.
    await expect(login.signInButton).toBeVisible();
    await expect(login.signInButton).toBeDisabled();
  });

  test('TC-LOGIN-001b — Sign in button enables after both fields are filled', async ({ page }) => {
    const login = new LoginPage(page);
    await login.emailInput.fill('someone@example.com');
    await login.passwordInput.fill('AnyPassword123!');
    await expect(login.signInButton).toBeEnabled({ timeout: 5_000 });
  });

  test('TC-LOGIN-002 — valid credentials log the user in', async ({ page }) => {
    const login = new LoginPage(page);
    const dashboard = new DashboardPage(page);

    await login.loginAndWait(users.validUser.email, users.validUser.password);
    await dashboard.expectLoaded();

    await expect(page).not.toHaveURL(/\/signin/i);
  });

  test('TC-LOGIN-003 — session persists across page reload', async ({ page }) => {
    const login = new LoginPage(page);
    const dashboard = new DashboardPage(page);

    await login.loginAndWait(users.validUser.email, users.validUser.password);
    await dashboard.expectLoaded();

    await page.reload();
    await expect(page).not.toHaveURL(/\/signin/i);
  });

  test('TC-LOGIN-004 — direct navigation to dashboard while authenticated stays authenticated', async ({ page }) => {
    const login = new LoginPage(page);
    await login.loginAndWait(users.validUser.email, users.validUser.password);

    await page.goto(urls.base, { waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/\/signin/i);
  });
});
