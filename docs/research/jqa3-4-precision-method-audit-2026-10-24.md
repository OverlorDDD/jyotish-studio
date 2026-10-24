# JQA-3.4 — Independent precision-method and test-gate audit (2026-10-24)

## Scope and reproducibility

This is a **bounded method investigation**, not a full 1-arcsecond/calendar certificate. The 20 original JHora 8.0 exports and their SHA-pinned ini / clipboard / JHD files in `tests/fixtures/jhora-corpus/` are unchanged. The separate Gandhi recording without original INI does not count as a matched profile. Before this investigation sign parity was 200/200 D1, 200/200 D9 and 200/200 D10 (600/600), all 12 Lagna signs covered, and all nine-by-nine Vimshottari lords in order.

A comparison was independently replayed against the 20 raw JHora coordinates with **pyswisseph linked to Swiss Ephemeris 2.10.03**. Use original UTC and geographic decimal coordinates, `SIDM_LAHIRI`, apparent/tropical Placidus ascendant from `houses(jd,lat,lon,b'P')`. Compare candidate sidereal ascendants from two ayanamsa conventions:

- Legacy implementation: tropical ascendant minus `get_ayanamsa_ex_ut(jd,FLG_SWIEPH)`, i.e. **nutated/true** Lahiri.
- Revised JHora-compatible observational candidate: same tropical ascendant minus `get_ayanamsa_ex_ut(jd,FLG_SWIEPH | FLG_NONUT)`, i.e. **mean** Lahiri.

