# N4.16 — Finish the maths without falsifying the proof
2026-11-07 | Draft PR #120 | ORIGINAL JHora8 and strict native SWIEPH
Production, Next.js UI, SEO, English/Ukrainian AI content and release are unchanged.

## 0. Owner observations that motivated this work
- Real original JHora8 private 50 synthetic sources: method-aware 16 vargas × 10 positions = **8,000 / 8,000** source signs.
- Real independent PyJHora 4.8.7 original CI run 41845004488, job 126626101250 **SUCCESS**: 8,000/8,000 separately computed **Sun/Moon** varga signs; `packages/jyotish-core/src/vargas.ts` Git blob SHA1 **3a4f2dec84a0ed13cb692f52a76612e0de1306e6** confirmed as unchanged in active PR. This is *symbolic D1 longitude → Dn sign* parity, not an independent physical astronomy test.
- Original JHora8 research used **Uma-Shambhu (US)** Hora, True Citra sidereal **geometric** positions. Existing production uses **Sun/Moon Hora**, Lahiri sidereal **apparent** positions. Original JHora US D2 matches existing Sun/Moon D2 only 80/500. Preserve both explicit variants; DO NOT swap production defaults to pass a mismatched oracle.
- Real N4.14 native 50-case Swiss time sensitivity: 253/253 detected D60 neighboring-second crossings refined to <=125ms, but continuous uncertainty-interval certification is NOT issued.
- Original 20 JHora (JQA3) captures: actual production Vimshottari 365.2425-day year produces **37/180** major start calendar-day matches and **294/1620** minor matches UTC; worst residual 5/6 calendar days. Source gives **YYYY-MM-DD only** and INI `YearDefinition=0 3` without a source-authenticated description of option 3. This is an actual date mismatch, not a syntax test.

## 1. Exact mathematical scope — solve different problems separately
- **Symbolic 16 D formulas:** source-pinned Sun/Moon mapping independently checked by PyJHora 8k on versioned source; US alternative separately checked by genuine JHora8 8k. New `tools/n4-math-scope-ledger.mjs` requires exact Git blob checksum and records both scopes without pretending they have the same D2 method.
- **Physical D1 birth calculation:** source and time scales matter. The 50 True Citra geometric benchmark does NOT certify the production Lahiri/apparent ephemeris. Retain JQA3 and production unchanged until exact-profile independent physical test.
- **Vimshottari calendar:** neither replacing 365.2425 with 365.25 or 365.25636 nor adopting savana is justified without matching the actual author-selected JHora option and holdout original date vectors. Keep existing production dasha computation unchanged.
- **History and D60:** birth-time GAP/FOLD is always blocked; pre-1970 IANA zones are NOT proof of specific local legal time. D60 numeric sector formula can be checked at an assumed instant, but not described as birth-time-stable or an exact forecast absent verified continuous enclosures. If such proof is unavailable, show D60 as explicitly provisional and WITHHOLD it from enhanced AI; that is a clear bounded product decision, not pretending stability was proved.

## 2. Independent original 20-case fixed-year evaluation (already executed by assistant via GitHub connector)
All 20 original JHora8 normalized reference JSON Git blob SHA1 values were checked against the original manifest on the current branch; no synthetic expected dates were invented. Using original Moon longitude, recorded birth UTC and the independently coded fixed-year equations (UTC clock):

| Year days | First 10 original cases minor matches / 810 | Holdout 10 minor matches / 810 | Total / 1620 |
|---|---:|---:|---:|
| 360 | 3 | 3 | **6** |
| 365 | 25 | 23 | 48 |
| 365.24219 | 143 | 149 | 292 |
| 365.2425 (existing production) | 144 | 150 | **294** |
| 365.25 | 168 | 144 | 312 |
| 365.25636 (mean sidereal) | 188 | 152 | **340** |
| 365.26 | 178 | 153 | 331 |
| 365.3 | 100 | 101 | 201 |

These are ORIGINAL SOURCE-HASH-CHECKED diagnostic matches, not proof of year mode or success. The sidereal constant fits only 340/1620 and its apparent advantage is mostly on the training half (188 vs 152). A universal constant year definition cannot close this discrepancy. The code `tools/n4-dasha-year-mode-matrix.mjs` reruns the source-bound evaluation in Windows and CI; tests pin 294 / 340 / 6 exact scores.

