# Galaxiora historical Jyotish study library — user-initiated download
# PowerShell 5.1+ / Windows, no API keys, no local AI, no install scripts.
# Usage: powershell -ExecutionPolicy Bypass -File .\tools\research\download-classics.ps1
# Only a Wellcome/Wikimedia Public Domain Mark scan and the catalogued public-subset repository.
# Review jurisdiction and image/text rights BEFORE redistribution via your website.

$ErrorActionPreference = 'Stop'
$folder = Join-Path (Get-Location).Path 'research-library'
New-Item -ItemType Directory -Force -Path $folder | Out-Null

$downloads = @(
  @{Name = 'Brihat_Jataka_Iyer_1885_Public_Domain.pdf'; Url = 'https://upload.wikimedia.org/wikipedia/commons/a/a9/The_Brihat_jataka_of_Varaha_Mihira_%28IA_b2488442x%29.pdf'},
  @{Name = 'jyotisha-corpus-classical-public.zip'; Url = 'https://github.com/maximally0/jyotisha-corpus/archive/refs/heads/main.zip'}
)

foreach ($item in $downloads) {
  $target = Join-Path $folder $item.Name
  Write-Host ('Downloading ' + $item.Name + ' ...')
  try {
    Invoke-WebRequest -Uri $item.Url -OutFile $target -MaximumRedirection 5
    $bytes = (Get-Item $target).Length
    if ($bytes -lt 1024) {
      Remove-Item $target -Force
      throw 'Suspiciously small or empty download'
    }
    Write-Host ('Saved ' + $bytes + ' bytes to ' + $target)
  } catch {
    Write-Warning ('Failed to fetch ' + $item.Name + ': ' + $_.Exception.Message)
  }
}

Write-Host 'Review docs/research/a8-classical-source-registry.md before using these materials.'
Write-Host 'Author-provided modern textbook: https://www.vedicastrologer.org/articles/astro_books.htm'
Write-Host 'Jagannatha Hora: https://vedicastrologer.org/jh/index.htm'
