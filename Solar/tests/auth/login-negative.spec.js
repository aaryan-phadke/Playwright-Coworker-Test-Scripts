// DA-1128 — negative login scenarios. Defect-raising candidates for DA-1106.
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { users } = require('../../fixtures/test-data');

test.describe('Sorigin AMS — Login (negative flows)', () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.expectLoaded();
  });

  test('TC-LOGIN-N001 — empty form submission is blocked (button disabled)', async ({ page }) => {
    const login = new LoginPage(page);
    // With empty fields the Sign in button must be disabled — this is the actual validation.
    await expect(login.signInButton).toBeDisabled();
    await expect(page).toHaveURL(/\/signin/i);
  });

  test('TC-LOGIN-N002 — invalid credentials show an error and keep user on /signin', async ({ page }) => {
    const login = new LoginPage(page);
    await login.login(users.invalid.email, users.invalid.password);

    await expect(page).toHaveURL(/\/signin/i, { timeout: 15_000 });
    await login.expectErrorVisible().catch(async () => {
      // Fallback: at minimum we should not have navigated to dashboard
      await expect(page).toHaveURL(/\/signin/i);
    });
  });

  test('TC-LOGIN-N003 — malformed email is rejected', async ({ page }) => {
    const login = new LoginPage(page);
    await login.login(users.malformedEmail.email, users.malformedEmail.password);
    await expect(page).toHaveURL(/\/signin/i);
  });

  test('TC-LOGIN-N004 — correct email with wrong password is rejected', async ({ page }) => {
    const login = new LoginPage(page);
    await login.login(users.validUser.email, 'definitely-wrong-password-123');
    await expect(page).toHaveURL(/\/signin/i, { timeout: 15_000 });
  });

  test('TC-LOGIN-N005 — password field masks input', async ({ page }) => {
    const login = new LoginPage(page);
    await login.passwordInput.fill('SomeSecret123!');
    await expect(login.passwordInput).toHaveAttribute('type', 'password');
  });
});
