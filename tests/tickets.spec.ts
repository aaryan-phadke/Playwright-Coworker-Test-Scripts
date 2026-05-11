import { test, expect } from '@playwright/test';
import { TicketsPage } from '../pages/TicketsPage';

test.describe('Tickets module', () => {
  test('tickets page loads with visible content', async ({ page }) => {
    await page.goto('/');
    const t = new TicketsPage(page);
    await t.open();

    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.waitForTimeout(800);

    await expect(page).not.toHaveURL(/error|404|notfound/i);
    const visibleText = (await page.locator('body').innerText()).trim();
    expect(
      visibleText.length,
      'expected Tickets page to render visible text'
    ).toBeGreaterThan(20);
  });
});
