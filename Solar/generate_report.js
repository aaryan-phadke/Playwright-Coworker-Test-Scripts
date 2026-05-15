// Generator for DA-1106 Test Automation Plan & Execution Report (Word .docx).
// Run with: node generate_report.js
// Output: DA-1106_Test_Automation_Report.docx

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel,
  BorderStyle, WidthType, ShadingType, PageNumber, PageBreak,
  TableOfContents, TabStopType, TabStopPosition,
} = require('docx');

// ---------- shared style helpers ----------
const COLOR_PRIMARY = '1F4E79';   // dark blue
const COLOR_ACCENT = '2E75B6';
const COLOR_BORDER = 'CCCCCC';
const COLOR_HEADER_BG = 'D5E8F0';
const COLOR_ZEBRA = 'F4F7FA';
const FONT = 'Calibri';

const PAGE_WIDTH = 12240;
const PAGE_HEIGHT = 15840;
const PAGE_MARGIN = 1440;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * PAGE_MARGIN; // 9360

const border = { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER };
const allBorders = { top: border, bottom: border, left: border, right: border };

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    ...opts,
    children: [new TextRun({ text, ...(opts.run || {}) })],
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, bold: true, size: 32, color: COLOR_PRIMARY, font: FONT })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 120 },
    children: [new TextRun({ text, bold: true, size: 26, color: COLOR_PRIMARY, font: FONT })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, size: 22, color: COLOR_ACCENT, font: FONT })],
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 300 },
    children: [new TextRun({ text, font: FONT, size: 22, ...(opts.run || {}) })],
    ...opts,
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, font: FONT, size: 22 })],
  });
}

function numbered(text) {
  return new Paragraph({
    numbering: { reference: 'numbers', level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, font: FONT, size: 22 })],
  });
}

function cell(text, opts = {}) {
  const { bold = false, header = false, width, color, zebra = false } = opts;
  return new TableCell({
    borders: allBorders,
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    shading: header
      ? { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR, color: 'auto' }
      : zebra
      ? { fill: COLOR_ZEBRA, type: ShadingType.CLEAR, color: 'auto' }
      : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        spacing: { after: 0 },
        children: [new TextRun({
          text: String(text ?? ''),
          bold: bold || header,
          font: FONT,
          size: 20,
          color: color || (header ? COLOR_PRIMARY : undefined),
        })],
      }),
    ],
  });
}

function buildTable(headers, rows, colWidths) {
  const total = colWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((t, i) => cell(t, { header: true, width: colWidths[i] })),
      }),
      ...rows.map((row, rIdx) =>
        new TableRow({
          children: row.map((t, i) =>
            cell(t, { width: colWidths[i], zebra: rIdx % 2 === 1 })
          ),
        })
      ),
    ],
  });
}

// ---------- content ----------
const today = new Date().toISOString().split('T')[0];

const cover = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 2400, after: 240 },
    children: [new TextRun({ text: 'Sorigin Energy — AMS', bold: true, size: 40, color: COLOR_PRIMARY, font: FONT })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [new TextRun({ text: 'Web Portal Automation — Test Plan & Execution Report', bold: true, size: 32, color: COLOR_ACCENT, font: FONT })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: 'JIRA Reference: DA-1106 (Parent: DA-1081 Solar Side Testing)', size: 22, font: FONT })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 600 },
    children: [new TextRun({ text: `Sprint: DA Sprint 12  •  Due: May 15, 2026  •  Report Date: ${today}`, size: 22, font: FONT })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: 'Prepared by QA Automation Team', size: 22, font: FONT, italics: true })],
  }),
  new Paragraph({ children: [new PageBreak()] }),
];

const tocSection = [
  h1('Table of Contents'),
  new TableOfContents('Contents', { hyperlink: true, headingStyleRange: '1-3' }),
  new Paragraph({ children: [new PageBreak()] }),
];