## 3. NEXT physics hypothesis test prepared for owner's local Swiss installation
`tools/n4-dasha-true-solar-native.mjs` compares **true sidereal and true tropical** solar longitude years to the same 20 immutable JHora8 GUI date exports, under UTC and original fixed local-offset date clocks, with 10 training / 10 held-out source charts. It uses file-backed native `@swisseph/node`, validates SHA256 of both DE431 *.se1 files and insists every returned Sun backend flag equals SWIEPH=2. It explicitly computes solar longitude roots by bisection instead of interpreting nominal years as fixed days.

The output is only aggregate source-matched counts, not original birth data; no automatic method switch or calendar "certificate" if a candidate happens to fit calendar days. `tools/n4-math-phase2-verify.ps1` runs this along with fixed-year, original JHora 8000, strict D2 profile and historical-time regressions, all in an isolated worktree and with no Docker or AWS changes.

## 4. Owner-assisted FINAL JHora year-mode evidence, when runtime reveals best physical model
A single targeted Windows JHora8 screenshot or export can remove the main documentation ambiguity:
1. Open original Jagannatha Hora 8.0 from the same prior authenticated installation and one existing JQA3 synthetic sample. DO NOT change options or create a real person's profile.
2. In the **Vimshottari Dasa** period table, right-click; locate **"Definition of year in Dasa"** (exact label/menu placement may vary by installed version). Screenshot the selected item and full available options. The original source INI recorded `YearDefinition=0 3`. Compare what option 3 actually means; do NOT assume it.
3. If JHora can show "date AND time" of major/minor boundaries, screenshot one or two original reference periods with time/zone. Source clipboard exports give only YYYY-MM-DD and cannot independently prove sub-day UTC.
4. Do not switch the production algorithm until independently checked original method/solar root corresponds to the menu, the 10-case holdout has strong exact matches, and future regression CI on the final SHA passes.

This targeted request is CONDITIONAL on the owner running the new code. It is not a new 50-file manual capture task.

## 5. Finite close-out criteria
A. Symbolic Shodashavarga rules: DONE at strict scope, only for the two exact D2/source-method pairs, with true original JHora and separate PyJHora evidence; physical source does not follow from this.
B. Actual physical production Lahiri/MeanNode/JQA3: prove same method independently on published/official original 20 cases, include Moon/Lagna arcsecond residuals and calendar UTC. Earlier 19/20 Lagna and 18/20 Moon accuracy targets mean not finished.
C. Vimshottari: run true solar comparison and resolve option 3 via original GUI; achieve specified independent exact-date parity on heldout sources or explicitly keep calendar dates uncertified / advisory only. No artificial tolerance that turns six-day errors into PASS.
D. IANA/law: clear only zones with documented provenance and known UTC branch, never globally assert every pre-1970 civil time or discard a DST fold.
E. D60: either independently justify full continuous physical longitude bounds and certified birth time, or retain provisional sectors and strictly exclude D60 from enhanced AI and positive stability claims. This is a product-safe close-out, not pretending full mathematical certainty.
F. Full CI, human-reviewed actual UK/EN AI corpus, approved math-to-UI handoff, separate PR merge and explicit production release permission.

## Reference provenance
- Original JHora 8.0 publisher: https://mail.vedicastrologer.org/jh/update_8.0.htm
- Author P.V.R. Narasimha Rao, *Vedic Astrology: An Integrated Approach*, 1.3.7 (solar year defined by 360 degrees of Sun motion). The passage does NOT identify GUI option 3.
- PyJHora independent 4.8.7 source: https://github.com/naturalstupid/PyJHora; license restricts it to isolated comparison only.
- Original JHora / physical / D60 records: docs/astronomy/N4_12_ORIGINAL_JHORA50_REAL_SOURCE_PARITY_20261106.md; docs/astronomy/N4_13_NATIVE_SWIEPH_EXACT_PROFILE_PLAN_20261106.md; docs/astronomy/N4_14_HISTORICAL_TIME_D60_FOUNDATION_20261107.md.

**This is a technical research release candidate, not completed public nativity certification. All production N4 switches remain OFF and redesign remains held.**
