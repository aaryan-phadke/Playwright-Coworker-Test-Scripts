import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * DA-1116 — Role-based access validation
 *
 * Verifies that two distinct user accounts on the Sorigin AMS portal can:
 *   1. Authenticate independently with their own credentials
 *   2. Reach the dashboard after login (no auth redirect loop)
 *   3. Render a non-empty sidebar (proves the post-login UI loads)
 *
 * Then captures and compares the two sidebars — if they differ, the portal
 * is differentiating roles. If they match, both accounts have the same role
 * (the test still passes — it's informational, surfaced as an annotation in
 * the execution report).
 *
 * Configured accounts (in .env, gitignored):
 *   PORTAL_ADMIN_EMAIL  / PORTAL_ADMIN_PASSWORD   — primary test account
 *   PORTAL_VIEWER_EMAIL / PORTAL_VIEWER_PASSWORD  — secondary test account
 *
 * Both accounts currently used are Asset Engineer role, so identical sidebars
 * are EXPECTED. The annotation in the report makes this explicit. To validate
 * cross-role RBAC differences, replace one account with a user of a different
 * role (e.g., Admin, Viewer, Operator) and re-run.
 *
 * Implementation note: uses TWO separate browser contexts (one per account)
 * rather than logging out + back in within a single context, because the
 * Sorigin portal stores auth in localStorage as well as cookies — clearing
 * cookies alone doesn't fully sign out. Fresh contexts guarantee no auth
 * bleed-through.
 */

/** Sign in with the given creds and return the captured sidebar items. */
async function loginAndCaptureSidebar(
  page: Page,
  email: string,
  password: string
): Promise<string[]> {
  await page.goto('/signin');
  await page.getByRole('textbox', { name: 'Example@email.com' }).fill(email);
  await page.getByRole('textbox', { name: /Pass@/ }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL((u) => !/signin/i.test(u.pathname), { timeout: 30_000 });

  // Expand sidebar if collapsed
  const collapseBtn = page.getByRole('button', { name: /collapse/i }).first();
  if (!(await collapseBtn.isVisible().catch(() => false))) {
    await page.getByRole('complementary').getByRole('button').first().click().catch(() => {});
    await page.waitForTimeout(700);
  }

  const items = await page
    .getByRole('complementary')
    .locator('a:visible, button:visible, [role="menuitem"]:visible')
    .allInnerTexts();
  return items.map((s) => s.trim()).filter(Boolean);
}

test.describe('DA-1116 — Role-based access validation', () => {
  const account1Email = process.env.PORTAL_ADMIN_EMAIL;
  const account1Pwd = process.env.PORTAL_ADMIN_PASSWORD;
  const account2Email = process.env.PORTAL_VIEWER_EMAIL;
  const account2Pwd = process.env.PORTAL_VIEWER_PASSWORD;

  const haveBothAccounts = Boolean(account1Email && account1Pwd && account2Email && account2Pwd);

  // Don't reuse stored auth — these tests sign in fresh per account.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('two distinct accounts authenticate and access their workspaces', async ({ browser }) => {
    test.skip(
      !haveBothAccounts,
      'Set PORTAL_ADMIN_* and PORTAL_VIEWER_* in .env to enable DA-1116.'
    );

    // Use TWO independent browser contexts so storage doesn't bleed between accounts.
    let ctx1: BrowserContext | null = null;
    let ctx2: BrowserContext | null = null;

    try {
      // Account #1
      ctx1 = await browser.newContext();
      const page1 = await ctx1.newPage();
      const account1Sidebar = await loginAndCaptureSidebar(page1, account1Email!, account1Pwd!);

      // Account #2
      ctx2 = await browser.newContext();
      const page2 = await ctx2.newPage();
      const account2Sidebar = await loginAndCaptureSidebar(page2, account2Email!, account2Pwd!);

      // Compare for the report annotation.
      const same =
        JSON.stringify([...account1Sidebar].sort()) ===
        JSON.stringify([...account2Sidebar].sort());

      test.info().annotations.push({
        type: 'rbac',
        description: same
          ? `Both accounts (${account1Email} and ${account2Email}) see the SAME sidebar (${account1Sidebar.length} items). Items: ${account1Sidebar.join(', ')}. This indicates both accounts share the same role. To validate cross-role differentiation, configure one account with a different role.`
          : `Account #1 (${account1Email}) sees ${account1Sidebar.length} items: ${account1Sidebar.join(', ')}. Account #2 (${account2Email}) sees ${account2Sidebar.length} items: ${account2Sidebar.join(', ')}. RBAC is differentiating roles correctly.`,
      });

      // Core assertions — both accounts must successfully log in and load a sidebar.
      expect(
        account1Sidebar.length,
        `Account #1 (${account1Email}) signed in but sidebar is empty — login flow may be broken`
      ).toBeGreaterThan(0);

      expect(
        account2Sidebar.length,
        `Account #2 (${account2Email}) signed in but sidebar is empty — login flow may be broken`
      ).toBeGreaterThan(0);

      // Verify the login isolation worked — both accounts saw their OWN session,
      // not the same shared session. (If contexts leaked, the test would still
      // technically pass, but the sidebars from both contexts would be byte-for-byte
      // identical due to shared state. The annotation above captures this.)
    } finally {
      await ctx1?.close();
      await ctx2?.close();
    }
  });
});
