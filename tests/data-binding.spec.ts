import { test, expect } from '@playwright/test';

/**
 * Verifies that the portal actually fetches data from APIs during overview
 * load — catches the "API broken, UI stuck on skeleton" class of bug without
 * needing to know specific endpoints or response shapes.
 */
test.describe('Data binding — backend ↔ frontend reflection', () => {
  test('overview triggers JSON API calls that return data', async ({ page }) => {
    const jsonResponses: { url: string; status: number; bytes: number }[] = [];

    page.on('response', async (response) => {
      const ct = response.headers()['content-type'] ?? '';
      if (!ct.includes('json')) return;
      try {
        const text = await response.text();
        jsonResponses.push({
          url: response.url(),
          status: response.status(),
          bytes: text.length,
        });
      } catch {
        /* ignore */
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // 1. Overview made at least one JSON API request.
    expect(
      jsonResponses.length,
      'overview load should trigger at least one JSON API call'
    ).toBeGreaterThan(0);

    // 2. At least one of those returned a 2xx with a non-trivial body.
    const okWithData = jsonResponses.filter(
      (r) => r.status >= 200 && r.status < 300 && r.bytes > 20
    );
    expect(
      okWithData.length,
      'expected at least one JSON API call to return 2xx with data'
    ).toBeGreaterThan(0);

    // Attach captured response summary as an annotation for the report.
    test.info().annotations.push({
      type: 'data-binding',
      description: `Captured ${jsonResponses.length} JSON responses (${okWithData.length} with 2xx + data)`,
    });
  });
});
