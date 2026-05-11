import { test, expect } from '@playwright/test';

/**
 * Lightweight UI/UX checks that catch obvious regressions:
 * - no console errors on key pages
 * - viewport responsiveness (desktop vs narrow laptop)
 */
test.describe('UI/UX checks', () => {
  test('no severe console errors on dashboard load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

    // Filter out known noise (third-party warnings, source-map lookups).
    const severe = errors.filter(
      (e) =>
        !/source\s*map/i.test(e) &&
        !/favicon/i.test(e) &&
        !/non-fatal/i.test(e)
    );
    expect(severe, 'severe console errors detected').toEqual([]);
  });

  test('responsive: layout still renders at 1280x800', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.waitForTimeout(800);

    // Portal-agnostic: assert page rendered real content at this viewport
    // size, not stuck on a blank/error screen.
    await expect(page).not.toHaveURL(/error|404|notfound/i);
    const visibleText = (await page.locator('body').innerText()).trim();
    expect(
      visibleText.length,
      'expected page body to render visible text at 1280x800 viewport'
    ).toBeGreaterThan(20);
  });
});
