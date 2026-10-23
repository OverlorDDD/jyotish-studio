param(
 [switch]$ReaderOnly
)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $root
$branch = (git branch --show-current).Trim()
if ($branch -notin @('feat/consultation-quality-v2','fix/jyotish-quality-audit-hardening')) {
 Write-Host "Current branch: $branch" -ForegroundColor Yellow
 throw 'Switch to the Consultation Quality v2 or Jyotish audit branch before starting verification.'
}
$sha=(git log -1 --format=%h).Trim()
Write-Host "Galaxiora Jyotish / branch=$branch / commit=$sha"
foreach($port in @(3000,4000)){
 $owners=Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
 foreach($pidNumber in $owners){
  if(-not $pidNumber){continue}
  $process=Get-CimInstance Win32_Process -Filter "ProcessId=$pidNumber" -ErrorAction SilentlyContinue
  $command=if($process){[string]$process.CommandLine}else{''}
  $label=if($process){$process.Name}else{'unknown'}
  if($command -match 'jyotish-studio-git' -or $command -match 'next/dist/bin/next' -or $command -match 'tsx.*main\.ts'){
   Write-Host "Port $port is occupied by a Jyotish-like $label (PID $pidNumber). Stop the OLD dev:full terminal with Ctrl+C, then run this script again." -ForegroundColor Yellow
  }else{
   Write-Host "Port $port belongs to $label (PID $pidNumber), not confirmed as Galaxiora. It will not be stopped." -ForegroundColor Red
  }
  throw "Port $port occupied; start aborted to avoid opening an outdated server."
 }
}
$env:AI_MODE='free'
Remove-Item Env:GALAXIORA_A89_PREVIEW -ErrorAction SilentlyContinue
if($ReaderOnly){$env:GALAXIORA_READER_ONLY='1'}else{Remove-Item Env:GALAXIORA_READER_ONLY -ErrorAction SilentlyContinue}
Write-Host 'Ports 3000/4000 free; starting both servers with Reader v6 / direct-v2 / CQv2.' -ForegroundColor Green
npm run dev:full
