# A2: Tarot application/ports/adapters (2026-10-19)

## Intent
Refactor code structure, not product behavior. Keep old 78 RWS card deck, interpretations, UI, language support, API request/response formats, row-locked quota (MEMBER 3/UTC day; ADMIN 100/UTC day), AI successful completion caps (2/10), explicit consent, historical records and payment-disabled state.

## Implemented boundaries
- `tarot.ts`: NestJS transport adapter with validation DTO, auth/Origin and HTTP exception mapping; delegates deck/history/draw.
- `tarot-domain.ts`: pure role quotas, UTC day logic, question normalization and domain error codes.
- `tarot-ports.ts`: interfaces for reading repository and AI gateway owned by application, no framework dependency.
- `tarot-application.ts`: framework-independent use cases for deck, history and drawing with offline/AI orchestration and fallback.
- `tarot-prisma-repository.ts`: PostgreSQL persistence; user-row `FOR UPDATE` transaction remains responsible for atomic quota check/draw/write; AI usage and narrative persistence.
- `tarot-ai-gateway.ts`: optional AI provider integration with existing per-process 12/hour attempt limit.
- `nest.ts`: composition root registers a single application instance via Nest factory provider using Prisma service + AI gateway.
- `tools/tarot-application.test.mjs`: isolated use-case and policy tests; A1's live PostgreSQL integration remains the regression gate.

## Unchanged surface
`GET /api/v1/tarot/deck`, `GET /api/v1/tarot/readings`, `POST /api/v1/tarot/readings` and Swagger DTO fields. No DB migration; user history and saved narratives are read from the same tables. The controller no longer contains SQL, provider calls or quota calculations.

## Architecture decision
Ports live in the application layer and describe only what it requires. Adapters supply Prisma and external AI implementations. Detailed Rider–Waite descriptions and schema are reused instead of copied. A2 is a contained **hexagonal pilot**, not a speculative whole-repo rewrite.

## Verification evidence
GitHub Actions branch CI passed for commit `66ea0f1` on 19 October 2026: https://github.com/OverlorDDD/jyotish-studio/actions/runs/39234942474. This includes live PostgreSQL authorization/concurrency tests, full unit suites, Swagger, Nest/Next build and standalone smoke. Final main CI and local browser acceptance are distinct checks.

## Test gates
1. `npm run test:tarot:app`, `npm run test:tarot:v2`, `npm run test:tarot`, `npm run test:tarot:session`.
2. `npm run test:all`, `npm run test:swagger`, `npm run build`.
3. GitHub Actions PostgreSQL job: `npm run test:integration` with disposable database `galaxiora_a1_test`. This verifies true concurrent requests, ownership and admin rules.
4. Windows manual: run `npm run security:check`, start full stack and check /uk/tarot 1/3/10 spreads, artwork, reversals, history, quota, Admin and language switching.

## Deferred
Dedicated persistent revocable sessions and distributed AI/provider quotas belong to subsequent security hardening. Full mobile client and CMS are not part of A2.