const introSection = [
  h1('1. Introduction'),
  body(
    'This document captures the test plan, execution approach, and reporting strategy for the ' +
    'Web Portal Automation Testing (Solar login) initiative tracked under JIRA DA-1106. ' +
    'The scope covers Playwright-driven automation of the Sorigin AMS web portal at https://ams.sorigin.app, ' +
    'including login flows, cross-browser validation, end-to-end regression after merge, role-based access ' +
    'validation, full regression, and automated report generation.'
  ),
  h2('1.1 Objectives'),
  bullet('Execute Playwright automation scripts against the AMS web portal sign-in and core modules.'),
  bullet('Validate browser compatibility across Chrome, Firefox, and Microsoft Edge.'),
  bullet('Run a full regression suite after each merge into the release branch.'),
  bullet('Generate and share interactive automation reports for stakeholders.'),
  bullet('Raise defects in JIRA for any test failure with full reproduction artifacts.'),
  h2('1.2 In Scope'),
  bullet('Authentication: positive and negative login scenarios.'),
  bullet('Dashboard smoke checks after successful login.'),
  bullet('Primary navigation modules (Sites, Reports, Settings, Users — where exposed).'),
  bullet('Role-based access permissions (admin, installer, viewer).'),
  bullet('Cross-browser parity on the three supported browsers.'),
  h2('1.3 Out of Scope'),
  bullet('Performance and load testing.'),
  bullet('Penetration / security testing.'),
  bullet('Mobile native applications (web responsive only, optional).'),
  bullet('Backend API contract tests (handled separately).'),
];

const acceptanceTable = buildTable(
  ['JIRA Subtask', 'Acceptance Criterion', 'Covered By', 'Status'],
  [
    ['DA-1128', 'Playwright execution for modified modules', 'tests/auth/login.spec.js, tests/auth/login-negative.spec.js', 'Automated'],
    ['DA-1129', 'Cross-browser validation (Chrome, Firefox, Edge)', 'tests/cross-browser/cross-browser.spec.js + playwright.config.js projects', 'Automated'],
    ['DA-1130', 'End-to-end regression testing after merge', 'tests/regression/dashboard-smoke.spec.js', 'Automated'],
    ['DA-1131', 'Generate and share automation reports', 'HTML + JUnit + JSON reporters in playwright.config.js', 'Automated'],
    ['DA-1271', 'Role-based access validation', 'tests/rbac/role-based-access.spec.js', 'Automated (pending role accounts)'],
    ['DA-1272', 'Full automation regression', 'tests/regression/full-regression.spec.js', 'Automated'],
    ['DA-1106', 'Raise defects for failures', 'Process documented in §8 of this report', 'Process defined'],
  ],
  [1560, 3400, 3000, 1400]
);

const acceptanceSection = [
  h1('2. Acceptance Criteria Traceability'),
  body('Each acceptance criterion in DA-1106 is mapped to a concrete test asset or process below.'),
  acceptanceTable,
];

const stackTable = buildTable(
  ['Component', 'Choice', 'Reason'],
  [
    ['Test framework', 'Playwright Test (@playwright/test ^1.45)', 'Built-in cross-browser support, auto-wait, traces, video, HTML reporter.'],
    ['Language', 'JavaScript (Node.js 18+)', 'Matches team preference per DA-1106 discussion; no build step.'],
    ['Pattern', 'Page Object Model', 'Encapsulates selectors and actions; keeps tests readable.'],
    ['Config / secrets', 'dotenv (.env)', 'Keeps credentials out of source control.'],
    ['Reporters', 'HTML, JUnit XML, JSON', 'Human review, CI ingestion, and custom dashboards.'],
    ['Browsers', 'Chromium, Firefox, Microsoft Edge', 'Covers the DA-1129 matrix.'],
    ['CI', 'GitHub Actions / Jenkins (recommended)', 'Run on each PR + nightly full regression.'],
  ],
  [2200, 3200, 3960]
);

