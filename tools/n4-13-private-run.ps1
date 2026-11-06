# N4.13 strict native Swiss Ephemeris private 50-case validation.
# Windows PowerShell 5.1 safe: all executable source ASCII only.
# No Docker, no production deployment, no secrets, no JHora GUI needed.
[CmdletBinding()]
param()
$ErrorActionPreference='Stop'
$ProgressPreference='SilentlyContinue'
$src=Join-Path $PSScriptRoot 'N4_12_50_ORIGINAL_JHORA_SANITIZED_REFERENCE_PRIVATE.json'
if (-not (Test-Path -LiteralPath $src -PathType Leaf)) { throw 'N413_PRIVATE_REFERENCE_NOT_FOUND' }
$expected='5DCB07D6D71F68199AF97696E8AD3CA91493B30F4ABC41FDD51350C14E4FF992'
$actual=(Get-FileHash -Algorithm SHA256 -LiteralPath $src).Hash
if ($actual -ne $expected) { throw "N413_PRIVATE_REFERENCE_SHA_MISMATCH: $actual" }
foreach ($exe in @('git','node','npm')) {
  if (-not (Get-Command $exe -ErrorAction SilentlyContinue)) { throw "N413_MISSING_REQUIRED_TOOL=$exe" }
}
$nodeVersion=((& node -v) -replace '^v','').Split('.')[0]
if ([int]$nodeVersion -lt 22) { throw "N413_NODE_22_OR_NEWER_REQUIRED_FOUND=$nodeVersion" }
$parent=Join-Path $env:USERPROFILE 'galaxiora-n413-swieph-lab'
New-Item -ItemType Directory -Path $parent -Force | Out-Null
$stamp=Get-Date -Format 'yyyyMMdd_HHmmss_fff'
$run=Join-Path $parent "audit-$stamp"
New-Item -ItemType Directory -Path $run -Force | Out-Null
$repo=Join-Path $run 'source'
Write-Host '=== GALAXIORA N4.13 REAL NATIVE SWIEPH RESEARCH ==='
Write-Host "ORIGINAL_PRIVATE_REFERENCE_SHA256=$actual"
Write-Host "WORKDIR=$run"
Write-Host 'Cloning isolated N4 draft research branch; production is never touched.'
& git clone --depth 1 --single-branch --branch feat/n4-shodashavarga-foundation https://github.com/OverlorDDD/jyotish-studio.git $repo
if ($LASTEXITCODE -ne 0) { throw 'N413_GIT_CLONE_FAILED' }
Push-Location $repo
try {
  $head=(& git rev-parse HEAD).Trim()
  if ($LASTEXITCODE -ne 0 -or $head -notmatch '^[0-9a-f]{40}$') { throw 'N413_INVALID_GIT_HEAD' }
  Write-Host "N413_GIT_HEAD=$head"
  Write-Host 'Installing local dependencies for research only...'
  & npm install --no-audit --no-fund --no-package-lock
  if ($LASTEXITCODE -ne 0) { throw 'N413_LOCAL_NPM_INSTALL_FAILED' }
  $script=Join-Path $repo 'tools\n4-native-swieph-exact-profile.mjs'
  if (-not (Test-Path -LiteralPath $script)) { throw 'N413_NATIVE_GATE_FILE_ABSENT' }
  Write-Host 'Checking real native SWIEPH file-backed backend flags...'
  & node --experimental-strip-types $script --smoke
  if ($LASTEXITCODE -ne 0) { throw 'N413_SWIEPH_RETURNED_FLAGS_SMOKE_FAILED' }
  Write-Host 'Comparing all original JHora 50 cases, 500 physical points, 8000 signs...'
  $out=Join-Path $run 'N413_PRIVATE_NATIVE_SWIEPH_50_CASE_RESULT.json'
  & node --experimental-strip-types $script --reference $src --output $out
  $code=$LASTEXITCODE
  if (Test-Path -LiteralPath $out) {
    $result=Get-Content -LiteralPath $out -Raw | ConvertFrom-Json
    Write-Host "N413_PRIVATE_RESULT=$out"
    Write-Host "N413_STATUS=$($result.status)"
    Write-Host "N413_MATCHING_SIGNS=$($result.matchingVargaSigns)/$($result.checkedVargaSigns)"
    Write-Host "N413_ANGULAR_VIOLATIONS=$($result.angularViolations)"
  }
  if ($code -ne 0) { throw "N413_PRIVATE_NATIVE_GATE_FAILED_EXIT_CODE=$code; inspect $out" }
  Write-Host 'N413_PRIVATE_NATIVE_50_SOURCE_COMPARISON_PASS'
  Write-Host 'This is NOT a production deploy or all-N4 release certification.'
} finally { Pop-Location }
