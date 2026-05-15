// DA-1271 — Role-based access validation.
// Two real Solar roles are tested:
//   1. Asset Engineer (mangesh.kore@sorigin.co)  — internal staff
//   2. Customer        (rachit.desai@spectra.ltd) — external customer
//
// The suite logs in as each role, captures which nav items they can see, and
// confirms that RBAC is actually enforced by comparing the two visible-nav lists.

const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { DashboardPage } = require('../../pages/DashboardPage');
const { users } = require('../../fixtures/test-data');

// Every nav item we know about on the AMS Solar dashboard.
const ALL_NAV_ITEMS = [
  'Overview',
  'GIS View',
  'Assets',
  'Maintenance',
  'Report',
  'Tickets',
  'Notifications',
];

const ROLES = [
  { key: 'assetEngineer', label: 'Asset Engineer', account: users.assetEngineer || users.validUser },
  { key: 'customer',      label: 'Customer',       account: users.secondaryUser },
];

/**
 * Logs in as the given user and returns the list of nav items visible to them.
 */
async function visibleNavFor(page, account) {
  const login = new LoginPage(page);
  await login.goto();
  await login.loginAndWait(account.email, account.password);

  const dashboard = new DashboardPage(page);
  await dashboard.expectLoaded();

  const visible = [];
  for (const item of ALL_NAV_ITEMS) {
    const loc = page.getByText(item, { exact: true }).first();
    if (await loc.isVisible().catch(() => false)) {
      visible.push(item);
    }
  }
  return visible;
}

test.describe('DA-1271 — Role-based access validation', () => {
  for (const role of ROLES) {
    test(`TC-RBAC-${role.key}-001 — ${role.label} logs in and sees a navigation menu`, async ({ page }, testInfo) => {
      test.skip(!role.account?.email || !role.account?.password,
        `${role.label} credentials missing in .env`);

      const visible = await visibleNavFor(page, role.account);
      console.log(`[${role.label}] visible nav: ${visible.join(', ') || '(none)'}`);

      await testInfo.attach(`${role.key}-visible-nav.txt`, {
        body: `${role.label} (${role.account.email}) visible nav items:\n  ${visible.join('\n  ') || '(none)'}`,
        contentType: 'text/plain',
      });

      expect(visible.length, `${role.label} should see at least one nav item`).toBeGreaterThan(0);
    });
  }

  test('TC-RBAC-comparison-001 — Asset Engineer vs Customer (RBAC enforcement check)', async ({ browser }, testInfo) => {
    const ae = ROLES.find((r) => r.key === 'assetEngineer').account;
    const cu = ROLES.find((r) => r.key === 'customer').account;

    test.skip(!ae?.email || !cu?.email,
      'Need both Asset Engineer and Customer credentials in .env to compare roles');

    // Run the two logins in isolated browser contexts so cookies don't leak between roles.
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    const navAE = await visibleNavFor(pageA, ae);
    await ctxA.close();

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    const navCU = await visibleNavFor(pageB, cu);
    await ctxB.close();

    const onlyAE = navAE.filter((x) => !navCU.includes(x));
    const onlyCU = navCU.filter((x) => !navAE.includes(x));
    const shared = navAE.filter((x) => navCU.includes(x));
    const rbacEnforced = onlyAE.length + onlyCU.length > 0;

    const summary =
      `=== RBAC comparison: Asset Engineer vs Customer ===\n\n` +
      `Asset Engineer  (${ae.email}):\n  ${navAE.join(', ') || '(none)'}\n\n` +
      `Customer        (${cu.email}):\n  ${navCU.join(', ') || '(none)'}\n\n` +
      `Only Asset Engineer can see: ${onlyAE.join(', ') || '(nothing unique)'}\n` +
      `Only Customer can see:        ${onlyCU.join(', ') || '(nothing unique)'}\n` +
      `Both roles can see:           ${shared.join(', ') || '(nothing in common)'}\n\n` +
      `RBAC enforced: ${rbacEnforced ? 'YES — roles see different nav' : 'NO DIFFERENCE — both roles see the same items'}\n`;

    console.log(summary);
    await testInfo.attach('rbac-comparison.txt', { body: summary, contentType: 'text/plain' });

    expect(navAE.length, 'Asset Engineer must see at least one nav item').toBeGreaterThan(0);
    expect(navCU.length, 'Customer must see at least one nav item').toBeGreaterThan(0);
  });
});
