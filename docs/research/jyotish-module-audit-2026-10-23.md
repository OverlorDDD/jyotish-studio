# Galaxiora / Jyotish — full-module architecture audit and hardening
Date: 2026-10-23 · Source branch: `feat/consultation-quality-v2` → patch: `fix/jyotish-quality-audit-hardening`.

## 1. Qualitative review of the sample Gemini CQv2 report

**Provisional editorial score: 7.5/10, not a verified astrological correctness score** because the exact calculation JSON was not provided alongside the user-facing prose.

Strengths: correct-looking Pisces dual lordship of Jupiter H1+H10, tighter symbolic synthesis, difficult configurations interpreted with context, an active Saturn/Ketu period, actionable practices, natural narrative. Does not simply recycle Reader v5 paragraphs.

Defects: no substantive D9 or D10 analysis despite the source label; definite investment instruction ("це не час для нових великих інвестицій") inferred from symbolic dasha, too categorical; language errors ("десята хапа", "Ваша Місяць", "єдиний мірило"); too confident psychological mind-reading; career/resources dominate. Target: a more complete **one-document** consultation without returning to all-eight-chapter gating.

Patch: single immutable instruction still calls LLM exactly once per provider; adds explicit supported D9+D10 factor requirement, idiomatic UA reminder, a ban on categorical portfolio/investment instructions, **non-blocking** post-completion review of missing vargas, risky financial imperatives, dasha coverage, potential lord claims and length; precise typo corrections only. NEVER discard an otherwise usable response for stylistic coverage issues. Logs only diagnostic codes, never full personal text. Human source review still essential.

## 2. Reverse-traced Jyotish pipeline: each module, role, observed risk, test

| Scope / module | Problem solved / verified input-output | Current risk / audit action | Automated coverage |
|---|---|---|---|
| Web `apps/web/app/astrology/jyotish/page.tsx` | Validated birth form, locale, chart calculate, D1/D9/D10 tabs, AI vs Reader controls, runtime-version check | Browser might show saved older snapshot; report version checked, UI remains same | `jyotish-real-pipeline.spec.mjs`, `jyotish-layout.spec.mjs`, `a4-portal.spec.mjs` |
| `apps/api/src/dto.ts` | Date/time, IANA timezone, geographic coordinates, language, local/auto mode | Input correctness must also be enforced by ephemeris/core; DTO alone cannot verify historical timezone | `core.test.ts`, `engine2.test.mjs`, API + E2E |
| `apps/api/src/logic.ts` | Server-side validated calculation orchestration, ephemeris selection | Old `interpretChart` short-reading path still exists and uses legacy AI; **not the main POST reports path**, deprecate separately | `engine2`, `api-response`, `smoke-test` |
| `apps/api/src/ephemeris.ts` + `tools/swiss_ephemeris.py` | Native Swiss ephemeris + Python fallback, Lahiri, sidereal positions, mean lunar nodes | OS/native engine parity and exact DST correctness need JHora regression; Python fallback not equal legal license clearance | `reference-check`, `cross-method-check.py`, `core`, CI E2E |
| `packages/jyotish-core/src/index.ts` | Whole-sign D1, signed 9 grahas, Moon nakshatra+pada, D9/D10, Vimshottari | Accuracy depends on precise input and independent ephemeris validation; do not change accepted calculations | `npm test`, `test:engine2`, `test:reference` |
| `packages/jyotish-core/src/rules.ts` | Parashari 12 house lords, dignity, narrow certified named yoga set, validation and hash | Sign dignity **is not** Shadbala or neecha-bhanga; narrow rules documented | `test:a8:graph`, `test:engine2`, `test:jyotish:quality` |
| `apps/api/src/reader-classical.ts` | Functional house roles/yogakaraka, selected non-blocking lord-claim review, source IDs | Heuristic prose parser cannot prove factual validity; no hard rejection | `test:a8:substantive`, `test:jyotish:integrity` |
| `apps/api/src/consultation-fact-graph.ts` | Machine-verifiable D1/D9/D10 nodes, dispositor, sign-based drishti, dasha | No school-wide completeness; graph checks no invented facts | `test:a8:graph`, `test:jyotish:quality` |
| `apps/api/src/consultation-quality-v2.ts` | Six themed, evidence-linked priority brief for support/friction/mixed and dasha | Weighting is an editorial heuristic, not classical numerical strength; guard token budget | `test:jyotish:quality` on all 12 lagnas |
| `apps/api/src/reader-narrative-v6.ts` + `interpretation-v3.ts` | Deterministic UA/EN 8-chapter reading whenever cloud is unavailable | Human prose quality still variable; never claim it is the LLM text | `test:a8:reader-v6`, `test:report` |
| `apps/api/src/report.ts` + `jyotish-report-application.ts` | One deterministic report from server-recalculated chart plus explanatory sections | Chart assembly is O(1) small; retaining a second legacy long-text layer is a technical debt, not active cloud blocker | `test:report`, `test:architecture:a3` |
| `apps/api/src/direct-jyotish.ts` | Compact fixed fact bundle + one immutable system instruction + 1 LLM request/provider + safe failover | Missing D9/D10, categorical claims and UA grammar; patched instructions and non-blocking diagnostics | `test:jyotish:direct`, `test:jyotish:integrity` |
| `apps/api/src/free-ai.ts` | Shared request limiter, confirmed-free provider configuration, legacy provider adapters | Legacy A8.9 path still used by short-reading endpoint and Tarot-independent modules; do not delete blindly | `test:free-ai`, `test:a7:cloud`, `test:a8:cloud` |
| `apps/api/src/consultation-ai.ts`, `consultation-intelligence.ts`, `resilient-consultation.ts` | Earlier strict-chapter A8.9 experiments | NOT called by active reports route; retain research tests, assess removal/deprecation only after compatibility inventory | `test:a8:intelligence`, `test:a8:resilience` |
| `apps/api/src/consultation-prose-review.ts` (NEW) | Lightweight UA typo correction, missing D9/D10, possible unsupported financial directives, missing current dasha/lord claims | **Warnings only**, not a semantic fact-verifier and never discards accepted model output | `test:jyotish:integrity` |
| `apps/api/src/consultation-replay.ts` (NEW) | Share concurrent same-chart LLM request, cap successful cache at 40/30min, retry errors | In-process only, not cross-replica distributed; global quota still rate-limits users together | `test:jyotish:integrity` |
| `apps/api/src/nest.ts` | API routes, account ownership, recalculation, report version, model usage | Repeated concurrent identical reports previously consumed multiple quota calls; patched in-flight cache; GET runtime exposes version | real `jyotish-real-pipeline.spec.mjs` + `test:api-response` |
| `apps/web/app/components/DetailedReport.tsx` | One large native AI document + Reader sections + provenance and glossary | User submitted two practices now distinct; accepted visual design preserved | `jyotish-layout.spec.mjs`, `jyotish-real-pipeline.spec.mjs` |
| `apps/web/app/components/NorthIndianChart.tsx`, `apps/web/lib/north-indian-layout.ts` | D1/D9/D10 stable house geometry, bounded crowded stacks, UI icons | Approved design, no changes | `test:jyotish:layout` + browser chart layout |
| `apps/web/app/components/GlossaryText.tsx`, glossary library | UA/EN jargon explanations hover/focus | UI accessibility/performance still worth periodic audits | `test:glossary`, `a21-glossary.spec.mjs` |
| `apps/web/app/components/AccountPortal.tsx`, `apps/api/src/account.ts`, `chart-application.ts`, `chart-prisma.ts` | Authenticated save/list/open/delete and private owner-only chart access | **BUG FIXED:** saves previously stripped Gemini/Groq AI provenance; saved report missing Reader v6 version so reopened reports disappeared; text cut at 12k. Now accepts Gemini/Groq, stores full up to 32k, marks Reader v6, retains AI source | `test:architecture:a3` new re-open roundtrip, `test:access`, PostgreSQL integration |
| `tools/start-jyotish.ps1` | Checks branch/port ownership; starts right Next/Nest pair | Must update if branch name changes; per-machine runtime handshake still checks direct-v2 | CI syntax/real browser local guidance |

