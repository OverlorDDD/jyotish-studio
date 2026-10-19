# A3 — modular boundaries for Identity, Admin and Jyotish

Scope: behavior-preserving architecture refactor (2026-10-19); no routes, Prisma migrations, UI, quota, existing stored data, provider calls or entitlement prices changed.

## Modules
- `account-policy.ts`: pure user projection and time-based subscription entitlement (staff role is independent).
- `chart-application.ts`: save/list/read/delete saved chart use cases, calculates chart on server and builds deterministic snapshot through injected functions.
- `chart-prisma.ts`: owner-scoped Prisma port implementation. Maintains 100 chart limit, 100 latest listing, id + owner scoped reads and deletes. Legacy Jyotish chart/dasha endpoints share this port with account history.
- `admin-role-application.ts`: role-change use case and domain errors (self-change and malformed target ID).
- `admin-role-prisma.ts`: Serializable transaction, DB-backed actor ADMIN verification, target lookup, no last-admin removal, atomic role audit row.
- `jyotish-report-application.ts`: portable application coordinator for server-authoritative deterministic calculation and snapshot. Existing optional provider AI and usage metering still owned by `nest.ts`.
- `nest.ts`: composition root wires providers via Nest DI. HTTP controllers keep cookie/session/CSRF, request validation and HTTP-specific error mapping.

### Interaction
Browser -> Nest controller (authenticated principal from signed cookie) -> use case (business policy) -> injected Prisma adapter -> PostgreSQL.
No changes to Tarot A2 port implementation or astronomical core packages.

## Guardrails
- Never authorize a chart from caller-supplied user IDs: pass cookie-derived principal into application. Queries always pair `id` and `ownerId`.
- Never trust caller claims of ADMIN: both controller and transaction validate current role in DB.
- Recompute Jyotish facts on the server for chart saves and reports. No guest persistence.
- No checkout implementation; role and subscription remain separate.
- Error mapping remains 400 / 401 / 403 as before; current login and logout semantics preserved.

## Validation
Focused: `npm run test:architecture:a3`, `npm run test:access`, `npm run test:stage3`, `npm run test:tarot`, `npm run test:engine2`.
Full: `npm run test:all`, `npm run test:swagger`, `npm run build`.
GitHub Actions uses a disposable PostgreSQL service and a real Nest API to verify ownership, role audit, Tarot quotas and access. The test refuses to connect to normal `jyotish` DB.

Unfinished security work: session revocation, distributed throttling, load tests, full browser E2E and licensing review.
