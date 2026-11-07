# N4.14 — Historical civil time & D60 continuous-boundary audit
Date: 2026-11-07. Research-only addition to draft PR #120; NO N4 production release.

## Deliverables introduced
1. `tools/n4-14-time-d60.mjs`: IANA/ICU diagnostic converting civil local datetime to zero, one or multiple valid UTC instants. DST spring GAP and autumn FOLD are explicit, never silently normalized; invalid date/zone rejected. Reports host timezone provenance as **NOT externally certified**.
2. `tools/n4-14-time-d60.test.mjs` and `tools/n4-14-regression-corpus.test.mjs`: reproducible Kyiv winter, DST gap/fold, invalid-input and D60 multiple-boundary regression tests; additional 20-region UTC sanity fixture corpus and 50 deterministic D60 interval sweeps. These remain synthetic and are not historical legal-time evidence.
3. Exact interval arithmetic for D60 0.5-degree crossings on *unwrapped* longitude enclosures. This complements existing `apps/api/src/n4-birth-time-certainty.ts`, which already requires independently attested continuous envelopes and original JHora method certification.

## Strict scientific/engineering limitations
- `Intl.DateTimeFormat` uses runner's ICU/tzdb. It cannot independently certify historical legal local time. Version of ICU, OS tzdb/Node must be recorded in actual executed evidence, plus independent primary-source reference for problematic historical jurisdictions.
- The 72-hour sampled UTC offsets are a **candidate discovery technique**; pathological short historical offset changes might evade it. Do not grant productionTimeResolved on this alone.
- A finite number of longitude samples, even a dense sweep, CANNOT prove absence of extrema or sub-sample boundary crossings. `inspectN414D60Envelope` only inspects bounds that must be independently proved continuous over the UTC uncertainty interval.
- Clock ambiguity must be resolved from authoritative birth record or user's explicit disambiguation, never an arbitrary UTC choice.
- D60 Lagna near boundaries requires birth-time uncertainty, location accuracy, Swiss ephemeris profile, and verified continuous range enclosure. Endpoint equality is not enough.
- N4.13's 8000/8000 native SWIEPH research parity does not automatically approve N4.14 or Vimshottari.

## Remaining large gates (required before N414_*_PASS)
A. Dataset: 50 original synthetic JHora cases, at least 20 historical DST/zone edge cases across different regions, fixed zone database versions, independent authoritative UTC reference.
B. For each case, verify timezone transition history (including pre-1970 limitations), same time scales and location provenance. Reject nonexistent and ambiguous times without explicit disambiguation.
C. Build source-independent continuous numerical interval certification, with validated derivative bounds or interval arithmetic across every complete UTC uncertainty window (including retrograde, sign wrap and D60 Lagna). Numerical sampling alone must be marked **DIAGNOSTIC**, not certified.
D. Report exact crossing times and worst-case sign stability for ±15s, ±30s, ±1m, ±2m, ±5m and unknown time. Prove D60 restrictions never falsely assert interpretation eligibility.
E. GitHub CI, source-independent review and user acceptance; production D1/D9/D10, JQA3, flags, privacy and other modules unchanged.

## Available local smoke
`node --test tools/n4-14-time-d60.test.mjs tools/n4-14-regression-corpus.test.mjs`

**Current status:** N414_FOUNDATION_IMPLEMENTED; N414_HISTORICAL_TIME_AND_D60_CERTAINTY_PASS **NOT** issued.


## 2026-11-07 expansion: second-by-second sensitivity and external runtime
- `tools/n4-14-sensitivity.mjs`: explicitly diagnostic one-second sweeps over ±15s, ±30s, ±1m, ±2m and ±5m, covering all 10 requested positions, fail-closed on DST fold/gap and incomplete numeric ephemeris callback. Samples NEVER become certified continuous longitude bounds, and real SWIEPH must be injected by a separate research-only runner.
- `tools/n4-14-sensitivity.test.mjs`: synthetic crossing detection, stability-label negative test, gap/fold sampler nonexecution, malformed provider rejection.
- `tools/n4-14-python-zoneinfo.py`: Python standard library `zoneinfo` second-runtime differential on the 20-zone January 2024 test corpus plus three Kyiv DST cases. Different runtime does **not** mean independent historical primary evidence; both may draw from related IANA data.
- CI runs both Node test suites and the Python differential. At present CI green on the exact head SHA is **not yet evidenced**.

