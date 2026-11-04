# Stage JQA-2 — JHora numerical accuracy audit (2026-10-23)

## Scope and proof levels
Continuation of draft PR #45; production Jyotish formula, Reader v6, D10 1-9 and mean-node defaults are **unchanged**.

**Independent data:** exactly **ONE** third-party JHora 8.0 desktop export (Gandhi), pinned to JHoraKit commit `f63826b501eabe69c6b08c5365875e1e2f74c24a`; `tests/fixtures/jhora-8-gandhi-public.json`. As checked on the pinned upstream sample-data directory, there are no additional published charts in that snapshot.

**Non-independent data:** `tools/jqa2-numerical.test.mjs` runs **24 additional real Swiss-computed natal charts** across 1869–2007 and verifies D1/house/nakshatra/pada/D9/D10/Vimshottari invariants, plus a full `12 × (9+10) × 2 = 456` varga-part test and 108 nakshatra/pada cases. These **are not 24 JHora exports** and cannot certify cross-engine parity.

## Root causes and newly discovered details

The pinned JHora profile in the public export is identifiable only partially: displayed ayanamsa `22-01-26.49`, inferred True Lahiri/Chitrapaksha, true nodes inferred from longitude, recorded D-10 (5-8) table. **The original JHora INI was not preserved** for this chart, so TruePositions, nutation, observer geometry, special ascendant settings, choice of Vimshottari year and even specific JHora build settings are not independently certified.

JHoraKit's reverse engineering documents that `UserSelectedAyanamsa=17` in that installation is **True Lahiri**, while `0` is **Traditional Lahiri**. Its `TruePositions=1` is the geometric/true rather than apparent planetary position. Swiss `SIDM_LAHIRI` is *not* the same as Swiss `SIDM_TRUE_CITRA` or necessarily JHora's own Spica projection; source labels alone cannot establish bit-for-bit equivalence.

**New numerical observation on the original externally recorded Gandhi values:** `tools/jqa2-profile-diagnostics.py` runs a *diagnostic profile only*, using Swiss `SIDM_TRUE_CITRA + FLG_TRUEPOS` for the seven classical grahas, true Rahu (Moshier fallback when its Swiss ephemeris files are not available), sidereal Swiss houses, and the recorded JHora `D10 5-8` variant. Results:

| Field (Gandhi only) | Previous production profile | Matched diagnostic candidate | Acceptance implication |
| --- | --- | --- | --- |
| D1 signs, Lagna + nine grahas | 10/10 | **10/10** | PASS for sign count, not precision |
| D9 signs | 8/10 | **10/10** | Production vs JHora = CONFIGURATION DIFFERENCE |
| D10 signs | 7/10 vs source 5-8 | **10/10** using source 5-8 | Production 1-9 remains valid and untouched |
| Seven classical planetary longitudes | 8/8 (including lagna) within **5 arcmin** | **7/7 within 1 arcsec** | Matched numerical subset observed; original INI still UNKNOWN |
| Lagna longitude | Traditional Lahiri mismatch | True Citra sidereal houses **about 34.84 arcsec** off | **UNVERIFIED** at 1 arcsec |
| True Rahu longitude | Mean vs True nodes | Moshier true node **about 1.48 arcsec** off | **UNVERIFIED** at 1 arcsec; comparison ephemeris fallback |
| Ketu | Opposite Rahu | Shares true node difference | **UNVERIFIED** at 1 arcsec |
| JHora dasha starting dates | About 10–11 days previously reported | Different even with adjusted Moon | **UNVERIFIED** year/balance algorithm, no arbitrary offsets |

For transparency, using the **externally recorded** JHora ayanamsa to subtract from a separately computed Swiss tropical ascendant reproduces the recorded lagna longitude to ~0.03 arcsec. But this injects the answer's ayanamsa into the calculation and is **only a geometry cross-check, not an independent solution** to the unsolved 34.84″ ascendant mismatch. Do NOT count it as mathematical parity.

