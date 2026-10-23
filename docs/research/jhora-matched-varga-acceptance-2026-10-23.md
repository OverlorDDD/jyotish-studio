# Matched-Method Varga Acceptance — D9 / D10 10-of-10
Date: 2026-10-23 · Companion to `docs/research/jhora-independent-parity-2026-10-23.md`

## Problem and non-negotiable distinction
An old comparison misleadingly mixed **different ephemeris / varga profiles** and displayed D9 8/10 and D10 7/10. Those numbers accurately record *the unmatched configurations* but **do not establish a defect** in the Parashari formulas Galaxiora runs. It would be a serious mistake to change production calculations blindly to improve scores when the source JHora uses a separate mean/true node type and alternate D10 method.

We therefore adopted a two-layer acceptance process:
1. **Matched-longitudes and matched-varga algorithm**: treat the externally recorded sidereal longitudes as fixed input; compare D9 and D10 outputs against the separately recorded signs. This isolates the *varga formula*, without the ayanamsa / ephemeris / node confounder.
2. **Absolute astronomical and dasha parity**: independent JHora input run with the **same recorded options** as Galaxiora and numerical longitude tolerance (not yet complete; evidence must be separately acquired). Do not mix these layers.

## Two genuinely external, immutable reference sources

### Tier 1 — Jagannatha Hora 8.0 desktop actual output
Original data from JHoraKit, captured under Wine + AutoHotkey:
- Public repository: https://github.com/normalmystic/JHoraKit
- SHA: `f63826b501eabe69c6b08c5365875e1e2f74c24a`
- Files: `sample-data/Mahatma_Gandhi/chart_data.txt` and `divisionals.txt`
- Snapshot in our repository: `tests/fixtures/jhora-8-gandhi-public.json`
- **D9: 10/10** using Galaxiora's exact D9 projection on 10 original JHora sidereal longitudes
- **D10: 10/10** when comparing against JHora's explicit exported `D10 (5-8)` profile, reproduced with a **test-only** `d10JHoraFiveEight()` function.
- This does NOT establish that Galaxiora's active D10(1-9) method should be switched to the JHora alternate 5-8; doing so would silently alter visitor career charts.

### Tier 2 — independent PyJHora 4.8.7 cross-check (NOT JHora desktop output)
- Published within `amitpandeygit/hora`, pinned SHA `a2d772a437626a9976611e1ec5cf6ff100cd5462`, original `tests/benchmark/fixtures/pvr_1972_pyjhora.json`
- The archived data was recorded from a separate PyJHora implementation, which the author says was tested against JHora. It is **not equivalent to an original JHora 8.0 export**.
- Our snapshot: `tests/fixtures/pyjhora-pvr-1972-independent.json`
- For sidereal positions on 1972-10-01 and that reference's selected classical D10(1-9):
  - **D9: 10/10** planet and lagna signs
  - **D10: 10/10** planet and lagna signs

**Reference results:** four separate groups × 10 bodies = **40/40 matching signs**, with source data pinned to external commits. We did NOT change source expectations to fit our code.

## Wide coverage beyond the two physical birth cases
`tools/jhora-matched-methods.test.mjs` also tests:
- **108 distinct D9 sign-sector combinations** across all 12 zodiac signs (12×9)
- **120 distinct D10 sign-sector combinations** across all 12 zodiac signs (12×10)
- **408 boundary cases** immediately below/above all 8 D9 and 9 D10 interior boundaries across all signs
- **120 alternative JHora D10(5-8) cases** against a separately stated counting rule, and verifies that some results differ from the production method
- Assertions that D10(1-9) is **not silently replaced** in the production Jyotish Core

All comparisons are deterministic, versioned and run on every `npm run test:all` via `npm run test:jhora:matched`, independently of the already existing `npm run test:jhora:independent`.

The JHora desktop output and PyJHora alt-source were each independently created, but note: sector and boundary tests rely on explicitly coded mathematical reference rules, not on 636 additional JHora executable chart captures. Do **not** describe this test matrix as hundreds of independently generated JHora natal charts.

## Exact differences still openly visible
Directly comparing Galaxiora's default Swiss Lahiri + Mean Rahu + D10(1-9) to the historical JHora True Chitrapaksha + apparent True Rahu + D10(5-8) still gives **D9 8/10 and D10 7/10**. Those are **unmatched profiles**. They are retained as evidence of config incompatibility, labelled separately in the UI.

Neither our 40/40 matched-varga checks nor the full 12-sign sector matrix eliminates uncertainty in:
- precise sidereal astronomical longitude, historical UTC offset and Julian date in other cases
- true Chitrapaksha versus Traditional Lahiri in the original historical snapshot
- True vs Mean Rahu/Ketu
- JHora 5-8, reverse modes versus approved classical D10 1-9
- days of Vimshottari periods due to different selected ayanamsa, year-length and year mode
- planet close to a varga boundary: even tiny angular differences can place it in a different sign

### Gate for claiming *full* JHora per-chart 10/10
An additional **10–20 direct captures from the actual JHora desktop** with exported exact `jhora.ini` profiles, matching UTC, ayanamsa, mean nodes, selected D10 rule, and dasha-year convention, and compare all 10 bodies (including Lagna), exact positions within a justified tolerance and all dasha boundaries. Until then, user copy must say only that **the mathematics of varga projection passed 10/10 on the archived examples**, not that their individual chart is certified as matching JHora.

## Consequence for the website
`GET /api/v1/jyotish/runtime` now exposes matched 10/10 with independent source names and evidence tier, while preserving the unmatched historical 8/10 and 7/10 for transparent diagnosis. In the collapsed chart verification explanation, users can see both, without implying their own chart was run in JHora.

The core ephemeris flags, selected ayanamsa, house system, Rahu type, D9 / D10 algorithms, previously verified birth data and Reader / Gemini consultations remain **unchanged**.

## What this solves
1. Separates meaningful errors from differences between methodologies
2. Detects D9/D10 off-by-one boundary regressions across all 12 signs
3. Prevents silent future changes to the selected D10 method
4. Gives a publicly reviewable record of external evidence and an unambiguous path to full JHora 8 numerical acceptance, without faking perfect scores
