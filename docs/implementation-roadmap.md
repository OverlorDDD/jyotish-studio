# Galaxiora — phased delivery plan (2026-10-19)

Status values distinguish **already in main** from work requiring new engineering. Stages are incremental; do not modify unrelated modules or create expensive all-suite loops for a small task.

| Stage | Priority | Deliverable | State / measurable exit |
|---|---|---|---|
| A0 Architecture foundation | Complete | `AGENTS.md`, `PROJECT_MAP.yaml`, DDD/ports-adapters ADR, risk register, reference index | **Merged to main as PR #10**, commit `9e0a4a9` |
| A1 Secure engineering foundation | Highest next | Contract tests, disposable PostgreSQL CI, CSRF, per-account auth throttling and environment check | **Implemented; GitHub CI PostgreSQL integration (8/8), unit/build/Swagger/smoke all PASS for branch commit `4e09a86`.** See docs/a1-security-and-testing.md; server-side session revocation and distributed quotas are still future hardening |
| A2 API module pilot | Implemented in A2 PR | Tarot application use cases, ports, Prisma and AI adapters; pure quota/date/question rules; transport-only controller, stable API | **Implemented; PR branch CI PASS (unit, full build, Swagger, smoke, live PostgreSQL integration); browser acceptance pending.** No schema or URL changes |
| A3 Reusable domain boundaries | Current | Extract account saved-chart, admin role, shared entitlement and Jyotish deterministic report preparation into explicit application ports/Prisma adapters | **Implemented; PR branch CI passed**, including tests, build, Swagger, smoke and real PostgreSQL (run 39249620186). Manual browser QA not performed. Expert drafts deferred. |
| A4 Site quality and release readiness | In progress | UK/EN live-browser E2E, locale and indexable SEO, keyboard/small-screen QA; security and operations checklist | **Implemented in A4 PR pending CI**; production audit, restore drill, license/privacy sign-off remain release blockers |
| A5 Publishing/content | After foundation | Real yoga/meditation and Academy content with editorial CMS, author/source workflow, SEO; news/community later with moderation | **Planned**; real multilingual content, moderation and no empty public promises |
| A6 Services and monetization | After security | Expert verification, order/payment webhook, protected video, refunds; premium plans and AI costs | **Planned**; never claim a pre-checkout draft is paid |
| A7 Public distribution | After A4/A6 as applicable | Stable domain, permanent free/low-cost hosting evaluation, analytics with privacy controls, marketing experiments, legal launch | **Planned**; continuous deployment, backup/rollback and monitored public site |
| A8 Mobile | After API stabilizes | Reuse shared API and contracts in React Native/other mobile client; no duplicated Jyotish/Tarot rules | **Planned**; tested parity with web |

## Live functionality baseline to preserve
- Galaxiora UK/EN shell; Jyotish Swiss/Lahiri D1/D9/D10, Vimshottari and rule-based reports.
- Signed accounts, private saved chart history, staff roles, admin audit and FREE/PREMIUM flags (not paid checkout).
- Tarot v2 78 illustrations, upright/reversed, one/three/Celtic spreads; narrative reader; optional external AI by consent; private history; member quota 3/UTC day, admin 100/UTC day.
- Expert **consented question drafts** only; no verified video orders or payment completion.
- Main GitHub CI green on 19 Oct; browser/production acceptance not yet verified.

## A3 implementation scope
1. Pure identity entitlement policy and public user projection; preserve roles separate from subscription.
2. Extract account chart save/list/read/delete orchestration behind owner-scoped persistence port, and share it with legacy Jyotish saved-chart API.
3. Extract admin role-change transaction behind policy/use-case and Prisma adapter, preserving Serializable audit and last-admin protection.
4. Isolate deterministic Jyotish report calculation/preparation from HTTP controller; keep optional AI orchestration unchanged.
5. Run focused application tests + existing unit/build/Swagger and disposable PostgreSQL CI before merging.

## Previous implementation task (A1, completed)
1. Inventory all HTTP endpoints and identify guest/member/admin permissions using existing controller/DTO files; write a focused permissions table.
2. Add a reproducible PostgreSQL service in CI and a few real database integration tests for Tarot quota concurrency, user history isolation and role gating. Do not touch schema unless required.
3. Review cookie/session and same-origin/proxy behavior including forwarded headers, logout, production HTTPS, and per-account rate limiting; implement changes only with regression tests.
4. Keep results in `docs/`, update this roadmap and `PROJECT_MAP.yaml`; provide a short manual Windows test checklist.

## Work still requiring product decisions
Payment processor/countries, real domain, licensing budget, storage for videos, editorial moderation policy, privacy/retention terms, analytics/marketing approach. Do not silently invent these.
