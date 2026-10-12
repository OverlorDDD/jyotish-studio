# Stage 3: numerics, API, full stack and AI — verification record (2026-10-12)

## What was really executed

- `npm test` — 14 passing Node test cases for D9/D10, nakshatras, Vimshottari timeline, date/time handling and validation.
- `npm run test:reference` — 3 fictional reference cases pinned from PySwissEph (Lahiri, mean node, Swiss Ephemeris flags), compared to re-computed positions to within 0.0001°.
- Independent **calculation route**, not independent ephemeris: subtract Lahiri from Swiss **tropical** longitudes and compare with Swiss **direct sidereal** longitude to within **0.006°** (21.6 arcsec). Small expected differences reflect true/mean ecliptic convention; do not require equality to 0.0001°. Check Python code at `tools/cross-method-check.py`.
- Autonomous local Node API: `npm run dev`, `node tools/smoke-test.mjs`, and `GET /api/v1/charts/:id/dashas` validate chart creation, retrieval and periods.
- Standalone JS syntax (`node --check`) and template label text audited.
- Full Windows native `@swisseph/node`, Next.js build, PostgreSQL/Prisma migrations and paid OpenAI calls: **not verified here** (npm registry install timed out). A working code path is present, with a Windows checklist below.
- Jagannatha Hora (JHora) **numeric** comparison: **not completed**; software could not be run here. Do not claim independent acceptance.

## Frozen fictional Swiss scenarios (NOT private user data)

| Scenario | UTC | Lahiri | Ascendant | Moon sidereal |
|---|---|---:|---:|---:|
| Delhi 2000-01-01 | 06:30 | 23.857084° | 343.189124° | 196.711688° |
| London 2012-06-15 | 08:30 | 24.031067° | 114.858922° | 13.902425° |
| Kyiv 2024-02-29 | 14:45 | 24.194624° | 127.804070° | 191.621195° |

Values are frozen **outputs of Swiss Ephemeris**, not externally certified
ground truth. Dataset in `tests/fixtures/swiss-reference.json`.

## Manual independent acceptance procedure (JHora on Windows)

1. Install Jagannatha Hora using the author's official page:
   https://www.vedicastrologer.org/jh/index.htm
2. In Preferences/Calculations, select Lahiri/Chitrapaksha, **mean Rahu**,
   geocentric planetary positions and whole-sign houses; note JHora version.
   Confirm the selected divisional chart calculation is standard Parashari.
3. Enter the three *fictional* cases above with exact local civil time,
   coordinates and historical daylight-saving setting. Validate UTC before
   comparing; timezone errors swamp astronomical tolerances.
4. Record absolute sidereal longitudes Sun, Moon, Rahu and Lagna; compare
   D1/D9/D10 sign assignments and Moon's nakshatra.
5. Match **Vimshottari year length = 365.2425 days** before comparing
   Mahadasha/Antardasha instants. If JHora can't configure that precise
   length, document the difference rather than adjust the algorithm to fake a
   match. Do not compare its 360-day default directly to our 365.2425-day result.
6. Set acceptance thresholds: planets ±1 arcminute; Lagna ±1 arcminute
   after confirming exact sidereal-house method; divisional *signs* must match
   except near boundaries; dasha dates must match when conventions match.
7. Add the resulting export/screenshots and signed numeric fixture only after
   the independent comparison is physically completed.

## Full stack & LLM checklist on Windows

- `npm install`: native Swiss wrapper and npm workspaces resolve.
- `npm run db:generate && npm run db:migrate`: Prisma schema migrations succeed.
- `npm run dev:full`: Next.js port 3000; NestJS port 4000; docs at `/api/docs`.
- `npm run test:full`: API calculates a fictional chart, fetches chart back from PostgreSQL,
  returns 9 dashas, local interpretation, rejects invalid coordinates.
- Refresh Next.js and retrieve a saved ID: stored chart must remain after API restart
  when PostgreSQL is running.
- Set a valid API key in local `.env`, request an interpretation, confirm
  `provider:openai`; unset key, confirm `provider:local`.
- Deliberately use an invalid API key and unavailable DB. UI must show the error
  rather than display invented results. OpenAI network calls have usage costs.
- Do not deploy personal-birth-data endpoints publicly without authentication,
  validation, throttling and deletion/retention protections.

## Background and competitors

Swiss Ephemeris official programmer manual:
https://www.astro.com/swisseph/swephprg.htm

`@swisseph/node` current API:
https://github.com/swisseph-js/swisseph/blob/main/docs/api/node.md

Jagannatha Hora official downloads:
https://www.vedicastrologer.org/jh/index.htm

Market baseline: JHora has far deeper varga/dasha settings; AstroSage and
Prokerala provide city-search, export/report flows and broader calculators.
Our narrow interview MVP prioritizes **tested core boundaries, documented
conventions and truthful limitations** over matching their feature count.
