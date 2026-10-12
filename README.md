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

**Windows setup/checklist:** [`docs/fullstack-windows.md`](docs/fullstack-windows.md). Start with `npm run preflight:full`. The initial SQL migration is committed and `db:migrate` now uses noninteractive `prisma migrate deploy`.


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

`npm test` (14 tests) checks divisional rules, nakshatras, whole-sign houses, DST ambiguity, 120-year dasha durations and normalized chart composition. These checks are not substitutes for independent golden-chart comparisons.

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

## Audit and reference manuals

See [October 12 calculation and UX audit](docs/audit-2026-10-12.md) for the defects fixed, external technical manuals, competitor comparison, reproducibility settings and outstanding reference-chart verification. The v0.2 UI renders a North Indian-style 12-house SVG with localized Ukrainian/English labels. The verified browser preview used an anonymous fictional profile, not any private birth data.

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

Recommended clean setup (PowerShell):

```powershell
cd C:\Users\Note
git clone https://github.com/OverlorDDD/jyotish-studio.git
cd jyotish-studio
npm install
py -m pip install pyswisseph
npm run dev
```

Open http://localhost:4000. If `py` is not installed but `python` works, run `python -m pip install pyswisseph` and set `$env:PYTHON_BIN = 'python'` before `npm run dev`.

**Troubleshooting `ENOENT package.json` after ZIP extraction:** the original ZIP contains a top-level `jyotish-studio` folder. If you extracted into a folder of the same name, navigate one level deeper:

```powershell
cd .\jyotish-studio
Get-Item package.json
npm install
npm run dev
```

Do not commit `.env`, API keys, real birth data or database dumps. The connected GitHub integration can maintain this repository directly.


## v0.3 — readable chart + Stage 3 verification (2026-10-12)

**Chart labels:** All graha and sign names now appear in full in North Indian SVG
for both standalone and Next.js modes. The diagram grows to 520 px, with one
graha per line. When a rare conjunction contains more than 3 entries in a tiny
house, the diagram shows "more below"; the full-name **Planets by house**
index immediately below the chart always includes every placement. Switch D1,
D9 and D10 to update both areas.

**Astronomy evidence:** `npm run test:all` runs the unit suite, 3 frozen
fictional Swiss-Ephemeris fixtures, and an additional tropical-minus-Lahiri
cross-method check. This does NOT constitute an independent JHora numerical
sign-off; see `docs/stage-3-validation.md`.

**Update directly from GitHub** (after cloning once; no more ZIP archives):

```powershell
cd C:\\Users\\Note\\jyotish-studio-v2
git status --short
git pull --ff-only origin main
npm install
npm run test:all
npm run dev
```

If you cloned to `C:\\Users\\Note\\jyotish-studio-github` instead, use that
folder in the first line. Never run `git reset --hard` to resolve an update
without first backing up your work. `git pull --ff-only` safely refuses to
overwrite divergent local commits.

**Full NestJS + PostgreSQL** (separate terminal, on Windows):

```powershell
Copy-Item .env.example .env      # once; never commit .env
docker compose up -d db
npm run db:generate
npm run db:migrate
npm run dev:full
```

Open http://localhost:3000 (Next.js) and http://localhost:4000/api/docs
(Swagger). In another PowerShell window within the repo run
`npm run test:full` to exercise a real API, database persistence, Dasha lookup
and the no-key fallback interpretation. Native `@swisseph/node` is now an
explicit backend dependency; if unavailable, set `PYTHON_BIN=py` after
installing `pyswisseph`.

**OpenAI:** Put `OPENAI_API_KEY` in `.env` locally and start the full stack to
activate the provider; without a key, educational local explanation is used.
Actual paid OpenAI API calls, native Windows bindings and full Next.js/NestJS
build must be checked on your machine; they have not been confirmed in this
offline test environment.

**Security:** local-only prototype. Birth details and stored charts are
private personal information; the database endpoints currently have no login.
Do not expose full-stack port 4000 to the public internet until authentication,
authorization, retention controls and rate limits are implemented.


## Stage 5 — guarded OpenAI & temporary private demo

For Windows instructions, see [OpenAI integration](docs/openai-integration.md) and [temporary private ngrok preview](docs/private-public-demo.md).

In the existing Git checkout, update with `git pull --ff-only origin main`, run `npm install`, then `npm run test:all`, `npm run test:swagger` and `npm run build`. Use `npm run dev:full` for local development on 3000/4000.

OpenAI is **opt-in only**: with `OPENAI_ENABLED=0` (default), interpretations are local and do not consume paid tokens. To try real AI, set `OPENAI_API_KEY` in private root `.env` and `OPENAI_ENABLED=1`, then restart. OpenAI structured output is schema-checked and linked to deterministic calculation facts; symbolic explanations are not scientific predictions.

A *temporary* externally accessible demo uses a **single Next.js domain** and proxies API calls to loopback NestJS. Before exposing **only port 3000** through `ngrok http 3000`, configure a strong unique `DEMO_ACCESS_USER` / `DEMO_ACCESS_PASSWORD`, use `npm run build` followed by `npm run start:full`, and check `npm run demo:check` reports PASS. Use fictional birth data and disable paid OpenAI for the shared preview. This is not production multi-user authentication or always-on hosting.

## Free AI interpretation

The default `AI_MODE=free` uses only the `openrouter/free` zero-priced router (with an OpenRouter API key), optionally falls back to locally running Ollama, and otherwise returns the built-in Ukrainian/English Jyotish text. **OpenAI billing is never invoked automatically.** See [docs/free-ai.md](docs/free-ai.md).
