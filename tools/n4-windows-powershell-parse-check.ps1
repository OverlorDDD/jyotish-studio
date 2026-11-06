# N4.12 Windows PowerShell 5.1 syntax and source-encoding verifier.
# Use for AUTO50 bundle scripts before any original JHora GUI invocation.
[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$Source)
$ErrorActionPreference='Stop'
$bytes=[IO.File]::ReadAllBytes($Source)
if($bytes.Length -eq 0){throw 'N4_12_POWERSHELL_SOURCE_EMPTY'}
foreach($b in $bytes){if($b -gt 127){throw 'N4_12_POWERSHELL_NON_ASCII_SOURCE: use ASCII or UTF8 BOM; for this batch ASCII is mandatory'}}
$tokens=$null
$errorsList=$null
[void][System.Management.Automation.Language.Parser]::ParseFile($Source,[ref]$tokens,[ref]$errorsList)
if(@($errorsList).Count -gt 0){
 foreach($e in $errorsList){Write-Host ('PARSE_ERROR_LINE={0} MESSAGE={1}' -f $e.Extent.StartLineNumber,$e.Message)}
 throw 'N4_12_WINDOWS_POWERSHELL_PARSE_FAILED'
}
Write-Host 'N4_12_WINDOWS_POWERSHELL_51_PARSER_PASS'
