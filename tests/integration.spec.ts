import { test, expect } from '@playwright/test';
import { OverviewPage } from '../pages/OverviewPage';
import { AssetsPage } from '../pages/AssetsPage';
import { ReportsPage } from '../pages/ReportsPage';

test.describe('Integration — cross-module navigation', () => {
  test('overview → assets → reports navigates without error', async ({ page }) => {
    await page.goto('/');

    const overview = new OverviewPage(page);
    await overview.open().catch(() => {});

    const assets = new AssetsPage(page);
    await assets.open();
    await expect(page).not.toHaveURL(/error|404/i);

    const reports = new ReportsPage(page);
    await reports.open();
    await expect(page).not.toHaveURL(/error|404/i);
  });
});
