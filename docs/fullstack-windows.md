# Jyotish Studio: Windows Full Stack launch (interview prototype)

## 1. Preparation

Run these commands **from the Git clone**, not an extracted ZIP. In PowerShell:

```powershell
cd C:\Users\Note\jyotish-studio-git
# Stop the old standalone process with Ctrl+C before starting the full API on 4000.
git status --short
git pull --ff-only origin main
npm install
npm run preflight:full
```

The standalone site (`npm run dev`) is NOT NestJS. The full mode has two servers and a database.

## 2. PostgreSQL and Prisma

Start Docker Desktop and wait for Engine Running. Then:

```powershell
# Only create .env once; don't overwrite an existing local key/config.
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
docker compose up -d db
docker compose ps
npm run db:generate
npm run db:migrate
```

What each command does:
- `docker compose up -d db` creates/runs PostgreSQL bound to `127.0.0.1:5433` and persists data in the `jyotish-postgres` volume.
- `db:generate` generates a typed Prisma Client from `apps/api/prisma/schema.prisma`.
- `db:migrate` applies the committed initial SQL migration **non-interactively** (`prisma migrate deploy`), creating `Chart` and `Interpretation` tables.

If `prisma generate` reports a missing engine, review npm install-script approval warnings on your machine. Never execute arbitrary build scripts from unknown packages. See `npm help install` and the relevant npm version documentation. Jyotish uses host port **5433**, deliberately separate from OpsPilot or other local PostgreSQL instances on 5432. PostgreSQL still listens on port 5432 **inside** its own container.

## 3. Compile checks and start full mode

```powershell
npm run build
npm run dev:full
```

Expected services:
- Next.js: http://localhost:3000
- NestJS Swagger: http://localhost:4000/api/docs
- API + PostgreSQL readiness: http://localhost:4000/api/health — returns `status: ok` and `database: connected`

Do not run `npm run dev` concurrently; it is the older standalone on port 4000.

## 4. Smoke test from a *second* terminal

```powershell
cd C:\Users\Note\jyotish-studio-git
npm run test:full
```

Manual checks:
1. Open Next.js on 3000, choose the fictional demo profile, calculate D1 and confirm all nine grahas.
2. Switch to D9/D10 and compare the signs and 12 house labels.
3. Open Swagger; test `GET /api/health` (database must show connected).
4. Run `test:full`: create chart, retrieve chart by id, check dashas, obtain a **local** (no OpenAI key) reading, reject invalid coordinates.
5. Restart NestJS and retrieve the saved chart id again in Swagger: if it exists, PostgreSQL persistence works.
6. Stop PostgreSQL, then confirm API health does not claim database readiness. Restart with `docker compose up -d db`.
7. Check the browser's console; no failed API requests or JavaScript errors are expected.

## 5. OpenAI validation (after Full Stack passes)

Keep `OPENAI_API_KEY` **only in local `.env`**, do not share it in a chat or commit it. Use a real OpenAI API key with model access/billing, then restart the API and call `POST /api/v1/interpretations` for a saved chart. Verify provider is `openai`, language matches, and placements agree with the deterministic chart. Test a missing/invalid key (must not silently claim OpenAI success). API usage may incur charges.

## Troubleshooting

- `Missing script` or `not a git repository`: make sure `pwd` points to the Git clone, with `.git` and root `package.json`.
- `EADDRINUSE 4000`: stop the previous `npm run dev` using Ctrl+C; `Get-NetTCPConnection -LocalPort 4000` helps locate conflicting listeners.
- `P1001` / can't reach DB: ensure Docker Desktop is running and `docker compose ps` shows a healthy Postgres instance.
- `@prisma/client did not initialize`: run `npm run db:generate` again and inspect install-script approval.
- Swiss Ephemeris native installation errors: use the Python `pyswisseph` adapter supported by `getEphemeris` (`py -m pip install pyswisseph`) and set `ALLOW_PYTHON_SWISSEPH=1` in local `.env`.
- The full-stack build/test is **not verified** until it succeeds on a machine with installed dependencies and PostgreSQL. Keep logs and send the first failing command/error for targeted fixes.

**Privacy:** API has no authentication yet; keep it bound to localhost and do not publish birth profiles through an open tunnel.

## Prisma P1012: `DATABASE_URL` not found

The project uses **one root `.env`** (`jyotish-studio-git/.env`), not `apps/api/.env`. With npm workspaces, commands invoked from `apps/api` normally don't load the root `.env` automatically. Root `db:generate` and `db:migrate` now load the root file explicitly through Node `--env-file` and pass an absolute-from-root schema path. NestJS resolves the same root `.env` relative to `main.ts`.

In PowerShell from the Git checkout:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
git pull --ff-only origin main
npm run db:migrate
npm run build
npm run dev:full
```

Keep `.env` private and never paste its contents into chat or GitHub. If the database is not reachable, run `docker compose ps` and wait for the DB service to become healthy before rerunning migration. If local edits prevent a fast-forward pull, stop and check `git status --short` rather than overwriting files.


## Two local Postgres projects: Docker port collision / Prisma P1000

If you also run OpsPilot, **do not stop or delete** its PostgreSQL container or volume. The Jyotish Compose configuration now binds PostgreSQL to `127.0.0.1:5433` on Windows, while keeping internal Docker port `5432`.

After `git pull --ff-only origin main`, update your *existing local* root `.env` (do not overwrite it or share its contents):

```powershell
# In C:\Users\Note\jyotish-studio-git
(Get-Content .env -Raw).Replace('localhost:5432','localhost:5433') | Set-Content .env
docker compose up -d db
docker compose ps -a
npm run db:migrate
```

Expected data source: `localhost:5433` and a healthy Jyotish DB. If the container stops, inspect `docker compose logs --tail=50 db` to identify the cause. If P1000 persists after confirming `localhost:5433`, the Jyotish Docker **volume** may contain a prior initialization with different credentials. Preserve the volume and ask for diagnostics before changing database credentials or resetting data.

To check port ownership without changing any data:
```powershell
docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"
```

Do not run `docker compose down -v`, `docker volume prune`, `docker system prune`, or `npm audit fix --force` to solve P1000.

## NestJS Swagger startup crash under `tsx`

**Symptom:** `TypeError: Cannot read properties of undefined (reading '0')` inside `@nestjs/swagger/dist/services/parameter-metadata-accessor.js`; Next.js starts, but NestJS API never listens on port 4000.

**Cause:** The `tsx` runner uses esbuild, which does not implement `emitDecoratorMetadata` even when TypeScript type checking succeeds. Swagger and NestJS validation need `design:paramtypes` runtime metadata for `@Body()` and `@Param()`.

**Fix:** `apps/api/src/nest.ts` now attaches explicit `design:paramtypes` to the four controller methods and declares request-property types in `@ApiProperty`. A regression test exercises real Swagger document creation without connecting to PostgreSQL.

After updating GitHub, stop both current development processes with `Ctrl+C`, then run in PowerShell:

```powershell
cd C:\Users\Note\jyotish-studio-git
git pull --ff-only origin main
npm run test:swagger
npm run dev:full
```

Then verify `http://localhost:4000/api/health` returns database connected, `http://localhost:4000/api/docs` shows Swagger, and `http://localhost:3000` displays the chart. While servers remain running, in a **second PowerShell** run `npm run test:full`. Never run standalone `npm run dev` simultaneously on port 4000.

Do not use `npm audit fix --force` to solve metadata errors.
