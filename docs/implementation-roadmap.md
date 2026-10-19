# Galaxiora — phased delivery plan (2026-10-19)

Status values distinguish **already in main** from work requiring new engineering. Stages are incremental; do not modify unrelated modules or create expensive all-suite loops for a small task.

| Stage | Priority | Deliverable | State / measurable exit |
|---|---|---|---|
| A0 Architecture foundation | Now | `AGENTS.md`, `PROJECT_MAP.yaml`, DDD/ports-adapters ADR, risk register, reference index | Documentation PR submitted; review/merge pending |
| A1 Secure engineering foundation | Highest next | Contract tests and CI with temporary PostgreSQL; auth/session/authorization and quota concurrency review; versioned environment validation | **Planned**; no confidential cross-user reads, repeatable DB-backed tests, CI green |
| A2 API module pilot | Next | Extract Tarot Draw use case, repository/AI interfaces, pure policy functions from controller without changing routes or schemas | **Planned**; 1/3/10 spread, ADMIN 100/UTC, MEMBER 3/UTC, history and AI consent pass unchanged |
| A3 Reusable domain boundaries | Later | Extract account/admin, Jyotish report application, expert draft use cases only when touched; explicit module contracts | **Planned**; no DB/HTTP dependency in domain/application tests |
| A4 Site quality and release readiness | Before public beta | UK/EN browser smoke/E2E, performance budget, SEO sitemap/robots, WCAG 2.2 AA checks, observability, backup/restore, privacy and licensing review | **Planned**; operational and legal checklist signed off |
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

## Next implementation task (A1, deliberately bounded)
1. Inventory all HTTP endpoints and identify guest/member/admin permissions using existing controller/DTO files; write a focused permissions table.
2. Add a reproducible PostgreSQL service in CI and a few real database integration tests for Tarot quota concurrency, user history isolation and role gating. Do not touch schema unless required.
3. Review cookie/session and same-origin/proxy behavior including forwarded headers, logout, production HTTPS, and per-account rate limiting; implement changes only with regression tests.
4. Keep results in `docs/`, update this roadmap and `PROJECT_MAP.yaml`; provide a short manual Windows test checklist.

## Work still requiring product decisions
Payment processor/countries, real domain, licensing budget, storage for videos, editorial moderation policy, privacy/retention terms, analytics/marketing approach. Do not silently invent these.
