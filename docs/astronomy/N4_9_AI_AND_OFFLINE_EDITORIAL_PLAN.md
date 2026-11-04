# N4.9 — AI + no-AI Jyotish editorial release plan
Date: 2026-11-04. Scope: PR #120 only; no `main` merge or AWS deployment.

## Research baseline
Primary practitioner reference: P. V. R. Narasimha Rao, *Vedic Astrology: An Integrated Approach* (divisional chart computation and using a divisional chart for its particular life area), section 6, https://storage.yandexcloud.net/j108/library/rptviqw0/P.V.R._Narasimha_Rao_-_Vedic_Astrology_-_An_Integrated_Approach.pdf .
Supporting reference: traditional Shodashavarga categories, BPHS ch. 6–7; independent overview https://www.mpanchang.com/articles/astrology/divisional-charts/ .
Interpretation must read D1 first and Dn *from its own Lagna*. D9 is a second lens on partnership/dharma; D10 profession/public contribution; D2 money/resources; D3 siblings/courage; D4 fortune/property; D7 children; D24 education; D30 unequal portions/troubles. No model is authorized to invent yogas, aspects, personal history, diagnoses, children, dates or guaranteed outcomes.
Sources are **astrological traditions**, not empirical proof that a person's future can be predicted.

## Two independent writing products
**No-AI Reader v6 + N4 additive companion.** Reader v6 chapters, rule fingerprint, live dasha and report digest remain byte-identical. New `n4-offline-reading.ts` creates five bilingual chart-specific chapters: D9 with Venus, D10 with the actual D1 tenth lord, and three high-signal varga lenses selected by computed D1 contexts. Each contains a factual D1→Dn link, contrasting house/sign position, a realistic *hypothetical* decision, an actionable next step and a source-fact disclosure. N4 chapters appear in the existing DetailedReport UI only with `N4_OFFLINE_READER_ENABLED=1` AND `N4_VARGA_INDEPENDENT_REFERENCE_APPROVED=1`. This is a separate optional N4 field; legacy Reader v6 stays intact.

**AI Direct Jyotish N4.** The existing D1/D9/D10 narrative contract stays primary; an independently computed N4 editorial brief adds three relevant extra D-chart themes only if both approval flags are on. Require at least two extra D lenses, **two independently verifiable numeric graha/house claims**, a source-grounded contrast, a benefit and a trade-off, concrete alternative scenario and a useful response. Reject missing evidence, D60 claims and explicit wrong numeric signs/houses before publishing; at most one bounded model retry. Numeric claim matching is limited to overt syntactic forms and is *not* a general hallucination detector. Human review remains mandatory.

## Automated test matrix
1. 12 deterministic synthetic chart inputs × UK and EN = 24 no-AI outputs: five chapters and traceable source placements, no private dates/cities/coordinates; all 24 unique within each language and meaningfully different across seeds. Reader v6+digest must be byte-identical with flags off/on except optional N4 annex.
2. N4 AI transport tests: both switches required; default OFF; only facts not customer birth metadata; known fabricated D-house/sign assertions rejected; two actual verified D placement statements required, not generic D-tags. One retry only. Resource-exhaustion and provider failure fallback leaves Reader v6 accessible.
3. Existing 50×16×10 independent PyJHora 4.8.7 oracle, JQA3, permission/owner isolation, Next/Nest build, 360px/desktop Chromium and EN/UK FAQ all remain required on same SHA.

## Real provider editorial acceptance — separate, NOT yet certified
Create a 48-response *synthetic-only* corpus: 12 deliberately different chart signatures × 2 languages × 2 editorial emphasis variants. Run against the actual approved free-tier provider with **only synthetic** input, explicit opt-in, quotas and secret handling. Preserve provider/model and timestamp, source seed, language, prompt version and output for a reviewer; never store user natals or API keys. No project source can invent this corpus.

**Blind human editorial audit (0–4 score in each dimension):**
- verified graha/sign/house/source integrity (zero fabricated facts is mandatory);
- actual D1 / D9 / D10 comparisons, plus 2 grounded extra D lenses;
- interpretive detail and genuine distinctions between synthetic charts;
- concrete, coherent trade-offs and actions rather than generic or repeated praise;
- idiomatic Ukrainian, idiomatic English, natural paragraph transitions and rhythm;
- sensitivity to time uncertainty, avoiding unearned dasha dates or D60 confidence.
All critical astronomy hallucinations, personal-data leaks and exact guaranteed event dates require a FAIL, regardless of aggregate score. Require >=3/4 on each non-critical dimension; at least 2 different human reviewers should resolve borderline cases. Automated regex/word counts do NOT replace this.

## Blockers, mitigation and stopping rule
- JHora 8.0 same-profile 50-source corpus is unavailable from original publisher (HTTP 406/429). Never treat PyJHora oracle as original JHora certification, and do not enable new N4 flags in production.
- JQA3 true-sidereal-solar mode has 180/180 maha + 1620/1620 antara matching original *calendar dates* across 20 sources, but not exact transition instants and is not installed in legacy API. Do not silently change Reader v6 dates or claim day-exact future events.
- Existing GitHub secrets do not authorize revealing API keys or running paid provider calls. No live model-text PASS can be claimed without actual responses, provenance and review. Default CI uses deterministic fixtures only. Opt-in batch runner requires explicit non-production free-tier flags.
- Birth-time uncertainty especially for D60 is independent of model output. Do not treat angular sector boundary distance as clock-minute precision.
- N4 offline thematic cards should not overwhelm mobile layout: 1 column <=700px, visible source proof in details, D1 chart always available.
- If any required gate fails, leave N4 enhancements OFF; do not suppress existing Reader v6, other product flows or currently certified fingerprints.

## Release decision
`test:n4`, authentic PyJHora 8k, original JHora 50×16×10, full Jyotish Core/Chromium, source-and-output QA, one final Windows user QA, explicit owner merge/deploy approval, rollback plan. No deploy from this PR until then.
