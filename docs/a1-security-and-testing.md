# Galaxiora A1 — real PostgreSQL tests and first-pass hardening (2026-10-19)

## Scope
A1 preserves routes, visuals, Prisma schema and existing user data. It adds a separate **disposable** PostgreSQL GitHub Actions job that starts the **real NestJS server** and verifies user isolation, admin DB authorization, persistent role audit, CSRF blocking, parallel Tarot quota enforcement and ADMIN 100 UTC-day limit. It also adds process-local per-email auth throttling, Fetch Metadata CSRF checks, configurable HTTPS session cookies, basic web security headers and a no-secret-printing runtime readiness check.

## Security matrix and expected responses
| Endpoint | Guest | MEMBER | ADMIN | Important behavior |
|---|---|---|---|---|
| GET /api/health | 200 | 200 | 200 | PostgreSQL connection required in full stack |
| POST /api/v1/charts/calculate, /api/v1/reports | 201 | 201 | 201 | Stateless computation, no guest DB history |
| POST /api/v1/account/register, /login | 201 or error | 201 or error | 201 or error | Signed HttpOnly cookie; global+per-email throttle |
| POST /api/v1/account/logout | 201 | 201 | 201 | Expires browser cookie (does **not** revoke stolen prior signed token) |
| GET /api/v1/account/me | 200 (user:null) | 200 | 200 | Session-derived identity |
| GET /api/v1/account/charts | 401 | 200 own | 200 own | Own charts only |
| POST /api/v1/account/charts | 401 | 201 | 201 | Owner assigned server-side, recalculated facts |
| GET /api/v1/account/charts/:id or /api/v1/charts/:id | 401 | own 200, чужа 401 | own 200, чужа 401 | No admin bypass of personal charts |
| DELETE /api/v1/account/charts/:id | 401 | own 200, чужа 401 | own 200, чужа 401 | Origin checked, owner scoped |
| GET /api/v1/tarot/deck | 200 | 200 | 200 | 78 cards and spread metadata |
| GET /api/v1/tarot/readings | 401 | own 200 | own 200 | Returns remaining/limit/history |
| POST /api/v1/tarot/readings | 401 | 201 or 429 | 201 or 429 | MEMBER:3; ADMIN:100 per UTC day, user row locked |
| GET /api/v1/admin/* | 401 | 403 | 200 | DB-backed role, no client role trust |
| PATCH /api/v1/admin/users/:id/role | 401/403 | 403 | 200/403 | Origin required; no self role changes; role audit |
| GET,POST,DELETE /api/v1/reading-orders/drafts | 401 | owner-scoped | owner-scoped | Consent, owner-only temporary drafts |
| POST /api/v1/reading-orders/:id/brief | 401 | 403 unless paid+verified+owner | same | No enabled checkout or fake paid orders |

## What A1 does and does not prove
- CI integration uses PostgreSQL 16 as GitHub Actions service and **applies real Prisma migrations**. Concurrent Tarot requests are actual HTTP requests over the server's locked transaction.
- The integration test refuses any DB other than a local `/galaxiora_a1_test` and must be explicitly enabled with `GALAXIORA_INTEGRATION_TEST=1`. It never tests against user's existing `jyotish` DB.
- The new `security:check` verifies presence and shape of `DATABASE_URL` and `AUTH_SECRET` without exposing their values.
- Added `Sec-Fetch-Site` denial for cross-site/same-site mutations even if Origin is missing, without blocking curl/Node clients with neither header. Existing Origin checks remain.
- Login throttle is global 60/hour per Node process plus a per-normalized-email 12/hour bucket. This is an interim mitigation only; buckets and AI limits do not coordinate across server replicas.
- `SESSION_COOKIE_SECURE=1` forces Secure cookies for HTTPS deployments even if a proxy fails to forward HTTPS metadata. **Keep 0 for localhost HTTP**, which requires non-Secure cookies.
- Next middleware adds X-Content-Type-Options, X-Frame-Options and Referrer-Policy; no CSP policy is enforced yet because it requires browser regression checks.

## Remaining risk backlog
1. Signed sessions are stateless for seven days; logout only expires browser cookie. Stolen old session tokens cannot be centrally revoked yet. Design per-device server-side sessions/session rotation before broad public launch.
2. Origin/Fetch Metadata are defense in depth; production still needs threat model, host/proxy header trust policy, browser penetration tests and potentially explicit CSRF tokens on sensitive forms.
3. Distributed (DB/Redis) per-account/request quota and AI budget accounting; prevent simultaneous AI requests from slipping past provider daily counters.
4. E2E browser automation with stable HTTPS frontend, retention/export/erasure and audit; release gates in A4.
5. Swiss Ephemeris/RWS art commercial license review before monetization.

## Normal Windows update (existing data preserved)
```powershell
cd C:\Users\Note\jyotish-studio-git
git status --short
git pull --ff-only origin main
npm install
docker compose up -d db
npm run db:generate
npm run db:migrate
npm run security:check
npm run test:all
npm run test:swagger
npm run build
npm run dev:full
```
No new Prisma migration in this stage. Do not overwrite .env, reset PostgreSQL or run `docker compose down -v`.

## Optional isolated local DB integration (safe from your normal DB)
Run only if you want to repeat the GitHub integration suite locally. Uses a **separate disposable container and port 55433**:
```powershell
docker run --rm -d --name galaxiora-a1-test-db -e POSTGRES_USER=ci -e POSTGRES_PASSWORD=ci -e POSTGRES_DB=galaxiora_a1_test -p 55433:5432 postgres:16
# In this PowerShell session only — DO NOT save the URL in .env:
$env:DATABASE_URL = 'postgresql://ci:ci@127.0.0.1:55433/galaxiora_a1_test?schema=public'
$env:GALAXIORA_INTEGRATION_TEST = '1'
npm run db:generate
npm run db:migrate
npm run test:integration
Remove-Item Env:DATABASE_URL
Remove-Item Env:GALAXIORA_INTEGRATION_TEST
docker stop galaxiora-a1-test-db
```
The test runner starts its own Nest port 45721; **stop your current Next/Nest dev session** for clarity before this optional procedure. This container has no Docker named volume, so it is disposable. Do not point this suite to the usual local `jyotish` DB.

## Manual browser / negative QA after update
1. Log in to `/uk`; check account, logout, relogin, English switch.
2. `/uk/tarot` with MEMBER: draw one card, refresh, check private history; three daily draws allowed, fourth blocked without losing history.
3. ADMIN on `/uk/tarot` sees 100/day (minus used); admin history separate from member history.
4. Logged-out and MEMBER attempts to access `/uk/admin` must reveal no admin data; administrator sees user list and role audit.
5. A second account cannot open/delete charts or Tarot history created by the first account.
6. In Developer Tools > Network, confirm account mutation cookies are HttpOnly / SameSite=Lax. On localhost HTTP, they do not need Secure; on real HTTPS public deployment set SESSION_COOKIE_SECURE=1.
7. Browser Console shows no errors, and DevTools Network shows X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin on page responses.
8. Check Jyotish D1/D9/D10 and report unchanged; NO paid Tarot AI requests unless explicitly enabled and approved.

## Sources
- GitHub PostgreSQL services: https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers
- OWASP CSRF and Fetch Metadata: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- NestJS tests: https://docs.nestjs.com/fundamentals/testing
