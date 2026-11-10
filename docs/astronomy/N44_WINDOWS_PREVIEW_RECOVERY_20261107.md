# N4.4 Windows preview failure recovery — Git pack auto-maintenance and local API
Date: 2026-11-07. Scope: independent **Windows** preview checkout, never EC2 or main.

## Incident evidence (owner-provided terminal log)

- `git pull --ff-only origin feat/n4-d60-certified-precision-20261107` fetched from `936e4b8` to `7340bab`, reported `Updating 936e4b8..7340bab` and `Fast-forward`.
- Git then ran automatic object maintenance/repack, twice enumerating and packing objects, and failed unlinking `.git/objects/pack/pack-e8a5696b6dcd7c9128de959a04e8fb9b7c3ccf7f.idx`; it prompted `Should I try again? (y/n)` repeatedly.
- The precise file-lock owner is **not proven by these logs** (possible concurrent Git/IDE, antivirus or Windows file handles). This is Git's local pack maintenance; it does **not** show a failed Reader 8 algorithm or compilation.
- Earlier terminal logs started only `npm run dev:web`; the Next page returned HTTP 200, but `/api/v1/account/me` and `/api/v1/jyotish/runtime` could not reach `127.0.0.1:4000` (`ECONNREFUSED`). This was a separate failure: no local API process listening. CSS autoprefixer `align-items:end` warning was nonfatal (fixed to `flex-end`).

## Implemented in GitHub

1. `tools/n44-preview.ps1`: force `git config --local gc.auto 0` and `git config --local maintenance.auto false` only in this preview clone, then run `git -c gc.auto=0 -c maintenance.auto=false fetch --no-auto-gc --no-tags` followed by `git merge --ff-only`. Never `reset --hard`, `git gc`, `git prune` or delete pack/index files. Prints `N44_GIT_READY` with the local HEAD SHA.
2. `tools/n43-preview.ps1`: same safety for direct legacy invocations. Confirms native Swiss loads, ensures the two local ports are unused, launches a loopback-only API and verifies it responds with a complete `reader-v8.0.0-n44` **15-insight report** and `verified_internal` from an ephemeral fixed test input before starting Next. Prints `N44_REAL_SWISS_READER_8_REPORT_VERIFIED`, checks local Next HTTP 200 and the same Reader 8 through Next's API proxy, then prints `N44_CLASSICAL_READER_8_PREVIEW_READY` and opens the page. Optional `-ReaderOnly` bypasses cloud AI prompts.
3. `apps/web/app/astrology/jyotish/NatalLanding.module.css`: replace unsupported flex `end` to quiet nonfatal Windows webpack/autoprefixer warnings.
4. `.github/workflows/n43-reader-ai.yml`: on Windows runner, parse both PowerShell launch scripts, check non-destructive Git fetch/merge contract, install Node 24 dependencies and run the real native-Swiss + local HTTP Reader 8 test. The Linux main gate remains unchanged.

## Recover a stuck terminal and launch

If the old terminal is still asking `Should I try again? (y/n)`:
- Press **Ctrl+C once** in that terminal; do not keep entering `y`. The transcript shows a fast-forward already occurred, but the remaining Git cleanup can leave redundant pack files.
- Close previous local Next/API terminals to free ports 3000 and 4000. Never kill unrelated Git jobs or stop production AWS processes.
- Do not manually delete `.git/objects/pack/*.idx`, `*.pack`, `index.lock` or `gc.log` without confirming the process holding them has ended. The configured Git update skips automatic repack, so deletion is unnecessary.

In a **fresh PowerShell**:
```powershell
$ErrorActionPreference = "Stop"
$branch = "feat/n4-d60-certified-precision-20261107"
Set-Location "$env:USERPROFILE\galaxiora-n4-preview"

git config --local gc.auto 0
if ($LASTEXITCODE -ne 0) { throw "Local Git configuration failed" }
git config --local maintenance.auto false
if ($LASTEXITCODE -ne 0) { throw "Local Git maintenance configuration failed" }

git -c gc.auto=0 -c maintenance.auto=false fetch --no-auto-gc --no-tags origin $branch
if ($LASTEXITCODE -ne 0) { throw "Git fetch failed; check the prior Git window or Windows file lock" }
git -c gc.auto=0 -c maintenance.auto=false merge --ff-only "origin/$branch"
if ($LASTEXITCODE -ne 0) { throw "Fast-forward failed. No local edits were reset." }

powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\n44-preview.ps1" -SkipGitPull
if ($LASTEXITCODE -ne 0) { throw "Reader 8 preview failed: inspect the printed error" }
```

Use `-ReaderOnly` after `-SkipGitPull` to run deterministic Reader 8 without a provider key or AI prompt.

Expected output:
`N44_GIT_READY`, `N44_REAL_SWISS_READER_8_REPORT_VERIFIED`, `N44_CLASSICAL_READER_8_PREVIEW_READY`.

- Reader 8 UA: http://localhost:3000/uk/astrology/jyotish
- Reader 8 EN: http://localhost:3000/en/astrology/jyotish
- To check the genuine isolated API route without any birth data: `(Invoke-RestMethod http://127.0.0.1:3000/api/v1/jyotish/runtime) | Select-Object readerEdition,previewOnly,productionAuthorized`. Expected `reader-v8.0.0-n44`, `True`, `False`.
- Build a chart with real (owner-supplied, local-only) birth details and read `Читати без AI — Reader 8`. For AI comparison, configure an actual provider in the launch prompt; a simulated/synthetic AI response is **not** a valid content comparison.

## What the fix does not claim

- No tool can remotely release a lock held by an unknown local Windows process. The prevention is disabling automatic Git object maintenance in the preview clone; if Git already left an index lock/corrupt object, stop and inspect it. If irreparable, use a **fresh parallel clone** under another directory instead of deleting .git objects.
- An HTTP 200 HTML page proves only the web route; the new probe proves the complete calculation and Reader 8 API locally. Any externally hosted Gemini response still needs its own key/quota and editorial review.
- Windows GitHub Actions runner can verify syntax and runtime on a clean machine, not the owner's existing Antivirus/IDE file handles.
