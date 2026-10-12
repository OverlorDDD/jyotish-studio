# Jyotish Studio ✧

**Interview demo / навчальний Full Stack проєкт**: Vedic astrology engine with real Swiss Ephemeris, Lahiri sidereal coordinates, 9 grahas, whole-sign D1, Navamsa D9, Dashamsa D10, Vimshottari Mahadasha/Antardasha, React/Next.js UI, NestJS REST API, Prisma/PostgreSQL, optional OpenAI explanations.

## Fastest launch — standalone preview, with no npm install

Requirements: Node.js **22+** and one astronomical adapter:
- Optional native backend: install `@swisseph/node` in the API workspace (`npm install @swisseph/node -w @jyotish/api`), **or**
- Recommended quick-start fallback: Python 3 plus `py -m pip install pyswisseph` on Windows (`python3 -m pip install pyswisseph` on Linux/macOS).

```powershell
# Windows PowerShell, from repository root:
py -m pip install pyswisseph  # unless the native @swisseph/node adapter is installed
npm run dev
```

Open **http://localhost:4000**. This runs a working static UI and Node HTTP API using the same domain core. The fallback does NOT use Nest or PostgreSQL and temporarily keeps charts only in memory; it is meant for quick demonstrations.

## Full stack — Next.js + NestJS + PostgreSQL

Requires Docker Desktop, Node.js 22+, npm and internet to download dependencies:

```powershell
Copy-Item .env.example .env
npm install
docker compose up -d db
npm run db:generate
npm run db:migrate
npm run dev:full
```

Open web **http://localhost:3000**, Swagger API **http://localhost:4000/api/docs**. To use real OpenAI readings, set `OPENAI_API_KEY=...` **only in local `.env`**, then restart the API. If it is unset, local rule-based interpretations work. The backend loads environment variables from `.env` when launched (see note below).

**Important:** Nest + Next builds were not verified in the offline authoring environment (npm registry unavailable); unit tests and standalone preview were executed. Run the full-stack validation locally after `npm install`.

## Tested example (do not commit actual personal birth details)

The UI opens with a fictional test date `2000-01-01 12:00`, New Delhi. You can select **Kryvyi Rih** in Location preset and enter any date/time locally; the time zone is `Europe/Kyiv` (including historical DST rules). No personal birth details are embedded in the public repository.

## Core endpoints

`GET /api/health`, `POST /api/v1/charts/calculate`, `GET /api/v1/charts/:id`, `GET /api/v1/charts/:id/dashas` (Nest only), `POST /api/v1/interpretations`.

Example POST body:

```json
{"date":"2000-01-01","time":"12:00","timeZone":"Asia/Kolkata","latitude":28.6139,"longitude":77.209}
```

`npm test` checks divisional rules, nakshatras, whole-sign houses, DST ambiguity, 120-year dasha durations and normalized chart composition. These checks are not substitutes for independent golden-chart comparisons.

## Manual QA checklist

1. Start server: `/api/health` returns `ok`.
2. Select Delhi and calculate: D1 table shows 9 grahas and an Ascendant summary. Compare Sun/Moon to independent Jyotish calculator under **same** Lahiri & node settings.
3. Switch D1/D9/D10: planet signs and houses change according to divisional rules; no network request is needed for switching.
4. Look at Dasha list: 9 Mahadashas; the one containing today's date is highlighted if within the cycle, with its Antardasha.
5. Change place/time zone and recalculate: Ascendant changes; same UTC with different coordinates also changes Ascendant but not geocentric planets.
6. Try invalid coords `91`, impossible date `2026-02-30`, and `2026-03-29 03:30` in `Europe/Kyiv`: API rejects these with an error.
7. No `OPENAI_API_KEY`: Generate interpretation reports local rule-based response, clearly tagged. With a valid key: provider is `openai`; invalid key returns an error instead of silent fake success.
8. For full stack: stop PostgreSQL and calculate — explicit DB unavailable error; restart and migrate. Swagger lists documented API endpoints.
9. Check source `.gitignore`: `.env` never committed. Inspect browser Network tab: OpenAI key is never sent to client; chart-only summaries are sent to AI **only after clicking** Generate.

## Privacy and correctness

Never upload real birth profiles to a public repository. Saved DB contains potentially sensitive birth details; **do not expose this unauthenticated MVP to the public internet**. Swiss Ephemeris is AGPL-3.0; check licensing before commercial use. See [calculation conventions](docs/calculation-rules.md) and [architecture](docs/architecture.md).

## Project layout

- `packages/jyotish-core/src`: deterministic TS domain, pure unit tests.
- `apps/api/src`: Swiss adapter, calculation and interpretation orchestrator; standalone Node fallback; Nest REST app.
- `apps/api/prisma`: PostgreSQL schema.
- `apps/web`: React/Next.js UI and independent static preview at port 4000.
- `.github/workflows/ci.yml`: Node core tests in GitHub Actions.

**License**: AGPL-3.0-only (respect Swiss Ephemeris upstream license).

## GitHub repository and Windows setup

The public GitHub repository is now available: https://github.com/OverlorDDD/jyotish-studio

**Recommended clean setup (PowerShell):**

```powershell
cd C:\Users\Note
git clone https://github.com/OverlorDDD/jyotish-studio.git
cd jyotish-studio
npm install
py -m pip install pyswisseph
npm run dev
```

Open http://localhost:4000. If `py` is not installed but `python` works, run `python -m pip install pyswisseph` and set `$env:PYTHON_BIN = 'python'` before `npm run dev`.

**Troubleshooting `ENOENT package.json` after ZIP extraction:** the ZIP contains a top-level `jyotish-studio` folder. If you extracted into a folder of the same name, navigate one level deeper:

```powershell
cd .\jyotish-studio
Get-Item package.json
npm install
npm run dev
```

Do not commit `.env`, API keys, real birth data or database dumps. The connected GitHub integration can maintain this repository directly.
