# N4.3 — Integrated Natal Reader 7 + grounded AI consultation
Date: 2026-11-07. Owner requested one consolidated implementation. Draft PR #143; no unreviewed AWS deployment or merge.

## Audit of before state
- Reader v6 (8 existing substantive editorial chapters) relied principally on D1/D9/D10. N4.2 appended 15 bound but largely technical D1-varga comparisons; ordinary users saw a wall of house/ruler terminology.
- Free-model direct-v2 called Gemini, Groq or OpenRouter with verified D1/D9/D10 and the compact N4 dataset, but its original rules made the model list ruler/house numbers. It accepted some repetitive filler and did not hard-block a wrong house-lord or unsafe financial directive.
- D60 was mathematically method-certified for fixed longitudes, but personal birth-time and divisional-lagna stability were not certified. No personal D60 narratives are allowed.

## Editorial principles (grounded in the code and classical source categories)
- Parashari thematic domains are introduced through everyday questions, not unintroduced Sanskrit: resources, actions, home, family, partnership, vocation, learning, strengths, obstacles, inherited values.
- D1 is the general basis. D2–D45 are thematic *refinements*, not free-standing proofs about the person's actual experiences. No personality scores, medical outcomes, guaranteed wealth, fixed events, or unverified planetary dignity and predictive timing.
- Every insight combines at least two distinct, server-validated source placements from the theme's varga and the D1 house-lord. No generic "everyone is 53% favorable" scores.
- Clear format: **potential strength → issue to watch → one small, real-world step**. Factual calculations are accessible under "Why this interpretation?" rather than in the opening copy.
- D60 remains the 16th visible chart, with a clearly visible accuracy note but no per-person interpretation.

Sources for technical method/domain selection (not proof that astrological interpretations are scientific):
- Brihat Parashara Hora Shastra, Shodashavarga chapters and topic allocation: https://www.horasad.com/download/ebooks/BRIHAT_PARASHARA_HORA_SHASTRA_1.pdf
- Classical domain summary and discussion of reliability: https://epandit.in/en/learn/varga/shodashvarga
- Method overview: https://www.parasharahora.app/methodology

## Implemented code
1. `apps/api/src/reader-v7.ts`: readable, deterministic bilingual engine, 15 insights + 3 most useful takeaways (D27 resource, D30 challenge, D10 next step); precise source-proof tokens; higher-varga time sensitivity; no personal D60 result.
2. `apps/api/src/report.ts`: additive `readerV7` field; retain v6 underlying eight chapters and older report sections.
3. `apps/web/app/components/ReaderV7View.tsx` + CSS: premium Galaxiora design, helpful summary first, 15 visible life-area cards, original numerical evidence only in optional disclosures. Existing technical narrative is a separate optional expanded section to reduce jargon. AI consultation has distinct provider/provenance.
4. `apps/api/src/direct-jyotish.ts`: bounded, verified Reader 7 prompt content; plain-idiomatic writing instruction; require 2 new relevant vargas, block unsupported D60 and other D-codes, block fabricated explicit chart/planet/house references, repeated filler, wrong D1 house lordships, inappropriate investment advice.
5. `apps/api/src/nest.ts`: include Reader 7 edition in runtime and successful-AI cache key; prior AI v2 cache cannot silently override new content. No provider credentials logged or committed.
6. `apps/web/app/astrology/jyotish/page.tsx`: Reader 7 CTA and API contract check; old stored Reader v6 reports do not impersonate Reader 7.
7. SEO: restored keyword-compatible English meta description without losing 16-life-charts value proposition.
8. Tests: `tools/n4-reader-ai-16.test.mjs`, `tools/n43-reader-preview.mjs`, `e2e/n4-d60-provisional.spec.mjs`, `.github/workflows/n43-reader-ai.yml`. Previous browser D60 minute-toggle test opened the form incorrectly and was corrected; it did not indicate a bug in the real checkbox.

## Testing rules
- Symbolic D60 method certification is maintained from prior N4 records, *not* redefined.
- Fast N4.3 CI checks new Reader 7, old Reader v6, mock Gemini/Groq, 3 distinct synthetic cases in UA/EN, Core/API/Next production builds, and negative math cases.
- Browser acceptance requires 320/360/390/430/768/1024/1440 widths, no horizontal overflow, 15 plain cards + D60 note, usable navigation, saved reports, and truthful AI provenance.
- No live Gemini/Groq validation can be claimed without actual provider configuration. Mock tests prove protocol/guard behavior only, not provider quality.
- Full AWS release remains gated on exact-head CI + integration into current production baseline, backup and smoke. Draft PR must not be deployed directly over a newer main branch, as that may revert unrelated site updates.

## Local inspection, no Docker
At an existing clean copy of the PR branch:
```powershell
cd "$env:USERPROFILE\galaxiora-n4-preview"
git pull --ff-only origin feat/n4-d60-certified-precision-20261107
node --experimental-strip-types tools/n43-reader-preview.mjs
```
The last line shows three *synthetic* charts in Ukrainian and English using the production Reader code; it is NOT the live AI or personal birth calculation.
The real Reader and AI require web **and** NestJS API from the same commit, configured database and external provider keys for the latter. If providers are unavailable, deterministic Reader 7 still works; never present a fallback as AI-generated content.

## Release state
No merge or production publish was performed by creating this document. Check exact PR SHA and all required GitHub checks before declaring acceptance.
