# PVR Narasimha Rao publisher ONLY; downloads/validates ZIP, never executes the installer.
param([string]$Destination = "$env:USERPROFILE\Downloads\N4-JHora8")
$ErrorActionPreference='Stop'
[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12
New-Item -ItemType Directory -Force -Path $Destination | Out-Null
$zipPath=Join-Path $Destination 'jh_short_install.zip'
$hosts=@('https://www.vedicastrologer.org/jh','https://mail.vedicastrologer.org/jh','https://vedicastrologer.org/jh')
$valid=$false
foreach($hostUrl in $hosts){
 try{
  Invoke-WebRequest -Uri "$hostUrl/jh_short_install.zip" -OutFile $zipPath -TimeoutSec 45 -UseBasicParsing
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $archive=[System.IO.Compression.ZipFile]::OpenRead($zipPath)
  try{
   $matches=@($archive.Entries | Where-Object {$_.FullName -match '(^|[/\\])jh_short_install\.exe$'})
   if($matches.Count -eq 0){throw 'Expected installer entry not found'}
  } finally {$archive.Dispose()}
  $valid=$true;break
 }catch{
  Write-Host "Official ZIP unavailable/invalid from $hostUrl"
  if(Test-Path $zipPath){Remove-Item -Force $zipPath}
 }
}
if(-not $valid){Write-Error 'Official publisher download unavailable (406/429 possible). Use ONLY https://vedicastrologer.org/jh/index.htm; no unknown mirrors.';exit 2}
Write-Host "N4_OFFICIAL_JHORA_ZIP=$zipPath"
Write-Host "N4_OFFICIAL_ZIP_SHA256=$((Get-FileHash -Algorithm SHA256 -Path $zipPath).Hash)"
Write-Host 'Never executed. ZIP structure/hash do not establish publisher signature; manual provenance review still required.'
