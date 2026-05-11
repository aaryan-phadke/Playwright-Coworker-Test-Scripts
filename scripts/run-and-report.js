/**
 * Cross-platform runner: executes the full Playwright test suite, then
 * generates the Word report regardless of whether tests passed or failed.
 *
 * Replaces the previous Bash-style "test:all || true && report:docx" npm
 * script, which broke on Windows because `true` isn't a Windows command.
 */
const { spawnSync } = require('child_process');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

console.log('\n=== Running cross-browser tests (chromium + firefox + msedge) ===\n');
spawnSync(
  'npx',
  ['playwright', 'test', '--project=chromium', '--project=firefox', '--project=msedge'],
  { stdio: 'inherit', shell: true, cwd: projectRoot }
);

console.log('\n=== Generating Word execution report ===\n');
const docxResult = spawnSync(
  'node',
  ['scripts/generate-docx-report.js'],
  { stdio: 'inherit', shell: true, cwd: projectRoot }
);

process.exit(docxResult.status ?? 0);
