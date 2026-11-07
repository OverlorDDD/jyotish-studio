# N4.14 private verification. Run only from the Galaxiora git repository.
# Windows PowerShell 5.1-safe ASCII, fail-closed, no Docker, no AWS, no merge.
[CmdletBinding()]
param(
 [string]$PrivateReference = '',
 [switch]$SkipPrivateSwiss
)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$branch = 'feat/n4-shodashavarga-foundation'
$expectedSha = '5DCB07D6D71F68199AF97696E8AD3CA91493B30F4ABC41FDD51350C14E4FF992'
function NeedExit([string]$label) {
 if ($LASTEXITCODE -ne 0) { throw "$label (exit=$LASTEXITCODE)" }
}
try {
 foreach ($cmd in @('git','node','python')) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
   throw "N414_MISSING_TOOL=$cmd"
  }
 }
 $root = (& git rev-parse --show-toplevel).Trim()
 NeedExit 'N414_NOT_IN_GIT_REPOSITORY'
 $origin = (& git remote get-url origin).Trim()
 NeedExit 'N414_ORIGIN_NOT_CONFIGURED'
 if ($origin -notmatch '(^|[:/])OverlorDDD/jyotish-studio(\.git)?$') {
  throw "N414_UNEXPECTED_ORIGIN=$origin"
 }
 $major = [int](((& node -v) -replace '^v','').Split('.')[0])
 if ($major -lt 22) { throw "N414_NODE_22_OR_NEWER_REQUIRED" }
 if (-not $PrivateReference) {
  $PrivateReference=Join-Path $root 'tools\N4_12_50_ORIGINAL_JHORA_SANITIZED_REFERENCE_PRIVATE.json'
 }
 if (-not $SkipPrivateSwiss) {
  if (-not (Test-Path -LiteralPath $PrivateReference -PathType Leaf)) {
   throw "N414_PRIVATE_REFERENCE_MISSING=$PrivateReference"
  }
  $sourceSha=(Get-FileHash -LiteralPath $PrivateReference -Algorithm SHA256).Hash
  if ($sourceSha -ne $expectedSha) { throw 'N414_PRIVATE_REFERENCE_SHA256_MISMATCH' }
  if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
   throw 'N414_NPM_REQUIRED_FOR_NATIVE_SWIEPH'
  }
 }
 $lab = Join-Path $env:USERPROFILE 'galaxiora-n414-private-lab'
 New-Item -ItemType Directory -Force -Path $lab | Out-Null
 $run = Join-Path $lab ('audit-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
 New-Item -ItemType Directory -Force -Path $run | Out-Null
 $worktree=Join-Path $run 'source'
 Write-Host '=== N414 PINNED RESEARCH AND VERIFICATION ==='
 Write-Host "N414_WORKDIR=$run"
 & git fetch origin $branch
 NeedExit 'N414_FETCH_FAILED'
 & git worktree add --detach $worktree "origin/$branch"
 NeedExit 'N414_CREATE_ISOLATED_WORKTREE_FAILED'
 Push-Location $worktree
 try {
  $head = (& git rev-parse HEAD).Trim()
  NeedExit 'N414_GET_HEAD_FAILED'
  Write-Host "N414_GITHUB_HEAD=$head"
  & node --test tools/n4-14-time-d60.test.mjs tools/n4-14-regression-corpus.test.mjs tools/n4-14-sensitivity.test.mjs tools/n4-14-utc-sensitivity.test.mjs
  NeedExit 'N414_NODE_TESTS_FAILED'
  Write-Host 'N414_NODE_REGRESSION_TESTS_PASS'
  $venv = Join-Path $run 'py-venv'
  & python -m venv $venv
  NeedExit 'N414_PYTHON_VENV_FAILED'
  $py = Join-Path $venv 'Scripts\python.exe'
  if (-not (Test-Path -LiteralPath $py -PathType Leaf)) {
   throw 'N414_VENV_PYTHON_MISSING'
  }
  & $py -m pip install --disable-pip-version-check --no-input -r tools/n4-14-python-requirements.txt
  NeedExit 'N414_PINNED_TZDATA_INSTALL_FAILED'
  & $py tools/n4-14-python-zoneinfo.py
  NeedExit 'N414_PYTHON_ZONEINFO_TEST_FAILED'
  Write-Host 'N414_PYTHON_PINNED_TZDATA_PASS'
  if ($SkipPrivateSwiss) {
   Write-Host 'N414_PUBLIC_DIAGNOSTICS_PASS'
   Write-Host 'N414_PRIVATE_SWIEPH_NOT_RUN_EXPLICIT_SKIP'
  } else {
   Write-Host 'Installing native research dependencies in isolated worktree only.'
   & npm install --no-audit --no-fund --no-package-lock
   NeedExit 'N414_NATIVE_DEPENDENCY_INSTALL_FAILED'
   & node --experimental-strip-types tools/n4-14-native-private-run.mjs --smoke
   NeedExit 'N414_NATIVE_BACKEND_SMOKE_FAILED'
   $resultPath=Join-Path $run 'N414_PRIVATE_NATIVE_SWIEPH_50_CASE_GRID_RESULT.json'
   & node --experimental-strip-types tools/n4-14-native-private-run.mjs --reference $PrivateReference --output $resultPath
   NeedExit 'N414_PRIVATE_NATIVE_50_GRID_FAILED'
   if (-not (Test-Path -LiteralPath $resultPath -PathType Leaf)) {
    throw 'N414_RESULT_FILE_MISSING'
   }
   $report=Get-Content -LiteralPath $resultPath -Raw | ConvertFrom-Json
   if ($report.status -ne 'N414_PRIVATE_NATIVE_SWIEPH_50_CASE_GRID_DIAGNOSTIC_PASS' -or
       $report.originalSyntheticCases -ne 50 -or
       $report.sampledUtcInstants -ne 30050 -or
       $report.byRadius.Count -ne 5 -or
       $report.productionReleasePermitted -ne $false -or
       $report.fullN414CertificateIssued -ne $false) {
    throw 'N414_PRIVATE_RESULT_FAIL_CLOSED'
   }
   Write-Host "N414_PRIVATE_RESULT=$resultPath"
   foreach ($row in $report.byRadius) {
    Write-Host ("N414_RADIUS_" + $row.radiusSeconds + "S_ASC_CHANGED=" + $row.observedCasesWithAscendantSignChange + "/50")
   }
   Write-Host 'N414_PRIVATE_NATIVE_SWIEPH_50_CASE_GRID_DIAGNOSTIC_PASS'
  }
  Write-Host 'N414_HISTORICAL_TIME_AND_D60_CERTAINTY_PASS_NOT_ISSUED'
  Write-Host 'Production unchanged. No N4 flags enabled.'
 } finally {
  Pop-Location
 }
 exit 0
} catch {
 Write-Error ("N414_VERIFICATION_FAILED: " + $_.Exception.Message)
 exit 1
}
