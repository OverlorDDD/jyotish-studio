# Natal N4 math-phase2 crosswalk. PowerShell 5.1 safe; no Docker/AWS/merge.
[CmdletBinding()]
param([string]$PrivateReference='', [string]$N414Report='')
$ErrorActionPreference='Stop'
$expected='5DCB07D6D71F68199AF97696E8AD3CA91493B30F4ABC41FDD51350C14E4FF992'
$branch='feat/n4-shodashavarga-foundation'
function CheckExit([string]$stage) { if($LASTEXITCODE -ne 0) { throw "$stage EXIT=$LASTEXITCODE" } }
try {
 foreach($tool in @('git','node','npm')) {
  if(-not (Get-Command $tool -ErrorAction SilentlyContinue)) { throw "N4_MISSING=$tool" }
 }
 $root=(& git rev-parse --show-toplevel).Trim()
 CheckExit 'N4_GIT_ROOT'
 $origin=(& git remote get-url origin).Trim()
 CheckExit 'N4_GIT_ORIGIN'
 if($origin -notmatch '(^|[:/])OverlorDDD/jyotish-studio(\.git)?$') { throw 'N4_WRONG_ORIGIN' }
 $lab=Join-Path $env:USERPROFILE 'galaxiora-n414-private-lab'
 if(-not (Test-Path -LiteralPath $lab -PathType Container)) { throw 'N4_N414_LAB_MISSING' }
 $filename='N4_12_50_ORIGINAL_JHORA_SANITIZED_REFERENCE_PRIVATE.json'
 $sources=@()
 if($PrivateReference) {
  $sources+=@($PrivateReference)
 } else {
  $sources+=@((Join-Path $root ('tools\' + $filename)))
  $sources+=@((Join-Path $lab $filename))
  foreach($folder in @('E:\Downloads\N413PrivateAudit','E:\Downloads\Galaxiora_N413_Private_SWIEPH_Audit',(Join-Path $env:USERPROFILE 'Downloads\N413PrivateAudit'))) {
   if(Test-Path -LiteralPath $folder -PathType Container) {
    $sources+=@(Get-ChildItem -LiteralPath $folder -Recurse -File -Filter $filename -ErrorAction SilentlyContinue | ForEach-Object {$_.FullName})
   }
  }
 }
 $source=$null
 foreach($path in ($sources | Select-Object -Unique)) {
  if(-not (Test-Path -LiteralPath $path -PathType Leaf)) { continue }
  $actual=(Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash
  if($actual -ne $expected) { throw 'N4_PRIVATE_SOURCE_SHA_MISMATCH' }
  $source=(Get-Item -LiteralPath $path).FullName
  break
 }
 if(-not $source) { throw 'N4_ORIGINAL_JHORA50_REFERENCE_NOT_FOUND' }
 $report=$null
 if($N414Report) {
  if(-not (Test-Path -LiteralPath $N414Report -PathType Leaf)) { throw 'N4_REPORT_PATH_NOT_FOUND' }
  $report=(Get-Item -LiteralPath $N414Report).FullName
 } else {
  $found=@()
  foreach($folder in @(Get-ChildItem -LiteralPath $lab -Directory -Filter 'audit-*')) {
   $path=Join-Path $folder.FullName 'N414_PRIVATE_NATIVE_SWIEPH_50_CASE_GRID_RESULT.json'
   if(-not (Test-Path -LiteralPath $path -PathType Leaf)) { continue }
   $data=Get-Content -LiteralPath $path -Raw | ConvertFrom-Json
   if($data.refinement.status -eq 'N414_OBSERVED_CROSSINGS_REFINED_DIAGNOSTIC_PASS') {
    $found+=@(Get-Item -LiteralPath $path)
   }
  }
  $latest=$found | Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
  if($latest) { $report=$latest.FullName }
 }
 if(-not $report) { throw 'N4_N414_REFINED_REPORT_NOT_FOUND' }
 Write-Host "N4_ORIGINAL_SOURCE_SHA256_VERIFIED=$expected"
 & git fetch origin $branch
 CheckExit 'N4_FETCH'
 $run=Join-Path $lab ('math-method-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
 New-Item -ItemType Directory -Path $run -Force | Out-Null
 $workspace=Join-Path $run 'source'
 & git worktree add --detach $workspace "origin/$branch"
 CheckExit 'N4_WORKTREE'
 Push-Location $workspace
 try {
  $head=(& git rev-parse HEAD).Trim()
  CheckExit 'N4_HEAD'
  Write-Host "N4_MATH_HEAD=$head"
  & node --experimental-strip-types --test tools/n4-d2-original-profile-crosswalk.test.mjs tools/n4-production-utc-transition-parity.test.mjs tools/n4-vimshottari-year-mode-audit.test.mjs tools/n4-math-integration-readiness.test.mjs tools/n4-exact-production-varga-methods.test.mjs tools/n4-original50-explicit-profile-gate.test.mjs tools/n4-jhora20-dasha-date-audit.test.mjs tools/n4-historical-birth-confidence.test.mjs tools/n4-dasha-year-mode-matrix.test.mjs tools/n4-dasha-true-solar-native.test.mjs
  CheckExit 'N4_METHOD_TESTS'
  Write-Host 'N4_MATH_METHOD_TESTS_PASS'
  & node --experimental-strip-types tools/n4-d2-original-profile-crosswalk.mjs $source
  CheckExit 'N4_D2_SOURCE_CROSSWALK'
  Write-Host 'N4_JHORA50_D2_METHOD_CROSSWALK_DIAGNOSTIC_PASS'
  & node --experimental-strip-types tools/n4-original50-explicit-profile-gate.mjs $source
  CheckExit 'N4_EXPLICIT_16_VARGA_ORIGINAL_JHORA_PARITY'
  Write-Host 'N4_JHORA50_EXPLICIT_16_VARGA_8000_PARITY_PASS'
  & node --experimental-strip-types tools/n4-jhora20-dasha-date-audit.mjs
  CheckExit 'N4_JHORA20_DASHA_CALENDAR_ARCHIVE_AUDIT'
  Write-Host 'N4_JHORA20_DASHA_CALENDAR_DIAGNOSTIC_COMPLETED'
  Write-Host '=== N4.16 FIXED-YEAR HOLDOUT MATRIX ==='
  $fixedRaw = @(& node --experimental-strip-types tools/n4-dasha-year-mode-matrix.mjs)
  CheckExit 'N4_DASHA_FIXED_YEAR_MATRIX_FAILED'
  $fixed = ($fixedRaw -join [Environment]::NewLine) | ConvertFrom-Json
  if($fixed.status -ne 'N4_JHORA20_YEAR_MODE_HOLDOUT_FORENSICS_COMPLETED' -or
     $fixed.actualProductionUtc.minorExact -ne 294 -or
     $fixed.candidatesByHoldoutScore.Count -ne 12) {
    throw 'N4_DASHA_FIXED_YEAR_MATRIX_INCOMPLETE'
  }
  $fixedPath=Join-Path $run 'N4_JHORA20_FIXED_YEAR_MODEL_MATRIX.json'
  [System.IO.File]::WriteAllText($fixedPath,($fixedRaw -join "`n"),[System.Text.UTF8Encoding]::new($false))
  Write-Host "N4_DASHA_FIXED_YEAR_MATRIX=$fixedPath"
  foreach($candidate in $fixed.candidatesByHoldoutScore | Select-Object -First 4) {
    Write-Host ("N4_FIXED_YEAR_CANDIDATE=" + $candidate.yearModel +
      ";clock=" + $candidate.clock + ";holdoutMinor=" +
      $candidate.holdout.minorExact + "/810")
  }
  Write-Host 'N4_DASHA_FIXED_YEAR_HOLDOUT_DIAGNOSTIC_PASS'
  Write-Host '=== N4.16 NATIVE SWIEPH TRUE-SOLAR YEAR FORENSICS ==='
  & npm install --no-audit --no-fund --no-package-lock
  CheckExit 'N4_NATIVE_DEPENDENCIES_INSTALL_FAILED'
  $solarRaw=@(& node --experimental-strip-types tools/n4-dasha-true-solar-native.mjs)
  CheckExit 'N4_NATIVE_SOLAR_YEAR_JHORA20_AUDIT_FAILED'
  $solar=($solarRaw -join [Environment]::NewLine) | ConvertFrom-Json
  if($solar.status -ne 'N4_JHORA20_NATIVE_SOLAR_LONGITUDE_DASHA_DIAGNOSTIC_COMPLETED' -or
    $solar.genuineOriginalSyntheticCases -ne 20 -or
    $solar.actualNativeSunEphemerisCalls -lt 1000 -or
    $solar.comparison.Count -ne 2 -or
    $solar.productionReleasePermitted -ne $false) {
    throw 'N4_NATIVE_SOLAR_AUDIT_INCOMPLETE'
  }
  $solarPath=Join-Path $run 'N4_JHORA20_TRUE_SOLAR_SWIEPH_MODE_MATRIX.json'
  [System.IO.File]::WriteAllText($solarPath,($solarRaw -join "`n"),[System.Text.UTF8Encoding]::new($false))
  Write-Host "N4_NATIVE_SWIEPH_SOLAR_MATRIX=$solarPath"
  foreach($entry in $solar.comparison) {
    foreach($clock in @('UTC','ORIGINAL_CAPTURED_LOCAL')) {
      $set=$entry.sourceDateClockResults.$clock
      Write-Host ("N4_TRUE_SOLAR_CANDIDATE=" + $entry.solarYearConvention +
        ";clock=" + $clock + ";holdoutMinor=" +
        $set.holdout.minorExact + "/810;totalMinor=" + $set.total.minorExact + "/1620")
    }
  }
  Write-Host 'N4_NATIVE_SWIEPH_TRUE_SOLAR_20_CASE_DIAGNOSTIC_PASS'


  & node --experimental-strip-types tools/n4-math-integration-readiness.mjs $report
  CheckExit 'N4_PROFILE_READINESS'
  Write-Host 'N4_NATAL_MATH_INTEGRATION_STILL_BLOCKED'
  Write-Host 'N4_NO_UI_AI_PRODUCTION_AUTHORIZED'
 } finally {
  Pop-Location
 }
 exit 0
} catch {
 Write-Host ("N4_MATH_PHASE2_FAILED: " + $_.Exception.Message) -ForegroundColor Red
 exit 1
}
