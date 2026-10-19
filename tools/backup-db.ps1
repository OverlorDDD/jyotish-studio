# Safe one-way local PostgreSQL backup. NEVER overwrites a production database.
# Requires Docker Desktop with the existing jyotish-db container.
param(
 [string]$Container = "jyotish-db",
 [string]$Database = "jyotish",
 [string]$DatabaseUser = "jyotish",
 [string]$OutputDirectory = "backups"
)
$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$dir = Join-Path $root $OutputDirectory
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
$filename = "galaxiora-$timestamp-$([Guid]::NewGuid().ToString('N').Substring(0,8)).dump"
$remote = "/tmp/$filename"
$destination = Join-Path $dir $filename
try {
  docker exec $Container pg_dump -U $DatabaseUser -d $Database -Fc -f $remote
  if ($LASTEXITCODE -ne 0) { throw "pg_dump failed" }
  docker cp "${Container}:${remote}" $destination
  if ($LASTEXITCODE -ne 0) { throw "docker cp failed" }
  $item = Get-Item -LiteralPath $destination
  if ($item.Length -lt 1024) { throw "Backup too small; verify PostgreSQL dump" }
  Write-Host "Backup created: $destination ($($item.Length) bytes)"
  Write-Host "PRIVATE: contains user emails, chart birth data, Tarot questions. Store securely off-device."
} finally {
  docker exec $Container rm -f $remote | Out-Null
}
