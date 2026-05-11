# ========================================================================
# Sorigin AMS Playwright Suite - Setup Check
# ========================================================================
# Run this in PowerShell from C:\Users\Aaryan.Phadke\OneDrive - Sorigin Group\Playwright Cowork Tests:
#     .\check-setup.ps1
#
# It verifies every prerequisite needed to run the test suite and tells
# you exactly what to fix if anything is missing. Safe to run any time.
# ========================================================================

$ErrorActionPreference = 'Continue'
$results = @()

function Write-Status {
    param([string]$Label, [string]$Status, [string]$Detail = '')
    $color = switch ($Status) {
        'OK'      { 'Green' }
        'WARN'    { 'Yellow' }
        'MISSING' { 'Red' }
        default   { 'Gray' }
    }
    $tag = "[{0,-7}]" -f $Status
    Write-Host $tag -ForegroundColor $color -NoNewline
    Write-Host " $Label" -NoNewline
    if ($Detail) {
        Write-Host "  -  $Detail" -ForegroundColor DarkGray
    } else {
        Write-Host ''
    }
    $script:results += [PSCustomObject]@{ Label = $Label; Status = $Status; Detail = $Detail }
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " Sorigin AMS Playwright - Setup Check" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# --- 1. PowerShell ----------------------------------------------------------
$psVer = $PSVersionTable.PSVersion.ToString()
Write-Status -Label "PowerShell" -Status "OK" -Detail "v$psVer"

# --- 2. Node.js -------------------------------------------------------------
$nodeOk = $false
try {
    $nodeVer = (& node -v 2>$null)
    if ($LASTEXITCODE -eq 0 -and $nodeVer) {
        $major = [int]($nodeVer -replace '^v(\d+)\..*', '$1')
        if ($major -ge 18) {
            Write-Status -Label "Node.js" -Status "OK" -Detail "$nodeVer (>=18 required)"
        } else {
            Write-Status -Label "Node.js" -Status "WARN" -Detail "$nodeVer (recommend Node 18+)"
        }
        $nodeOk = $true
    }
} catch {}
if (-not $nodeOk) {
    Write-Status -Label "Node.js" -Status "MISSING" -Detail "Install LTS from https://nodejs.org"
}

# --- 3. npm -----------------------------------------------------------------
$npmOk = $false
try {
    $npmVer = (& npm -v 2>$null)
    if ($LASTEXITCODE -eq 0 -and $npmVer) {
        Write-Status -Label "npm" -Status "OK" -Detail "v$npmVer"
        $npmOk = $true
    }
} catch {}
if (-not $npmOk) {
    Write-Status -Label "npm" -Status "MISSING" -Detail "Reinstall Node.js (npm comes bundled)"
}

# --- 4. Microsoft Edge ------------------------------------------------------
$edgePaths = @(
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe"
)
$edgeFound = $false
$edgePath = ''
foreach ($p in $edgePaths) {
    if (Test-Path $p) { $edgeFound = $true; $edgePath = $p; break }
}
if ($edgeFound) {
    Write-Status -Label "Microsoft Edge" -Status "OK" -Detail $edgePath
} else {
    Write-Status -Label "Microsoft Edge" -Status "WARN" -Detail "Not detected. Install from https://www.microsoft.com/edge"
}

# --- 5. Git -----------------------------------------------------------------
$gitOk = $false
try {
    $gitVer = (& git --version 2>$null)
    if ($LASTEXITCODE -eq 0 -and $gitVer) {
        Write-Status -Label "Git" -Status "OK" -Detail $gitVer
        $gitOk = $true
    }
} catch {}
if (-not $gitOk) {
    Write-Status -Label "Git" -Status "WARN" -Detail "Optional. Install from https://git-scm.com if you want to push to GitHub"
}

# --- 6. Internet - Playwright CDN -------------------------------------------
try {
    $r = Invoke-WebRequest -Uri "https://cdn.playwright.dev/" -Method Head -TimeoutSec 8 -UseBasicParsing -ErrorAction Stop
    Write-Status -Label "Reach cdn.playwright.dev" -Status "OK" -Detail "HTTP $($r.StatusCode)"
} catch {
    Write-Status -Label "Reach cdn.playwright.dev" -Status "WARN" -Detail "Cannot reach. Corporate proxy? Browser install will fail."
}

# --- 7. Internet - Sorigin portal -------------------------------------------
try {
    $r = Invoke-WebRequest -Uri "https://ams.sorigin.app/signin" -Method Head -TimeoutSec 8 -UseBasicParsing -ErrorAction Stop
    Write-Status -Label "Reach ams.sorigin.app" -Status "OK" -Detail "HTTP $($r.StatusCode)"
} catch {
    $code = $null
    if ($_.Exception.Response) { $code = $_.Exception.Response.StatusCode.value__ }
    if ($code) {
        Write-Status -Label "Reach ams.sorigin.app" -Status "OK" -Detail "HTTP $code (server reachable)"
    } else {
        Write-Status -Label "Reach ams.sorigin.app" -Status "WARN" -Detail "Cannot reach. VPN required? Tests will fail at login."
    }
}

# --- 8. Project files -------------------------------------------------------
$expectedFiles = @(
    'package.json',
    'playwright.config.ts',
    'tsconfig.json',
    '.env.example',
    'tests\auth.spec.ts',
    'pages\LoginPage.ts',
    'scripts\generate-docx-report.js'
)
$missing = @()
foreach ($f in $expectedFiles) {
    if (-not (Test-Path (Join-Path $PSScriptRoot $f))) { $missing += $f }
}
if ($missing.Count -eq 0) {
    Write-Status -Label "Project files" -Status "OK" -Detail "$($expectedFiles.Count) core files present"
} else {
    Write-Status -Label "Project files" -Status "MISSING" -Detail ("Missing: " + ($missing -join ', '))
}

# --- 9. node_modules --------------------------------------------------------
if (Test-Path (Join-Path $PSScriptRoot 'node_modules')) {
    Write-Status -Label "node_modules" -Status "OK" -Detail "Dependencies already installed"
} else {
    Write-Status -Label "node_modules" -Status "WARN" -Detail "Not installed yet. Run: npm install"
}

# --- 10. .env credentials ---------------------------------------------------
$envPath = Join-Path $PSScriptRoot '.env'
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw -ErrorAction SilentlyContinue
    if ($envContent -match 'PORTAL_PASSWORD=replace-with-password' -or $envContent -match 'PORTAL_PASSWORD=\s*$') {
        Write-Status -Label ".env credentials" -Status "WARN" -Detail "File exists but PORTAL_PASSWORD not filled in"
    } else {
        Write-Status -Label ".env credentials" -Status "OK" -Detail "Configured"
    }
} else {
    Write-Status -Label ".env credentials" -Status "WARN" -Detail "Not configured. Run: copy .env.example .env  then notepad .env"
}