## 3. Test evidence and limitations
Baseline head of parent PR #42 `4065c26d`: GitHub Actions `39819443640` PASS all jobs (unit/full build, Postgres, Chromium). For THIS hardening branch, acceptance requires a **new** workflow on its final commit, including added cache/reopen/coverage test. CI browser runs AI_MODE=local and uses a controlled mocked provider for single-call gateway; it does **not** prove live Gemini/Groq availability or quality of a new real model answer.

No chart data or secrets are required for the tests and none are committed.

## 4. Outstanding risks by release priority

P0 before a paid or public relaunch:
- Human factual audit of at least 10–20 real natal charts, including tricky DST and D9/D10 boundary values; independent JHora comparison, school-specific rule provenance.
- Textual QA on UA/EN real model responses: D9/D10 integration, strengths/frictions, evidence, categorical future/financial assertions, literary polish; rubric >=4/5 on each facet.
- Finalize stacked PR #41 (direct), #42 (CQv2), then this audit patch; validate main on actual Windows after merge.
- Confirm Swiss Ephemeris licensing and historical-book translation rights for the intended distribution/commercial model; do not assume free for commercial redistribution.

P1 early public beta:
- Global in-memory 50 reports/hour and 10-ish free model attempts/hour are deployment-wide limits, not user fairness; add per-account/IP cost controls, abuse protection, provider budgets and usage dashboards.
- Single-flight cache only covers one process, not multiple replicas; add shared Redis cache if/when production replicas appear.
- Remove or clearly deprecate the legacy POST /interpretations/ A8.9 pathways only after verifying other consumers. Do NOT recreate multi-call strict report gating.
- Saved consultation provenance is client supplied when an authenticated user saves their own card; mark as account snapshot rather than server-verified third-party interpretation if displayed/shared publicly.
- Monitor actual cloud response latency, accepted length and QA codes without storing private birth facts in logs.

P2 product expansion:
- Personalized dasha/transit module based on independently verified astronomical timing.
- Upgrade Tarot literary quality in the same way without borrowing Jyotish-specific factual rules.
- Academy, articles, glossary, SEO content, personal account UX, payments when legal/financial mechanism ready.
- Performance/accessibility on real phone and desktop, and first public non-paid demo launch before broad traffic.

## 5. Not touched
No edits to Swiss calculation, approved D1/D9/D10 visual layout, Tarot, Yoga, payment code, astrology rule formulae, or paid cloud setup. Main one-pass AI pipeline still returns the result if the model completes; warnings do not trigger a second model or fail an accepted report.