const archSection = [
  h1('3. Technology Stack & Architecture'),
  stackTable,
  h2('3.1 Repository Layout'),
  body('The project is laid out as follows:'),
  body('├── package.json'),
  body('├── playwright.config.js'),
  body('├── .env.example'),
  body('├── fixtures/test-data.js'),
  body('├── pages/LoginPage.js, DashboardPage.js'),
  body('├── utils/helpers.js'),
  body('└── tests/'),
  body('     ├── auth/login.spec.js, login-negative.spec.js'),
  body('     ├── cross-browser/cross-browser.spec.js'),
  body('     ├── regression/dashboard-smoke.spec.js, full-regression.spec.js'),
  body('     └── rbac/role-based-access.spec.js'),
];

const envSection = [
  h1('4. Test Environment'),
  buildTable(
    ['Attribute', 'Value'],
    [
      ['Application URL', 'https://ams.sorigin.app/signin'],
      ['Test User Email', 'mangesh.kore@sorigin.co'],
      ['Test User Password', 'Stored in .env (TEST_USER_PASSWORD)'],
      ['Supported Browsers', 'Chrome (Chromium), Firefox, Microsoft Edge'],
      ['Runtime', 'Node.js 18 LTS or later'],
      ['OS', 'Windows 10/11, macOS 13+, Ubuntu 22.04+'],
      ['Network', 'HTTPS, outbound access to ams.sorigin.app'],
    ],
    [3000, 6360]
  ),
];

const testCasesTable = buildTable(
  ['Test ID', 'Description', 'Type', 'JIRA Link'],
  [
    ['TC-LOGIN-001', 'Sign-in page renders with email, password, and submit', 'Positive', 'DA-1128'],
    ['TC-LOGIN-002', 'Valid credentials log the user in', 'Positive', 'DA-1128'],
    ['TC-LOGIN-003', 'Session persists across page reload', 'Positive', 'DA-1128'],
    ['TC-LOGIN-004', 'Authenticated user can access base URL', 'Positive', 'DA-1128'],
    ['TC-LOGIN-N001', 'Empty form submission is blocked', 'Negative', 'DA-1128'],
    ['TC-LOGIN-N002', 'Invalid credentials show an error', 'Negative', 'DA-1128'],
    ['TC-LOGIN-N003', 'Malformed email is rejected', 'Negative', 'DA-1128'],
    ['TC-LOGIN-N004', 'Correct email + wrong password is rejected', 'Negative', 'DA-1128'],
    ['TC-LOGIN-N005', 'Password field masks input', 'Security', 'DA-1128'],
    ['TC-XB-001', 'Sign-in renders correctly per browser', 'Cross-browser', 'DA-1129'],
    ['TC-XB-002', 'Login succeeds per browser', 'Cross-browser', 'DA-1129'],
    ['TC-XB-003', 'No blocking console errors per browser', 'Cross-browser', 'DA-1129'],
    ['TC-SMK-001', 'Dashboard renders after login', 'Smoke', 'DA-1130'],
    ['TC-SMK-002', 'Primary navigation links present', 'Smoke', 'DA-1130'],
    ['TC-SMK-003', 'Logout returns user to /signin', 'Smoke', 'DA-1130'],
    ['TC-REG-001', 'Authenticated landing reachable', 'Regression', 'DA-1272'],
    ['TC-REG-002', 'Sites/Plants module opens', 'Regression', 'DA-1272'],
    ['TC-REG-003', 'Reports module opens', 'Regression', 'DA-1272'],
    ['TC-REG-004', 'Settings module opens', 'Regression', 'DA-1272'],
    ['TC-REG-005', 'Return to dashboard works', 'Regression', 'DA-1272'],
    ['TC-REG-006', 'Logout completes session', 'Regression', 'DA-1272'],
    ['TC-RBAC-admin-001', 'Admin sees all allowed modules', 'RBAC', 'DA-1271'],
    ['TC-RBAC-admin-002', 'Admin has no forbidden modules', 'RBAC', 'DA-1271'],
    ['TC-RBAC-installer-001', 'Installer sees allowed modules', 'RBAC', 'DA-1271'],
    ['TC-RBAC-installer-002', 'Installer cannot see Users/Settings', 'RBAC', 'DA-1271'],
    ['TC-RBAC-viewer-001', 'Viewer sees only Dashboard + Reports', 'RBAC', 'DA-1271'],
    ['TC-RBAC-viewer-002', 'Viewer cannot see Sites/Users/Settings', 'RBAC', 'DA-1271'],
  ],
  [2200, 4660, 1400, 1100]
);

