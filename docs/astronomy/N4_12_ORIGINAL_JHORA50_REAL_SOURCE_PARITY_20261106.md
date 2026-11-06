# N4.12 – Actual original JHora8 50-case research audit, 2026-11-06

**Research result: source-confirmed, method-aligned Shodashavarga mathematical sign parity 8000/8000. This is NOT permission to deploy the N4 charts.**

## Owner original unmodified Windows binaries and source captures
- Original binary SHA-256: 3DDBE5FB0458AD1F0AD91B002C7EFB8BBA9F08891D3F46190ABA97D570B17908. Publisher signature not independently authenticated.
- Case 001 original Windows GUI Ctrl+C archive SHA256 a69f95b3613f18eddce79c7045da4df599371ad6c3744635fae79b1faaed9893.
- Cases 002–050 original Windows GUI main Ctrl+C archive SHA256 9a93eb3e2c3f1882648f6defa5e9919204a130e124e19419aff1b44ef3e10db1.
- All 50 exact synthetic dates, local timezones, source place lat/lon and names verified directly from original raw text. No original source duplicates; source signatures matched batch manifest.
- Independent Python native JHora South-Indian ASCII chart parser cross-validated 7840 results against Windows-produced JSON. Source-extracted 8000 signs compared against independently implemented D1/D2 US/D3...D60 rules, **8000/8000** with no body closer than 1 arcsecond to a fractional-sign boundary.

## The hidden Swiss calculation flags resolved
Original owner INI has UserSelectedAyanamsa=17 (True Chitrapaksha), TruePositions=1, TopocentricPositions=0, TrueNodes=0.
- Apparent planet positions (without SEFLG_TRUEPOS) differ from JHora by up to 77.7 arcseconds; with SEFLG_TRUEPOS=16, 50-epoch geometrical planet locations agree: Sun max 0.0501 arcsec; Moon max 1.9364 arcsec; all other planets max 0.6579 arcsec. Explicit backend **MOSEPH**, not SWIEPH, was used in this independent diagnostic.
- Lagna must be computed from tropical SWISS ascendant minus TRUE_CITRA ayanamsa evaluated with **SEFLG_TRUEPOS|SEFLG_NONUT**; this reproduces 50 JHora Lagna values to max 0.0087 arcsec and 50 printed ayanamshas to max 0.0118 arcsec.
- This resolves the single naive sidereal-houses D60 Lagna mismatch in synthetic #049. Independent Swiss Moshier sidereal signs align across all **8000/8000** source positions with this exact profile.
- SWIEPH file-verified native Galaxiora production adapter NOT YET EXECUTED for this exact TrueCitra+TRUEPOS profile. Production currently uses historically calibrated Lahiri/apparent from 20-profile JQA3. NEVER silently switch production or use MOSEPH as proof of SWIEPH.

## D2 methodological blocker
- Original JHora GUI D-2 (US) = Uma-Shambhu. Current Galaxiora core D2 = Sun/Moon Cancer/Leo. On 50 source cases, original D2 matches legacy only **80/500**, and **420/500** cells differ by valid method selection.
- Method-aware gate added in tools/n4-original-jhora50-reference-gate.mjs; it accepts separately sanitized, SHA-bound original 50-case reference vectors with explicitly tagged D2 US and D60 Trd. It does NOT treat method differences as formula defects. Synthetic gate tests are only structural, NOT independently recorded source.
- Original raw captures, exact personal INI, derived 8000-cell private comparison CSV and private sanitized reference remain user-supplied/private, not published in this GitHub repo.

## D60 and birth time reliability
Swiss sample ±15s changes D60 Lagna sign on 11/50 synthetic profiles, ±30s on 25/50, ±1m on 46/50 and ±2m on 50/50; sampling alone is not a continuous stability certificate. Any user-facing D60 guidance must show time uncertainty limitations.

## Next stages
1. N4.13: run explicit, separately named JHora compatibility math profile against production's @swisseph/node **SWIEPH** (verify returned backend flag 2 and real sepl/semo files), 50 exact independent positions, all 8000 signs, no regressions to existing JQA3 Lahiri.
2. N4.14: verify historical time zone/DST and true D60 time sensitivity windows; do not treat unknown birth-time precision as certifiable.
3. N4.15: expose method labels, D2 Uma-Shambhu plus optional Sun/Moon, gallery UI 16 D maps and UA/EN interpretations with no duplicate filler.
4. N4.16: independently compute and verify Vimshottari dates and source Shadbala, Ashtakavarga and Vimsopaka. Do not ask an LLM to invent exact strengths.
5. Only when all production SWIEPH and interpretation/accessibility gates are passed, owner-approved merge and deployment. N4 current draft flags stay OFF.

Source manual: https://www.astro.com/swisseph/swephprg.htm; source True Citra: https://github.com/astrorigin/pyswisseph/blob/master/docs/programmers_manual/sidereal_mode.rst

**This report documents a strict mathematical method-matching diagnostic on synthetic charts. It is neither a scientific verification of astrology nor proof that the site's existing production ephemeris already has this profile.**
