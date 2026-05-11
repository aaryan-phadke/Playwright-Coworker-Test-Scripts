import { test, expect } from '@playwright/test';
import { AssetsPage } from '../pages/AssetsPage';
import { TicketsPage } from '../pages/TicketsPage';

/**
 * DA-1114 — Sorting validation
 *
 * Verifies that clicking a sortable column header reorders the table.
 *
 * Strategy:
 *   1. Navigate to the module (Assets, Tickets)
 *   2. Read the text of the first 3–5 rows into an "initial order" array
 *   3. Click a column header (or sort button)
 *   4. Read the rows again and compare — the order should change
 *
 * Portal-agnostic: doesn't assume column header is an exact element; tries
 * <th>, role=columnheader, button-in-header, and clickable-text patterns.
 *
 * Skips with a clear annotation if no sortable columns are detected — so the
 * report shows DA-1114 was attempted but not applicable, instead of failing.
 */
test.describe('DA-1114 — Sorting validation', () => {
  /** Read the first N visible row labels into a stable string array. */
  async function rowSnapshot(page: import('@playwright/test').Page, max = 5): Promise<string[]> {
    const rows = page.locator('table tbody tr:visible, [role="row"]:visible');
    const count = Math.min(await rows.count(), max);
    const out: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await rows.nth(i).innerText().catch(() => '')) || '';
      out.push(text.trim());
    }
    return out;
  }

  test('Assets: clicking a column header changes row order', async ({ page }) => {
    await page.goto('/');
    const assets = new AssetsPage(page);
    await assets.open();
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.waitForTimeout(1500);

    const initial = await rowSnapshot(page);
    if (initial.length < 2) {
      test.skip(true, 'Assets has fewer than 2 rows — cannot detect sort change');
    }

    // Find a sortable header. Try common patterns.
    const headerCandidates = [
      page.locator('th[role="columnheader"]:visible').first(),
      page.locator('th:visible button').first(),
      page.getByRole('columnheader').first(),
      page.locator('th:visible').first(),
    ];

    let clicked = false;
    for (const h of headerCandidates) {
      if (await h.isVisible().catch(() => false)) {
        await h.click().catch(() => {});
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      test.skip(true, 'No sortable column header detected on Assets');
    }

    await page.waitForTimeout(1200);
    const sorted = await rowSnapshot(page);

    test.info().annotations.push({
      type: 'sort',
      description: `Assets initial=[${initial.slice(0, 2).join(' | ')}] after=[${sorted.slice(0, 2).join(' | ')}]`,
    });

    expect(
      JSON.stringify(initial) !== JSON.stringify(sorted),
      'expected row order to change after clicking column header'
    ).toBeTruthy();
  });

  test('Tickets: clicking a column header changes row order', async ({ page }) => {
    await page.goto('/');
    const tickets = new TicketsPage(page);
    await tickets.open();
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.waitForTimeout(1500);

    const initial = await rowSnapshot(page);
    if (initial.length < 2) {
      test.skip(true, 'Tickets has fewer than 2 rows — cannot detect sort change');
    }

    const header = page
      .locator('th[role="columnheader"]:visible, th:visible button, th:visible')
      .first();

    if (!(await header.isVisible().catch(() => false))) {
      test.skip(true, 'No sortable header detected on Tickets');
    }

    await header.click().catch(() => {});
    await page.waitForTimeout(1200);

    const sorted = await rowSnapshot(page);
    test.info().annotations.push({
      type: 'sort',
      description: `Tickets initial=[${initial.slice(0, 2).join(' | ')}] after=[${sorted.slice(0, 2).join(' | ')}]`,
    });

    expect(
      JSON.stringify(initial) !== JSON.stringify(sorted),
      'expected Tickets row order to change after sort click'
    ).toBeTruthy();
  });
});
