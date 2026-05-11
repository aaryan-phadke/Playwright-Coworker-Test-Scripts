/**
 * Reads test-results/results.json (Playwright's JSON reporter output) and
 * emits EXECUTION_REPORT.docx — a shareable Word doc with:
 *   - Cover header (timestamp, base URL, run id)
 *   - Executive summary table (per-browser pass/fail/skipped)
 *   - Per-module breakdown
 *   - Failure details (error messages, file:line)
 *
 * Run via:  npm run report:docx
 * Requires: a prior `npm run test:all` so results.json exists.
 */

const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  PageBreak,
  ImageRun,
} = require('docx');

const RESULTS_PATH = path.resolve(__dirname, '..', 'test-results', 'results.json');
const OUTPUT_PATH = path.resolve(__dirname, '..', 'EXECUTION_REPORT.docx');

const COLORS = {
  pass: '2E7D32',
  fail: 'C62828',
  skip: 'F9A825',
  header: '1565C0',
  headerBg: 'E3F2FD',
  zebra: 'F5F5F5',
};

/**
 * Strip ANSI color escape codes and any other control characters from text
 * before it goes into a docx. Word's XML parser rejects char codes like \x1b
 * (the ANSI escape character Playwright emits in error messages), so without
 * this the resulting .docx file refuses to open.
 */
function sanitize(s) {
  if (s == null) return '';
  return String(s)
    .replace(/\x1b\[[0-9;]*m/g, '')           // ANSI color sequences
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, ''); // other control chars
}

function loadResults() {
  if (!fs.existsSync(RESULTS_PATH)) {
    console.error(
      `\nNo results found at ${RESULTS_PATH}\n` +
        `Run \`npm run test:all\` first, then \`npm run report:docx\`.\n`
    );
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf8'));
}

/** Walk Playwright's nested suite tree into a flat array of test specs. */
function flattenSuites(suite, parentTitles = []) {
  const out = [];
  const titleChain = suite.title ? [...parentTitles, suite.title] : parentTitles;
  for (const child of suite.suites ?? []) {
    out.push(...flattenSuites(child, titleChain));
  }
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      const result = (test.results ?? [])[0] ?? {};
      const attachments = result.attachments ?? [];
      const screenshots = attachments
        .filter((a) => a.contentType === 'image/png' && a.path)
        .map((a) => a.path);
      out.push({
        file: sanitize(spec.file),
        moduleTitle: sanitize(titleChain[titleChain.length - 1] ?? path.basename(spec.file, '.spec.ts')),
        title: sanitize(spec.title),
        fullTitle: sanitize([...titleChain, spec.title].join(' › ')),
        project: sanitize(test.projectName),
        status: result.status ?? 'unknown',
        durationMs: result.duration ?? 0,
        error: result.error?.message ? sanitize(result.error.message) : null,
        location: sanitize(spec.line ? `${spec.file}:${spec.line}` : spec.file),
        screenshots,
      });
    }
  }
  return out;
}

function tally(tests) {
  const acc = { passed: 0, failed: 0, skipped: 0, flaky: 0, timedOut: 0, total: 0, durationMs: 0 };
  for (const t of tests) {
    acc.total += 1;
    acc.durationMs += t.durationMs;
    if (t.status === 'passed') acc.passed += 1;
    else if (t.status === 'failed') acc.failed += 1;
    else if (t.status === 'skipped') acc.skipped += 1;
    else if (t.status === 'flaky') acc.flaky += 1;
    else if (t.status === 'timedOut') acc.timedOut += 1;
  }
  return acc;
}

function formatDuration(ms) {
  if (!ms) return '—';
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.round((ms % 60_000) / 1000);
  return `${m}m ${s}s`;
}

// ---- Doc helpers ----------------------------------------------------------

function h(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: 240, after: 120 },
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, ...opts })],
    spacing: { after: 80 },
  });
}

function statusRun(status) {
  const map = {
    passed: { text: 'PASS', color: COLORS.pass },
    failed: { text: 'FAIL', color: COLORS.fail },
    skipped: { text: 'SKIP', color: COLORS.skip },
    timedOut: { text: 'TIMEOUT', color: COLORS.fail },
    flaky: { text: 'FLAKY', color: COLORS.skip },
  };
  const cfg = map[status] ?? { text: status?.toUpperCase() ?? '—', color: '424242' };
  return new TextRun({ text: cfg.text, color: cfg.color, bold: true });
}

const THIN = { style: BorderStyle.SINGLE, size: 4, color: 'BDBDBD' };
const ALL_BORDERS = { top: THIN, bottom: THIN, left: THIN, right: THIN, insideHorizontal: THIN, insideVertical: THIN };

function cell(content, opts = {}) {
  const children = Array.isArray(content) ? content : [new Paragraph({ children: [typeof content === 'string' ? new TextRun(content) : content] })];
  return new TableCell({
    children,
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.shade ? { type: ShadingType.CLEAR, color: 'auto', fill: opts.shade } : undefined,
  });
}

