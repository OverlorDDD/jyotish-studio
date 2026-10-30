# AE-P6 — Verified personal lunar calendar, eclipse geometry and local traditional periods

Date: 2026-10-27. Development branch: `fix/jqa3-windows-and-llm-recovery`.

## Stage plan and delivered scope

**AE-P6.1 Personal Tarabala / Chandrabala**
- No birth data in public requests. Require authenticated user and an **owner-selected, verified/recovered current natal chart** using existing `resolvePersonalChart` rules.
- Verify saved natal Moon sign against saved verified Moon longitude; derive Janma Nakshatra directly from longitude.
- Calculate Moon nakshatra and sign from **actual local sunrise Swiss/Lahiri** positions, not pre-rendered horoscope text and not local-noon transits.
- Tara: inclusive distance from Janma Nakshatra to today's Moon nakshatra reduced to 9; categories Janma, Sampat, Vipat, Kshema, Pratyak, Sadhaka, Naidhana, Mitra, Parama Mitra. Supportive 2,4,6,8,9. Janma explicitly caution; school policy is versioned.
- Chandrabala: whole-sign distance, counting natal Moon sign as 1. Supportive signs 1,3,6,7,10,11; 8 separately flagged **Ashtama Chandra**. This is a traditional interpretive convention, not an outcome predictor.
- `GET /api/v1/personal/panchanga?date=...&zone=...&latitude=...&longitude=...`, `Cache-Control: private,no-store`; 401 anonymous; `requires_verified_chart` when authenticated but chart not selected/current. No DB migration, no user location persistence.
- Private UA/EN panel on `/{locale}/panchanga` with signed-out/unverified/available/unavailable states.

**AE-P6.2 Solar/lunar eclipse geometry and observer visibility**
- Public `GET /api/v1/astronomy/eclipses?start=2027-01-01&days=366&zone=Europe%2FKyiv&latitude=50.4501&longitude=30.5234`.
- Bounded 1..366 local days; year 1900–2098, lat/lon valid and optional altitude 0..5000 m. Default example location Kyiv; no precision location retrieval.
- Python `pyswisseph` official `sol_eclipse_when_glob`, `lun_eclipse_when` determine **real global eclipse geometry**. `sol_eclipse_when_loc` and `lun_eclipse_when_loc` independently establish local visibility and local maximum. Never infer eclipse from a simple full/new Moon phase.
- Native Swiss compressed planet/Moon files REQUIRED; verify actual returned Swiss backend flags in representative Sun/Moon calculations; no Moshier/JPL substitution. `503` on source failure; bounded process timeout, in-flight cache and no database writes.
- Distinguish total, annular, hybrid, partial and penumbral eclipses, local visibility, global and local maxima. Numerical Swiss eclipse time is not a guarantee of clear-weather observation or safe naked-eye solar viewing.
- Observer selection comes from the Panchanga place form. Eclipse search is **on-demand**, not fired automatically on every visit.

**AE-P6.3 Independently pinned astronomical regression**
- Five independent **NASA GSFC 2027** eclipse maximum records: 6 Feb annular solar, 20 Feb penumbral lunar, 18 Jul grazing penumbral lunar, 2 Aug total solar and 17 Aug penumbral lunar.
- Original human-readable source: https://eclipse.gsfc.nasa.gov/OH/OH2027.html
- Machine-readable pinned source: `docs/research/nasa-eclipses-2027-fixture.json`; origin/UT/time resolution explicit, **±15 minutes** regression tolerance. Test compares exactly 5 eclipses, **both date/type and maximum UT**. Never call this a ±1-second independent observability certificate.
- `npm run test:astronomy:nasa` runs against installed Swiss library and official compressed files. The NASA table does not establish local eclipse visibility for a particular observer, so `independentVisibilityCertified:false`.

**AE-P6.4 Traditional daytime kalas**
- `Rahu Kalam`, `Yamaganda`, `Gulika Kalam` — mathematically divide actual local sunrise→sunset into 8 equal segments and apply versioned weekday segment table.
- Sunday-Saturday segments: Rahu [8,2,7,5,6,4,3]; Yamaganda [5,4,3,2,1,7,6]; Gulika [7,6,5,4,3,2,1].
- Uses real observer sunrise/sunset, not hard-coded 06:00 / 18:00. No festival or specific auspicious marriage/operation verdicts.
- UI in main Panchanga five-limb display. Source convention: https://vedangam.org/jyotisha/panchanga/muhurta
- Edge cases: polar non-rising days fail closed, dates and DST handled at ISO UTC conversions.

## Acceptance

```powershell
cd C:\Users\Note\jyotish-studio-git
git status --short
git fetch origin
git switch fix/jqa3-windows-and-llm-recovery
git pull --ff-only origin fix/jqa3-windows-and-llm-recovery

npm install
py -m pip install pyswisseph
npm run test:lunar-strength
npm run test:daytime-kalas
npm run test:astronomy:nasa
npm run test:panchanga
npm run jqa3:certify
npm run test:all
npm run build
npm run dev:full
```

Separate terminal:
```powershell
$day = Invoke-RestMethod 'http://localhost:4000/api/v1/panchanga/day?date=2026-10-27&zone=Europe%2FKyiv&latitude=50.4501&longitude=30.5234'
$day.daytimeKalas | Format-List
$ecl = Invoke-RestMethod 'http://localhost:4000/api/v1/astronomy/eclipses?start=2027-01-01&days=366&zone=Europe%2FKyiv&latitude=50.4501&longitude=30.5234'
$ecl.events | Select-Object type,eclipseKind,maximumUtc,visibleHere,localMaximumUtc | Format-Table
```

- Test 2027 NASA five events globally. The observable-elsewhere distinction must stay meaningful; Kyiv is an *example*, not the user's inferred GPS coordinate.
- From `http://localhost:3000/uk/panchanga`, press «Знайти затемнення на рік»; review observer visibility. English: `/en/panchanga`.
- Sign into Personal, choose verified natal chart, return to Panchanga and inspect Tarabala/Chandrabala based on actual sunrise. Sign out and verify no private data revealed and 401 for private API.
- Vary observer, timezone, day, including DST. Bad coordinates/date/366+ horizon -> HTTP 400, missing official Swiss -> 503.
- Strict preserved JQA-3 certification remains original, not re-labelled event-time certification.
- Browser tests: `e2e/astronomy-ae-p6.spec.mjs`, past `e2e/panchanga.spec.mjs` and `e2e/astronomical-events.spec.mjs`. Regression scripts wired to `npm run test:all`.

## Limitations and following stage

JQA-3 certifies 20 authentic natal profiles; NASA 2027 fixtures independently test five *global eclipse* types and UT maxima at ±15min, but do not validate the entire AE-P5 event corpus to ±1second or local horizon visibility for every town.

Full **festival Panchanga/muhurta** requires user-chosen traditions and local policy (regional lunisolar era, amanta/purnimanta, adhika/ksaya masa, tithi-at-sunrise and festival precedence), independent references for selected cities and holidays, optional elevation and horizon/atmosphere configuration. Do not silently apply a single pan-Indian festival date or declare a universal auspicious window. Next stage should version these separately after reference fixtures.
