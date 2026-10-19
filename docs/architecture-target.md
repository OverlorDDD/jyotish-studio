# Galaxiora — architecture audit and target blueprint

As of **2026-10-19**, audited against `main` commit `3d5bde3`. This is a design and risk register, not a claim that the proposed directory hierarchy has already been implemented.

## 1. What is implemented
- Bilingual UK/EN Galaxiora portal with locale routes and same-origin proxy from Next.js to NestJS.
- Separate `@jyotish/core` pure TS calculations; Swiss ephemeris adapter and deterministic rule-based Jyotish reports. Independent JHora numerical sign-off remains open.
- User registration / signed HttpOnly session cookies, private saved charts, admin role assignment and audit, subscription tier field (billing not connected).
- Tarot v2 with 78-card deck, 1/3/10 card spreads, reversals, private history, offline question-aware narratives, opt-in generative AI, admin quota of 100 UTC-day readings; local artwork preparation.
- Consented private expert-reading drafts and database order skeleton without actual payment/video commerce.
- Tests, Next/Nest build and GitHub Actions CI passing on main on 2026-10-19. No evidence of production browser E2E, DB-in-CI integration, production security audit or permanent deployment.

## 2. Current flow
```text
Browser (UK/EN Next.js App Router)
  -> same-origin /api rewrite -> NestJS controllers
     -> calculation/report & tarot domain functions
     -> PrismaService -> PostgreSQL
     -> Swiss ephemeris native or Python fallback
     -> optional AI (consent, server configuration, no key in client)
```

Major files: `apps/web/app`, `apps/web/lib`, `apps/api/src/nest.ts`, `apps/api/src/account.ts`, `apps/api/src/tarot.ts`, `apps/api/src/reading-orders.ts`, `apps/api/prisma/schema.prisma`, `packages/jyotish-core/src`. For ownership see `PROJECT_MAP.yaml`.

## 3. Target modular monolith
```text
apps/web/ (Next.js page/layout/client components; API as source of truth)
apps/api/src/
  modules/
    identity/
    jyotish/
    tarot/
    experts/
    subscriptions/       (only after billing is designed)
    usage/
  shared/                (minimal auth, config, DB, errors, telemetry)
packages/jyotish-core/  (retained, pure and independently testable)
```
This is a **future** layout, not a rename instruction. Within a complex module:
```text
domain/           pure entities, value objects, rules, domain errors
application/      use cases, ports/interfaces, transaction orchestration
infrastructure/   Prisma, ephemeris, external AI/payment/storage adapters
presentation/     NestJS controllers, DTO validation, response mapping
```
Dependency direction: presentation/infrastructure -> application -> domain. Interfaces belong where consumed; adapters implement them. Compose dependencies with Nest providers. No direct persistence calls from Next.js, and no business rules hidden in UI components.

### Bounded contexts
| Context | Owns | Does not own |
|---|---|---|
| Identity & Access | account, signed session, roles, authorization | paid entitlement determination |
| Subscription/Billing | membership tier, payment verified ledger, future invoices | staff role |
| Jyotish | birth input validation, ephemeris integration, chart facts, dasha and rules | free-form AI invention |
| Tarot | deck/draw state, quota, saved reading, local narrative, AI opt-in | account passwords |
| Experts | verified practitioner catalog later, private drafts, orders, video delivery | mark payment paid without verified webhook |
| AI & Usage | provider integrations, metering, consent/budget guardrails | authoritative Jyotish facts |
| Editorial/Community | planned content, moderation and indexes | payment or account credential logic |

## 4. Main audit findings and action
| Priority | Finding evidenced in code | Action (not yet implemented) |
|---|---|---|
| P0 before public launch | Need commercial licensing clearance for Swiss Ephemeris and RWS restored scans; no audited legal/privacy launch gate | Complete legal and image provenance register and user privacy/retention review |
| P0 before paid features | ReadingOrder statuses exist but no real verified payment flow | Keep payment disabled; implement signature-verified webhook, idempotent transition, refunds, restricted delivery |
| P1 | `tarot.ts` and `nest.ts` mix routing, quota/persistence and orchestration | Write characterization tests, extract one use case at a time |
| P1 | `createHourlyLimiter` and some AI replay counters are in-memory per process | Design per-identity, shared-store limits and costs; avoid relying on single process |
| P1 | CI runs unit/build/swagger/standalone smoke without a running Postgres integration test or browser E2E | Add disposable PostgreSQL CI service, authorization/transaction integration tests and focused browser smoke |
| P1 | Signed session cookie and origin checking are custom implementations | Threat model, proxy header trust review, session invalidation/rotation, CSRF, audit, security response headers and rate-limit verification |
| P2 | `README.md`, older roadmap and runbooks contain pre-Galaxiora/temporary-demo statements | Refresh documentation after code changes and confirm current runtime behavior |
| P2 | Some new portal categories are placeholder pages | Build CMS/editorial, publishing, discoverability and accessibility before content rollout |

## 5. Engineering rules
1. Preserve current observable behavior and existing schema during initial layering. Add characterisation tests for old contracts and negative authorization flows first.
2. Determine actual owner from `PROJECT_MAP.yaml` before editing. Keep cross-context contracts explicit, documented and versioned where exposed.
3. Never pass untrusted client chart facts to an LLM as authoritative; server recomputes. Separate deterministic facts from interpretive, clearly non-evidentiary prose.
4. Apply OWASP ASVS-based controls to auth, sessions, authorization, inputs, sensitive data, paid webhooks and provider secrets. Store private questions/birth profiles minimally; define retention and erasure flow.
5. Check performance with representative workloads before caching or splitting processes. Use structured logs without personal question text, and request-level correlation IDs.
6. Keep EN/UK URLs and canonical/hreflang metadata, `robots`/`sitemap`, keyboard accessibility and responsive behavior in release acceptance.
7. Keep monetary and paid AI providers opt-in; never infer cost from absent provider usage records.
8. For public hosting, use one stable HTTPS origin, isolated server-only config, managed backups and restore drills, migration strategy and monitoring; do not assume ngrok is production hosting.

## 6. Acceptance gates
- **For architectural refactors:** current test suite green before/after; API contracts, session handling, per-user history, admin quota, reversed cards and Jyotish reproducibility unchanged.
- **For public beta:** live DB integration, browser E2E on UK/EN, privacy/retention/deletion paths, license clearance, security threat review, accessibility check, backups and monitoring.
- **For paid services:** verified and replay-safe payment webhook, permissioned order status transitions, refunds/cancellations, protected video storage, provider contracts and user consent.

Full phased execution list is in `docs/implementation-roadmap.md`. This document supersedes the minimal diagram in `docs/architecture.md` for **future design**, not historical runtime claims.
