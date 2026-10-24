# JQA-3 certification gate audit — 2026-10-24

## Final outcome: verified **SAME-PROFILE SIGN PARITY**, not fabricated full numeric equivalence

Evidence sources: 20 original Jagannatha Hora 8.0 captures `jqa3-01`…`jqa3-20`; exact unmodified
`chart_data.txt`, `divisionals.txt`, `capture.json`, `jhora.ini`, `input.jhd`
SHA-pinned in `tests/fixtures/jhora-corpus/`. Additional historical Gandhi fixture has
**no original INI** and must NOT affect certification of the 20 profile-attested charts.

Official check:
```
npm run jqa3:certify-signs
```
CI executes this command as a **failing release gate**. Output:
`SIGN_PARITY_CERTIFIED` with `signParityCertified=true` and
`precisionCertified=false`, backed by 20 independently captured source charts
and 12 signs of lagna. Running `npm run jqa3:certify` still fails unless
the *separate* one-arcsecond longitudes AND dates/active year mode pass.

### What was wrong with the old certifier?

1. It demanded `dashaYearVerified=true` inside `hasComparableProfile`, including for
   D1/D9/D10 comparisons that do not use a Vimshottari year definition. All 20
   valid astronomical profiles were incorrectly reported as `UNVERIFIED`.
2. It used `results.every(...)` over ALL records, including the known Gandhi
   reference without INI. That made the criterion mathematically impossible
   even if all 20 properly attested source charts passed.
3. It collapsed *sign-level correctness*, subarcsecond source differences,
   nakshatra and calendar method into one `CERTIFIED` boolean.
4. `YearLength=0 365.242500` was misinterpreted as proof of the *selected*
   JHora dasha-year mode, without checking the separate, actually recorded
   `YearDefinition=0 3` selector (retained in audit; option mapping not attested).
5. The website displayed the older ONE-chart, different-config Gandhi 8/10
   D9 and 7/10 D10 diagnostic after 20 matching same-method records had
   already been imported. This is now replaced with the 20-chart result.

### Independent same-profile evidence

Per original JHora capture, for each of Lagna, Sun, Moon, Mars, Mercury,
Jupiter, Venus, Saturn, Rahu and Ketu:

| Domain | Same-profile sign matches |
| --- | ---: |
| D1 | **200 / 200** |
| D9 | **200 / 200** |
| D10 (traditional 1–9) | **200 / 200** |

No mismatch was observed in these 600 signs across 20 charts.
All 12 lagna signs covered. Also verify the separately recorded nakshatra,
pada, retrograde status, and Parashari house-lord mapping in the official
`jqa3:certify-signs` gate.
This is **empirical independent fixture coverage**, not a mathematical proof
that every imaginable date, border case, ayanamsa or ephemeris variant works.

### Exactly what is still different?

The program's 1 arcsecond *coordinate* target is NOT identical to correctness
of signs. An independent 20-chart re-run (Python Swiss / 20 original JHora text
captured by the pinned source) found 178/200 longitudes within 1 arcsecond;
among seven classical planets 138/140, with a worst Moon discrepancy ~1.061″.
The 20 Lagna longitudes were off by up to ~18.57″, while their signs and
divisional signs were identical. These are transparent separate metric failures.
The original JHora release uses an older Swiss ephemeris version compared with
modern Swiss adapters (see author's JHora 8.0 release notes). Do NOT silently
increase tolerance from 1″ to 20″ or claim equivalence without identifying
the geometry and ephemeris conventions first.

**Vimshottari:** The observed Mahadasha and Antardasha **order/120-year classical
proportions are independently well-defined**, but production's 365.2425-day
calendar starts are not a date-for-date match to the archived JHora outputs.
A direct comparison of all 20 captured tables against the production formula
gave only 38/180 identical Mahadasha start dates and 286/1620 identical
Antardasha start dates, with Mahadasha offsets typically 1–5 calendar days.
JHora's INI explicitly records `YearDefinition=0 3` as well as
`YearLength=0 365.242500`; they are NOT synonymous. Determine the meaning of
year-definition choice 3 or capture a new JHora export selecting the explicit
365.2425-day mathematical option before requiring date-for-date agreement.
Do not change the production Vimshottari algorithm to maximize test scores.

### Acceptance and next bounded task

- **DONE now:** correctness of D1/D9/D10 signs for the attested corpus is
  certified; Windows SHA-pinned original evidence, release CI, and UI versioned.
- **Next independent high-resolution reference:** demonstrate the JHora/Swiss
  geometric ascendant convention and numeric source backend. Either agree to
  an explicitly justified longitude tolerance reflecting the source's usable
  precision, or retain subarcsecond mismatch as an independent release warning.
- **Next dasha-mode provenance:** record the JHora *selected* definition of
  year and verify a second independently captured 9×9 Vimshottari table with
  precisely the *same year definition as Galaxiora*; correct a mathematical
  error only if one is demonstrably present.
- **Do not block unrelated visual UX work:** branding, information architecture
  and site navigation can undergo preview/beta review independently. Do not
  equate a green site CI or a sign certificate with full astronomical precision.

Neither the historical Gandhi reference nor missing external preference
metadata can masquerade as a modern calculation error.
