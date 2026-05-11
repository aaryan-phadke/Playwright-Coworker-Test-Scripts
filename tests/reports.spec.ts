import { test, expect } from '@playwright/test';
import { ReportsPage } from '../pages/ReportsPage';

test.describe('Reports module', () => {
  test('reports page loads with visible content', async ({ page }) => {
    await page.goto('/');
    const r = new ReportsPage(page);
    await r.open();

    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.waitForTimeout(800);

    await expect(page).not.toHaveURL(/error|404|notfound/i);
    const visibleText = (await page.locator('body').innerText()).trim();
    expect(
      visibleText.length,
      'expected Reports page to render visible text'
    ).toBeGreaterThan(20);
  });

  test('reports page has interactive controls', async ({ page }) => {
    await page.goto('/');
    const r = new ReportsPage(page);
    await r.open();
    await page.waitForTimeout(800);

    // Loose check — reports pages typically have at least one button or input
    // for the user to interact with (generate, export, filter, date range, etc.)
    const interactiveCount = await page
      .locator('button:visible, input:visible, select:visible, [role="combobox"]:visible')
      .count();
    expect(
      interactiveCount,
      'expected at least one interactive control on Reports page'
    ).toBeGreaterThan(0);
  });
});
