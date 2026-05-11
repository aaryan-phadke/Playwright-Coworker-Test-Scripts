import { test, expect } from '@playwright/test';
import { AssetsPage } from '../pages/AssetsPage';
import { TicketsPage } from '../pages/TicketsPage';

/**
 * DA-1115 — Pagination validation
 *
 * Verifies that pagination controls (Next, page numbers) actually fetch the
 * next page of data and replace the visible rows.
 *
 * Strategy:
 *   1. Navigate to the list page (Assets, Tickets)
 *   2. Capture the text of the first visible row as a "page-1 fingerprint"
 *   3. Click the Next button (or page number "2")
 *   4. Wait, then capture the first row again
 *   5. Expect the fingerprint to differ — proves we got new data
 *
 * Portal-agnostic: tries Next button, role=button name=Next/2, and a generic
 * pagination container locator.
 *
 * Skips with a clear annotation if pagination isn't visible (e.g., only one
 * page of data exists), so DA-1115 isn't a false negative when the data set
 * is small.
 */
test.describe('DA-1115 — Pagination validation', () => {
  /** Returns the text of the first visible table/list row, or '' if none. */
  async function firstRowText(page: import('@playwright/test').Page): Promise<string> {
    const row = page
      .locator('table tbody tr:visible, [role="row"]:visible, [class*="card" i]:visible, [class*="item" i]:visible')
      .first();
    if (!(await row.isVisible().catch(() => false))) return '';
    return (await row.innerText().catch(() => '')).trim();
  }

  test('Assets: Next page button advances the data set', async ({ page }) => {
    await page.goto('/');
    const assets = new AssetsPage(page);
    await assets.open();
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.waitForTimeout(1500);

    const page1Fingerprint = await firstRowText(page);
    if (!page1Fingerprint) {
      test.skip(true, 'No rows visible on Assets — nothing to paginate');
    }

    // Find a Next/2 control. Many libraries use aria-label="next" or just ">".
    const nextCandidates = [
      page.getByRole('button', { name: /^next$/i }),
      page.getByRole('link', { name: /^next$/i }),
      page.getByRole('button', { name: /next page/i }),
      page.getByRole('button', { name: '2' }),
      page.locator('[aria-label*="next" i]:visible').first(),
      page.locator('button:has-text(">"):visible').first(),
    ];

    let nextBtn: import('@playwright/test').Locator | null = null;
    for (const c of nextCandidates) {
      const first = c.first();
      if (await first.isVisible().catch(() => false) && (await first.isEnabled().catch(() => false))) {
        nextBtn = first;
        break;
      }
    }

    if (!nextBtn) {
      test.skip(true, 'Pagination Next control not found (single-page data set?)');
    }

    await nextBtn!.click();
    await page.waitForTimeout(1500);

    const page2Fingerprint = await firstRowText(page);

    test.info().annotations.push({
      type: 'pagination',
      description: `Assets page1Row="${page1Fingerprint.slice(0, 60)}" page2Row="${page2Fingerprint.slice(0, 60)}"`,
    });

    expect(
      page1Fingerprint !== page2Fingerprint,
      'expected first-row text to change after clicking Next'
    ).toBeTruthy();
  });

  test('Tickets: Next page button advances the data set', async ({ page }) => {
    await page.goto('/');
    const tickets = new TicketsPage(page);
    await tickets.open();
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.waitForTimeout(1500);

    const page1Fingerprint = await firstRowText(page);
    if (!page1Fingerprint) {
      test.skip(true, 'No rows visible on Tickets — nothing to paginate');
    }

    const nextBtn = page
      .getByRole('button', { name: /^next$/i })
      .or(page.getByRole('link', { name: /^next$/i }))
      .or(page.locator('[aria-label*="next" i]:visible'))
      .first();

    if (!(await nextBtn.isVisible().catch(() => false))) {
      test.skip(true, 'Pagination Next control not found on Tickets');
    }

    await nextBtn.click();
    await page.waitForTimeout(1500);

    const page2Fingerprint = await firstRowText(page);
    test.info().annotations.push({
      type: 'pagination',
      description: `Tickets page1Row="${page1Fingerprint.slice(0, 60)}" page2Row="${page2Fingerprint.slice(0, 60)}"`,
    });

    expect(
      page1Fingerprint !== page2Fingerprint,
      'expected first-row text to change after clicking Next on Tickets'
    ).toBeTruthy();
  });
});