## Critical source-quality limitation (IANA)
IANA explicitly says its timezone database is not authoritative and pre-1970 rules often apply only to particular places. It cannot by itself prove the legality or actual use of historical local birth time. Source: https://www.iana.org/time-zones/theory. TZif format is standardized independently of the underlying source data: https://www.rfc-editor.org/rfc/rfc8536.html.

## Evidence needed for final N414 certification
1. Original synthetic case input vectors and separately captured original Jagannatha Hora results must be available in a PRIVATE local research environment. Public repository only stores aggregate and synthetic tests; no private birth data.
2. Explicitly pin original civil date, coordinates, IANA zone, tzdb vintage, offset/FOLD choice and documentary provenance for historic disputed offsets. Require site-specific evidence before 1970.
3. Actual @swisseph/node SWIEPH planet and tropical-ascendant callback with explicit backend 2 assertion, same source geometry and JHora method profile as N4.13.
4. Mathematical continuous time-window enclosure for each of 10 positions; derivative or interval proof must be independently validated and account for stationary points, longitude wrap, ephemeris discontinuities and local-time boundaries. A 1-second grid is valuable for discovery but **cannot** certify crossings were absent between seconds.
5. Independently validated D60 crossing times and 50 original test cases × 5 uncertainty radii. Full CI + browser regressions and user review.
6. Never enable N4 feature flags, modify JQA3 production settings, deploy AWS, or issue `N414_HISTORICAL_TIME_AND_D60_CERTAINTY_PASS` before 1–5.

**Current checkpoint:** `N414_SECOND_GRID_AND_ZONEINFO_FOUNDATION_COMMITTED`. NOT a math or production certificate.

## 2026-11-07 N4.14 private native research execution and Windows tzdata repair

### Confirmed owner observation
- Windows Node unit tests: 13/13 PASS in prior N4.14 foundation; not a physical Swiss 50-case run.
- Python 3.14 Windows zoneinfo failed with `ZoneInfoNotFoundError: No time zone found with key Etc/UTC` because the platform had no IANA dataset or installed Python `tzdata` package.
- The printed `N414_EXTENDED_DIAGNOSTICS_PASS` after the PowerShell exception was a manually executed unconditional Write-Host and **is invalid evidence**.

### Repairs committed
- `tools/n4-14-python-requirements.txt` pins **tzdata==2026.6** (IANA 2026f, released October 28, 2026); `n4-14-python-zoneinfo.py` requires exactly this package, resets TZPATH to the package and logs version. GitHub CI installs it before Python tests; Windows isolated venv installs it too.
- `tools/n4-14-sensitivity.mjs` exports a UTC-first `auditN414UtcSensitivity` and a civil IANA entrypoint. Both keep sampled-crossing brackets separate from mathematical interval proofs, with no certification claims.
- `tools/n4-native-swieph-exact-profile.mjs` adds an isolated read-only N4.14 sampler via the N4.13 native Swiss profile; all 8 actual planet positions are required to return `SWIEPH=2`, verified file-backed ephemeris SHA256. House/ayanamsha native backend return flags are not exposed.
- `tools/n4-14-native-private-run.mjs` requires the exact user-private original JHora reference SHA and its 50 source records; uses actual native Swiss 1-second positions for 50 × (601 samples) × 10 bodies, aggregates five temporal radii ±15s, ±30s, ±1m, ±2m, ±5m. Never uploads source or raw inputs; report contains only aggregate synthetic-case statistics. This is a **30,050 timestamp / 300,500 position** diagnostic, not a continuous proof.
- `tools/n4-14-verify.ps1` runs an isolated Git worktree + Python virtualenv, Node tests, pinned tzdata, 50-case native SWIEPH smoke and private full sensitivity; exits nonzero on any failure. No Docker, AWS, PR merge, or production flags.
- `tools/n4-14-utc-sensitivity.test.mjs` covers date validation, 360-degree wrap, stable synthetic samples which must remain uncertified.
- N4.14 GitHub workflow runs all public checks without any private reference.

### Run and interpret
Run `tools/n4-14-verify.ps1` from the existing repository, with the private reference at `tools/N4_12_50_ORIGINAL_JHORA_SANITIZED_REFERENCE_PRIVATE.json`. The script leaves the original working tree untouched, checks original reference SHA256, and writes private results under the user's home directory `galaxiora-n414-private-lab`. An alternate reference path can be provided by `-PrivateReference`. `-SkipPrivateSwiss` runs only public tests; it MUST NOT count as 50-case completion.

