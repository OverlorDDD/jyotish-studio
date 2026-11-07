# N4 RC: independently verify 12 NEW vargas, not already certified D1/D9/D10.
# No Docker, AWS, main branch, PR #120 merge, production deployment or user data.
[CmdletBinding()]
param([string]$ExpectedCommit='')
$ErrorActionPreference='Stop'
$branch='release/n4-natal-15-varga-rc-20261107'
$lab=Join-Path $env:USERPROFILE 'galaxiora-n4-rc-private-lab'
$run=Join-Path $lab ('new12-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'-'+$PID)
$checkout=Join-Path $run 'source'
$venv=Join-Path $run 'pyjhora-oracle-only'
$jsonPath=Join-Path $run 'N4_RC_NEW12_PYJHORA_INDEPENDENT_6000.json'
function Check([string]$stage){
 if($LASTEXITCODE -ne 0){throw ('N4RC_'+$stage+'_FAILED_EXIT_'+$LASTEXITCODE)}
}
try{
 foreach($exe in @('git','node','npm')){
  if(-not (Get-Command $exe -ErrorAction SilentlyContinue)){
   throw ('N4RC_REQUIRED_EXECUTABLE_MISSING_'+$exe)
  }
 }
 $root=(& git rev-parse --show-toplevel).Trim()
 Check 'GIT_ROOT'
 $remote=(& git -C $root remote get-url origin).Trim()
 Check 'ORIGIN'
 if($remote -notmatch '(^|[:/])OverlorDDD/jyotish-studio(\.git)?$'){
  throw 'N4RC_SOURCE_REPOSITORY_MISMATCH'
 }
 if(Get-Command py -ErrorAction SilentlyContinue){
  $python='py';$pythonArgs=@('-3')
 }elseif(Get-Command python -ErrorAction SilentlyContinue){
  $python='python';$pythonArgs=@()
 }else{
  throw 'N4RC_PYTHON3_REQUIRED_FOR_INDEPENDENT_PYJHORA'
 }
 & $python @pythonArgs -c "import sys; assert sys.version_info >= (3, 10)"
 Check 'PYTHON_VERSION'
 & git -C $root fetch origin $branch
 Check 'FETCH'
 $sha=(& git -C $root rev-parse ('origin/'+$branch)).Trim()
 Check 'HEAD'
 if($ExpectedCommit -and $sha -ne $ExpectedCommit){
  throw ('N4RC_HEAD_CHANGED_EXPECTED_'+$ExpectedCommit+'_ACTUAL_'+$sha)
 }
 New-Item -ItemType Directory -Force -Path $run | Out-Null
 & git -C $root worktree add --detach $checkout $sha
 Check 'ISOLATED_WORKTREE'
 Write-Host ('N4RC_COMMIT='+$sha) -ForegroundColor Cyan
 Write-Host ('N4RC_WORKSPACE='+$checkout)
 Push-Location $checkout
 try{
  $env:DATABASE_URL='postgresql://ci:ci@127.0.0.1:5433/n4_rc_local_isolated'
  $env:NEXT_PUBLIC_SITE_URL='https://galaxiora.example'
  $env:SITE_NOINDEX='0'
  $env:ALLOW_PYTHON_SWISSEPH='0'
  $env:QT_QPA_PLATFORM='offscreen'
  $env:PYTHONWARNINGS='ignore'
  Write-Host '=== N4 RC 12 NEW VARgas: prepare independent PyJHora ===' -ForegroundColor Cyan
  & $python @pythonArgs -m venv $venv
  Check 'CREATE_ORACLE_VENV'
  $oracle=Join-Path $venv 'Scripts\python.exe'
  if(-not (Test-Path -LiteralPath $oracle -PathType Leaf)){
   throw 'N4RC_ORACLE_VENV_PYTHON_NOT_CREATED'
  }
  & $oracle -m pip install --disable-pip-version-check --no-cache-dir 'PyJHora==4.8.7' 'pyswisseph' 'PyQt6' 'numpy' 'geocoder' 'geopy' 'pytz' 'timezonefinder' 'python-dateutil' 'certifi'
  Check 'INDEPENDENT_ORACLE_INSTALL'
  & $oracle -c "from importlib.metadata import version; assert version('PyJHora') == '4.8.7'; from jhora.horoscope.chart import charts"
  Check 'INDEPENDENT_ORACLE_VERSION'
  $env:N4_RC_PYTHON=$oracle
  Write-Host '=== N4 RC: 12 new cards x 50 x 10 against independent oracle ===' -ForegroundColor Cyan
  $jsonOutput=@(& node --experimental-strip-types tools/n4-rc-new12-pyjhora-compare.mjs)
  Check 'NEW12_EXTERNAL_REFERENCE_PARITY'
  $sourceJson=($jsonOutput | Where-Object {$_ -notmatch '^N4_RC_NEW12_SYMBOLIC_'}) -join [Environment]::NewLine
  $result=$sourceJson | ConvertFrom-Json
  if($result.status -ne 'N4_RC_NEW12_PYJHORA_INDEPENDENT_6000_OF_6000_PASS' -or
     $result.totalSigns -ne 6000 -or $result.matchedSigns -ne 6000 -or
     $result.totalPlanetHouses -ne 5400 -or $result.matchedPlanetHouses -ne 5400 -or
     $result.byDivision.Count -ne 12 -or
     $result.originalJHoraSameProfile50PhysicalCertified -ne $false -or
     $result.publicProductionReleaseAuthorized -ne $false){
   throw 'N4RC_NEW12_ORACLE_REPORT_NOT_CREDIBLE'
  }
  foreach($v in $result.byDivision){
   if($v.checked -ne 500 -or $v.signMatched -ne 500 -or $v.houseMatched -ne 450){
    throw ('N4RC_VARGA_D'+$v.division+'_INCOMPLETE')
   }
   Write-Host ('N4RC_D'+$v.division+'_INDEPENDENT_SIGN_PARITY='+$v.signMatched+'/500;HOUSES='+$v.houseMatched+'/450') -ForegroundColor Green
  }
  [System.IO.File]::WriteAllText($jsonPath,$sourceJson,[System.Text.UTF8Encoding]::new($false))
  Write-Host ('N4RC_NEW12_REPORT='+$jsonPath)
  Write-Host 'N4RC_NEW12_EXTERNAL_PYJHORA_6000_6000_PASS' -ForegroundColor Green
  Write-Host '=== Optional ORIGINAL JHora8 private 50: eleven shared NEW cards ===' -ForegroundColor Cyan
  $originalName='N4_12_50_ORIGINAL_JHORA_SANITIZED_REFERENCE_PRIVATE.json'
  $originals=@(
   (Join-Path $root ('tools\'+$originalName)),
   (Join-Path (Join-Path $env:USERPROFILE 'galaxiora-n414-private-lab') $originalName),
   (Join-Path 'E:\Downloads\N413PrivateAudit' $originalName)
  )
  $authentic=$null
  foreach($candidate in $originals){
   if(Test-Path -LiteralPath $candidate -PathType Leaf){
    $authentic=(Get-Item -LiteralPath $candidate).FullName
    break
   }
  }
  if($authentic){
   $originalOutput=@(& node --experimental-strip-types tools/n4-rc-original11-jhora50-local.mjs $authentic)
   Check 'ORIGINAL_JHORA_NEW11_PRIVATE'
   $source50=($originalOutput -join [Environment]::NewLine) | ConvertFrom-Json
   if($source50.status -ne 'N4_RC_ORIGINAL_JHORA8_11_NEW_SHARED_METHOD_5500_OF_5500_PASS' -or
      $source50.matchedSharedMethodSigns -ne 5500 -or
      $source50.checkedSharedMethodSigns -ne 5500 -or
      $source50.d2MethodDifferentOn -ne 420 -or
      $source50.claimsProductionLahiriPhysicalCertified -ne $false){
    throw 'N4RC_PRIVATE_JHORA11_SOURCE_FAILED'
   }
   $pathOriginal=Join-Path $run 'N4_RC_ORIGINAL11_METHOD_SCOPED_SUMMARY.json'
   [System.IO.File]::WriteAllText($pathOriginal,($originalOutput -join [Environment]::NewLine),
    [System.Text.UTF8Encoding]::new($false))
   Write-Host 'N4RC_ORIGINAL_JHORA_NEW11_SHARED_METHOD_5500_5500_PASS' -ForegroundColor Green
   Write-Host 'N4RC_D2_SOURCE_US_VS_PRODUCTION_SUN_MOON_420_500_DIFFER_EXPECTED' -ForegroundColor Yellow
  }else{
   Write-Host 'N4RC_ORIGINAL_JHORA_PRIVATE_REFERENCE_NOT_PRESENT_LOCAL_DIAGNOSTIC_SKIPPED' -ForegroundColor Yellow
  }
  Write-Host '=== N4 RC: 15-card API integrity and actual native Swiss ===' -ForegroundColor Cyan
  & npm install --no-audit --no-fund --no-package-lock
  Check 'NPM_INSTALL'
  & npm run db:generate
  Check 'PRISMA'
  & node --experimental-strip-types --test tools/n4-rc-contract.test.mjs tools/n4-rc-runtime-integration.test.mjs
  Check 'API_INTEGRATION_TESTS'
  Write-Host 'N4RC_API_AND_DST_TESTS_PASS' -ForegroundColor Green
  Write-Host '=== N4 RC: Core/NestJS/Next.js candidate build ===' -ForegroundColor Cyan
  & npm run build
  Check 'BUILD'
  Write-Host 'N4RC_BUILD_PASS' -ForegroundColor Green
  & node --experimental-strip-types tools/n4-rc-release-decision.mjs
  Check 'RELEASE_POLICY'
  Write-Host 'N4RC_NEW12_LOCAL_ENGINEERING_PASS' -ForegroundColor Green
  Write-Host 'N4RC_PRODUCTION_SAME_PROFILE_PHYSICAL_CERTIFICATION_BLOCKED_EXPECTED_NOT_A_FAILURE'
  Write-Host 'N4RC_NO_PRODUCTION_NO_MERGE_NO_DOCKER'
 }finally{Pop-Location}
}catch{
 Write-Host ('N4RC_NEW12_VERIFY_FAIL: '+$_.Exception.Message) -ForegroundColor Red
 Write-Host ('N4RC_DIAGNOSTICS_FOLDER='+$run)
 exit 1
}
