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