const testCasesSection = [
  h1('5. Test Case Inventory'),
  body('Twenty-seven (27) automated test cases are organised across five suites.'),
  testCasesTable,
];

const executionSection = [
  h1('6. Execution Strategy'),
  h2('6.1 Run Commands'),
  numbered('npm install — install Node dependencies'),
  numbered('npm run install:browsers — download Chromium / Firefox / Edge'),
  numbered('cp .env.example .env and populate test credentials'),
  numbered('npm test — run every project, every test'),
  numbered('npm run test:cross-browser — DA-1129 matrix across three browsers'),
  numbered('npm run test:smoke — DA-1130 smoke after merge'),
  numbered('npm run test:regression — DA-1272 full regression'),
  numbered('npm run test:rbac — DA-1271 role validation'),
  numbered('npm run report — open HTML report'),
  h2('6.2 Recommended CI Schedule'),
  bullet('On every PR: smoke + cross-browser on Chrome only (fast feedback, ~3–5 minutes).'),
  bullet('On merge to main: full cross-browser regression (Chrome, Firefox, Edge).'),
  bullet('Nightly: full regression + RBAC suite, publish reports to shared artifact store.'),
];

const reportingSection = [
  h1('7. Reporting (DA-1131)'),
  body(
    'Three machine-friendly and human-friendly reports are produced by every run. The HTML report is the ' +
    'primary stakeholder artifact; JUnit and JSON outputs feed CI and dashboards.'
  ),
  buildTable(
    ['Reporter', 'Output Path', 'Purpose'],
    [
      ['HTML', 'playwright-report/index.html', 'Human review; embeds screenshots, video, and Playwright trace on failure'],
      ['JUnit XML', 'reports/junit-results.xml', 'CI ingestion (Jenkins, GitLab CI, Azure DevOps)'],
      ['JSON', 'reports/test-results.json', 'Custom dashboards, metrics extraction'],
      ['List (stdout)', 'console', 'Quick feedback while running locally'],
    ],
    [1600, 3360, 4400]
  ),
  h2('7.1 Artifacts on Failure'),
  bullet('Screenshot of the page at the moment of failure (test-results/.../test-failed-1.png).'),
  bullet('Video recording of the entire test execution.'),
  bullet('Playwright trace.zip — step-by-step DOM snapshots, network log, console.'),
  body('Open a trace with: npx playwright show-trace path/to/trace.zip'),
];

const defectSection = [
  h1('8. Defect Management'),
  body('When a test fails, the on-call QA engineer follows this workflow:'),
  numbered('Open the HTML report and identify the failing test ID (e.g., TC-LOGIN-N002).'),
  numbered('Inspect the screenshot, video, and trace.zip in test-results/.'),
  numbered('Reproduce manually if the failure may be environmental or flaky.'),
  numbered('If the failure is a real defect, file a JIRA bug under DA-1106 with: test ID, browser, build/commit SHA, reproduction steps, and attached screenshot + trace.'),
  numbered('Link the new bug to DA-1106 and mention the relevant subtask (DA-1128, DA-1271, etc.).'),
  numbered('If the failure is a test issue, raise a chore/task to update the test and link it back to DA-1106.'),
];

