# Sorigin AMS Portal — Playwright Automation

End-to-end tests for the Wind login portal at https://ams.sorigin.app/signin.

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Install browser binaries (first time only)
npx playwright install chromium firefox
npx playwright install msedge   # uses your installed Microsoft Edge

# 3. Configure credentials (do NOT commit .env)
cp .env.example .env
# then edit .env and fill in PORTAL_EMAIL and PORTAL_PASSWORD

# 4. Run the full cross-browser regression
npm run test:all

# 5. Open the HTML report
npm run report
```

## Project layout

```
.
├── playwright.config.ts        Cross-browser projects (chromium, firefox, msedge)
├── tests/
│   ├── global.setup.ts             One-time login → saves auth state
│   ├── auth.spec.ts                Login happy-path + invalid creds
│   ├── overview.spec.ts            Overview / dashboard
│   ├── gis-view.spec.ts            GIS map view
│   ├── assets.spec.ts              Assets table/list
│   ├── maintenance.spec.ts
│   ├── reports.spec.ts
│   ├── tickets.spec.ts
│   ├── notifications.spec.ts
│   ├── ui-ux.spec.ts               Console errors, viewport
│   ├── data-binding.spec.ts        API JSON ↔ rendered text
│   ├── integration.spec.ts         Cross-module navigation         [DA-1112]
│   ├── filters.spec.ts             Filter UI changes results       [DA-1113]
│   ├── sorting.spec.ts             Column sort changes row order   [DA-1114]
│   ├── pagination.spec.ts          Next/page-2 fetches new data    [DA-1115]
│   └── role-based-access.spec.ts   Admin vs viewer sidebar diff    [DA-1116]
├── pages/                      Page-object classes
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   └── …one per module
└── utils/env.ts                Centralized env-var access
```

## Running a single browser

```bash
npm run test:chromium
npm run test:firefox
npm run test:edge
```

## Jira ticket coverage

| Parent | Subtask | Spec file(s) | Status |
|---|---|---|---|
| DA-1107 Web Portal Manual Testing | DA-1112 Page navigation and menu flow | `auth.spec.ts`, `integration.spec.ts`, all module specs | Covered |
| DA-1107 | DA-1113 Filters validation | `filters.spec.ts` | Covered |
| DA-1107 | DA-1114 Sorting validation | `sorting.spec.ts` | Covered |
| DA-1107 | DA-1115 Pagination validation | `pagination.spec.ts` | Covered |
| DA-1107 | DA-1116 Role-based access validation | `role-based-access.spec.ts` | Scaffolded — needs 2nd account in `.env` |
| DA-1107 | DA-1117 End-to-end regression after merge | `npm run test:report` | Covered (the whole suite) |
| DA-1108 Web Portal Automation Testing | DA-1118 Playwright execution for modified modules | All module specs × 3 browsers | Covered |
| DA-1108 | DA-1119 Cross-browser validation | `playwright.config.ts` projects: chromium, firefox, msedge | Covered |
| DA-1108 | DA-1120 Full automation regression | `npm run test:all` / `npm run test:report` | Covered |
| DA-1108 | DA-1121 Execution report generation | `playwright-report/index.html` + `EXECUTION_REPORT.docx` | Covered |

To enable DA-1116, add these to your `.env`:

```
PORTAL_ADMIN_EMAIL=admin@yourdomain.co
PORTAL_ADMIN_PASSWORD=...
PORTAL_VIEWER_EMAIL=viewer@yourdomain.co
PORTAL_VIEWER_PASSWORD=...
```

The role-based test will then unskip automatically.

## Refining selectors

The page objects use loose, semantic selectors (`getByLabel`, `getByRole`,
regex on text) so the suite runs end-to-end on a real portal even before you
fine-tune. To capture exact selectors from the live site:

```bash
npm run codegen
```

This opens the portal in a browser, lets you click around, and records
Playwright code you can paste into the relevant page object.

## Reports & artifacts

After a run you'll find:

- `playwright-report/index.html` — interactive HTML report
- `test-results/` — traces, screenshots, videos for failed tests
- `test-results/junit.xml` — JUnit XML for CI integration
- `test-results/results.json` — machine-readable results

## CI

`process.env.CI=true` enables retries (×2) and a 2-worker concurrency cap.

## Known limitations of this initial scaffold

This suite was scaffolded without access to the portal's live DOM. Expect to
refine selectors in `pages/*.ts` after the first run — Playwright's
`codegen` is the fastest way. The data-binding test uses heuristics and is
meant to flag obvious regressions, not validate every API contract.
