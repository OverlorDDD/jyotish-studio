# Astronomical Events & Panchanga Engine — AE-P1/P2/P3/P4 (2026-10-27)

## Scope, released APIs and relationship to natal accuracy
This stage introduces an additive, read-only, stateless daily Panchanga. It does **not**
modify natal D1/D9/D10, the original 20 JHora 8 captures, the JQA-3 numerical/printed-date
certification or any database schema. The new calendar inherits the *same* verified-SWIEPH,
JHora8-history compatible Lahiri and Delta-T position adapters used by natal calculations.

- Routes: `/uk/panchanga`, `/en/panchanga`, exposed in main navigation.
- API: `GET /api/v1/panchanga/day?date=2026-10-27&zone=Europe%2FKyiv&latitude=50.4501&longitude=30.5234`.
- Optional query parameters: absent values default to **Kyiv** geographic coordinates,
  IANA zone `Europe/Kyiv`, and the current local date in that zone.
- Validation: year 1900–2099, exact ISO local civil day, real IANA time zone,
  finite coordinates (latitude strictly between ±90, longitude ±180).
- Method: five limbs sampled at **local sunrise**, not at midnight or noon.
  Current and following solar sunrise, sunset, each anga's crossing start/end,
  **every crossing during the sunrise-to-sunrise day**, and source-provenance tags.
- No LLM, AI promises, guessed transit times, persistent user locations, location
  database, extra Swiss data source or modified saved-chart records.
- Each returned calculated field is a mathematical observation. The website does
  not claim that a lunar phase guarantees a personal future event.

## Five limbs — precise mathematical contract
Given apparent geocentric **sidereal** Lahiri longitudes S, M:
- Elongation E = (M - S) mod 360°.
- Tithi = floor(E / 12°) + 1, 1–15 Shukla, 16–30 Krishna (30 slots).
- Nakshatra = floor(M / (360°/27)) + 1; pada = 1..4 in 3°20′ segments.
- Vāra = weekday of the **local civil day on which sunrise occurs**,
  Sunday = Ravivara .. Saturday = Shanivara.
- Nitya Yoga = floor(((S+M) mod 360°) / (360°/27)) + 1, 27 values.
- Karana = floor(E/6°), zero based in 60 half-tithis.
  Slot 0 Kimstughna, 1..56 repeating Bava..Vishti seven movable names,
  57 Shakuni, 58 Chatushpada, 59 Naga.
- All transitions are computed by bracketing and bisecting fresh Swiss positions
  to an **at most one-second time interval**, not by interpolating noon samples.
  End times are true UTC instants, rendered in the selected IANA zone.

**Important distinction:** one-second numerical root isolation does NOT mean the
sky event is independently physically accurate to one second in every situation.
Independent Panchanga reference/date/time comparisons are a separate acceptance gate.

## Astronomical adapter and rise/set conventions
Native `@swisseph/node` 1.4+ supplies Sun/Moon longitudes. It rejects calculated
results unless the **returned** Swiss flags attest SWIEPH rather than a silent
Moshier/JPL fallback. The historical JHora8 compatibility correction is applied
identically to the existing natal path; it is not fit to Panchanga results.

For local sunrise/sunset, the same Swiss C ephemeris is called through the
existing `pyswisseph` fallback binding and `swe_rise_trans`. This exposes
the standard **apparent upper limb at a flat sea-level horizon with atmospheric
refraction**, i.e. a location-specific astronomical rise/set convention. A
different religious convention (Hindu geometric centre, non-refracted disk,
specific elevation/obstructed horizon) may differ by minutes and must be
explicitly versioned before adding festival or muhurta logic.

The Python helper deliberately doesn't use Python's separate timezone database:
it returns candidate UTC rise/set instants; Node's existing IANA/Intl time-zone
source selects the requested local civil date, including daylight-saving days.
No sunrise / sunset (polar latitude) fails closed with 503 rather than a fake time.
There is no fallback to fixed 06:00 or 24-hour calendars.

## Required installed dependencies
No new astronomical package needed beyond the **existing** native Swiss binding
and Python fallback. In the project root on Windows:

```powershell
npm install
py -m pip install pyswisseph
docker compose up -d db
npm run dev:full
```

Compressed `.se1` files `sepl_18.se1` and `semo_18.se1` are expected in the
bundled `node_modules/@swisseph/node/ephemeris`, as in the natal adapter.
For a nonstandard installation, set `GALAXIORA_SWISS_EPHE_PATH` to the folder
containing the official files. Do **not** download unrelated SWIEPH archives or
enable Moshier fallback to manufacture a PASS. If Python is missing, the new
Panchanga API returns a clear 503; pre-existing natal calculations are unchanged.

## Windows acceptance and QA
```powershell
cd C:\Users\Note\jyotish-studio-git
git fetch origin
git switch fix/jqa3-windows-and-llm-recovery
git pull --ff-only origin fix/jqa3-windows-and-llm-recovery
npm install
py -m pip install pyswisseph
npm run test:panchanga
npm run jqa3:certify
npm run test:all
npm run build
npm run dev:full
```

Second terminal:
```powershell
$day = Invoke-RestMethod 'http://localhost:4000/api/v1/panchanga/day?date=2026-10-27&zone=Europe%2FKyiv&latitude=50.4501&longitude=30.5234'
$day.version
$day.sunrise
$day.boundaries
$day.changes | Select-Object kind,atUtc,nextIndex
```

Visit `http://localhost:3000/uk/panchanga` and `/en/panchanga`.
Check the same date for Kyiv, Delhi and London: local rise/set and local times
must change. Compare a boundary in Ukrainian and English: ISO UTC instant
must remain identical for the same inputs. On a DST transition date, check
the returned interval is measured sunrise→next sunrise (can be ~23/25 hours).
Negative checks: invalid date 2026-02-30 and latitude 91 -> HTTP 400;
unavailable Swiss data -> HTTP 503 and no synthetic results.

Browser E2E: `e2e/panchanga.spec.mjs`. Pure mathematics:
`tools/panchanga-core.test.mjs`; included in `npm run test:all`.

## Sources and additional verification (not copied source code)
1. Official Swiss Ephemeris programming manual: https://www.astro.com/swisseph/swephprg.htm
   (`swe_calc_ut`, return flags, rise/set `swe_rise_trans`).
2. Official `@swisseph/node` API reference:
   https://github.com/swisseph-js/swisseph/blob/main/docs/api/node.md
3. PySwissEph `rise_trans` test and documented function signature:
   https://github.com/astrorigin/pyswisseph/blob/master/tests/test_swe_rise_trans.py
4. Published Drik-Panchanga methodology and formula cross-check:
   https://sahikundli.com/methodology/panchanga-computation
5. The original library/module provenance and JQA3 method: `docs/research/
   jqa3-7-historical-lahiri-calibration-2026-10-27.md` and
   `docs/research/jqa3-acceptance-gate.md`.

## Next stages after AE-P4
- **AE-P5** exact new/full lunar phase, sidereal planetary ingress and stations,
  solar sankranti, bounded event discovery without blindly sampling daily.
- **AE-P6** verified natal star matching (Tarabala/Chandrabala), traditional
  Rahu Kalam and optional festival rules with region-specific reference
  acceptance; accurate eclipses incl. observer visibility.
- **Release precision gate** compare independently timestamped native astronomical
  reference cases across longitudes, DST, leap years and multiple latitudes. Keep
  JQA-3's 20-source certification independent from Panchanga event-time certification.
- **External operations** loading/performance, data/ephemeris licensing, cache
  strategy with privacy, accessible mobile, content editor acceptance.