# --- 11. Playwright browser binaries ----------------------------------------
$browserCache = "$env:USERPROFILE\AppData\Local\ms-playwright"
if (Test-Path $browserCache) {
    $browserDirs = Get-ChildItem $browserCache -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -notmatch 'screencast|.cache' }
    if ($browserDirs.Count -gt 0) {
        Write-Status -Label "Playwright browsers" -Status "OK" -Detail "$($browserDirs.Count) browser builds in cache"
    } else {
        Write-Status -Label "Playwright browsers" -Status "WARN" -Detail "Cache empty. Run: npx playwright install chromium firefox"
    }
} else {
    Write-Status -Label "Playwright browsers" -Status "WARN" -Detail "Not installed yet. Run: npx playwright install chromium firefox"
}

# --- Summary ----------------------------------------------------------------
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
$ok    = ($results | Where-Object { $_.Status -eq 'OK' }).Count
$warn  = ($results | Where-Object { $_.Status -eq 'WARN' }).Count
$miss  = ($results | Where-Object { $_.Status -eq 'MISSING' }).Count
Write-Host (" Summary: {0} OK | {1} warning | {2} missing" -f $ok, $warn, $miss)
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

if ($miss -gt 0) {
    Write-Host "BLOCKED - fix the MISSING items above before proceeding." -ForegroundColor Red
} elseif ($warn -gt 0) {
    Write-Host "READY (with caveats) - review the WARN items, then run:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "    npm install" -ForegroundColor White
    Write-Host "    npx playwright install chromium firefox" -ForegroundColor White
    Write-Host "    npx playwright install msedge" -ForegroundColor White
    Write-Host "    copy .env.example .env" -ForegroundColor White
    Write-Host "    notepad .env" -ForegroundColor White
    Write-Host "    npm run test:report" -ForegroundColor White
} else {
    Write-Host "READY - everything looks good. To run the full suite:" -ForegroundColor Green
    Write-Host ""
    Write-Host "    npm run test:report" -ForegroundColor White
}
Write-Host ""