Expected *when successfully executed*, NOT pre-claimed here:
- `N414_NODE_REGRESSION_TESTS_PASS`
- `N414_PYTHON_PINNED_TZDATA_PASS`
- `N414_PRIVATE_NATIVE_SWIEPH_50_CASE_GRID_DIAGNOSTIC_PASS`
- `N414_HISTORICAL_TIME_AND_D60_CERTAINTY_PASS_NOT_ISSUED`

### Outstanding blockers to full N414 certification
1. The 50 original JHora synthetic cases intentionally use fixed offsets; they cannot certify historical IANA zone selection or DST changes for an actual birthplace. Need an authoritative historical legal/local civil-time corpus with region-specific provenance, especially pre-1970.
2. Swiss 1-second samples cannot prove no sub-second D60 crossing. Need rigorous verified continuous longitude enclosures (including Lagna, retrograde and wrap) and independently validated crossing roots.
3. Source JHora 50-case parity proves method-aligned varga signs at sampled moments, not time uncertainty, geographical coordinate/time zone correctness, or N4 global release.
4. Full active-HEAD CI, browser/mobile/SEO, human editorial acceptance and independent Vimshottari/strength checks remain separate N4 gates. Keep N4 production flags OFF.
5. Current GitHub implementation is **committed, not proof of execution** until verified runtime reports are collected and audited.

References: https://docs.python.org/3/library/zoneinfo.html ; https://pypi.org/project/tzdata/2026.6/ ; https://www.iana.org/time-zones/theory.


## 2026-11-07 Windows owner execution — missing N4.13 private reference fixed

The owner ran the previously committed `n4-14-verify.ps1` from `C:\\Users\\Note\\jyotish-studio-git`. Execution STOPPED before tests at `N414_PRIVATE_REFERENCE_MISSING` because the old script guessed that the private 50-case reference was directly under the current Git checkout's `tools/` directory. This location was never guaranteed: N4.13's original audit was delivered as `Galaxiora_N413_Private_SWIEPH_Audit.zip`, extracted under `E:\\Downloads\\N413PrivateAudit`. The private reference is intentionally **not** in Git.

Fix: `tools/n4-14-verify.ps1` now searches the exact named original JSON under the prior N4.13 extraction and the known Downloads roots; if not extracted, it reads **only that JSON entry** from a locally present `Galaxiora_N413_Private_SWIEPH_Audit*.zip`. Every candidate and extracted entry must match the pinned N4.13 original SHA-256 `5DCB07D6D71F68199AF97696E8AD3CA91493B30F4ABC41FDD51350C14E4FF992`. No arbitrary ZIP scripts are executed, no unverified source is accepted, and no private data are pushed to GitHub. `-PrivateReference` remains supported for a user-local alternate path.

If the archive is missing too, the correct outcome is `N414_PRIVATE_REFERENCE_NOT_FOUND` with the expected original archive name and a manual alternate-path option. **The aggregate `N413_PRIVATE_NATIVE_SWIEPH_50_CASE_RESULT.json` is not a substitute**: it lacks the 50 independent source records.

A previously printed `N414_VERIFICATION_RUN_COMPLETED` came from a separate `Write-Host` pasted after an exception. It is **not** proof of any N4.14 execution. N4.14 private native computations have NOT run for that failed attempt. Do not mark N4.14 certified until actual runtime audit, historical reference review, continuous D60 bound proof and all CI gates succeed.


## 2026-11-07: N4.14 native 50-case actual result and follow-up

