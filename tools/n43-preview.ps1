# N4.4 LOCAL: real Swiss Ephemeris + Classical Reader 8 + optional cloud AI; NO Docker/DB/AWS.
# Run from the independent preview folder: powershell -ExecutionPolicy Bypass -File .\tools\n43-preview.ps1
[CmdletBinding()]
param([switch]$SkipGitPull,[switch]$ReaderOnly)
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $root
$branch='feat/n4-d60-certified-precision-20261107'
function AssertExit([string]$where){if($LASTEXITCODE -ne 0){throw "$where failed (exit $LASTEXITCODE)"}}
function PortUsed([int]$port){
 $client=[System.Net.Sockets.TcpClient]::new()
 try {
  $async=$client.BeginConnect('127.0.0.1',$port,$null,$null)
  if(-not $async.AsyncWaitHandle.WaitOne(450)){return $false}
  try{$client.EndConnect($async);return $true}catch{return $false}
 }finally{$client.Close()}
}
if(-not (Get-Command git -ErrorAction SilentlyContinue)){throw 'Install Git before N4.3 preview'}
if(-not (Get-Command node -ErrorAction SilentlyContinue)){throw 'Node.js 24 is required'}
if(-not (Get-Command npm -ErrorAction SilentlyContinue)){throw 'npm is required'}
$major=[int]((node -p 'process.versions.node').Trim().Split('.')[0])
if($major -lt 24){throw 'N4.3 local preview requires Node.js 24 or newer'}
$actual=(git branch --show-current).Trim()
AssertExit 'Git branch inspection'
if($actual -ne $branch){throw "Wrong branch: $actual; required $branch. Do not switch the production checkout."}
if(-not $SkipGitPull){
 # Windows Git automatic pack cleanup can hang on locked .idx files.
 # Fetch with automatic maintenance disabled, then fast-forward only.
 git config --local gc.auto 0
 AssertExit 'Disable automatic Git gc'
 git config --local maintenance.auto false
 AssertExit 'Disable automatic Git maintenance'
 git -c gc.auto=0 -c maintenance.auto=false fetch --no-auto-gc --no-tags origin $branch
 AssertExit 'Git fetch without auto gc'
 git -c gc.auto=0 -c maintenance.auto=false merge --ff-only "origin/$branch"
 AssertExit 'Safe Git fast-forward'
}
if(-not (Test-Path -LiteralPath '.\node_modules\next\dist\bin\next' -PathType Leaf)){
 Write-Host 'Installing missing npm dependencies (no package lock rewrite)...' -ForegroundColor Cyan
 npm install --no-audit --no-fund --no-package-lock
 AssertExit 'npm install'
}
if(-not (Test-Path -LiteralPath '.\node_modules\@swisseph\node' -PathType Container)){
 throw 'Swiss Ephemeris dependency missing. Run npm install --no-package-lock, then retry.'
}
# A package directory alone does not prove the native Windows addon can load.
& node --experimental-strip-types -e "import('@swisseph/node').then(m=>{ if(!m.julianDay) process.exit(2) }).catch(()=>process.exit(2))"
AssertExit 'Native Swiss Ephemeris Windows addon'
if((PortUsed 3000) -or (PortUsed 4000)){
 throw 'Ports 3000/4000 are already in use. Stop old Next/Nest terminals with Ctrl+C. Preview must never show an outdated server.'
}
$envPath=Join-Path $root '.env'
if(-not (Test-Path -LiteralPath $envPath)){
 $text=@'
SITE_NOINDEX=1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
INTERNAL_API_ORIGIN=http://127.0.0.1:4000
AI_MODE=free
HTTP_ACCESS_LOG=0
'@
 [System.IO.File]::WriteAllText($envPath,$text,[System.Text.UTF8Encoding]::new($false))
 Write-Host 'Created safe local .env (no database, no cloud keys).' -ForegroundColor Green
}else{
 Write-Host 'Keeping existing .env unchanged; no secret values will be printed.' -ForegroundColor Yellow
}
$env:PORT='4000'
$env:WEB_PORT='3000'
# Explicit process-local overrides prevent an existing .env from targeting production API or enabling public indexability.
$env:INTERNAL_API_ORIGIN='http://127.0.0.1:4000'
$env:NEXT_PUBLIC_SITE_URL='http://localhost:3000'
$env:SITE_NOINDEX='1'
$env:AI_MODE=if($ReaderOnly){'off'}else{'free'}
$env:GALAXIORA_READER_ONLY=if($ReaderOnly){'1'}else{'0'}
if(-not $ReaderOnly -and -not $env:GEMINI_API_KEY -and -not $env:GROQ_API_KEY -and -not $env:OPENROUTER_API_KEY){
 $choice=Read-Host 'Optional: test LIVE Gemini AI? Enter Y (you supply your own key) or N (Reader-only)'
 if($choice -match '^[Yy]$'){
  $confirm=Read-Host 'Have you verified your Gemini key has a free-tier quota and you agree to one live request? (Y/N)'
  if($confirm -match '^[Yy]$'){
   $secure=Read-Host 'Paste Gemini API key (input hidden; not saved to a file)' -AsSecureString
   $ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
   try{$env:GEMINI_API_KEY=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)}
   finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)}
   if([string]::IsNullOrWhiteSpace($env:GEMINI_API_KEY)){throw 'Empty Gemini API key'}
   $env:GEMINI_FREE_TIER_CONFIRMED='1'
   $env:FREE_AI_ORDER='gemini'
   Write-Host 'LIVE_GEMINI_CONFIGURED_FOR_THIS_PROCESS (secret not displayed)' -ForegroundColor Green
  }
 }
}
if(-not (Test-Path -LiteralPath '.\tools\n43-live-preview-api.mjs')){throw 'N4.3 preview server is missing: git pull the latest branch'}
Write-Host '=== STARTING N4.4 ISOLATED CLASSICAL READER 8 PREVIEW ===' -ForegroundColor Cyan
$api=Start-Process -PassThru -FilePath 'powershell.exe' -WorkingDirectory $root -ArgumentList @(
 '-NoExit','-Command','node --experimental-strip-types tools/n43-live-preview-api.mjs'
)
$ready=$false
for($i=0;$i -lt 35;$i++){
 Start-Sleep -Milliseconds 600
 try{
  $health=Invoke-RestMethod -Uri 'http://127.0.0.1:4000/api/health' -TimeoutSec 2
  if($health.service -eq 'n43-local-preview'){$ready=$true;break}
 }catch{}
 if($api.HasExited){break}
}
if(-not $ready){throw 'N44 local API did not start. Inspect the separate API terminal for Swiss/Node errors. No production changes were made.'}
# Health alone is insufficient: run a real Swiss Ephemeris + Reader 8 report
# against a fixed, non-user test birth (no AI, no database). Do not log the chart.
$probe=@{
 date='2000-01-01';time='12:00';timeZone='Etc/UTC';latitude=50.45;longitude=30.52;
 lang='uk';preferred='local';asOf='2026-11-07'
} | ConvertTo-Json -Compress
try{
 $calculated=Invoke-RestMethod -Uri 'http://127.0.0.1:4000/api/v1/reports' -Method Post -ContentType 'application/json' -Body $probe -TimeoutSec 45
}catch{
 throw "Reader 8 real Swiss calculation failed on local API (port 4000). Inspect the API window. $($_.Exception.Message)"
}
if($calculated.readerV8.version -ne 'reader-v8.0.0-n44' -or
 $calculated.readerV8.editorialVersion -ne 'n45-human-reading-1.0.0' -or
 $calculated.readerV8.status -ne 'available' -or
 $calculated.readerV8.insights.Count -ne 15 -or
 $calculated.verification.status -ne 'verified_internal'){
 throw 'Reader 8 local API returned an incomplete or unverified report; aborting the preview.'
}
Write-Host 'N44_REAL_SWISS_READER_8_REPORT_VERIFIED (15 thematic readings)' -ForegroundColor Green
$web=Start-Process -PassThru -FilePath 'powershell.exe' -WorkingDirectory $root -ArgumentList @(
 '-NoExit','-Command','npm run dev:web'
)
$ready=$false
for($i=0;$i -lt 90;$i++){
 Start-Sleep -Milliseconds 700
 try{
  $resp=Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3000/uk/astrology/jyotish' -TimeoutSec 3
  if($resp.StatusCode -eq 200){$ready=$true;break}
 }catch{}
 if($web.HasExited){break}
}
if(-not $ready){throw 'Next.js preview did not start. Review the other terminal. Do not use an old 3000 server.'}
$runtime=Invoke-RestMethod 'http://127.0.0.1:3000/api/v1/jyotish/runtime' -TimeoutSec 6
if($runtime.readerEdition -ne 'reader-v8.0.0-n44' -or
 $runtime.editorialEdition -ne 'n45-human-reading-1.0.0' -or
 -not $runtime.previewOnly){
 throw 'API proxy is not connected to isolated N4.4 Classical Reader 8.'
}
Write-Host ''
Write-Host 'N45_HUMAN_READER_81_VERIFIED — source-bound editorial edition active' -ForegroundColor Green
Write-Host 'N44_CLASSICAL_READER_8_PREVIEW_READY — NO DOCKER, NO DATABASE, NO PRODUCTION DEPLOY' -ForegroundColor Green
Write-Host 'UA: http://localhost:3000/uk/astrology/jyotish'
Write-Host 'EN: http://localhost:3000/en/astrology/jyotish'
Write-Host 'Enter birth data and city. Compare "Read without AI — Reader 8" with AI.'
Write-Host 'If no valid AI key is configured, Reader 8 still works deterministically without AI.'
Write-Host 'Leave both launched terminal windows open while reviewing.'
Start-Process 'http://localhost:3000/uk/astrology/jyotish'
