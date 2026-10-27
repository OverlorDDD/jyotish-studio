# Galaxiora: AE-P0–AE-P7 release inventory, module integration and verification

Date: 2026-10-27. Development branch: `fix/jqa3-windows-and-llm-recovery`.
This inventory documents **implemented code**, and separates it from wish-list integration and independent certification.

## Distinguish stage numbering

**AE-P0 was not a standalone recorded implementation stage.** It denotes the preflight architecture/Swiss-JHora quality baseline, not a new claim of delivered code. The first separately documented engineering release was **AE-P1–P4 combined** in `docs/research/astronomical-events-panchanga-v1-2026-10-27.md`.
Do not keep inventing automatic AE-P8/P9 scope; owner explicitly wants the defined module finished.

| Stage | Verified repository surfaces | Scope |
|---|---|---|
| AE-P0 (preflight) | Natal JQA-3 corpus/certifier, `apps/api/src/ephemeris.ts` | Prior approved 20-profile JHora natal baseline; Swiss/Lahiri/Delta-T conventions; **no independent festival or event-time certification** |
| AE-P1 | `packages/jyotish-core/src/panchanga.ts` | Five true sunrise angas: Tithi, Nakshatra + Pada, Vara, Nitya Yoga, Karana |
| AE-P2 | Same core | Boundary-finding and all actual transitions, fresh sampling with <=1-second bisection bracket |
| AE-P3 | `tools/panchanga-sunrise.py`, `apps/api/src/panchanga.ts` | Local Swiss apparent sunrise/sunset, IANA civil date, coordinates, strict source checks, polar failure |
| AE-P4 | `apps/api/src/panchanga-controller.ts`, `apps/web/app/components/PanchangaHub.tsx` | GET `/api/v1/panchanga/day`, UA/EN `/{locale}/panchanga` and nav |
| AE-P5 | `packages/jyotish-core/src/astronomical-events.ts`, `apps/api/src/astronomical-events.ts`, `AstronomicalEventsPanel.tsx` | Four lunar quarters, seven bodies’ sidereal sign crossings, Mercury–Saturn direct/retrograde stations; bounded 7/30-day UI, independent source required |
| AE-P6 | `packages/jyotish-core/src/lunar-strength.ts`, `daytime-kalas.ts`, `apps/api/src/astronomy-eclipses.ts`, `PersonalPanchanga.tsx`, `EclipsePanel.tsx` | Owner-only Tara/Chandrabala against verified natal Moon and real sunrise; global/local eclipses + NASA 2027 independent 5-event corpus; Rahu/Yama/Gulika eighths |
| AE-P7 | `packages/jyotish-core/src/vedic-calendar.ts`, `apps/api/src/vedic-calendar.ts`, `VedicFestivalPanel.tsx` | Amanta/Purnimanta, authentic New Moon lunar months, Adhika/Kshaya review, sunrise Ekadashi/Arunodaya, Pradosha, Sankranti, candidate festival days, Abhijit Muhurta |

### Astro APIs

- `GET /api/v1/panchanga/day` — public observer day.
- `GET /api/v1/astronomy/events` — public phases, ingresses, stationary events.
- `GET /api/v1/astronomy/eclipses` — public solar/lunar eclipse events including observer visibility, on demand.
- `GET /api/v1/personal/panchanga` — **authenticated** and requires owner-selected verified natal chart; no natal Moon leaked to public.
- `GET /api/v1/vedic-calendar/week` — public seven-day astronomical observance candidates and local daylight periods.

### How the astronomical engine is used elsewhere: precise status

| Portal module | **Present integration** | Still not wired |
|---|---|---|
| Natal D1/D9/D10 and Vimshottari | Existing `getEphemeris` Swiss/Lahiri source, JQA-3 checked. Additive AE code does **not modify** natal algorithm | Panchanga/festival rules are **not** automatically added to natal report chapters |
| Public horoscope for 12 signs | `apps/api/src/horoscope.ts` calls `dailyTransit`, which samples the same Swiss/Lahiri astronomical backend at **local noon** | The horoscope currently does **not** call AE-P5 exact event timestamps or AE-P7 festival calendar |
| Personal dashboard, personal horoscope | Existing primary natal-chart recovery, dasha and noon transit. `/api/v1/personal/panchanga` uses owner chart + genuine sunrise Moon | The Tarabala/Chandrabala readout is on Panchanga page, **not** yet merged into Personal dashboard's daily advice. No personal Muhurta election engine |
| Tarot | Separate card/reading engine, not dependent on Swiss or astronomy | No automatic planetary-event interpretation. Should be optional and clearly disclosed rather than changing Tarot card semantics |
| Yoga, practices, Academy | Independent modules reachable from site navigation | No automatic class/practice scheduling driven by lunar date/Abhijit |
| GalaxiNews | Independent RSS/news discovery, with astronomy topic support | AE-P5/P6/P7 **not** yet published automatically as original astronomy news items |
| GalaxiCom | Independent community discussion | No automatic event/observance threads or community calendar |
| Portal navigation | Panchanga now appears in header in UA/EN | Launch usability and mobile-polish remain general QA tasks |