const riskTable = buildTable(
  ['Risk', 'Mitigation'],
  [
    ['UI selectors change frequently and break tests', 'Use role/label/data-testid selectors; partner with frontend team to add data-testid attributes to critical components.'],
    ['Role accounts (admin, installer, viewer) not provisioned', 'DA-1271 tests auto-skip when credentials are missing; track account provisioning as a blocker on DA-1271.'],
    ['Flaky network or environment causes false failures', 'Use Playwright auto-retry, CI-only retries=2, trace retain-on-failure to triage.'],
    ['Cross-browser parity issues on Edge', 'msedge project uses the installed Edge channel rather than Chromium-bundled to catch Edge-specific issues.'],
    ['Credentials leak via committed .env', '.gitignore excludes .env; only .env.example is committed.'],
  ],
  [3600, 5760]
);

const riskSection = [
  h1('9. Risks & Mitigations'),
  riskTable,
];

const nextSection = [
  h1('10. Next Steps'),
  numbered('Install dependencies and Playwright browsers on the QA machine and CI runner.'),
  numbered('Inspect the live DOM and replace fallback selectors with stable single selectors / data-testids.'),
  numbered('Request admin / installer / viewer role accounts from the AMS team to fully activate DA-1271.'),
  numbered('Wire the suite into the team CI pipeline using the JUnit reporter.'),
  numbered('Run the full regression after each merge and attach the HTML report to the JIRA ticket.'),
  numbered('Triage failures, file defects, and iterate until all suites are green on every browser.'),
];

const signOffSection = [
  h1('11. Sign-off'),
  buildTable(
    ['Role', 'Name', 'Date', 'Signature'],
    [
      ['Reporter (QA)', 'Harsh Sahu', '', ''],
      ['Assignee (Automation)', 'Aaryan Phadke', '', ''],
      ['QA Lead', '', '', ''],
      ['Engineering Manager', '', '', ''],
    ],
    [2400, 2400, 1800, 2760]
  ),
];

// ---------- assemble doc ----------
const doc = new Document({
  creator: 'QA Automation Team',
  title: 'DA-1106 Web Portal Automation — Test Plan & Execution Report',
  description: 'Test plan, execution strategy, and reporting for Sorigin AMS web portal automation.',
  styles: {
    default: {
      document: { run: { font: FONT, size: 22 } },
    },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: FONT, color: COLOR_PRIMARY },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: FONT, color: COLOR_PRIMARY },
        paragraph: { spacing: { before: 260, after: 120 }, outlineLevel: 1 },
      },
      {
        id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 22, bold: true, font: FONT, color: COLOR_ACCENT },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: 'numbers',
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
        margin: { top: PAGE_MARGIN, right: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_ACCENT, space: 4 } },
            children: [
              new TextRun({ text: 'DA-1106 — AMS Web Portal Automation', font: FONT, size: 18, color: COLOR_PRIMARY, bold: true }),
              new TextRun({ text: '\tSorigin Energy', font: FONT, size: 18, color: COLOR_PRIMARY }),
            ],
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
              new TextRun({ text: `Generated ${today}`, font: FONT, size: 18, color: '666666' }),
              new TextRun({ text: '\tPage ', font: FONT, size: 18, color: '666666' }),
              new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: '666666' }),
              new TextRun({ text: ' of ', font: FONT, size: 18, color: '666666' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 18, color: '666666' }),
            ],
          }),
        ],
      }),
    },
    children: [
      ...cover,
      ...tocSection,
      ...introSection,
      ...acceptanceSection,
      ...archSection,
      ...envSection,
      ...testCasesSection,
      ...executionSection,
      ...reportingSection,
      ...defectSection,
      ...riskSection,
      ...nextSection,
      ...signOffSection,
    ],
  }],
});

const out = path.join(__dirname, 'DA-1106_Test_Automation_Report.docx');
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log(`Wrote ${out} (${buf.length} bytes)`);
});
