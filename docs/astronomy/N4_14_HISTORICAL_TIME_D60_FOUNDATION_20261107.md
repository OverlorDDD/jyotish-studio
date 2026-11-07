# N4.14 — Historical civil time & D60 continuous-boundary audit
Date: 2026-11-07. Research-only addition to draft PR #120; NO N4 production release.

## Deliverables introduced
1. `tools/n4-14-time-d60.mjs`: IANA/ICU diagnostic converting civil local datetime to zero, one or multiple valid UTC instants. DST spring GAP and autumn FOLD are explicit, never silently normalized; invalid date/zone rejected. Reports host timezone provenance as **NOT externally certified**.
2. `tools/n4-14-time-d60.test.mjs`: reproducible modern Kyiv winter, DST gap/fold, invalid-input and D60 multiple-boundary regression tests.
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
`node --test tools/n4-14-time-d60.test.mjs`

**Current status:** N414_FOUNDATION_IMPLEMENTED; N414_HISTORICAL_TIME_AND_D60_CERTAINTY_PASS **NOT** issued.
