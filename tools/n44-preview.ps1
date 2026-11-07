# N4.4 owner convenience wrapper; preserves safe tested startup logic.
[CmdletBinding()]
param([switch]$SkipGitPull)
$ErrorActionPreference='Stop'
$script=Join-Path $PSScriptRoot 'n43-preview.ps1'
if(-not (Test-Path -LiteralPath $script -PathType Leaf)){throw 'Missing N4.4 preview launcher'}
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $script @($(if($SkipGitPull){'-SkipGitPull'}else{''}) | Where-Object { $_ })
if($LASTEXITCODE -ne 0){throw "Classical Reader 8 preview failed: exit $LASTEXITCODE"}