These results suggest the original 8/10 and 7/10 are not demonstrated D9/D10 calculation bugs. The 10/10 in the candidate configuration is a **genuine replay of the original external JHora labels** with a clearly specified alternative mode; it is not proof that the commercial/default Galaxiora mode has become JHora-identical. No JHora fixture fields or expected values were changed.

## Proven defect fixed: historic IANA timezone offsets
`packages/jyotish-core/src/index.ts` previously iterated offsets in **15-minute increments**, so historical offsets with seconds (e.g., Europe/Dublin on 1900-06-01, UTC−00:25:21; historical Asia/Kolkata) failed to resolve. New algorithm samples actual IANA offsets on both sides of the target instant, candidate-matches full second-precision civil timestamps, and still rejects DST folds/gaps.

This fix is **not** a license to reinterpret Gandhi's explicit historical `+04:39:16` as Asia/Kolkata: the public JHora sample's offset differs from that IANA zone's historical offset. The exact fixture UTC `1869-10-02T02:40:44Z` remains unchanged.

## CI and acceptance
- `npm run test:jhora:independent` — original real JHora test; classification changed from a misleading global PASS to `CONFIGURATION_DIFFERENCE`, with `UNVERIFIED` 1″ precision and dashas. Recorded reference D9 and D10 (5-8) varga replay stay PASS 10/10 on the **original JHora longitudes**.
- `npm run test:jqa2:numerical` — 24 cross-century Swiss natal cases, all slices of 12 signs in D9/D10, nakshatra boundaries, UTC seconds offsets, DST and 120-year dasha lifecycle. This tests Galaxiora's code, not JHora against Swiss.
- `npm run test:jqa2:profiles` — independently recorded JHora positions compared with specified alternative Swiss modes, 10/10 D1, D9, D10 **sign checks** and 7/7 classical graha 1″ diagnostic, with remaining mismatches printed numerically.
- All three added to mandatory `npm run test:all`; existing CI then also executes production build, PostgreSQL integration, real Chromium browser tests, API smoke.

## Strict remaining gates
1. Capture **at least 10–20 new real JHora exports** with preserved per-chart INI, software version/build, unambiguous UTC, date/time to seconds, precision, location and dasha year options. Never turn Swiss- or PyJHora-derived data into fake JHora files.
2. Match exact astronomical observer, positions (true/apparent), nutation, true/mean nodes, ayanamsa and divisional calculation variant without using the recorded output as a computational input.
3. Verify **each** one: D1/D9/D10 10/10, 12/12 lords, 27 nakshatra/pada classification, longitudes <=1″ where both sources genuinely have that precision, Vimshottari major/subperiod boundaries at stated precision; mark absent evidence UNVERIFIED.
4. Solve independent ascendant mode and true-node ephemeris delta; separate substantive formula bugs from valid alternative calculations. Version/invalidate persisted charts if production formulas ever change.
5. Repeat all CI tests, review stacked PRs #41–#45, then merge in dependency order only when required gates pass.

### Sources
- JHora developer P.V.R. Narasimha Rao: https://www.vedicastrologer.org/jh/index.htm
- Pinned source export: https://github.com/normalmystic/JHoraKit/tree/f63826b501eabe69c6b08c5365875e1e2f74c24a/sample-data/Mahatma_Gandhi
- JHora internal configuration sweep: https://github.com/normalmystic/JHoraKit/blob/f63826b501eabe69c6b08c5365875e1e2f74c24a/JHoraInternals.md
- Swiss Ephemeris sidereal technical reference: https://ephe.scryr.io/swisseph/doc/swisseph.htm

**Decision: JQA-2 PARTIAL. One real external case, D9/D10 sign methodology corroborated; full numeric 1″ certification, 10–20 independent cases and dashas NOT YET ACCEPTED.**
