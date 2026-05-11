import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * DA-1116 — Role-based access validation
 *
 * Verifies that users with different roles see different parts of the portal.
 * Requires at least TWO sets of credentials (e.g., admin + viewer) configured
 * via env vars:
 *
 *   PORTAL_ADMIN_EMAIL=admin@example.com
 *   PORTAL_ADMIN_PASSWORD=...
 *   PORTAL_VIEWER_EMAIL=viewer@example.com
 *   PORTAL_VIEWER_PASSWORD=...
 *
 * When those vars aren't present, the test is intentionally skipped with a
 * clear annotation so the DA-1116 ticket can be marked as "scaffolded,
 * awaiting test accounts" rather than failing.
 *
 * Implementation note: this test uses TWO separate browser contexts (one per
 * role) instead of trying to log out + log in within a single context. The
 * Sorigin portal stores auth in localStorage as well as cookies, so simply
 * clearing cookies doesn't fully sign out and the second login would fail.
 * Fresh contexts guarantee no auth bleed-through.
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
  const adminEmail = process.env.PORTAL_ADMIN_EMAIL;
  const adminPwd = process.env.PORTAL_ADMIN_PASSWORD;
  const viewerEmail = process.env.PORTAL_VIEWER_EMAIL;
  const viewerPwd = process.env.PORTAL_VIEWER_PASSWORD;

  const haveBothRoles = Boolean(adminEmail && adminPwd && viewerEmail && viewerPwd);

  // Don't reuse stored auth — these tests sign in fresh per role.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('admin and viewer see different sidebar items', async ({ browser }) => {
    test.skip(
      !haveBothRoles,
      'Set PORTAL_ADMIN_* and PORTAL_VIEWER_* in .env to enable DA-1116.'
    );

    // Use TWO independent browser contexts so storage doesn't bleed between roles.
    let adminCtx: BrowserContext | null = null;
    let viewerCtx: BrowserContext | null = null;

    try {
      adminCtx = await browser.newContext();
      const adminPage = await adminCtx.newPage();
      const adminSidebar = await loginAndCaptureSidebar(adminPage, adminEmail!, adminPwd!);

      viewerCtx = await browser.newContext();
      const viewerPage = await viewerCtx.newPage();
      const viewerSidebar = await loginAndCaptureSidebar(viewerPage, viewerEmail!, viewerPwd!);

      test.info().annotations.push({
        type: 'rbac',
        description: `admin items (${adminSidebar.length}): ${adminSidebar.join(', ')} | viewer items (${viewerSidebar.length}): ${viewerSidebar.join(', ')}`,
      });

      // Admin should see at least as many items as viewer.
      expect(
        adminSidebar.length >= viewerSidebar.length,
        'admin should see at least as many sidebar items as viewer'
      ).toBeTruthy();

      // If their sets are identical, the two accounts have the same role.
      expect(
        JSON.stringify([...adminSidebar].sort()) !== JSON.stringify([...viewerSidebar].sort()),
        'admin and viewer should see different sidebar items (both accounts may have the same role)'
      ).toBeTruthy();
    } finally {
      await adminCtx?.close();
      await viewerCtx?.close();
    }
  });
});
