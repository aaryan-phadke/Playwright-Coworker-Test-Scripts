// Page Object Model for the Sorigin AMS signin page (https://ams.sorigin.app/signin).
// Selectors verified against the live AMS UI on 15-May-2026.
// NOTE: The Sign in button is disabled until both email and password are filled.

const { expect } = require('@playwright/test');
const { urls } = require('../fixtures/test-data');

class LoginPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    this.emailInput = page.locator(
      'input[type="email"], input[name="email"], input[name="username"], input#email, input[placeholder*="mail" i]'
    ).first();

    this.passwordInput = page.locator(
      'input[type="password"], input[name="password"], input#password'
    ).first();

    // Sign in button — confirmed text "Sign in", type="submit", disabled until both fields filled.
    this.signInButton = page.getByRole('button', { name: /^sign\s*in$/i });

    this.forgotPasswordLink = page.getByRole('link', { name: /forgot.*password/i });

    this.errorBanner = page.locator(
      '[role="alert"], .ant-message-error, .ant-notification-notice-error, .error-message, .toast-error, [class*="error" i]'
    ).first();
  }

  async goto() {
    await this.page.goto(urls.signIn, { waitUntil: 'domcontentloaded' });
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/signin/i);
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    // Button is visible but starts disabled — DO NOT assert toBeEnabled here.
    await expect(this.signInButton).toBeVisible();
  }

  async expectSignInButtonDisabled() {
    await expect(this.signInButton).toBeDisabled();
  }

  async expectSignInButtonEnabled() {
    await expect(this.signInButton).toBeEnabled();
  }

  /**
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await expect(this.signInButton).toBeEnabled({ timeout: 10_000 });
    await this.signInButton.click();
  }

  /**
   * Fill, wait for button to enable, click, and wait for navigation away from /signin.
   */
  async loginAndWait(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await expect(this.signInButton).toBeEnabled({ timeout: 10_000 });
    await Promise.all([
      this.page.waitForURL((u) => !/\/signin/i.test(u.toString()), { timeout: 20_000 }).catch(() => null),
      this.signInButton.click(),
    ]);
  }

  async expectErrorVisible() {
    await expect(this.errorBanner).toBeVisible({ timeout: 10_000 });
  }
}

module.exports = { LoginPage };
