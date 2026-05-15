# check-setup.ps1
# Verifies the local environment is ready to run the Sorigin AMS Solar automation suite (DA-1106).
# Usage: .\check-setup.ps1

$ErrorActionPreference = 'Continue'
$ok = $true

function Check-Step {
    param([string]$Label, [scriptblock]$Test, [string]$Fix)
    Write-Host -NoNewline "[ ... ] $Label"
    try {
        $result = & $Test
        if ($result) {
            Write-Host "`r[ OK  ] $Label" -ForegroundColor Green
        } else {
            Write-Host "`r[FAIL ] $Label" -ForegroundColor Red
            if ($Fix) { Write-Host "       Fix: $Fix" -ForegroundColor Yellow }
            $script:ok = $false
        }
    } catch {
        Write-Host "`r[FAIL ] $Label" -ForegroundColor Red
        if ($Fix) { Write-Host "       Fix: $Fix" -ForegroundColor Yellow }
        $script:ok = $false
    }
}

Write-Host ""
Write-Host "Sorigin AMS — Solar Automation Setup Check (DA-1106)" -ForegroundColor Cyan
Write-Host "------------------------------------------------------" -ForegroundColor Cyan

Check-Step "Node.js installed (>= 18)" {
    $v = (& node -v) -replace 'v',''
    [version]$v -ge [version]'18.0.0'
} "Install Node.js 18+ from https://nodejs.org"

Check-Step "npm available" {
    & npm -v | Out-Null
    $LASTEXITCODE -eq 0
} "Reinstall Node.js (npm ships with it)"

Check-Step "package.json present" {
    Test-Path .\package.json
} "Make sure you're running this script from the Solar/ folder"

Check-Step "node_modules installed" {
    Test-Path .\node_modules\@playwright\test
} "Run: npm install"

Check-Step "Playwright browsers installed" {
    $cache = "$env:USERPROFILE\AppData\Local\ms-playwright"
    (Test-Path $cache) -and ((Get-ChildItem $cache -Directory | Measure-Object).Count -gt 0)
} "Run: npm run install:browsers"

Check-Step ".env file present" {
    Test-Path .\.env
} "Run: copy .env.example .env  (then edit credentials)"

Check-Step ".env has TEST_USER_EMAIL" {
    (Get-Content .\.env -ErrorAction SilentlyContinue) -match '^TEST_USER_EMAIL=.+'
} "Edit .env and set TEST_USER_EMAIL=mangesh.kore@sorigin.co"

Check-Step ".env has TEST_USER_PASSWORD" {
    (Get-Content .\.env -ErrorAction SilentlyContinue) -match '^TEST_USER_PASSWORD=.+'
} "Edit .env and set TEST_USER_PASSWORD (provided in JIRA DA-1106)"

Check-Step "Can reach https://ams.sorigin.app" {
    try {
        $r = Invoke-WebRequest -Uri 'https://ams.sorigin.app/signin' -UseBasicParsing -TimeoutSec 10
        $r.StatusCode -ge 200 -and $r.StatusCode -lt 500
    } catch { $false }
} "Check VPN / firewall / proxy"

Write-Host ""
if ($ok) {
    Write-Host "All checks passed. You're ready to run:  npm run test:cross-browser" -ForegroundColor Green
    exit 0
} else {
    Write-Host "One or more checks failed. Fix the items above and rerun." -ForegroundColor Red
    exit 1
}
