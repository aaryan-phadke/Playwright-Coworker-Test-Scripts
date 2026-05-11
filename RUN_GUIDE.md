# How to run the Playwright suite on Windows

A step-by-step walkthrough for running the test suite and generating the
shareable Word report. Assumes you've never used PowerShell before.

---

## One-time setup

### 1. Install Node.js (if not already installed)

1. Open https://nodejs.org/en/download in your browser.
2. Download the **LTS** Windows installer (.msi).
3. Run the installer, click Next through all defaults, finish.
4. To verify, press `Win + R`, type `powershell`, press Enter, and run:

   ```powershell
   node -v
   npm -v
   ```

   You should see two version numbers (e.g. `v20.11.0` and `10.2.4`).
   If you get "command not found", reboot and try again.

### 2. Open PowerShell in the project folder

The fastest way:

1. Open File Explorer and navigate to `C:\Users\Aaryan.Phadke\OneDrive - Sorigin Group\Playwright Cowork Tests`.
2. **Hold the `Shift` key** and **right-click** in the empty space of the
   folder window.
3. Choose **"Open PowerShell window here"** (Windows 10) or
   **"Open in Terminal"** (Windows 11).

A PowerShell window opens with the prompt already pointing at this folder.
You'll know it's right when the prompt reads:

```
PS C:\Users\Aaryan.Phadke\OneDrive - Sorigin Group\Playwright Cowork Tests>
```

### 3. Install dependencies (one time)

In the PowerShell window, paste these one at a time, pressing Enter after each:

```powershell
npm install
```

Takes ~30 seconds. You'll see lines streaming past, ending with something
like `added 25 packages, found 0 vulnerabilities`.

```powershell
npx playwright install chromium firefox
```

Takes 1–2 minutes. Downloads the chromium and firefox browsers Playwright
uses.

```powershell
npx playwright install msedge
```

Quick — just registers your installed Microsoft Edge with Playwright.

### 4. Add your portal credentials

Still in PowerShell:

```powershell
copy .env.example .env
notepad .env
```

Notepad opens. Replace the placeholder lines with the real values:

```
BASE_URL=https://ams.sorigin.app
PORTAL_EMAIL=mohit.mahajan@sorigin.co
PORTAL_PASSWORD=<your-password>
```

Save and close Notepad. The `.env` file is gitignored, so it won't get
pushed to GitHub.

> **Important:** rotate this password after testing if it's been shared
> anywhere unexpected.

---

## Running the tests

### Quick smoke test (just login, chromium only — ~30 seconds)

```powershell
npx playwright test --project=chromium tests/auth.spec.ts
```

Use this to verify the credentials and selectors work before running the
full regression. If this fails, the rest will too — fix it first.

### Full cross-browser regression + Word report (one command)

```powershell
npm run test:report
```

This runs all 61 tests across Chromium, Firefox, and Edge, then
auto-generates `EXECUTION_REPORT.docx` in the project folder.

Expect 5–15 minutes depending on your network. You'll see live progress
in the terminal:

```
  ✓  [chromium] › auth.spec.ts:10:7 › happy path... (2.3s)
  ✓  [firefox]  › auth.spec.ts:10:7 › happy path... (3.1s)
  ✘  [msedge]   › gis-view.spec.ts:5:7 › GIS map... (4.2s)
```

### Run pieces separately

```powershell
npm run test:chromium      # Chromium only
npm run test:firefox       # Firefox only
npm run test:edge          # Edge only
npm run test:all           # All three browsers (no docx)
npm run report:docx        # Regenerate just the Word doc from last run
npm run report             # Open the interactive HTML report
```

### What if a test fails the first time?

Selectors in `pages/*.ts` are educated guesses since the suite was
scaffolded without seeing the live portal. Common fixes:

1. **Capture the real selector** with codegen:

   ```powershell
   npm run codegen
   ```

   A browser opens at the signin page. Click through the flow you want to
   automate. Playwright records the code in a side panel.

2. Copy the recorded selector (the part inside `page.locator(...)`,
   `page.getByRole(...)`, etc.) into the matching page object file under
   `pages/`.

3. Re-run.

---

## Reading the results

After a run you'll find:

| File | Use |
|---|---|
| `EXECUTION_REPORT.docx` | **Share this.** Polished Word doc with summary tables and failure details. |
| `playwright-report/index.html` | Interactive HTML — click into any test to see screenshots, traces, video. Open with `npm run report`. |
| `test-results/junit.xml` | For CI tools (Jenkins, Azure DevOps). |
| `test-results/results.json` | Raw machine-readable data the docx is built from. |

Open `EXECUTION_REPORT.docx` by double-clicking it in File Explorer — it
opens in Word and is ready to attach to an email or paste into Teams.

A preview of the format is already in the folder as
`EXECUTION_REPORT_PREVIEW.docx` — open that first to see what the real
report will look like once you've run the suite.

---

## Pushing the code to GitHub

When you're ready to publish to your `Playwright-Coworker-Test-Scripts`
repo:

```powershell
git init
git add .
git commit -m "Initial Playwright scaffold for Sorigin AMS portal"
git branch -M main
git remote add origin https://github.com/aaryan-phadke/Playwright-Coworker-Test-Scripts.git
git push -u origin main
```

If git asks for credentials, sign in with your GitHub account in the popup
window.

---

## Troubleshooting

**"npm is not recognized as a command"** — Node.js isn't installed (or
your PATH didn't pick it up). Reboot after installing, or reinstall.

**`npx playwright install msedge` says "Edge channel not found"** —
Microsoft Edge isn't installed on this machine. Download it from
https://www.microsoft.com/edge.

**Tests all fail at the login step** — credentials are wrong or the email
field has unusual structure. Run `npm run codegen` to capture the real
selectors and paste them into `pages/LoginPage.ts`.

**Tests pass on chromium but fail on firefox/edge** — usually a timing
issue. Bump the timeout in `playwright.config.ts` or add an explicit wait
in the failing page object.

**The Word doc says "No results found"** — you have to run the tests
first (`npm run test:all`) before `npm run report:docx`. The `:report`
script does both in one command.

---

## Cleanup of leftover files

The folder may have these stragglers from earlier setup that you can
delete via File Explorer:

- `.git\` (hidden — enable "Hidden items" in File Explorer's View tab)
- `.write-test`, `write-test.txt`
- `Playwright-Coworker-Test-Scripts\` (empty subfolder)

These won't break anything if left in place but are noise.
