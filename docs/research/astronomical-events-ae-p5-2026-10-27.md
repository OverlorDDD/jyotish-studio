# AE-P5 — Astronomical Events Engine, October 27, 2026

**Integration branch:** `fix/jqa3-windows-and-llm-recovery`.
**Status:** implementation pushed; full GitHub CI acceptance is tracked separately.

## Scope

AE-P5 upgrades the Panchanga page with a separate, location-independent
geocentric astronomy timeline for 1–30 **local IANA civil days**.

1. Exact new, first-quarter, full and last-quarter lunar phases. A phase
   crossing is defined by apparent geocentric ecliptic Moon−Sun longitude
   equal to 0°, 90°, 180° or 270°, modulo 360°. This is **not** an eclipse
   prediction and is not a topocentric/visual illumination maximum calculation.
2. Planetary sign ingress (sidereal **Lahiri**) for Sun, Moon, Mercury, Venus,
   Mars, Jupiter and Saturn. Both prograde and retrograde sign crossings
   are represented, including wraparound Aries/Pisces.
3. Stationary → retrograde and stationary → direct events for Mercury, Venus,
   Mars, Jupiter and Saturn, from the sign change of geocentric sidereal
   longitude speed (degrees/day). Neither Sun/Moon nor mean lunar nodes are
   reported as having these stations.
4. Source proof: Native `@swisseph/node` with requested **and returned**
   flags explicitly checked for SWIEPH (no silent Moshier fallback).
   `SEFLG_SPEED` is required for all calculations. The shared
   `createVerifiedSiderealPlanetAt()` handles **both** AE-P5 and Panchanga,
   preserving the JQA-3 attested historical Swiss 2.02.01-compatible
   Delta-T/Lahiri convention in one place. Natal chart calculation is unchanged.
5. Each event is located by bounded bracketing followed by bisection to an
   interval at most 1 second wide. This is numerical root isolation, not an
   independent claim of UTC astronomical accuracy to ±1 s.
6. No database changes, user identifiers, birth data, AI model calls, extra
   ephemeris packages, or external downloads.

## Interface

- `/uk/panchanga`, `/en/panchanga`: the new **Астрономічні події /
  Astronomical events** panel appears even if a separate sunrise
  calculation fails.
- Switch between 7 or 30 days, filter all / lunar phases / sign ingresses /
  retrograde stations, see time-zone-localized timestamps and provenance.
- Scope follows the **applied** date/timezone input, not unsubmitted edits.
- API query: `GET /api/v1/astronomy/events?start=2026-10-27&days=7&zone=Europe%2FKyiv`.
- The window is [local midnight, local midnight after N days), converted to
  UTC by IANA rules for both endpoints. A DST switch changes the exact UTC
  window length rather than fabricating a fixed 24-hour day.
- API limits days to integers 1..30, time zones to real IANA zones and
  dates to the historical Swiss convention era. Errors: 400 bad inputs,
  503 if verified Swiss is missing. Successful responses are cached for
  5 minutes in a bounded, in-flight promise cache (no private information).

## Accuracy and independent certification

The 20-chart JQA-3 `CERTIFIED` gate (600/600 signs, 200/200 longitudes
within 1 arcsecond, 180/180 printed Maha and 1620/1620 printed Antara dates)
remains completely separate from **AE-P5 event-time verification**.
JHora original date captures are not independent timestamps for lunar
phases, ingress or planetary stations. The API therefore always returns
`independentEventTimeCertified:false`.

Full acceptance of a reference-grade AE-P5 requires a separately pinned
multi-decade reference suite of independent timestamp exports with explicit
sidereal mode, geocentric/apparent model, ΔT and rounding; include ingresses
during retrograde, station near sign cusp, one lunar phase at 360°,
DST transition time zones, and observational differences near midnight.
Until this is available, AE-P5 is an operational astronomical calculator
with unit and real-browser verification, not a separately certified oracle.

**Official source:** Swiss Ephemeris programming manual:
https://www.astro.com/swisseph/swephprg.htm
(`swe_calc_ut`, `SEFLG_SPEED`, `SEFLG_SIDEREAL`, returned backend flags).

## Tests and Windows instructions

```powershell
cd C:\Users\Note\jyotish-studio-git
git status --short
git fetch origin
git switch fix/jqa3-windows-and-llm-recovery
git pull --ff-only origin fix/jqa3-windows-and-llm-recovery
npm install
npm run test:astronomy
npm run test:panchanga
npm run jqa3:certify
npm run test:all
npm run build
npm run dev:full
```

In a second PowerShell window:

```powershell
$events = Invoke-RestMethod 'http://localhost:4000/api/v1/astronomy/events?start=2026-10-27&days=7&zone=Europe%2FKyiv'
$events.version
$events.independentEventTimeCertified
$events.events | Select-Object kind,body,atUtc,localDate,fromSign,toSign,motion | Format-Table -AutoSize
```

Expected API version `astronomical-events-v1`. The result must include
at least one true Moon sign ingress in seven days and every event UTC time
inside `[startUtc,endUtc)`. The website's filter does not replace the
underlying complete event list.

Test 30-day mode and UA/EN date rendering, the month containing a station,
an event close to a local midnight, and the DST switch. Invalid
`days=31`, `days=0`, `start=2026-02-30` and unknown zone must fail 400.
A missing ephemeris must fail 503 — **never** return synthetic events.
Real HTTP and Chromium acceptance scenarios:
`e2e/astronomical-events.spec.mjs`.
Pure astronomical math tests:
`tools/astronomical-events.test.mjs`, included in `test:all`.

## What comes next: AE-P6

- Separate independent Drik/reference benchmark for Panchanga and AE-P5.
- Topocentric eclipse candidates + validated observer visibility (must
  distinguish geocentric syzygy from an actual eclipse).
- Tarabala and Chandrabala relative to **verified user natal Moon**;
  user account and privacy gates apply.
- Explicitly region/method-versioned festival and muhurta policies
  (local sunrise, day cutoff, refraction, elevation, traditional school).
- Performance budget and bounded APIs before mass public traffic;
  owner visual acceptance on Windows and mobile.
