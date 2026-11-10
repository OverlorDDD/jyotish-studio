# N4.4: safe Windows preview launch. Never deploys or touches production.
# Git for Windows can invoke automatic repack/GC after fetch and block on locked
# .git/objects/pack/*.idx with an interactive "Should I try again?" prompt.
# Disable AUTO maintenance only in this disposable preview clone and use a
# separate fetch + fast-forward merge. Never delete packs, locks, or user edits.
[CmdletBinding()]
param([switch]$SkipGitPull,[switch]$ReaderOnly)
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $root
$branch='feat/n4-d60-certified-precision-20261107'
$legacy=Join-Path $PSScriptRoot 'n43-preview.ps1'
function AssertExit([string]$label){
 if($LASTEXITCODE -ne 0){throw "$label failed (exit $LASTEXITCODE). No files were reset; see the Git output above."}
}
if(-not (Test-Path -LiteralPath $legacy -PathType Leaf)){throw 'Missing local Reader 8 API/web launcher'}
if(-not (Get-Command git -ErrorAction SilentlyContinue)){throw 'Git for Windows is required'}
$actual=(& git branch --show-current).Trim()
AssertExit 'Inspect Git branch'
if($actual -ne $branch){throw "Wrong branch: $actual. The preview must use $branch"}
if(-not $SkipGitPull){
 Write-Host '=== N4.4 SAFE WINDOWS GIT UPDATE (AUTO GC DISABLED) ===' -ForegroundColor Cyan
 # A prior automatic repack may have left redundant packs. They are harmless;
 # do not run git gc or delete the pack files to force a repair.
 & git config --local gc.auto 0
 AssertExit 'Disable local Git automatic gc'
 & git config --local maintenance.auto false
 AssertExit 'Disable local Git automatic maintenance'
 & git -c gc.auto=0 -c maintenance.auto=false fetch --no-auto-gc --no-tags origin $branch
 AssertExit 'Safe Git fetch'
 & git -c gc.auto=0 -c maintenance.auto=false merge --ff-only "origin/$branch"
 AssertExit 'Safe fast-forward merge'
}
$sha=(& git rev-parse --short HEAD).Trim()
AssertExit 'Inspect preview commit'
Write-Host "N44_GIT_READY: $sha (no automatic repack or destructive cleanup)" -ForegroundColor Green
if($ReaderOnly){
 & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $legacy -SkipGitPull -ReaderOnly
}else{
 & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $legacy -SkipGitPull
}
if($LASTEXITCODE -ne 0){throw "N4.4 preview launcher failed (exit $LASTEXITCODE). Check the API/web console windows."}