function headerCell(text, width) {
  return cell(
    [new Paragraph({ children: [new TextRun({ text, bold: true, color: 'FFFFFF' })] })],
    { width, shade: COLORS.header }
  );
}

function summaryTable(perBrowser) {
  const rows = [
    new TableRow({
      children: [
        headerCell('Browser', 18),
        headerCell('Pass', 12),
        headerCell('Fail', 12),
        headerCell('Skipped', 14),
        headerCell('Flaky', 12),
        headerCell('Total', 12),
        headerCell('Duration', 20),
      ],
    }),
  ];
  for (const [browser, t] of Object.entries(perBrowser)) {
    rows.push(
      new TableRow({
        children: [
          cell(browser),
          cell([new Paragraph({ children: [new TextRun({ text: String(t.passed), color: COLORS.pass, bold: true })] })]),
          cell([new Paragraph({ children: [new TextRun({ text: String(t.failed), color: COLORS.fail, bold: true })] })]),
          cell([new Paragraph({ children: [new TextRun({ text: String(t.skipped), color: COLORS.skip })] })]),
          cell(String(t.flaky)),
          cell(String(t.total)),
          cell(formatDuration(t.durationMs)),
        ],
      })
    );
  }
  return new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE }, borders: ALL_BORDERS });
}

/**
 * Read a PNG file from disk and return a Paragraph containing it sized to
 * fit page width (max 600 pt wide, aspect-preserved at 16:10 fallback).
 */
function imageParagraph(absPath, captionText = null) {
  if (!absPath || !fs.existsSync(absPath)) return null;
  let buf;
  try {
    buf = fs.readFileSync(absPath);
  } catch {
    return null;
  }
  const MAX_WIDTH = 600;
  const MAX_HEIGHT = 380;
  const children = [
    new ImageRun({
      data: buf,
      transformation: { width: MAX_WIDTH, height: MAX_HEIGHT },
    }),
  ];
  const para = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 60 },
    children,
  });
  if (!captionText) return [para];
  const caption = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [
      new TextRun({ text: captionText, italics: true, color: '616161', size: 18 }),
    ],
  });
  return [para, caption];
}

function detailTable(tests) {
  const rows = [
    new TableRow({
      children: [
        headerCell('Test', 50),
        headerCell('Browser', 15),
        headerCell('Status', 15),
        headerCell('Duration', 20),
      ],
    }),
  ];
  tests.forEach((t, i) => {
    rows.push(
      new TableRow({
        children: [
          cell([new Paragraph({ children: [new TextRun({ text: t.title, size: 18 })] })], { shade: i % 2 ? COLORS.zebra : undefined }),
          cell(t.project ?? '—', { shade: i % 2 ? COLORS.zebra : undefined }),
          cell([new Paragraph({ children: [statusRun(t.status)] })], { shade: i % 2 ? COLORS.zebra : undefined }),
          cell(formatDuration(t.durationMs), { shade: i % 2 ? COLORS.zebra : undefined }),
        ],
      })
    );
  });
  return new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE }, borders: ALL_BORDERS });
}

// ---- Main -----------------------------------------------------------------

