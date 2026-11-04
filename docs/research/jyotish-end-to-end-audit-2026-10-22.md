# Jyotish end-to-end architecture and blocker audit — 2026-10-22

## Scope and evidence
Audited GitHub branch `feat/reader-v6-editorial-consultation` (based on approved PR #39), then implemented corrective branch `fix/jyotish-direct-llm-e2e`. Includes core calculation, ephemeris, NestJS/report path, old A8.8/A8.9 AI services, Next.js proxy/browser, saved report, quality gates, tests, startup. Does **not** claim a live cloud request was performed from GitHub: provider access is present only in the user's local environment.

## Desired canonical workflow
1. Birth date/time/timezone/coordinates validated by Nest.
2. Server recalculates Swiss sidereal ephemeris with Lahiri, determines D1 ascendant/9 grahas, whole-sign houses, nakshatras, D9/D10, Vimshottari.
3. Rules determine 12 house lords, selected dignity/yogas, actual dashas. Prepare bounded **compact fact summary**; never send name, coordinates or raw birth input to cloud.
4. A **single versioned system instruction** + user-message facts to a verified free provider (Gemini/Groq/OpenRouter). One completed Markdown consultation and no editor calls. On 429/503/timeout switch providers, never paid fallback.
5. Render model prose as a **single large document**. Reader v6 is separately available and never blocked by upstream failure.

## Reverse-traced audit table
| Segment | Previous implementation | Failure | Corrective action |
|---|---|---|---|
| Web UI `apps/web/app/astrology/jyotish/page.tsx` | One button called reports without `preferred`, resulting in legacy AI route | Deterministic and LLM modes indistinguishable; old server could show v5 silently | AI vs Reader controls, explicit `preferred`, version handshake, stale response rejection |
| `DetailedReport.tsx` | hardcoded v5 in main, v6 in PR40, fragmented AI cards | Unexpected old frontend misleadingly appears current, full prose split into cards | versioned title/status; render one direct Markdown document and Reader as fallback |
| Next API proxy `apps/web/next.config.mjs` | same-origin rewrites to `127.0.0.1:4000` | Old backend may still hold port 4000 while newest Next runs | runtime endpoint `GET /api/v1/jyotish/runtime` includes Reader/pipeline versions; frontend blocks mismatches |
| API `apps/api/src/nest.ts` | Report DTO `auto` default launched `generateResilientFreeConsultation`; `GALAXIORA_A89_PREVIEW` launched `generateConsultationIntelligence` | partial chapters rejected by final all-eight gate; long latency and free-tier quota exhaustion | direct-v1, a single completion request per provider; explicit Reader mode and successful-response replay only |
| Previous `consultation-intelligence.ts` | graph/claims/global planner + strict unified author/editor and prose checks | highest-quality text can still fail formatting/whole-document validation | keep module for research, do **not** invoke on primary report route |
| Previous `resilient-consultation.ts` | 8 small API calls plus continuations and checkpoint | >=8 calls per consultation, 429 or 503 can stop final completion | retired from report route; no multi-call editor |
| Old `consultation-ai.ts` & `ai.ts` | [[id]] per chapter, fixed paragraph-length gates, JSON formats, 8 chapter constraints | models return useful prose discarded because of decoration and length | direct-v1 accepts a single coherent Markdown text with limited minimum-safety checks |
| `free-ai.ts` | real provider order/confirmed-free flags, hourly call budget, model limitations | expensive retries & quotas | export shared quota gate, direct calls only free-confirmed providers, switch on transport rejection |
| `direct-jyotish.ts` (new) | none | missing simple end-to-end LLM path | fixed prompt, compact chart facts, no birth data, one content response, bounded plaintext size and basic no-Western-factors validation |
| `jyotish-report-application.ts` + `logic.ts` | server rebuilds natal chart from input | correct and retains independent calculation | preserved |
| `ephemeris.ts` | Swiss node + pyswisseph fallback; calculates sidereal lagna and 9 grahas | platform-native adapter availability still matters; no proof of direct JHora parity for all real charts | preserved, tested end-to-end in CI; JHora parity remains separate acceptance |
| `packages/jyotish-core/src/index.ts` | D1/D9/D10 + Vimshottari + validation | calculation basis reasonably covered, no immediate root cause for cloud failure | preserved; unit/cross-method checks remain |
| `rules.ts`, `reader-classical.ts`, `reader-narrative-v6.ts`, `interpretation-v3.ts` | deterministic rule support + full Reader | Reader quality may need human acceptance; separate issue from cloud | keep Reader v6 independent and present whenever requested/cloud unavailable |
| `chart-application.ts` / saved reports | stored previous report snapshots with older `editorial.version` | can display stale Reader prose until user requests new report | web rejects outdated saved report display in the active editor; no destructive migration |
| `main.ts` + `next-launch.mjs` | .env inherited and Next/API started separately | user can access server left running from another branch | PowerShell port/branch guard, runtime fingerprint handshake |
| CI/browser tests | most `jyotish-layout.spec.mjs` requests were mocked | green screenshot tests did not prove request path to Nest | add real Playwright E2E (without mock reports), runtime GET + chart POST + Reader POST UA/EN |
| Live CLI `ai:verify-live` | exercised old 8-chapter path | reported A8.9 errors after direct changes, confusing diagnosis | point script to exactly the new active direct-v1 gateway |

## Specific blockers and prioritization
**P0 fixed by PR #41:** old Reader frontend on localhost; no cross-service version signal; eight-chapter acceptance gate; upstream failover loses valuable prose; UI cannot distinguish full AI consultation and deterministic Reader.

**P1 addressed in this PR:** single direct gateway, free-tier-only failover, bounded provider response size, common hourly quota, successful-only cache, explicit version endpoint, real web/API e2e tests, deployment/startup guard.

**P1 to verify on user's machine:** actual model quota and network availability, final literary quality and factual accuracy of model prose, visual verification after branch switch, whether `OPENROUTER_FREE_MODEL` still exists, real native Swiss adapter and timezone on Windows.

**P2 future work:** automatically fact-check individual model statements against `ChartFactGraph` (the new direct-v1 instruction constrains model behavior but cannot prove model assertions true); verify citation/edition provenance for historical OCR; separate high-quality text editing from generation only if it is demonstrably necessary; independent JHora parity across 10–20 charts; streaming for partial provider outages if future supported models permit.

## Validation matrix
- `npm run test:all`: core, Jyotish, Reader, direct-v1 mock-provider acceptance/failover, other platform regressions.
- `npm run build`: Nest + Next production compile.
- CI Postgres: RBAC and data isolation intact.
- `e2e/jyotish-real-pipeline.spec.mjs`: real browser → Next proxy → Nest → Swiss → Reader, no intercepted report JSON, both locales, no accidental reversion to v5.
- `npm run ai:verify-live`: real free-tier provider one-shot using a synthetic chart on a device where the providers are configured; must return accepted long text. **Cannot be confirmed via CI without credentials/network access.**
- Human: actual 1996 natal chart rendered on Windows for direct long consultation, prose compared to supplied reference and factual assertions checked against table; never claim ready without this pass.

## Manual quickstart
`git switch fix/jyotish-direct-llm-e2e; git pull --ff-only origin fix/jyotish-direct-llm-e2e; docker compose up -d db; powershell -ExecutionPolicy Bypass -File tools/start-jyotish.ps1`
Open `http://localhost:3000/uk/astrology/jyotish`. Test `Читати без AI — Reader v6` then `Створити AI-трактування`. For provider diagnostic, run `npm run ai:verify-live` after stopping dev server or separately; compare provider/model and outcome only.
