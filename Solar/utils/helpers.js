// Shared test helpers.

/**
 * Wait until any of the given locators is visible. Useful when the AMS UI
 * sometimes shows a toast OR a banner OR an inline error.
 * @param {import('@playwright/test').Locator[]} locators
 * @param {number} timeoutMs
 */
async function waitForAny(locators, timeoutMs = 10_000) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    for (const loc of locators) {
      if (await loc.isVisible().catch(() => false)) return loc;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return null;
}

/**
 * Generate an ISO timestamp suitable for file names: 2026-05-13T10-22-04
 */
function fileTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').split('Z')[0];
}

module.exports = { waitForAny, fileTimestamp };
