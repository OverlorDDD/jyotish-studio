# N4 RC offline/online Windows candidate verification, NO Docker/AWS/main changes.
# Run from the user's current repository: one PowerShell.exe -File invocation.
[CmdletBinding()]
param([string]$ExpectedCommit='')
$ErrorActionPreference='Stop'
$branch='release/n4-natal-15-varga-rc-20261107'
$repo='OverlorDDD/jyotish-studio'
$base=Join-Path $env:USERPROFILE 'galaxiora-n4-rc-private-lab'
$work=Join-Path $base ('n4-rc-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'-'+$PID)
$source=Join-Path $work 'source'
$report=Join-Path $work 'N4_RC_LAHIRI20_RESULT.json'
function Step([string]$label){
 if($LASTEXITCODE -ne 0){throw ('N4RC_'+$label+'_FAILED exit='+$LASTEXITCODE)}
}
try{
 foreach($exe in @('git','node','npm')){
  if(-not (Get-Command $exe -ErrorAction SilentlyContinue)){throw ('N4RC_REQUIRED_EXE_MISSING='+$exe)}
 }
 $root=(& git rev-parse --show-toplevel).Trim();Step 'SOURCE_ROOT'
 $origin=(& git -C $root remote get-url origin).Trim();Step 'SOURCE_ORIGIN'
 if($origin -notmatch '(^|[:/])OverlorDDD/jyotish-studio(\.git)?$'){throw 'N4RC_UNEXPECTED_SOURCE_REPOSITORY'}
 & git -C $root fetch origin $branch;Step 'FETCH'
 $head=(& git -C $root rev-parse ('origin/'+$branch)).Trim();Step 'HEAD'
 if($ExpectedCommit -and $head -ne $ExpectedCommit){throw ('N4RC_BRANCH_HEAD_CHANGED expected='+$ExpectedCommit+' actual='+$head)}
 New-Item -ItemType Directory -Force -Path $work | Out-Null
 & git -C $root worktree add --detach $source $head;Step 'WORKTREE'
 Write-Host ('N4RC_SOURCE_SHA='+$head)
 Write-Host ('N4RC_ISOLATED_WORKTREE='+$source)
 Push-Location $source
 try{
  $env:DATABASE_URL='postgresql://ci:ci@127.0.0.1:5433/n4_rc_verification'
  $env:NEXT_PUBLIC_SITE_URL='https://galaxiora.example'
  $env:SITE_NOINDEX='0'
  $env:ALLOW_PYTHON_SWISSEPH='0'
  Write-Host '=== N4 RC dependencies (no Docker) ===' -ForegroundColor Cyan
  & npm install --no-audit --no-fund;Step 'NPM_INSTALL'
  & npm run db:generate;Step 'PRISMA'
  Write-Host '=== N4 RC unit and negative security tests ===' -ForegroundColor Cyan
  & node --check tools/n4-rc-lahiri-physical-audit.mjs;Step 'SOURCE_CHECK'
  & node --experimental-strip-types --test tools/n4-rc-contract.test.mjs tools/n4-rc-lahiri-physical-audit.test.mjs;Step 'UNIT_TESTS'
  Write-Host 'N4RC_UNIT_TESTS_PASS' -ForegroundColor Green
  & node --experimental-strip-types --test tools/n4-rc-runtime-integration.test.mjs
  Step 'REAL_NATIVE_API_AND_DST'
  Write-Host 'N4RC_REAL_NATIVE_API_DST_INTEGRATION_PASS' -ForegroundColor Green
  Write-Host '=== N4 RC real original Lahiri SWIEPH 20-source diagnostic ===' -ForegroundColor Cyan
  $raw=@(& node --experimental-strip-types tools/n4-rc-lahiri-physical-audit.mjs)
  Step 'NATIVE_LAHIRI_20'
  $physical=($raw -join [Environment]::NewLine)|ConvertFrom-Json
  if($physical.status -ne 'N4_RC_ORIGINAL_LAHIRI_20_SOURCE_DIAGNOSTIC_COMPLETE' -or
     $physical.originalJHoraCases -ne 20 -or
     $physical.original50CaseExternalReleaseGatePassed -ne $false -or
     $physical.productionN4Approved -ne $false){
    throw 'N4RC_UNVERIFIABLE_LAHIRI_SOURCE_REPORT'
  }
  [System.IO.File]::WriteAllText($report,($raw -join [Environment]::NewLine),
    [System.Text.UTF8Encoding]::new($false))
  Write-Host ('N4RC_D1_MATCHES='+$physical.signs.D1+'/200')
  Write-Host ('N4RC_D9_MATCHES='+$physical.signs.D9+'/200')
  Write-Host ('N4RC_D10_MATCHES='+$physical.signs.D10+'/200')
  Write-Host ('N4RC_MOON_WITHIN_1_ARCSEC='+$physical.moonWithinOneArcsecond+'/20')
  Write-Host ('N4RC_LAGNA_WITHIN_1_ARCSEC='+$physical.lagnaWithinOneArcsecond+'/20')
  Write-Host ('N4RC_PRIVATE_SUMMARY='+$report)
  Write-Host 'N4RC_NATIVE_LAHIRI_DIAGNOSTIC_PASS_NOT_50_CERTIFICATE' -ForegroundColor Green
  Write-Host '=== N4 RC build (Core + Nest + Next) ===' -ForegroundColor Cyan
  & npm run build;Step 'MONOREPO_BUILD'
  Write-Host 'N4RC_MONOREPO_BUILD_PASS' -ForegroundColor Green
  & node --experimental-strip-types tools/n4-rc-release-decision.mjs
  Step 'RELEASE_DECISION'
  Write-Host 'N4RC_RC_LOCAL_ENGINEERING_CHECKS_PASS' -ForegroundColor Green
  Write-Host 'N4RC_PRODUCTION_RELEASE_BLOCKED_EXPECTED_50_JHORA_AND_CI_AND_OWNER'
  Write-Host 'N4RC_NO_DOCKER_NO_DEPLOY_NO_MERGE'
 } finally{Pop-Location}
} catch {
 Write-Host ('N4RC_VERIFICATION_FAILED: '+$_.Exception.Message) -ForegroundColor Red
 Write-Host ('N4RC_DIAGNOSTICS_DIR='+$work)
 exit 1
}
){throw 'N4RC_UNEXPECTED_SOURCE_REPOSITORY'}
 & git -C $root fetch origin $branch;Step 'FETCH'
 $head=(& git -C $root rev-parse ('origin/'+$branch)).Trim();Step 'HEAD'
 if($ExpectedCommit -and $head -ne $ExpectedCommit)throw ('N4RC_BRANCH_HEAD_CHANGED expected='+$ExpectedCommit+' actual='+$head)
 New-Item -ItemType Directory -Force -Path $work | Out-Null
 & git -C $root worktree add --detach $source $head;Step 'WORKTREE'
 Write-Host ('N4RC_SOURCE_SHA='+$head)
 Write-Host ('N4RC_ISOLATED_WORKTREE='+$source)
 Push-Location $source
 try{
  $env:DATABASE_URL='postgresql://ci:ci@127.0.0.1:5433/n4_rc_verification'
  $env:NEXT_PUBLIC_SITE_URL='https://galaxiora.example'
  $env:SITE_NOINDEX='0'
  $env:ALLOW_PYTHON_SWISSEPH='0'
  Write-Host '=== N4 RC dependencies (no Docker) ===' -ForegroundColor Cyan
  & npm install --no-audit --no-fund;Step 'NPM_INSTALL'
  & npm run db:generate;Step 'PRISMA'
  Write-Host '=== N4 RC unit and negative security tests ===' -ForegroundColor Cyan
  & node --check tools/n4-rc-lahiri-physical-audit.mjs;Step 'SOURCE_CHECK'
  & node --experimental-strip-types --test tools/n4-rc-contract.test.mjs tools/n4-rc-lahiri-physical-audit.test.mjs;Step 'UNIT_TESTS'
  Write-Host 'N4RC_UNIT_TESTS_PASS' -ForegroundColor Green
  & node --experimental-strip-types --test tools/n4-rc-runtime-integration.test.mjs
  Step 'REAL_NATIVE_API_AND_DST'
  Write-Host 'N4RC_REAL_NATIVE_API_DST_INTEGRATION_PASS' -ForegroundColor Green
  Write-Host '=== N4 RC real original Lahiri SWIEPH 20-source diagnostic ===' -ForegroundColor Cyan
  $raw=@(& node --experimental-strip-types tools/n4-rc-lahiri-physical-audit.mjs)
  Step 'NATIVE_LAHIRI_20'
  $physical=($raw -join [Environment]::NewLine)|ConvertFrom-Json
  if($physical.status -ne 'N4_RC_ORIGINAL_LAHIRI_20_SOURCE_DIAGNOSTIC_COMPLETE' -or
     $physical.originalJHoraCases -ne 20 -or
     $physical.original50CaseExternalReleaseGatePassed -ne $false -or
     $physical.productionN4Approved -ne $false){
    throw 'N4RC_UNVERIFIABLE_LAHIRI_SOURCE_REPORT'
  }
  [System.IO.File]::WriteAllText($report,($raw -join [Environment]::NewLine),
    [System.Text.UTF8Encoding]::new($false))
  Write-Host ('N4RC_D1_MATCHES='+$physical.signs.D1+'/200')
  Write-Host ('N4RC_D9_MATCHES='+$physical.signs.D9+'/200')
  Write-Host ('N4RC_D10_MATCHES='+$physical.signs.D10+'/200')
  Write-Host ('N4RC_MOON_WITHIN_1_ARCSEC='+$physical.moonWithinOneArcsecond+'/20')
  Write-Host ('N4RC_LAGNA_WITHIN_1_ARCSEC='+$physical.lagnaWithinOneArcsecond+'/20')
  Write-Host ('N4RC_PRIVATE_SUMMARY='+$report)
  Write-Host 'N4RC_NATIVE_LAHIRI_DIAGNOSTIC_PASS_NOT_50_CERTIFICATE' -ForegroundColor Green
  Write-Host '=== N4 RC build (Core + Nest + Next) ===' -ForegroundColor Cyan
  & npm run build;Step 'MONOREPO_BUILD'
  Write-Host 'N4RC_MONOREPO_BUILD_PASS' -ForegroundColor Green
  & node --experimental-strip-types tools/n4-rc-release-decision.mjs
  Step 'RELEASE_DECISION'
  Write-Host 'N4RC_RC_LOCAL_ENGINEERING_CHECKS_PASS' -ForegroundColor Green
  Write-Host 'N4RC_PRODUCTION_RELEASE_BLOCKED_EXPECTED_50_JHORA_AND_CI_AND_OWNER'
  Write-Host 'N4RC_NO_DOCKER_NO_DEPLOY_NO_MERGE'
 } finally{Pop-Location}
} catch {
 Write-Host ('N4RC_VERIFICATION_FAILED: '+$_.Exception.Message) -ForegroundColor Red
 Write-Host ('N4RC_DIAGNOSTICS_DIR='+$work)
 exit 1
}
