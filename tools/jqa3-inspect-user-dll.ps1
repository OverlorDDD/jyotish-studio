param(
 [Parameter(Mandatory=$true)][string]$DllPath,
 [string]$JHoraInstallDir = "${env:ProgramFiles(x86)}\Jagannatha Hora",
 [string]$ExpectedUploadedSha256 = "915c9d66188d192dfc417b251fc5da591214aa1bdf793645b6881ba0e3ec8bc8"
)
$ErrorActionPreference = "Stop"
$resolved = (Resolve-Path -LiteralPath $DllPath).Path
$file = Get-Item -LiteralPath $resolved
if ($file.Extension -ne ".dll") { throw "Expected a DLL file" }
# Metadata and hash inspection only: do not execute or load untrusted DLLs.
$bytes = [System.IO.File]::ReadAllBytes($resolved)
if ($bytes.Length -lt 1024 -or [Text.Encoding]::ASCII.GetString($bytes,0,2) -ne "MZ") { throw "Invalid PE header" }
$pe = [BitConverter]::ToInt32($bytes,0x3C)
if ($pe -lt 64 -or $pe+24 -ge $bytes.Length -or [Text.Encoding]::ASCII.GetString($bytes,$pe,4) -ne "PE`0`0") { throw "Invalid PE signature" }
$machine = [BitConverter]::ToUInt16($bytes,$pe+4)
$stamp = [BitConverter]::ToUInt32($bytes,$pe+8)
$info = [Diagnostics.FileVersionInfo]::GetVersionInfo($resolved)
$sha = (Get-FileHash -LiteralPath $resolved -Algorithm SHA256).Hash.ToLowerInvariant()
$official = Join-Path $JHoraInstallDir "bin\swedll32.dll"
$officialInfo = $null
if (Test-Path -LiteralPath $official) {
 $other = Get-Item -LiteralPath $official
 $otherMeta = [Diagnostics.FileVersionInfo]::GetVersionInfo($official)
 $officialInfo = [ordered]@{
  path = $official
  sha256 = (Get-FileHash -LiteralPath $official -Algorithm SHA256).Hash.ToLowerInvariant()
  length = $other.Length
  fileVersion = $otherMeta.FileVersion
  productVersion = $otherMeta.ProductVersion
 }
}
[ordered]@{
 status = "STATIC_METADATA_ONLY_NOT_A_PARITY_CERTIFICATE"
 uploaded = [ordered]@{
   sha256 = $sha
   matchesUserUpload = ($sha -eq $ExpectedUploadedSha256)
   length = $bytes.Length
   peMachine = ('0x{0:X4}' -f $machine)
   peTimestampUtc = [DateTimeOffset]::FromUnixTimeSeconds($stamp).UtcDateTime.ToString('o')
   fileVersion = $info.FileVersion
   productVersion = $info.ProductVersion
 }
 installedJHoraDll = $officialInfo
 identicalToInstalledJHora = ($null -ne $officialInfo -and $officialInfo.sha256 -eq $sha)
 recommendation = "Never replace JHora system DLL or execute an unknown uploaded DLL. Use genuine installed JHora DLL for numerical comparison."
} | ConvertTo-Json -Depth 5
