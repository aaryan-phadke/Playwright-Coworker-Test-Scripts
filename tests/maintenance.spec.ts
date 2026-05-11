import { test, expect } from '@playwright/test';
import { MaintenancePage } from '../pages/MaintenancePage';

test.describe('Maintenance module', () => {
  test('maintenance page loads with visible content', async ({ page }) => {
    await page.goto('/');
    const m = new MaintenancePage(page);
    await m.open();

    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.waitForTimeout(800);

    // 1. We're not on an error/404 route.
    await expect(page).not.toHaveURL(/error|404|notfound/i);

    // 2. The page rendered real content (not blank/skeleton-only).
    const visibleText = (await page.locator('body').innerText()).trim();
    expect(
      visibleText.length,
      'expected Maintenance page to render visible text'
    ).toBeGreaterThan(20);
  });
});
