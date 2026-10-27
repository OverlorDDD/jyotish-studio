# Galaxiora astronomical foundation — fail-closed SWIEPH backend audit (2026-10-27)

## Empirical reproduction
With Python pyswisseph 2.10.03 on an environment with no compressed Swiss data, `swe.calc_ut(jd, MOON, FLG_SWIEPH|FLG_SIDEREAL|FLG_SPEED)` returns flag 65860, whose backend mask `& 7` is **4 (MOSEPH)** instead of requested **2 (SWIEPH)**. This is a documented Swiss Ephemeris fallback, **not** proof that all current site natal charts were computed by MOSEPH.

## Propagation
`getEphemeris()` -> `calculateChart()` -> D1/D9/D10/lagna, graha and nakshatra -> Vimshottari (Moon longitude).
`getEphemeris()` -> `dailyTransit()` -> public daily/weekly horoscope, Personal daily/transit and timing calculations. Other systems using this source transit are in the same blast radius.
Tarot/Yoga/News/Forum have no direct dependence on astronomical Swiss calculation: do not add Swiss libraries to those systems.

## Code remediation
- Native `@swisseph/node` returns `PlanetaryPosition.flags` (documented). Validate for every graha including mean node using a tested pure `assertSwissReturnFlags()` module. Native package documents bundled Swiss data; validate actual result regardless.
- Python fallback now checks `ret & 7 == FLG_SWIEPH` for every planet. Without data, raise rather than returning silently different calculations. `GALAXIORA_SWISS_EPHE_PATH` optionally points to **official** ephemeris directory. No mode was manually adjusted to force JHora reference parity.
- CI runs guard tests. This may surface a previously unnoticed deployment misconfiguration; treat such error as honest nonavailability, not a reason to disable the guard.

## License and third-party selection
- https://github.com/astrotools/SwissEphemeris archived 2018, OS X/iOS port, not a suitable maintained production engine.
- https://github.com/naturalstupid/PyJHora is AGPL-3.0 with rich independent **traditional interpretation** algorithms but it uses pyswisseph for positions, thus not an independent astronomy source. Useful as validation for D9/D10, dasha and Panchanga, not replacement.
- https://github.com/VedAstro/VedAstro MIT-licensed Vedic logic; its cloud/Python clients also ultimately use Swiss Ephemeris, not a fully independent numerical proof.
- https://github.com/aloistr/perl-sweph is the original Swiss Ephemeris's Perl interface; the same mathematical engine, different binding.
- https://www.astro.com/swisseph/swedownload_e.htm is the official place for data files, including latest compressed planet/Moon files and JPL, alongside programming docs.
- Swiss Ephemeris itself is **dual licensed** (AGPL or paid professional licence). Current site root is AGPL-3.0-only; evaluate licence and commercial deployment plans separately.

## Unresolved / separate from this correctness fix
JHora version 8.0 used Swiss Ephemeris 2.02.01 and DE431. A second library written around modern Swiss is not independent JHora compatibility proof. Subarcsecond parity remains Lagna 19/20, Moon 18/20 and JHora exact Vimshottari transition instants not certified until original binary/method is attested. Preserve exact independent fixtures and 1 arcsecond criterion.
