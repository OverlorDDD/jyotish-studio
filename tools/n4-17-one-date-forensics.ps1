# N4.17 fast residual forensic — reuse the user's proven successful N4.16
# isolated Windows lab (already contains native @swisseph/node).
# NO docker, npm install, production edits, CI flags, or workspace-branch changes.
[CmdletBinding()]
param([string]$ReferenceWorktree='', [switch]$ValidateWorktreeOnly, [switch]$MoonPrecision)
$ErrorActionPreference='Stop'
$branch='feat/n4-shodashavarga-foundation'
$required=if($MoonPrecision){'8aa1d904b107a5bfde517b7af823b65217303076'}else{'ca2d443bb323011f26dae72170a001f85868e4e3'}
$lab=Join-Path $env:USERPROFILE 'galaxiora-n414-private-lab'
$defaultSource=Join-Path $lab 'math-method-20261107-134700-403\source'
$source=if($ReferenceWorktree){$ReferenceWorktree}else{$defaultSource}
$tmpFile=$null
function FailCode([string]$stage){if($LASTEXITCODE -ne 0){throw "$stage EXIT=$LASTEXITCODE"}}
try {
 foreach($exe in @('git','node')){
  if(-not(Get-Command $exe -ErrorAction SilentlyContinue)){
   throw "N417_REQUIRED_TOOL_NOT_FOUND=$exe"
  }
 }
 if(-not (Test-Path -LiteralPath $source -PathType Container)) {
  throw "N417_PREVIOUS_SUCCESSFUL_WORKTREE_NOT_FOUND=$source"
 }
 # Git for Windows typically returns C:/... while PowerShell returns C:\\...
 # Never test the two textual representations for equality.
 # Ask git whether $source IS the repo root; require the .git FILE that
 # "git worktree add --detach" creates (ordinary clones have .git directory).
 $inside = @(& git -C $source rev-parse --is-inside-work-tree)
 FailCode 'N417_GIT_WORKTREE_CHECK'
 if((($inside -join '')).Trim() -ne 'true'){
  throw 'N417_NOT_INSIDE_GIT_WORKTREE'
 }
 $prefix = @(& git -C $source rev-parse --show-prefix)
 FailCode 'N417_GIT_WORKTREE_ROOT_CHECK'
 if((($prefix -join '')).Trim().Length -ne 0){
  throw 'N417_SOURCE_MUST_BE_WORKTREE_ROOT'
 }
 $gitMarker = Join-Path $source '.git'
 if(-not (Test-Path -LiteralPath $gitMarker -PathType Leaf)){
  throw 'N417_NOT_LINKED_WORKTREE_GITFILE'
 }
 $branchName = @(& git -C $source rev-parse --abbrev-ref HEAD)
 FailCode 'N417_DETACHED_WORKTREE_CHECK'
 if((($branchName -join '')).Trim() -ne 'HEAD'){
  throw 'N417_EXPECTED_DETACHED_RESEARCH_WORKTREE'
 }
 Write-Host 'N417_WORKTREE_VALIDATION_PASS'
 if($ValidateWorktreeOnly){
  Write-Host 'N417_LINKED_WORKTREE_STRUCTURE_SELFTEST_PASS'
  return
 }
 $origin=(& git -C $source remote get-url origin).Trim()
 FailCode 'N417_GIT_ORIGIN_CHECK'
 if($origin -notmatch '(^|[:/])OverlorDDD/jyotish-studio(\.git)?$'){
  throw 'N417_UNEXPECTED_GITHUB_REPOSITORY'
 }
 $current=( & git -C $source rev-parse HEAD ).Trim()
 FailCode 'N417_PREVIOUS_HEAD_CHECK'
 if($current -ne 'd1c808f3b5380aaa013a25cbb081fa9f7ad300b7'){
  throw "N417_PREVIOUS_WORKTREE_REVISION_CHANGED=$current"
 }
 $native=Join-Path $source 'node_modules\@swisseph\node\ephemeris\sepl_18.se1'
 if(-not (Test-Path -LiteralPath $native -PathType Leaf)){
  throw 'N417_PREVIOUS_NATIVE_SWISS_DEPENDENCIES_NOT_FOUND'
 }
 & git fetch origin $branch
 FailCode 'N417_FETCH'
 & git merge-base --is-ancestor $required "origin/$branch"
 FailCode 'N417_REQUIRED_DIAGNOSTIC_COMMIT_NOT_FOUND'
 $remote="origin/feat/n4-shodashavarga-foundation:tools/n4-dasha-true-solar-native.mjs"
 $lines=@(& git show $remote)
 FailCode 'N417_SOURCE_DOWNLOAD'
 if($lines.Count -lt 100){throw 'N417_SOURCE_INCOMPLETE'}
 $tmpFile=Join-Path $source ('tools\n4-17-private-residual-'+[guid]::NewGuid().ToString('N')+'.mjs')
 [System.IO.File]::WriteAllText($tmpFile,([string]::Join([Environment]::NewLine,$lines)+[Environment]::NewLine),[System.Text.UTF8Encoding]::new($false))
 & node --check $tmpFile
 FailCode 'N418_DOWNLOADED_EXECUTABLE_CLI_SYNTAX_CHECK'
 Write-Host 'N418_DOWNLOADED_NODE_EXECUTABLE_SYNTAX_CHECK_PASS'
 Write-Host 'N417_REUSING_PRIOR_VALIDATED_NATIVE_SWISS_WORKTREE'
 Write-Host "N417_DIAGNOSTIC_HEAD=$required"
 Push-Location $source
 try {
  $arguments=@('--experimental-strip-types',$tmpFile)
  if($MoonPrecision){$arguments+='--moon-precision-jqa3-02'}
  $raw=@(& node @arguments)
  FailCode 'N417_NATIVE_JHORA20_SOLAR_AUDIT'
  $report=($raw -join [Environment]::NewLine) | ConvertFrom-Json
 } finally {Pop-Location}
 if($MoonPrecision){
  if($report.status -ne 'N418_SOURCE_PRINT_PRECISION_DAY_BOUNDARY_SPANNED_STRICT_SWIEPH_PASS' -or
     $report.originalSourceCase -ne 'JQA3-02' -or
     $report.sourceRoundingCanExplainSingleCalendarMismatch -ne $true -or
     $report.originalUnroundedJHoraMoonLongitudeKnown -ne $false -or
     $report.productionReleasePermitted -ne $false -or
     $report.originalJHoraYearDefinitionOption3Proven -ne $false){
   throw 'N418_SOURCE_MOON_PRINT_PRECISION_EVIDENCE_INVALID'
  }
  $alternatives=@($report.originalMoonPrintAlternatives)
  if($alternatives.Count -ne 3 -or
     $report.firstOrderHalfRoundingSeconds -lt 30 -or
     $report.firstOrderHalfRoundingSeconds -gt 36 -or
     $report.nativeSolarEphemerisCalls -lt 500){
   throw 'N418_SWIEPH_MOON_RESOLUTION_NOT_VERIFIED'
  }
  $dates=@($alternatives | ForEach-Object {$_.computedLocalCalendarDate} | Select-Object -Unique)
  if($dates -notcontains '2018-11-14' -or $dates -notcontains '2018-11-15'){
   throw 'N418_MOON_PRINT_INTERVAL_DOES_NOT_CROSS_ORIGINAL_CALENDAR_DAY'
  }
  $output=Join-Path $lab ('N418_JHORA02_PRINT_PRECISION_'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.json')
  [System.IO.File]::WriteAllText($output,($raw -join [Environment]::NewLine),[System.Text.UTF8Encoding]::new($false))
  Write-Host '=== N4.18 JHORA ORIGINAL SOURCE PRECISION ===' -ForegroundColor Cyan
  Write-Host ('N418_ORIGINAL_JHORA_PRINT_PRECISION_ARCSECONDS='+$report.originalJHoraMoonPrintedPrecisionArcseconds)
  Write-Host ('N418_FIRST_ORDER_HALF_ROUNDING_SECONDS='+$report.firstOrderHalfRoundingSeconds)
  Write-Host ('N418_NATIVE_SOURCE_INTERVAL_SPAN_SECONDS='+$report.nativeSourcePrintedIntervalSpanSeconds)
  foreach($alternative in $alternatives){
   Write-Host ('N418_MOON_PRINT_OFFSET_ARCSECONDS='+$alternative.printedSourceMoonOffsetArcseconds+
    ';localCalendarDate='+$alternative.computedLocalCalendarDate+
    ';localClock='+$alternative.computedOriginalFixedOffsetLocalClock)
  }
  Write-Host 'N418_SOURCE_PRINTED_MOON_ROUNDING_STRADDLES_2018_MIDNIGHT'
  Write-Host "N418_PRIVATE_REPORT=$output"
  Write-Host 'N418_STRICT_NATIVE_SWIEPH_SOURCE_PRECISION_DIAGNOSTIC_PASS' -ForegroundColor Green
  Write-Host 'N418_UNROUNDED_JHORA_AND_YEAR_OPTION_UNATTESTED_NO_PRODUCTION_SWITCH'
 } else {
 if($report.status -ne 'N4_JHORA20_NATIVE_SOLAR_LONGITUDE_DASHA_DIAGNOSTIC_COMPLETED' -or
   $report.originalLocalSiderealMinorResidualCount -ne 1 -or
   @($report.originalLocalSiderealMinorCalendarResiduals).Count -ne 1){
  throw 'N417_BASELINE_RESIDUAL_COUNT_CHANGED_OR_REPORT_INVALID'
 }
 $sidereal=@($report.comparison | Where-Object {
  $_.solarYearConvention -eq 'TRUE_SIDEREAL_SOLAR_LONGITUDE_360_DEGREES'
 })
 if($sidereal.Count -ne 1 -or
   $sidereal[0].sourceDateClockResults.ORIGINAL_CAPTURED_LOCAL.total.minorExact -ne 1619 -or
   $sidereal[0].sourceDateClockResults.ORIGINAL_CAPTURED_LOCAL.holdout.minorExact -ne 810) {
  throw 'N417_ORIGINAL_JHORA20_SIDEREAL_1619_OF_1620_NOT_REPRODUCED'
 }
 $one=$report.originalLocalSiderealMinorCalendarResiduals[0]
 if($one.level -ne 'antardasha' -or
    $one.sourceCaseIndex -lt 1 -or $one.sourceCaseIndex -gt 20 -or
    $one.deltaCalendarDays -eq 0){
  throw 'N417_ONE_DATE_SOURCE_RESIDUAL_INVALID'
 }
 $output=Join-Path $lab ('N417_ONE_DATE_FORENSICS_'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.json')
 [System.IO.File]::WriteAllText($output,($raw -join [Environment]::NewLine),[System.Text.UTF8Encoding]::new($false))
 Write-Host '=== N4.17 SINGLE-DATE RESULT ===' -ForegroundColor Cyan
 Write-Host ('N417_REFERENCE_SYNTHETIC_CASE=JQA3-'+$one.sourceCaseIndex.ToString('00'))
 Write-Host ('N417_TOTAL_MAHADASHA_DATE_MISMATCHES='+$report.originalLocalSiderealMajorResidualCount)
 Write-Host ('N417_MAHADASHA='+$one.majorLord)
 Write-Host ('N417_ANTARDASHA='+$one.minorLord)
 Write-Host ('N417_JHORA_CAPTURE_DATE='+$one.independentlyCapturedJHoraDate)
 Write-Host ('N417_CALCULATED_LOCAL_DATE='+$one.predictedOriginalFixedOffsetLocalDate)
 Write-Host ('N417_LOCAL_CLOCK='+$one.predictedOriginalFixedOffsetLocalHHMMSS)
 Write-Host ('N417_DAYS_DIFFERENCE='+$one.deltaCalendarDays)
 Write-Host ('N417_SECONDS_TO_LOCAL_MIDNIGHT='+$one.secondsToNearestLocalMidnight)
 Write-Host 'N417_HOLDOUT_CALENDAR_MATCH=810/810'
 Write-Host 'N417_ALL_CALENDAR_MATCH=1619/1620'
 Write-Host "N417_PRIVATE_DIAGNOSTIC_REPORT=$output"
 Write-Host 'N417_EXACT_ONE_DAY_DISCREPANCY_ISOLATED_DIAGNOSTIC_PASS' -ForegroundColor Green
 Write-Host 'N417_YEAR_OPTION_AND_SUBDAY_CERTIFICATION_STILL_PENDING'
 Write-Host 'N417_NO_PRODUCTION_OR_UI_AI_RELEASE'
 }
} catch {
 Write-Host ('N417_FAILED: '+$_.Exception.Message) -ForegroundColor Red
 exit 1
} finally {
 if($tmpFile -and (Test-Path -LiteralPath $tmpFile -PathType Leaf)){
  Remove-Item -LiteralPath $tmpFile -Force -ErrorAction SilentlyContinue
 }
}
