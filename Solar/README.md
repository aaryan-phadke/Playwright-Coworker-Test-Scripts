# Sorigin AMS — Web Portal Automation (JIRA DA-1106)

Playwright (JavaScript) automation suite covering the Sorigin AMS web portal sign-in and core regression flows.

## Coverage map

| JIRA subtask | Area | Files |
|--------------|------|-------|
| DA-1128 | Playwright execution for modified modules | `tests/auth/*.spec.js` |
| DA-1129 | Cross-browser validation (Chrome / Firefox / Edge) | `tests/cross-browser/*.spec.js`, `playwright.config.js` projects |
| DA-1130 | End-to-end regression after merge | `tests/regression/dashboard-smoke.spec.js` |
| DA-1131 | Execution report generation | `reporter` block in `playwright.config.js` (HTML / JUnit / JSON) |
| DA-1271 | Role-based access validation | `tests/rbac/role-based-access.spec.js` |
| DA-1272 | Full automation regression | `tests/regression/full-regression.spec.js` |

## Project layout

```
.
├── package.json
├── playwright.config.js
├── .env.example
├── fixtures/
│   └── test-data.js
├── pages/
│   ├── LoginPage.js
│   └── DashboardPage.js
├── utils/
│   └── helpers.js
└── tests/
    ├── auth/
    │   ├── login.spec.js
    │   └── login-negative.spec.js
    ├── cross-browser/
    │   └── cross-browser.spec.js
    ├── regression/
    │   ├── dashboard-smoke.spec.js
    │   └── full-regression.spec.js
    └── rbac/
        └── role-based-access.spec.js
```

## Prerequisites

- Node.js 18 LTS or later
- npm 9 or later
- Network access to `https://ams.sorigin.app`

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers (Chrome, Firefox, Edge)
npm run install:browsers

# 3. Configure credentials
cp .env.example .env
# Edit .env and fill in test user credentials
```

## Running tests

```bash
# Run everything across all browsers
npm test

# Single browser
npm run test:chrome
npm run test:firefox
npm run test:edge

# DA-1129 — all three browsers
npm run test:cross-browser

# DA-1130 — smoke regression
npm run test:smoke

# DA-1272 — full regression
npm run test:regression

# DA-1271 — role-based access
npm run test:rbac

# Interactive debugging
npm run test:headed
npm run test:ui
npm run test:debug
```

## Reports (DA-1131)

After a run, three artifacts are produced:

| Format | Location | Purpose |
|--------|----------|---------|
| HTML   | `playwright-report/index.html` | Human-readable, includes screenshots/video/trace on failure |
| JUnit  | `reports/junit-results.xml`    | CI ingestion (Jenkins, GitLab, Azure DevOps, etc.) |
| JSON   | `reports/test-results.json`    | Custom dashboards or further automation |

Open the HTML report locally:

```bash
npm run report
```

Failure artifacts (screenshots, video, trace) live under `test-results/`.

## Raising defects (DA-1106 acceptance criterion)

When a test fails:

1. Open the HTML report, locate the failing test, and download the **trace.zip**.
2. View the trace with `npx playwright show-trace trace.zip`.
3. File a JIRA bug under DA-1106 with: failing test ID (e.g., `TC-LOGIN-N002`), browser/project, screenshot, trace attachment, and reproduction steps.

## Notes on selectors

Page Objects use **resilient locator chains** (`role`, `label`, `placeholder`, `type`, common class fallbacks). After the first execution against the live UI, replace these chains with the single most stable selector to make tests faster and clearer. Add `data-testid` attributes to AMS components where possible — that's the long-term right answer.

## Credentials

The default test user provided in DA-1106:

- Email: `mangesh.kore@sorigin.co`
- Password: `Mk@12345`

These are read from `.env` (see `.env.example`). Do **not** commit `.env`.
