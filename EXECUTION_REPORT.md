# Execution Report — Sorigin AMS Playwright Suite

**Generated:** 2026-05-08
**Repo target:** https://github.com/aaryan-phadke/Playwright-Coworker-Test-Scripts
**Local path:** `C:\Users\Aaryan.Phadke\OneDrive - Sorigin Group\Playwright Cowork Tests`

---

## What was delivered

| Artefact | Status |
|---|---|
| Playwright + TypeScript scaffold | Done |
| `playwright.config.ts` with chromium / firefox / msedge projects | Done |
| Global auth setup (login once, reuse storage state) | Done |
| Page-object classes for every Wind module | Done |
| 12 spec files covering 61 test cases × 3 browsers = **61 unique tests** | Done |
| `npm install` validated (7 packages, 0 vulnerabilities) | Done |
| TypeScript typecheck (`tsc --noEmit`) | **Passes** |
| Playwright `--list` confirms all tests are discoverable | **Passes** |
| Actual cross-browser execution | **Pending — must run on your machine** |

## Why I can't run the tests from here

Two sandbox constraints prevent me from doing the actual run:

1. **Playwright's browser CDN is blocked.** `cdn.playwright.dev` returns
   `403 Connection blocked by network allowlist`, so I can't download
   chromium / firefox binaries.
2. **`ams.sorigin.app` is also blocked** by my sandbox proxy
   (`X-Proxy-Error: blocked-by-allowlist`), so even if browsers were
   installed I couldn't reach the portal.
3. **MS Edge channel testing requires your installed Edge** — the channel
   uses the OS-installed Edge, which means it has to run on Windows where
   Edge is installed.

This is why the suite is set up to run on **your Windows machine**, where
Edge is already there and you have unrestricted network access.

## How to run it (5 minutes)

Open PowerShell in `C:\Users\Aaryan.Phadke\OneDrive - Sorigin Group\Playwright Cowork Tests`:

```powershell
# 1. Install Node deps (≈20s)
npm install

# 2. Install browser binaries (≈1–2 min, first time only)
npx playwright install chromium firefox
npx playwright install msedge

# 3. Configure credentials — DO NOT COMMIT this file
copy .env.example .env
# Open .env in Notepad and fill PORTAL_EMAIL + PORTAL_PASSWORD

# 4. Smoke run on Chromium first to verify selectors
npx playwright test --project=chromium tests/auth.spec.ts

# 5. Full cross-browser regression
npm run test:all

# 6. Open the HTML report
npm run report
```

## What you'll likely see on the first run

The selectors in `pages/*.ts` are **semantic guesses** — `getByLabel(/email/i)`,
`getByRole('button', { name: /sign in/i })`, etc. — because I never saw the
live DOM. Expect:

- **Auth tests**: high chance of passing if the signin form uses standard
  email/password inputs with reasonable labels. If they fail, run
  `npm run codegen`, click through the real form once, and paste the
  generated selectors into `pages/LoginPage.ts`.
- **Module nav tests**: depend on whether the side nav uses `<a>`,
  `<button>`, or a custom component with the module names. The `BasePage.openNav`
  helper tries 4 patterns; if all fail, codegen is again the fix.
- **Data-binding test**: heuristic — flags if no JSON APIs return data on
  overview load. Won't catch every bug but catches "API broke, UI stuck on
  skeleton".

## Subtask mapping (DA-1118 → DA-1121)

| Jira | Coverage |
|---|---|
| DA-1118 Playwright execution for modified modules | All 7 modules covered (Overview, GIS, Assets, Maintenance, Reports, Tickets, Notifications) |
| DA-1119 Cross-browser validation (Chrome, Firefox, Edge) | Three projects defined; `npm run test:all` runs all three |
| DA-1120 Full automation regression | 61 tests across functional / UI / acceptance / integration / data-binding |
| DA-1121 Execution report generation | HTML report at `playwright-report/index.html` after run; JUnit XML + JSON also emitted to `test-results/` |

## Pushing to GitHub

The repo `Playwright-Coworker-Test-Scripts` is currently empty. To push:

```powershell
cd "C:\Users\Aaryan.Phadke\OneDrive - Sorigin Group\Playwright Cowork Tests"
git init
git add .
git commit -m "Initial Playwright scaffold for Sorigin AMS portal"
git branch -M main
git remote add origin https://github.com/aaryan-phadke/Playwright-Coworker-Test-Scripts.git
git push -u origin main
```

`.gitignore` already excludes `node_modules`, `playwright-report`,
`test-results`, `playwright/.auth`, and `.env`, so credentials and binaries
won't be pushed.

## Known gaps & next steps

- **Selectors will need refinement** after the first run — use `npm run codegen`.
- **Unit testing** (which you mentioned) was not scaffolded here — Playwright
  is for E2E. For unit tests of frontend components, you'd use Vitest or
  Jest in the **frontend repo**, not this one. Let me know if you want me
  to set that up separately.
- **Visual regression** (pixel-diff snapshots) is not enabled by default.
  If you want it, I can add `await expect(page).toHaveScreenshot()` checks
  per module.
- **Test data setup/teardown** — currently relies on whatever data already
  exists in the portal. For a true regression suite, you'd seed test data
  via API hooks before runs.
