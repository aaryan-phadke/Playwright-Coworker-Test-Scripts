import { expect, Locator, Page } from '@playwright/test';
import { env } from '../utils/env';

/**
 * Page object for the Sorigin AMS sign-in page.
 *
 * Selectors below try a few common patterns (label, role, placeholder, name).
 * Refine these once the actual DOM is observed via codegen or DevTools:
 *   npm run codegen
 */
export class LoginPage {
  readonly page: Page;
  readonly emailField: Locator;
  readonly passwordField: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Selectors below were captured from `npx playwright codegen` against
    // https://ams.sorigin.app/signin. The form uses placeholders as the
    // accessible name (no <label>), so getByRole(textbox, name: <placeholder>)
    // is the sturdiest match.
    this.emailField = page.getByRole('textbox', { name: 'Example@email.com' });
    this.passwordField = page.getByRole('textbox', { name: /Pass@/ });
    this.submitButton = page.getByRole('button', { name: 'Sign in' });

    this.errorMessage = page
      .getByRole('alert')
      .or(page.locator('[class*="error" i], [class*="alert" i]'))
      .first();
  }

  async goto() {
    await this.page.goto(env.signinPath);
    await expect(this.emailField).toBeVisible({ timeout: 15_000 });
  }

  async login(email = env.email, password = env.password) {
    await this.emailField.fill(email);
    await this.passwordField.fill(password);
    await this.submitButton.click();
  }

  async loginAndWaitForDashboard(email?: string, password?: string) {
    await this.login(email, password);
    // Heuristic: post-login URL changes away from /signin
    await this.page.waitForURL((url) => !/\/signin/i.test(url.pathname), {
      timeout: 30_000,
    });
  }
}
