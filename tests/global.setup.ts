import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../pages/LoginPage';
import { env } from '../utils/env';

const authFile = path.resolve(__dirname, '../playwright/.auth/user.json');

/**
 * Performs login once and stores the authenticated cookies/localStorage so the
 * three browser projects (chromium, firefox, msedge) can reuse it without
 * re-logging in for every test. Run automatically as a project dependency.
 */
setup('authenticate', async ({ page }) => {
  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  const login = new LoginPage(page);
  await login.goto();
  await login.loginAndWaitForDashboard();

  // Sanity: we should NOT still be on the signin page.
  await expect(page).not.toHaveURL(/signin/i);

  await page.context().storageState({ path: authFile });
});
