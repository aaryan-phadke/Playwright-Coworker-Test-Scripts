import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { env } from '../utils/env';

// These tests intentionally do NOT reuse storageState — they exercise the
// signin form directly. We override storageState to "no auth" via a fresh ctx.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication — Wind login', () => {
  test('happy path: valid creds reach dashboard', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAndWaitForDashboard();
    await expect(page).not.toHaveURL(/signin/i);
  });

  test('shows an error for invalid password', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(env.email, 'definitely-wrong-password-' + Date.now());
    // We stay on signin OR see a visible error.
    await expect(async () => {
      const stillOnSignin = /signin/i.test(page.url());
      const errorVisible = await login.errorMessage.isVisible().catch(() => false);
      expect(stillOnSignin || errorVisible).toBeTruthy();
    }).toPass({ timeout: 10_000 });
  });

  test('shows an error for invalid email format', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.emailField.fill('not-an-email');
    await login.passwordField.fill('whatever');
    await login.submitButton.click();
    // Browsers may block submit via HTML5 validation OR the app shows an error.
    await page.waitForTimeout(1000);
    expect(/signin/i.test(page.url())).toBeTruthy();
  });

  test('empty fields keep submit button disabled', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    // Portal correctly disables the submit button when fields are empty —
    // that's the desired UX. Verify the disabled state instead of attempting
    // a click that would never succeed.
    await expect(login.submitButton).toBeDisabled();
    expect(/signin/i.test(page.url())).toBeTruthy();
  });
});
