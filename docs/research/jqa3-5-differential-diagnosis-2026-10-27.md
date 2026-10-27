# JQA-3.5: precision failure triage and independent certification path — 2026-10-27

## Certification truth — not to be relabeled
- 20 independently pinned JHora 8.0 raw captures remain immutable. No edits to raw birth events, JHora coordinates, selected software options, hashes, signs or 1-arcsecond acceptance cutoff.
- 600/600 D1/D9/D10 sign matches and 9×9 Vimshottari **lord order** are independently supported by those sources.
- High-precision JHora compatibility is not certified: mean-Lahiri tropical ascendant **19/20** (case 12 = -1.0191374 arcsec); apparent geocentric sidereal Moon **18/20** (case 03 = +1.0588 arcsec; case 04 = -1.0609 arcsec).
- Exact JHora Vimshottari calendar dates are not attested. The source prints dates only, not sub-day transitions; the original selected `YearDefinition=0 3` is not independently mapped, even if a separate `YearLength=0 365.242500` field exists. Fixed-year production matching calendar days ≠ demonstrated JHora algorithm parity.
- `npm run jqa3:certify` deliberately exits nonzero if longitude/date gates fail. A PASS in `npm run jqa3:certify-signs` or `npm run jqa3:doctor` is NOT a full numerical certificate.

## Root-cause investigation system added
1. `npm run jqa3:doctor` executes the normal immutable-reference verifier and independently recomputes all 20 charts. It refuses to complete if source capture count or differential residuals disagree. `npm run jqa3:doctor:json` outputs detailed machine-readable statuses.
2. `tools/jqa3-precision-doctor.py` replays the original UTC clock and geocoordinates through Python Swiss Ephemeris, recording the runtime Swiss version and returned calculation flags. This detects silent ephemeris fallback when SWIEPH was only requested.
3. For Lagna, it records signed arcsecond residuals for (a) production tropical ASC minus mean Lahiri, (b) tropical ASC minus nutated Lahiri, (c) Swiss native sidereal houses, (d) sidereal houses with NONUT. These are competing diagnostic **hypotheses**, not permitted automatic corrections.
4. For Moon, it compares geocentric apparent sidereal Moon with NONUT, TRUEPOS, NOABERR and NOGDEFL variants. Those variants must not be chosen merely because a few tests pass. A separate ±1-second UTC sensitivity demonstrates whether birth-clock uncertainty could explain a small error.
5. Dasha candidate scan explores 360, 365, 365.24219, 365.2425, 365.25 and 365.25636 days, comparing original-JHora-Moon projections in UTC and captured local offset. It reports exact YYYY-MM-DD agreement scores and year-option proof as **UNKNOWN**, never promoting a best-scoring mode to certified.
6. CI runs `jqa3:doctor` separately as an evidence integrity and diagnostic gate. No JHora downloads needed for every PR, only the already pinned original evidence.

## Evidence and source ranking
- Primary: original JHora 8.0 application binary, DLL version/hash, raw clipboard JHora exports and saved `jhora.ini` from the same calculation.
- Mathematical API: Swiss Ephemeris official programming manual (https://www.astro.com/swisseph/swephprg.htm), including UT vs TT, `SEFLG_NONUT`, sidereal houses, return flags.
- Provenance context: JHoraKit reverse-engineered notes (https://github.com/normalmystic/JHoraKit/blob/main/JHoraInternals.md), particularly older Win32 `swedll32.dll` imports and preference maps. Reverse engineering is not an authoritative guarantee of a particular JHora math algorithm.
- Secondary: author's work and contemporary software explaining multiple Vimshottari year conventions (https://www.vedicastrologer.org/); third-party tutorial material cannot replace the selected JHora code 3 mapping.

## Bounded external experiment needed to close last 3 cases
1. Install precisely SHA-matched JHora 8.0 executable used in captures. Extract **SHA256 and numerical version of swedll32.dll** from that same installation, plus any ephemeris data-file checksums. Never ship the proprietary DLL in the repository.
2. Recompute captures `jqa3-12` (Lagna) and `jqa3-03` + `jqa3-04` (Moon), each with identical original UTC, latitude, longitude and JHora preferences. Compare old JHora DLL, current Swiss, sidereal house mode, mean/nutated Lahiri, and input precision. Preserve the actual calculations and independent reviewer sign-off; do not insert fitting coefficients.
3. From JHora **GUI preference string/help** prove what option 3 means. Record original output both under option 3 and explicitly fixed `365.2425` mode, plus each displayed local date, time-zone/offset and **boundary time** where supported. If only dates are available, certify date-only separately; exact UTC transitions remain unverified.
4. Establish reference uncertainties. At longitude precision 0.01″, display rounding is at most about 0.005″; this alone cannot explain measured 1.02–1.06″ misses. Verify JHora DLL version, delta-T/UT implementation and source coordinate/time precision before considering a production algorithm change.
5. Only apply a documented physically justified production change supported by that controlled external experiment; version the calculation convention, migrate/recompute old persisted charts explicitly, rerun all 20 originals and native/Python parity, then full `jqa3:certify`.

## Pass conditions
- Original immutable independent cohort: >=20, 12 distinct Lagna signs, compatible calculation profiles and no corruption.
- Lagna 20/20 and all nine planets 20/20 within **unrounded ±1.0000″**; 600/600 D1/D9/D10 remains PASS.
- Vimshottari 9 Mahadasha + 81 Antardasha boundaries per original case agree in both correct sequence and selected **independently attested** year method. Calendar dates and exact instants are separate claims; never silently use an unknown timezone.
- Production native Node and Python Swiss versions/flags tested and source features read from original JHora outputs. Missing proof => `NOT_CERTIFIED`.

## Favicon correction
`apps/web/app/icon.svg` now has a **full-bleed opaque navy 64×64 rectangle** before the artwork, so browser UI does not render transparent corners black. New installation may require hard reload of browser favicon cache.