The Swiss Ephemeris [programming manual, section 12.2](https://www.astro.com/swisseph/swephprg.htm) explicitly documents `SEFLG_NONUT` versus default nutated ayanamsa; this is a documented *astronomical* difference, not a numerical fit coefficient. The pinned [JHoraKit internal analysis](https://github.com/normalmystic/JHoraKit/blob/f63826b501eabe69c6b08c5365875e1e2f74c24a/JHoraInternals.md) documents JHora 8.0 Swiss DLL usage and its separate ayanamsa modes. The 20-export agreement **does not prove JHora's exact internal house algorithm** or make an old and a modern ephemeris DLL bitwise identical.

## Comparison: signed angular residuals in arcseconds, candidate minus original JHora

| JHora capture | Legacy true-ay. Lagna | Revised mean-ay. Lagna | Unchanged Moon |
|---|---:|---:|---:|
| 01 | +8.4430 | +0.7208 | -0.2591 |
| 02 | +15.4151 | -0.5755 | +0.0877 |
| 03 | +15.2298 | -0.4900 | **+1.0588** |
| 04 | +6.9552 | -0.3084 | **-1.0609** |
| 05 | -2.1834 | +0.1149 | -0.5577 |
| 06 | -14.5326 | +0.1988 | -0.4895 |
| 07 | -18.5704 | -0.4022 | -0.5723 |
| 08 | -15.5910 | +0.4225 | -0.2782 |
| 09 | -2.5002 | -0.0342 | +0.8398 |
| 10 | +7.5158 | -0.0601 | +0.4612 |
| 11 | +18.1467 | +0.2993 | +0.9295 |
| 12 | +16.0554 | **-1.0191** | +0.0621 |
| 13 | +11.3025 | -0.2745 | +0.7735 |
| 14 | -1.7648 | +0.2310 | +0.1000 |
| 15 | -9.9449 | -0.3148 | -0.9770 |
| 16 | -15.3746 | +0.1349 | +0.6109 |
| 17 | -15.0901 | -0.0790 | +0.8718 |
| 18 | -3.9125 | +0.5187 | +0.9843 |
| 19 | +3.8570 | +0.2105 | +0.1452 |
| 20 | +11.9250 | +0.4048 | +0.6599 |
| **Within strict 1.0000″** | **0/20** | **19/20** | **18/20** |
| **Maximum absolute difference** | **18.5704″** | **1.0191374″** | **1.0609051″** |

These were calculated from unrounded longitudes; table values are presentation-only. The lone remaining Lagna residual is capture **12**, not a zero after rounding. Moon is still outside 1″ in captures **03 and 04**. Planetary positions and metadata ayanamsa were intentionally **not changed**; prior planet 178/180 remains the baseline.

## Assertion-by-assertion evaluation

| Claim tested | External evidence / standard | Test validity and disposition |
|---|---|---|
| JHora original fixture immutability | Pinned JHoraKit capture SHA-256, Git object SHA, raw original files and original INI | **Valid.** Keep all original bytes and allow precisely-defined Windows checkout CRLF canonicalization only for pinned text. |
| 600 D1/D9/D10 signs and nakshatra/pada | 20 raw JHora clipboard exports, ten independently exported positions per chart, all 12 Lagna signs | **Valid scoped empirical verification**, not proof for all dates/boundaries; remains independent PASS. |
| Seven classic retrogrades / 12 Parashari sign lords | Original speed/retrograde marks plus fixed classical ruler lookup | **Valid for the declared rule**, but ruler results are rule-derived, not exported JHora house-lord statements. Keep the source wording precise. |
| Ascendant 1″ | 20 JHora longitudes versus Swiss modern computed geometry | **Old formula's method mismatch demonstrated.** Revised source-compatible mean-ay. candidate gives 19/20 but still cannot certify 20/20 or prove DLL parity. |
| Nine planets 1″ | Original hundredth-of-arcsecond JHora text against same-time Swiss | **18/20 Moon, 178/180 all planets**. Two strict misses are not evidence of a sign or D9/D10 bug; older JHora DLL / rounding / ephemeris input differences still need *external* diagnosis. |
| 1″ boundary after formatting | Unrounded circular longitudes vs raw JHora values | **Test defect fixed**: body aggregate previously evaluated four-decimal rounded residual; now judge full precision and only round when printing. Added positive/negative boundary tests including wraparound. |
| Vimshottari 9x9 lord order | Real printed JHora tables | **Valid PASS** for sequence alone. |
| Vimshottari YYYY-MM-DD parity | JHora year-definition option / civil clock not yet decoded, distinct from fixed `YearLength=0 365.242500` | **Not comparable as a full independent same-mode calendar certificate**. Keep all 38/180 and 286/1620 observed date matches in audit; do not relabel those differences a Galaxiora bug. |
| Claim year mode attested on import | Raw INI `YearDefinition=0 3` and `YearLength=0 365.242500` | **Defective authorization fixed:** a recorder string and stored length alone cannot attest the selected algorithm. Future normalized imports fail closed until independently documented mode mapping. |

## Production change, compatibility and risks

Both `apps/api/src/ephemeris.ts` and the Python fallback `tools/swiss_ephemeris.py` use mean Lahiri for the **rising point only**, while existing true/nutated Lahiri metadata and sidereal graha remain unchanged. New `CalculatedChart.config.ascendantConvention='tropical-apparent-minus-mean-lahiri-v2'` records the new interpretation. Existing saved charts and their earlier rendered interpretations are **not rewritten**, nor silently claimed to have been recalculated. When old snapshot data is displayed, it is a historical chart snapshot without that v2 tag. A future migration/recalculation UX should explicitly handle legacy records before cross-version historical chart comparisons or personalized transit releases.

The source JHora application uses an older Swiss library version; even a strong geometric explanation is **not** a validation of all planet coordinates to 1″. Do not silently increase tolerance, change JHora reference bytes, alter Sun/Moon dates or manipulate the 120-year Vimshottari model. `npm run jqa3:certify-signs` can PASS while `npm run jqa3:certify` MUST continue to fail.

## The explicit missing external proof (finite next action, not an endless test cycle)

To close the **remaining 1.019″ Lagna** and **two ~1.06″ Moon residuals**, obtain the exact JHora 8.0 `swedll32.dll` numerical version or a controlled original calculation using the same Swiss ephemeris edition and its input precision/house algorithm, checking captures 12, 03, 04. The originals already establish the JHora values; what is missing is a version/method-matched *second* computation. No arbitrary 1.1″ grace pass.

For **Vimshottari**, acquire a source/help/GUI mapping of JHora 8.0's actual `YearDefinition=0 3` plus at least one controlled original JHora export explicitly selecting the **fixed 365.2425-day mode** (or an independently verified equivalent), showing both UTC and local date/time and boundary dates. Then test exact Julian instants and day rounding before declaring YYYY-MM-DD parity. None of the 20 archived captures independently proves that choice 3 uses the stored `YearLength`.

**Release decision:** JQA-3.4 correction and negative gates can be engineering-CI green, but **full subarcsecond and Vimshottari calendar certificate remains NOT_CERTIFIED** until external same-method evidence. Do not mislabel a visual/design beta or a green general CI as this certificate.