### Accuracy levels (do not conflate)

1. Natal JQA-3 original **CERTIFIED** scope: 20 independent original JHora profiles, 600/600 D1/D9/D10 signs, 200/200 printed longitudes within 1 arcsecond, 180/180 printed mahadasha and 1620/1620 printed antardasha dates. This does **not** certify all possible births, microsecond dasha transitions, or every festival.
2. Exact event search brackets crossings to ≤1 s **numerically**; this does not independently prove astronomical event-time accuracy ±1 second.
3. AE-P6 independent NASA-GSFC 2027 cases check **five global eclipse events within a ±15 min reference tolerance**; local visual visibility is not separately independently certified.
4. AE-P7 publishes **rule-based festival date candidates**, not definitive Smarta/Vaishnava fasting rules, Parana timings, regionally adjudicated dates or personalized electional recommendations.
5. Polar observer locations can legitimately receive a 503 rather than invented sunrise. Client-supplied coordinates default to Kyiv only as an example, not the user’s actual GPS.

### Local Windows commands — start in actual repository root

From `PS C:\Users\Note>`, running `npm run` **does not** locate nested repositories: first `Set-Location` to the directory containing root `package.json` or run `npm --prefix <root> run ...`.

```powershell
$project = 'C:\Users\Note\jyotish-studio-git'
if (-not (Test-Path "$project\package.json")) { throw 'Find the actual checked-out Galaxiora repository root' }
Set-Location $project
git status --short
git fetch origin
git switch fix/jqa3-windows-and-llm-recovery
git pull --ff-only origin fix/jqa3-windows-and-llm-recovery
npm install
py -m pip install pyswisseph
npm run test:brand-favicon
npm run test:panchanga
npm run test:astronomy
npm run test:lunar-strength
npm run test:daytime-kalas
npm run test:astronomy:nasa
npm run test:vedic-calendar
npm run jqa3:certify
npm run test:all
npm run build
npm run dev:full
```

In a second PowerShell, with the API running:

```powershell
Invoke-RestMethod 'http://localhost:4000/api/v1/panchanga/day?date=2026-10-27&zone=Europe%2FKyiv&latitude=50.4501&longitude=30.5234'
Invoke-RestMethod 'http://localhost:4000/api/v1/astronomy/events?start=2026-10-27&days=7&zone=Europe%2FKyiv'
Invoke-RestMethod 'http://localhost:4000/api/v1/astronomy/eclipses?start=2027-01-01&days=366&zone=Europe%2FKyiv&latitude=50.4501&longitude=30.5234'
Invoke-RestMethod 'http://localhost:4000/api/v1/vedic-calendar/week?start=2026-10-27&days=7&zone=Europe%2FKyiv&latitude=50.4501&longitude=30.5234&monthSystem=amanta'
```

Browser: `http://localhost:3000/uk/panchanga`, `/en/panchanga`, `/uk/horoscope`, `/uk/personal` (authenticated). Verify relative location and date, 7/30 days, all filter buttons, amanta/purnimanta, candidate disclaimers, personal verification gate, privacy, mobile display. Browser favicon: `/icon.svg`, cached URL `/icon.svg?v=galaxiora-round-gold-v3-20261027`; transparent circle, not full-bleed square.

### Before an actual public site launch: bounded priorities, not automatic AE-P8

- **Must do:** final user QA; verify production deployment, HTTPS/domain, migrations/backups/recovery, rate limits, nonblocking astronomy workers, server metrics, uptime, privacy/security policy, SEO indexing toggles; verify cross-browser icons and keyboard/mobile navigation.
- **Astronomy quality:** independently check a multi-city set of Panchanga/festival event and sunrise timestamps; version and freeze regional school policy before ever labelling candidate dates as certified. Verify day boundaries and DST. Do not weaken JQA-3 reference gate.
- **Portal quality:** explicitly wire important verified astronomical facts into horoscope/Personal guidance with correct time provenance, avoid conflicting repeated advice; finish GalaxiNews quality/search, GalaxiCom UI/moderation, Tarot editorial/natural style and Yoga/Academy navigation.
- **Commercial release:** decide free vs paid launch; validate lawful payment processing, owner identity/KYC, refunds and privacy before charging; budget Swiss-worker hosting and cache/rate-limit performance.
- Owner deferred hands-on acceptance until functional stages completed; no future AE phase is automatically authorized.
