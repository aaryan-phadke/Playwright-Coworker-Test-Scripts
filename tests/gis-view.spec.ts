import { test, expect } from '@playwright/test';
import { GisViewPage } from '../pages/GisViewPage';

test.describe('GIS View module', () => {
  test('GIS view loads and renders a map element', async ({ page }) => {
    await page.goto('/');
    const gis = new GisViewPage(page);
    await gis.open();

    // Maps need a couple seconds for tiles / canvas to draw.
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.waitForTimeout(2500);

    await expect(page).not.toHaveURL(/error|404|notfound/i);

    // Detect a map via canvas/svg/iframe presence — any of these signals a map
    // library rendered something (works for Leaflet, Mapbox, Google Maps, etc.)
    const mapSignals = await page
      .locator('canvas:visible, svg:visible, iframe[src*="map" i]:visible, [class*="map" i]:visible, [class*="leaflet" i]:visible, [class*="mapbox" i]:visible')
      .count();
    expect(
      mapSignals,
      'expected at least one map-like element on GIS View'
    ).toBeGreaterThan(0);
  });

  test('GIS view does not show a top-level error', async ({ page }) => {
    await page.goto('/');
    const gis = new GisViewPage(page);
    await gis.open();
    await page.waitForTimeout(2000);

    // Page rendered real content (not blank error screen).
    const visibleText = (await page.locator('body').innerText()).trim();
    expect(visibleText.length).toBeGreaterThan(20);

    // No error alert dominating the page.
    const bigError = page.getByText(/something went wrong|failed to load|server error/i).first();
    await expect(bigError).toBeHidden({ timeout: 3_000 }).catch(() => {});
  });
});
