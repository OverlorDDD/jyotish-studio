# Galaxiora — agent operating guide

Read `PROJECT_MAP.yaml` first, then only the files and docs relevant to the requested module. This is the public **Galaxiora** product in repository `jyotish-studio`; do not rename packages/routes solely to match the brand.

## Mission and boundaries
- One bilingual (UK/EN) web platform: Jyotish, Tarot, shared accounts/admin; Experts is pre-checkout only; Yoga/Academy/News/Community are planned.
- Target: **modular monolith with pragmatic DDD boundaries and ports/adapters**. See `docs/adr/0001-modular-monolith.md` and `docs/architecture-target.md`.
- Preserve working features, calculations, DB records, bilingual labels, public URLs and test fixtures. Do not rewrite the application or add microservices speculatively.
- `packages/jyotish-core`: deterministic domain calculations, no framework, DB or AI dependencies. Never use LLM output as an astronomical fact.
- Tarot: 78 RWS cards, upright/reversed, 1/3/10 card spreads, per-user private history; current UTC quota 3/day regular, 100/day ADMIN. AI requires explicit user consent and server opt-in. Do not imply symbolic readings are verified future events.
- Separate staff role (MEMBER/EXPERT/SUPPORT/ADMIN) from subscription entitlement (FREE/PREMIUM). Enforce authorization and ownership server-side, not in UI only.
- Never activate real payment, change role limits, or expose confidential user data without an explicit scoped task and tests.

## Fast and token-efficient workflow
1. Read `PROJECT_MAP.yaml` and the user request; inspect `git status --short`, branch, and only relevant files.
2. Form a narrow change plan; search within the owning module before searching across the repository. Do not recursively dump the entire codebase.
3. Implement the smallest coherent change; extract domain/application/infrastructure boundaries only where the feature is being changed.
4. Run focused relevant tests first. For changes affecting multiple modules, contracts or Prisma, additionally run `npm run test:all`, `npm run test:swagger`, `npm run build` when dependencies are available.
5. Any Prisma schema change requires an additive migration, migration review and explicit note of DB test requirements. Never reset user data; never use `docker compose down -v`.
6. Update `PROJECT_MAP.yaml` only when paths, contracts, status or milestones actually change; update architecture docs for significant design changes.
7. Provide a brief report: changes, tests actually run, unresolved risks and commit/PR. Distinguish verified from unverified.

## Relevant ownership
- Frontend: `apps/web/app`, `apps/web/lib`; App Router with UK/EN routes.
- HTTP application/API: `apps/api/src`; Prisma schema/migrations: `apps/api/prisma`.
- Astronomical deterministic logic: `packages/jyotish-core/src`.
- Test entry points: root `package.json`, `tools/*.test.mjs`; CI: `.github/workflows/ci.yml`.
- Existing product instructions: `docs/tarot-v2.md`, `docs/jyotish-engine-2.md`, `docs/galaxiora-windows-runbook.md`.

## Security, cost and release safeguards
- Never commit `.env`, API keys, session secrets, personal birth data, question text, DB dumps or paid-provider prompts.
- Browser calls same-origin `/api`; keys and authorization checks remain server-side. Validate every request and verify resource ownership.
- External AI must use opt-in, confirmed usage where available, bounded cost and safe fallback. Do not claim costs are known when provider data is missing.
- No checkout/paid order without authenticated and verified payment-provider webhook, idempotency and order state rules.
- Preserve Swiss Ephemeris and classic Tarot art license notices; commercially clear assets/license before release.
- Keep documentation factual: CI green is not proof of production security or manual browser acceptance.

## Local commands (Windows PowerShell, repository root)
`npm install`; `docker compose up -d db`; `npm run db:generate`; `npm run db:migrate`; `npm run dev:full`.
Targeted: `npm run test:tarot:v2`, `npm run test:tarot:session`, `npm run test:engine2`, `npm run test:access`.
Full: `npm run test:all`, `npm run test:swagger`, `npm run build`.
Local PostgreSQL defaults to port 5433; Next 3000, Nest 4000. Check actual `.env` (never print secrets).
