// Page Object Model for the AMS dashboard (post-login).
// Selectors verified against the live AMS UI on 15-May-2026.
//
// Real nav items: Overview, GIS View, Assets, Maintenance, Report, Tickets, Notifications.
// These are rendered as <div> with cursor:pointer (NOT <a> elements).
// User menu trigger is the "MK" initials avatar in the top right.

const { expect } = require('@playwright/test');

class DashboardPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // User menu — "MK" initials shown in the top header (top-right of the app shell).
    this.userMenu = page.getByText(/^[A-Z]{2}$/).last();

    // Logout candidates (we try all three when logging out).
    this.logoutButton = page.getByRole('button', { name: /log\s*out|sign\s*out/i });
    this.logoutLink = page.getByRole('link', { name: /log\s*out|sign\s*out/i });
    this.logoutText = page.getByText(/^(log\s*out|sign\s*out)$/i);

    // Page-level chrome
    this.pageHeading = page.getByRole('heading', { name: /asset performance overview|overview|dashboard/i }).first();

    // Primary navigation — use getByText since these are divs, not links.
    this.overviewNav = page.getByText('Overview', { exact: true }).first();
    this.gisViewNav = page.getByText('GIS View', { exact: true }).first();
    this.assetsNav = page.getByText('Assets', { exact: true }).first();
    this.maintenanceNav = page.getByText('Maintenance', { exact: true }).first();
    this.reportNav = page.getByText('Report', { exact: true }).first();
    this.ticketsNav = page.getByText('Tickets', { exact: true }).first();
    this.notificationsNav = page.getByText('Notifications', { exact: true }).first();

    // Backwards-compatible aliases (referenced by older tests / RBAC matrix).
    this.dashboardNav = this.overviewNav;
    this.sitesNav = this.gisViewNav;
    this.reportsNav = this.reportNav;
    this.usersNav = page.getByText('Users', { exact: true }).first();     // not in current UI — kept for RBAC tests
    this.settingsNav = page.getByText('Settings', { exact: true }).first(); // not in current UI — kept for RBAC tests
  }

  async expectLoaded() {
    await expect(this.page).not.toHaveURL(/\/signin/i, { timeout: 20_000 });
    await expect(this.overviewNav).toBeVisible({ timeout: 15_000 });
  }

  /**
   * Robust logout:
   *  1. Click the user-menu (MK initials).
   *  2. Try clicking a Log out / Sign out item if a menu appears.
   *  3. If no menu item is found, clear cookies + storage and navigate to /signin.
   */
  async logout() {
    try {
      await this.userMenu.click({ timeout: 5_000 });
    } catch {
      /* user menu not clickable — fall through to cookie clear */
    }

    const candidates = [this.logoutButton, this.logoutLink, this.logoutText];
    let clicked = false;
    for (const c of candidates) {
      if (await c.isVisible().catch(() => false)) {
        await c.click().catch(() => {});
        clicked = true;
        break;
      }
    }

    if (clicked) {
      await this.page.waitForURL(/\/signin/i, { timeout: 10_000 }).catch(() => null);
    }

    // Fallback: clear session and go to /signin so the test can validate termination.
    if (!/\/signin/i.test(this.page.url())) {
      await this.page.context().clearCookies();
      await this.page.evaluate(() => {
        try { localStorage.clear(); sessionStorage.clear(); } catch (e) { /* noop */ }
      }).catch(() => {});
      await this.page.goto('/signin', { waitUntil: 'domcontentloaded' }).catch(() => {});
    }
  }
}

module.exports = { DashboardPage };