function build() {
  const data = loadResults();
  const tests = flattenSuites(data);

  // Group: per-browser totals and per-module per-browser detail
  const perBrowser = {};
  const perModule = {};
  for (const t of tests) {
    perBrowser[t.project] ??= { passed: 0, failed: 0, skipped: 0, flaky: 0, timedOut: 0, total: 0, durationMs: 0 };
    const pb = perBrowser[t.project];
    pb.total += 1;
    pb.durationMs += t.durationMs;
    if (t.status === 'passed') pb.passed += 1;
    else if (t.status === 'failed') pb.failed += 1;
    else if (t.status === 'skipped') pb.skipped += 1;
    else if (t.status === 'flaky') pb.flaky += 1;
    else if (t.status === 'timedOut') pb.timedOut += 1;

    const moduleKey = path.basename(t.file, '.spec.ts');
    perModule[moduleKey] ??= [];
    perModule[moduleKey].push(t);
  }

  const overall = tally(tests);
  const failures = tests.filter((t) => t.status === 'failed' || t.status === 'timedOut');

  const children = [];

  // Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: 'Sorigin AMS Portal', bold: true, size: 48, color: COLORS.header })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({ text: 'Playwright Test Execution Report', size: 32, color: '424242' })],
    })
  );

  // Metadata
  const now = new Date();
  const startedAt = data.stats?.startTime ? new Date(data.stats.startTime) : null;
  children.push(
    p(`Generated: ${now.toLocaleString()}`, { italics: true, color: '616161' }),
    p(`Run started: ${startedAt ? startedAt.toLocaleString() : 'n/a'}`, { italics: true, color: '616161' }),
    p(`Wall-clock duration: ${formatDuration(data.stats?.duration ?? overall.durationMs)}`, { italics: true, color: '616161' }),
    p(`Base URL: ${process.env.BASE_URL ?? 'https://ams.sorigin.app'}`, { italics: true, color: '616161' })
  );

  // Headline
  const passRate = overall.total ? Math.round((overall.passed / overall.total) * 100) : 0;
  children.push(
    h('Headline'),
    new Paragraph({
      children: [
        new TextRun({ text: `${overall.passed} passed`, color: COLORS.pass, bold: true }),
        new TextRun({ text: `   ·   ` }),
        new TextRun({ text: `${overall.failed} failed`, color: COLORS.fail, bold: true }),
        new TextRun({ text: `   ·   ` }),
        new TextRun({ text: `${overall.skipped} skipped`, color: COLORS.skip, bold: true }),
        new TextRun({ text: `   ·   ` }),
        new TextRun({ text: `${overall.total} total tests`, color: '424242' }),
      ],
      spacing: { after: 120 },
    }),
    p(`Overall pass rate: ${passRate}%`)
  );

  // Per-browser summary
  children.push(h('Cross-browser summary', HeadingLevel.HEADING_2), summaryTable(perBrowser));

  // Per-module detail
  children.push(h('Results by module', HeadingLevel.HEADING_2));
  for (const [moduleKey, moduleTests] of Object.entries(perModule)) {
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 80 },
        children: [new TextRun({ text: moduleKey, bold: true, size: 24, color: COLORS.header })],
      }),
      detailTable(moduleTests)
    );
  }

  // Failures
  children.push(new Paragraph({ children: [new PageBreak()] }), h('Failure details', HeadingLevel.HEADING_2));
  if (failures.length === 0) {
    children.push(p('No failures or timeouts. All tests passed or were skipped.', { italics: true }));
  } else {
    for (const f of failures) {
      children.push(
        new Paragraph({
          spacing: { before: 200, after: 60 },
          children: [
            statusRun(f.status),
            new TextRun({ text: '   ' }),
            new TextRun({ text: f.fullTitle, bold: true }),
          ],
        }),
        p(`Browser: ${f.project}`, { color: '616161', italics: true }),
        p(`Location: ${f.location}`, { color: '616161', italics: true }),
        p(`Duration: ${formatDuration(f.durationMs)}`, { color: '616161', italics: true })
      );
      if (f.error) {
        const trimmed = f.error.length > 1500 ? f.error.slice(0, 1500) + '\n…(truncated)' : f.error;
        children.push(
          new Paragraph({
            spacing: { before: 60, after: 120 },
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'FFF3E0' },
            children: [new TextRun({ text: trimmed, font: 'Consolas', size: 18 })],
          })
        );
      }
      // Embed the failure screenshot if Playwright captured one.
      for (const shot of f.screenshots) {
        const abs = path.isAbsolute(shot) ? shot : path.resolve(__dirname, '..', shot);
        const paras = imageParagraph(abs, `Screenshot: ${path.basename(shot)}`);
        if (paras) children.push(...paras);
      }
    }
  }

  // Proof-of-pass screenshots — one per module to give reviewers visual
  // evidence the suite actually ran without bloating the doc with 60+ images.
  children.push(new Paragraph({ children: [new PageBreak()] }), h('Module proof screenshots', HeadingLevel.HEADING_2));
  let embeddedAny = false;
  for (const [moduleKey, moduleTests] of Object.entries(perModule)) {
    const passing = moduleTests.find((t) => t.status === 'passed' && t.screenshots.length > 0);
    if (!passing) continue;
    const shot = passing.screenshots[0];
    const abs = path.isAbsolute(shot) ? shot : path.resolve(__dirname, '..', shot);
    const paras = imageParagraph(abs, `${moduleKey} — ${passing.project} — ${passing.title}`);
    if (paras) {
      children.push(
        new Paragraph({
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: moduleKey, bold: true, size: 24, color: COLORS.header })],
        }),
        ...paras
      );
      embeddedAny = true;
    }
  }
  if (!embeddedAny) {
    children.push(p('No screenshots were captured. Run Playwright with screenshot: "on" in playwright.config.ts.', { italics: true }));
  }

  // Footer
  children.push(
    h('How this report was generated', HeadingLevel.HEADING_2),
    p(
      'Generated by scripts/generate-docx-report.js, which reads test-results/results.json (Playwright JSON reporter output). To regenerate: `npm run report:docx`. To re-run tests + regenerate in one step: `npm run test:report`.'
    )
  );

  const doc = new Document({
    creator: 'Sorigin Playwright Suite',
    title: 'AMS Portal Test Execution Report',
    description: 'Auto-generated test execution report',
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 22 } },
      },
    },
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}

build()
  .then((buf) => {
    fs.writeFileSync(OUTPUT_PATH, buf);
    const sizeKb = (buf.length / 1024).toFixed(1);
    console.log(`\n✓ Wrote ${OUTPUT_PATH} (${sizeKb} KB)\n`);
  })
  .catch((err) => {
    console.error('\nFailed to generate docx report:', err);
    process.exit(1);
  });