### Real owner-private SWIEPH result (verified from owner-submitted aggregate JSON)
- Status: \`N414_PRIVATE_NATIVE_SWIEPH_50_CASE_GRID_DIAGNOSTIC_PASS\`.
- 50 original synthetic JHora-aligned cases, 30,050 UTC grid epochs, 300,500 10-body position evaluations. Pinned private source SHA: \`5dcb07d6d71f68199af97696e8ad3ca91493b30f4abc41fdd51350c14e4ff992\`.
- Exactly 11/50 D60 Lagna sign changes at ±15s, 25/50 at ±30s, 46/50 at ±60s, 50/50 at ±120s and 50/50 at ±300s.
- Counts of observed adjacent-second sign-change brackets: 11, 25, 49, 102, 253. **These brackets are not distinct birth charts** and may include several crossings for one chart.
- Other bodies can also change: 47 changed body/case occurrences at ±60s, 51 at ±120s, 58 at ±300s. These are not all Ascendant changes.
- Source data have fixed timezone offsets, not independent historical IANA place names. No continuous D60 proof, production certification, human acceptance or statistical population extrapolation follows.

### New engineering, all research-only
1. \`tools/n4-14-report-gate.mjs\`: strict SHA/profile/backend/count monotonicity audit of original aggregate, fail closed on inflated production/historical/continuous claims. Its algorithm was exercised directly on the owner's uploaded aggregate; \`N414_AGGREGATE_EVIDENCE_INTEGRITY_PASS\`.
2. \`tools/n4-14-crossing-refinement.mjs\`: midpoint refinement of **observed** 1-second sign-change brackets to a numeric enclosure no wider than 125 milliseconds. Guards against over-fast/ambiguous neighboring sectors, invalid dates, incomplete bodies, >5000 brackets, and retains all outputs as numerical diagnostics only. No unique-root or all-interval continuity assertion.
3. \`tools/n4-14-native-private-run.mjs --refine\`: same pinned original Swiss file/hashes, 50-case source, derived 1-second brackets; refines and aggregates only counts and maximum numerical width. Raw refined timestamps/longitudes are never written to GitHub or the exported summary. Cross-check that refined and blocked counts sum to observed ±300s brackets.
4. \`tools/n4-14-transition-fixtures.json\`: 25 IANA cross-runtime cases, including Europe/Kyiv 1990 July fold and March gap, Pacific/Apia skipped 2011-12-30, US DST 2006/2007 changes, plus 20 international 2024 cases. \`tools/n4-14-transition-fixtures.test.mjs\` and Python zoneinfo verify these as **IANA behavioral diagnostics**, not primary-source legal time certificates.
5. \`tools/n4-14-historical-source-ledger.json\`: primary documentary research *identified* for Ukraine and Samoa. The Ukrainian SSR Supreme Council June 11 1990 resolution No. 15-XII records new civil-time order effective July 1; Samoa International Date Line Act 2011 records the change to standard time UTC+13 and the lost civil date. Neither source independently attests a specific birth record's UTC, IANA zone boundaries, every local DST hour, or 50 synthetic source cases. All source reviews remain NOT independently accepted.
6. Targeted unit test coverage and GitHub CI + isolated Windows verifier were extended; never count a commit as proof of CI PASS.

### Gate-by-gate next action before the FINAL full certificate
- **T1 historical legal time**: build a law/dating-based independently reviewed reference with at least 20 jurisdiction/time-transition cases from authoritative materials, exact city and offset and tzdb vintage, including pre-1970 risk and non-hour offsets. Compare UTC candidates to IANA and Python zoneinfo; never silently choose a fold.
- **T2 physical continuity**: independently validate conservative interval bounds for all 10 Swiss longitudes over each ±window, including derivative/second-derivative limits, stationary points, sidereal method, coordinate uncertainty, UTC/UT1 and rounding. A 125ms root bracket is NOT a proof of continuous uniqueness or that no other unobserved crossings exist.
- **T3 original 50-case refinement**: execute the newest native private \`--refine\` command through \`tools/n4-14-verify.ps1\`; require all observed crossings reconciled and bounded numerical brackets; inspect any BLOCKED brackets. Keep all individual original-source inputs private.
- **T4 UI/release policy**: apply existing N4.11 fail-closed birth-time trust: unknown/approximate civil times and non-certified D60 crossings do not become full D60 house/lagna readings. No production flags, PR merge, AWS deployment, or full N4 certification without independent review and CI.
- **T5 beyond N4.14**: N4.15 visual exploration, N4.16 independent Vimshottari/strength and editorial QA remain separate.

**Status after code commit (pending user verification):**
\`N414_CROSSING_REFINEMENT_AND_HISTORY_EVIDENCE_IMPLEMENTED\`.
Do not print \`N414_HISTORICAL_TIME_AND_D60_CERTAINTY_PASS\` until T1–T4 are verified.

Sources:
- https://www.iana.org/time-zones/theory — database not authoritative for all historical legal clock time, especially before 1970.
- https://peps.python.org/pep-0495/ — fold versus gap, Ukraine 1990 example.
- https://zakononline.ua/documents/show/156651___156651 — Ukraine SSR Resolution No. 15-XII (11 June 1990).
- https://mcil.gov.ws/wp-content/uploads/2023/10/International-Date-Line-Act-2011.pdf — Samoa Act No. 6 (2011).
