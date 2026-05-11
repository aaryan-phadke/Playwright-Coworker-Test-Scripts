import { expect, Locator, Page } from '@playwright/test';

/**
 * Common page abstractions shared by every authenticated module page.
 */
export abstract class BasePage {
  readonly page: Page;
  readonly mainNav: Locator;
  readonly userMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.mainNav = page
      .getByRole('navigation')
      .or(page.locator('nav, [role="navigation"], aside'))
      .first();
    this.userMenu = page
      .getByRole('button', { name: /account|profile|user/i })
      .or(page.locator('[data-testid*="user" i], [aria-label*="user" i]'))
      .first();
  }

  /**
   * Expand the sidebar (it starts collapsed by default) and click the module
   * link by its exact text. Selectors come from real codegen capture against
   * https://ams.sorigin.app — see RUN_GUIDE.md for how to refresh.
   */
  async ensureSidebarExpanded() {
    const collapseBtn = this.page.getByRole('button', { name: /collapse/i }).first();
    const isExpanded = await collapseBtn.isVisible().catch(() => false);
    if (isExpanded) return;
    // Sidebar is collapsed: click the toggle inside <aside> to expand it.
    const expandBtn = this.page.getByRole('complementary').getByRole('button').first();
    await expandBtn.click().catch(() => {});
    // Wait for the expand animation + text labels to render.
    await this.page.waitForTimeout(500);
  }

  /**
   * Click a module in the sidebar by its exact text label.
   * Scopes the click to the <aside> (complementary) so it can't accidentally
   * match a breadcrumb, page heading, or in-content link with the same text.
   */
  async openNav(name: string) {
    await this.ensureSidebarExpanded();
    await this.page
      .getByRole('complementary')
      .getByText(name, { exact: true })
      .first()
      .click();
    // Give the new module page a moment to load before assertions run.
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
    await this.page.waitForTimeout(300);
  }

  async expectLoadedHeading(name: string | RegExp) {
    const re = typeof name === 'string' ? new RegExp(name, 'i') : name;
    await expect(
      this.page.getByRole('heading', { name: re }).first()
    ).toBeVisible({ timeout: 15_000 });
  }

  async screenshot(label: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${label}.png`,
      fullPage: true,
    });
  }
}
