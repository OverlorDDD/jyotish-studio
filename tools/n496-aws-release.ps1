# Galaxiora N4.9.6 — Reader life-first protected AWS release.
# Run from Windows PowerShell only AFTER PR #159 is merged and all CI is green.
# No Docker, no reset --hard, no destructive checkout, no schema migrations.
param([switch]$PreflightOnly)
$ErrorActionPreference='Stop'
$repo='OverlorDDD/jyotish-studio'
$prNumber=159
$server='ubuntu@13.50.218.38'
$key=Join-Path $env:USERPROFILE '.ssh\galaxiora-aws-key.pem'
$headers=@{'User-Agent'='Galaxiora-N496-Guarded-Release';'Accept'='application/vnd.github+json'}
if (-not (Test-Path -LiteralPath $key)) { throw "STOP: SSH key missing: $key" }
Write-Host '=== N496 GITHUB MERGED RELEASE AND CI CHECK ===' -ForegroundColor Cyan
$pr=Invoke-RestMethod -Headers $headers -Uri "https://api.github.com/repos/$repo/pulls/$prNumber"
if (-not $pr.merged -or -not $pr.merge_commit_sha) {
 throw 'STOP: PR #159 is not merged into main. No AWS changes.'
}
$head=[string]$pr.head.sha
$target=[string]$pr.merge_commit_sha
$main=Invoke-RestMethod -Headers $headers -Uri "https://api.github.com/repos/$repo/branches/main"
if ([string]$main.commit.sha -ne $target) {
 throw "STOP: main has moved past merged PR #159. main=$($main.commit.sha); release=$target. Re-certify the new main before deploy."
}
$runs=Invoke-RestMethod -Headers $headers -Uri "https://api.github.com/repos/$repo/actions/runs?head_sha=$head&per_page=100"
$required=@(
 'N4.4 Classical Reader 8 and AI — integration gate',
 'N4.9 — Unified natal synthesis and source provenance (no deployment)',
 'Jyotish Core CI',
 'Canonical main integration — SEO, Privacy, Panchanga, Build',
 'GA4 Reliability and Anonymous Visitor Analytics'
)
foreach($workflow in $required){
 $match=@($runs.workflow_runs | Where-Object {$_.head_sha -eq $head -and $_.name -eq $workflow} |
  Sort-Object created_at -Descending | Select-Object -First 1)
 if($match.Count -ne 1 -or $match[0].conclusion -ne 'success'){
  throw "STOP: PR #159 CI is not green: $workflow"
 }
 Write-Host "PASS CI: $workflow" -ForegroundColor Green
}
Write-Host "N496_PR_HEAD=$head"
Write-Host "N496_PINNED_MAIN=$target"
Write-Host '=== N496 GUARDED AWS PREFLIGHT ===' -ForegroundColor Cyan
$source="https://raw.githubusercontent.com/$repo/$target/tools/n495-aws-release.sh"
$remote=@(
 'set -Eeuo pipefail',
 "curl -fsSL --retry 3 '$source' -o /tmp/n496-aws-release.sh",
 'bash -n /tmp/n496-aws-release.sh',
 "grep -Fq 'N495_PRODUCTION_ROLLBACK_REF_SAVED' /tmp/n496-aws-release.sh",
 "bash /tmp/n496-aws-release.sh --preflight $target"
)
if(-not $PreflightOnly){
 $remote+="bash /tmp/n496-aws-release.sh --deploy $target"
}
& ssh.exe -o BatchMode=yes -o StrictHostKeyChecking=yes -i $key $server ($remote -join '; ')
if($LASTEXITCODE -ne 0){
 throw "STOP: SSH release returned exit code $LASTEXITCODE. Do not reset, force checkout, or delete production files."
}
if($PreflightOnly){
 Write-Host 'N496_PREFLIGHT_ONLY_COMPLETE — no checkout or service restart.' -ForegroundColor Green
 exit 0
}
Write-Host '=== N496 LIVE URL CHECKS ===' -ForegroundColor Cyan
foreach($uri in @('https://galaxiora.com/uk/astrology/jyotish','https://galaxiora.com/en/astrology/jyotish')){
 $response=Invoke-WebRequest -UseBasicParsing -Uri $uri -TimeoutSec 45
 if([int]$response.StatusCode -ne 200){throw "STOP: Unexpected HTTP status at $uri"}
 Write-Host "PASS HTTP 200: $uri" -ForegroundColor Green
}
Write-Host '=== N496 PRODUCTION DEPLOYMENT COMPLETE ===' -ForegroundColor Green
Write-Host 'Verify N495_PRODUCTION_RELEASE_VERIFIED and two N495_PUBLIC_REPORT_BINDING_VERIFIED markers in the AWS log.'
