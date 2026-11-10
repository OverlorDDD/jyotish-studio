# N4.2 — Shodashavarga Reader and AI Evidence Expansion

Date: 2026-11-07. Target: same **draft PR #143**, **no production release** without owner's separate approval.

## Current-state audit

- `reader-narrative-v6.ts` generated 8 editorial chapters from D1 plus selected D9/D10 placements and verified Vimshottari. The 12 additional server-calculated N4 vargas were absent.
- `direct-jyotish.ts` built a deterministic but D1/D9/D10-only compact prompt for Gemini/Groq/OpenRouter; a successful cloud response was optional. Legacy `ai.ts` served the shorter interpretation route separately.
- `n4-rc-contract.ts` already generated the 15 bound charts under `jyotish-integrity-v3` provenance; `n4-d60-candidate.ts` separately exposed D60 with mathematically verified symbolic rule and **explicitly uncertified birth-time/lagna stability**.
- `DetailedReport.tsx` rendered Reader and direct model prose but had no section for N4 varga-focused, source-bound reading.
- Saved older reports could predate N4, so new fields must be optional and absent N4 must fail closed rather than fabricating data.

## Evidence model and design

The thematic mapping is based on the classical Shodashavarga allocation (BPHS vol. 1, section on divisional charts) and compared against practitioner technical notes, not copied prose: D2 resources, D3 siblings/courage, D4 fortune/property, D7 progeny, D9 partnership, D10 public work, D12 family/parents, D16 comfort, D20 devotion, D24 learning, D27 strength/weakness, D30 adversity, D40 auspicious/adverse and D45 broad themes. For D40/D45, vary tradition: avoid deterministic paternal/maternal claims or "past life" narratives.

Public research background (illustrative, not a proof of predictive efficacy):
- https://www.horasad.com/download/ebooks/BRIHAT_PARASHARA_HORA_SHASTRA_1.pdf
- https://siavigyan.com/learn/varga
- https://www.parasharahora.app/methodology
- https://www.vedastro.io/blog/divisional-charts-vargas

All deterministic reading is calculated **from the server-attached verified N4 payload only**. We check digest/version/method, completeness, whole-sign house arithmetic, and D1/D9/D10 parity. The relevant D1 house lord (from validated D1 lagna) is compared with the same graha's verified Dn sign/house. This is an *evidence-bound interpretive prompt*, **not a full classical phala prediction**, quantitative strength rating, calibrated personality test or scientific proof.

## Implementation

1. `apps/api/src/reader-varga-n4.ts` — fail-closed N4 verifier, bilingual 15-chart thematic readings, exact evidence tokens, distinct pragmatic self-reflection suggestions and `compactN4VargaFacts`.
2. `apps/api/src/report.ts` — additive `vargaReadings` field. Existing 8-chapter Reader v6 and report sections preserved.
3. `apps/web/app/components/DetailedReport.tsx` and `VargaInsights.module.css` — a responsive grouped interpretive section with per-chart evidence disclosure and explicit, visible D60 boundary.
4. `apps/api/src/direct-jyotish.ts` — inject bounded N4 evidence into cloud AI prompts. Require at least two **additional** D divisions in accepted output and reject D60/fabricated D numbers. Keep D1 primary and avoid borrowing D1 house lordship as Dn house lordship. Only provider-complete text passes through to UI.
5. `apps/api/src/ai.ts` — legacy short route also receives verified N4 context when available. The server never forwards names, birth date, city or coordinates to these contextual facts.
6. `apps/api/src/nest.ts` — change consultation cache key to include `N4_VARGA_READER_VERSION` so old D1/D9/D10-only AI output cannot be silently reused after the prompt/data upgrade.
7. `tools/n4-reader-ai-16.test.mjs` + N4 CI — verified provenance, synthetic chart-specific differences, guard against forged digest/D60 readings, UA/EN, old report fallback, AI scope and compactness.

## D60 accuracy/interpretation boundary

- The symbolic D60 calculation has previously been certified for exact input longitudes (JHora Traditional method).
- Precision of the actual birth time and divisional Lagna is a separate unverified statement. D60 **must not** be used to infer individual house meanings, karmic penalties, past lives, health/fertility outcomes, financial success or inevitable events.
- D60 remains visible in the 16-chart **viewer**. In the 16-theme Reader presentation its slot is a **method/precision explanation**, not a falsely certain personal reading.

## Acceptance and rollout

- Method/definition evidence validated on original JHora and PyJHora prior to this change; this PR does not alter mathematics.
- PASS new `n4-reader-ai-16.test.mjs`, prior Reader v6 tests, direct AI transport tests, Core/API/Next production builds, N4 D60 regression and e2e responsive tests.
- Human editorial acceptance: compare 3+ substantially different birth charts, UA/EN fluency, helpfulness of each of 15 thematic insights, no unsupported strength claims, and different content by varga.
- Test live model(s) separately using private provider keys without committing any keys or logging response bodies.
- PR stays **draft**, no merge or AWS deployment until full CI and human review. AI unavailability still shows deterministic Reader.
