import { test, expect } from '@playwright/test';
import { NotificationsPage } from '../pages/NotificationsPage';

test.describe('Notifications module', () => {
  test('notifications page loads with visible content', async ({ page }) => {
    await page.goto('/');
    const n = new NotificationsPage(page);
    await n.open();

    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.waitForTimeout(800);

    await expect(page).not.toHaveURL(/error|404|notfound/i);
    const visibleText = (await page.locator('body').innerText()).trim();
    expect(
      visibleText.length,
      'expected Notifications page to render visible text'
    ).toBeGreaterThan(20);
  });
});
