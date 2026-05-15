# Solar — Run Guide (DA-1106)

Step-by-step instructions to set up and run the Sorigin AMS Solar automation suite.

## 1. Prerequisites

- Windows 10/11, macOS 13+, or Ubuntu 22.04+
- Node.js 18 LTS or later — verify with `node -v`
- npm 9 or later — verify with `npm -v`
- Network access to `https://ams.sorigin.app`

## 2. First-time setup

Open a terminal in this `Solar` folder and run:

```bash
npm install
npm run install:browsers
```

`install:browsers` downloads the Chromium, Firefox, and Microsoft Edge binaries used by Playwright.

Then copy the env template and verify it has the credentials you want:

```bash
copy .env.example .env       # Windows
# or
cp .env.example .env         # macOS / Linux
```

Open `.env` and confirm:

```
BASE_URL=https://ams.sorigin.app
TEST_USER_EMAIL=mangesh.kore@sorigin.co
TEST_USER_PASSWORD=Mk@12345
```

If you have admin / installer / viewer accounts, fill those in too — the RBAC suite will activate automatically.

## 3. Smoke check

```powershell
.\check-setup.ps1
```

The script verifies Node, npm, the browsers, and the `.env` file. If anything is missing it prints a one-line fix.

## 4. Run tests

| Goal | Command |
|------|---------|
| Run everything across all browsers | `npm test` |
| Chrome only | `npm run test:chrome` |
| Firefox only | `npm run test:firefox` |
| Edge only | `npm run test:edge` |
| DA-1129 — all three browsers | `npm run test:cross-browser` |
| DA-1130 — smoke regression after merge | `npm run test:smoke` |
| DA-1272 — full automation regression | `npm run test:regression` |
| DA-1271 — role-based access | `npm run test:rbac` |
| Headed (watch it run) | `npm run test:headed` |
| Interactive UI mode | `npm run test:ui` |
| Step through with Playwright Inspector | `npm run test:debug` |

## 5. Reports (DA-1131)

After every run, three reports are written:

- `playwright-report/index.html` — interactive HTML report
- `reports/junit-results.xml` — for CI ingestion
- `reports/test-results.json` — for custom dashboards

Open the HTML report:

```bash
npm run report
```

## 6. Triage a failure → JIRA bug

1. Open the HTML report and click the failing test.
2. Download the `trace.zip` attached to the failure.
3. View it locally: `npx playwright show-trace trace.zip`
4. File a bug under DA-1106 with: test ID (e.g., `TC-LOGIN-N002`), browser, screenshot, trace, repro steps.
5. Link the bug to the relevant subtask (DA-1128, DA-1271, etc.).

## 7. Updating selectors

Page Objects in `pages/` use resilient selector chains (role / label / type / placeholder fallbacks). On the first run against the live UI:

1. Open the AMS sign-in and dashboard in Chrome DevTools.
2. Identify the stable selectors (prefer `data-testid`).
3. Replace the chains in `pages/LoginPage.js` and `pages/DashboardPage.js` with the single best selector.

## 8. Project layout

```
Solar/
├── README.md
├── RUN_GUIDE.md                          (this file)
├── DA-1106_Test_Automation_Report.docx
├── check-setup.ps1
├── package.json
├── playwright.config.js
├── .env.example
├── .gitignore
├── fixtures/
│   └── test-data.js
├── pages/
│   ├── LoginPage.js
│   └── DashboardPage.js
├── utils/
│   └── helpers.js
└── tests/
    ├── auth/
    │   ├── login.spec.js                  (DA-1128 positive)
    │   └── login-negative.spec.js         (DA-1128 negative)
    ├── cross-browser/
    │   └── cross-browser.spec.js          (DA-1129)
    ├── regression/
    │   ├── dashboard-smoke.spec.js        (DA-1130)
    │   └── full-regression.spec.js        (DA-1272)
    └── rbac/
        └── role-based-access.spec.js      (DA-1271)
```
