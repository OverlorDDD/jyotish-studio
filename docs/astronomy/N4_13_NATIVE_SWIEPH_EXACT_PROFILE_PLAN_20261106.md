# N4.13 – Native @swisseph/node strict SWIEPH JHora compatibility research
Date: 2026-11-06. Draft PR #120; NO existing production ephemeris, API contract, database, N4 feature flags or pre-certified D1/D9/D10 modified.

## Research and invariant
Private original JHora source: 50 unique synthetic JHD/GUI records, 8000/8000 source-profile symbolic signs. Prior independent `pyswisseph` result was returned **MOSEPH=4**, not native production SWIEPH. Not a production certificate.
Owner original JHora installed INI: `UserSelectedAyanamsa=17` (True Chitrapaksha); `TruePositions=1`, `TrueNodes=0`, `TopocentricPositions=0`, `NoNutation=0`. Empirical reconstructed ASC: tropical ASC minus true-Citra reference-star ayanamsa with `TRUEPOS|NONUT`. Note this is an observed JHora parity convention, not a claim to reverse-engineer undocumented implementation.
@swisseph/node upstream core Enum: SiderealMode.TrueCitra=27, CalculationFlag.SwissEphemeris=2, TruePositions=16, NoNutation=64, Sidereal=65536, LunarPoint.MeanNode=10. Official manual clarifies TRUEPOS is geometric, and NONUT independently modifies fixed-star True Citra ayanamsa.
Critical consequence: N4.13 is a *separately named* exact-profile research CLI. It does not call or alter `apps/api/src/ephemeris.ts` Lahiri-based, delta-T calibrated JQA3 production calculation. It does not enable the default D2 Uma-Shambhu or change existing D1/D9/D10.

## Code and independent fail-closed gates
- `tools/n4-native-swieph-exact-profile.mjs`: dynamically loads native project-installed `@swisseph/node`, checks bundled actual ephemeris files `sepl_18.se1` and `semo_18.se1` (sizes and SHA256), passes explicit setEphemerisPath, sets SiderealMode.TrueCitra and exact flags. For 8 separately native-computed Sun/Moon/planets/MeanNode checks returned backend `(flags & 7) === 2`; unknown and MOSEPH are hard errors.
- Native `getAyanamsaExUt` returns a scalar, not raw backend flags. **Do not claim independent ayanamsha SWIEPH flag verification**; still require source-compare of the actual ayanamsha and bound ephemeris files. For Lagna compute tropical Ascendant minus `TrueCitra` ayanamsa requested with `Swiss|TruePositions|NoNutation`. For grahas request native `Swiss|Speed|TruePositions|Sidereal`; Ketu = mean Rahu +180.
- On `--reference PRIVATE_JSON`: check all original source hashes, method D2 US/D60 Trd, all 16×10 source-derived signs via existing original JHora50 gate; independently check each synthetic source UTC against nominal local clock and source tz, all 50 native physical placements and all 8000 independently computed signs. Tolerances pinned prior to running: Ascendant <=0.5 arcsec, Sun <=0.5, Moon <=3, Rahu/Ketu <=0.5, other grahas <=2, ayanamsa <=0.5. Any >threshold, missing original data or wrong source ID fails closed. This is **an exploratory parity tolerance**, not a universal accuracy guarantee for D60.
- `--smoke`: validates native `@swisseph/node` SWIEPH file readiness and returned flags but **DOES NOT certify 50 JHora cases**. GitHub CI will run only smoke + fake shape/negative tests; no secret source data is put in public GitHub Actions. Never report smoke as 50-case PASS.
- Private reference is available in the user's ChatGPT-provided audit ZIP `N4_12_50_ORIGINAL_JHORA_SANITIZED_REFERENCE_PRIVATE.json` and must not be published. Run complete certification locally against this file only with native dependencies installed in same checkout, output private diagnostic.

## Blockers explicitly addressed
1. `@swisseph/node` no longer being silently mistaken for Python MOSEPH: assert actual returned flags on each numeric planet calculation.
2. Sidereal system contamination: do not share native process between existing JQA3 Lahiri and N4.13 TrueCitra; run separate CLI research process.
3. No hidden disk fallback: require two true Swiss `.se1` datasets for years 1990–2020 before generating any result.
4. No source independence false positives: SHA bind original reference, use separate native physics vs original source-sign method parity. CI without original private reference tests only structural guards and native flags.
5. No automatic threshold tuning to pass source; fixed explicit tolerances, per-body worst-case deviations and mismatch IDs.
6. Historical time zones and D60 birth-time uncertainty remain N4.14; strengths, Vimshottari remain N4.16, and automatic N4 production release remains forbidden.

## Acceptance / next engineering action
- GitHub CI native smoke and unit negative tests pass, site CI green.
- Full private 50×10 source physical positions and 50×16×10 signs run using the installed real native `@swisseph/node` and source original data; report all angular residuals and actual backend flags. No hardcoded expected results in code.
- Independently cross-check at least the original +0.01″ printed rounding and time-scale model for physical differences; isolate if Moon residual exceeds 3″ or Lagna boundary fails.
- Only after independent SWIEPH 50-case PASS can mark N4.13 exact-profile *diagnostic complete*; N4 release remains blocked by N4.14–N4.16 and human review.

References: https://www.astro.com/swisseph/swephprg.htm ; https://github.com/swisseph-js/swisseph/blob/main/docs/api/node.md ; https://github.com/swisseph-js/swisseph/blob/main/packages/core/src/enums.ts
