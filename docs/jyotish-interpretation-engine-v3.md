# Galaxiora Jyotish Interpretation Engine v3 — implementation contract

## What changes
The former editor produced ten mostly deterministic template sections. The v3 engine in apps/api/src/interpretation-v3.ts now separates (1) verified Parashari chart-derived evidence, (2) ranked AstrologicalFinding records, (3) an eight-chapter connected consultation. Existing core astronomy (Swiss/Lahiri, D1/D9/D10, Vimshottari) and the version 2.0 calculation/rule facts are unchanged.

Output: 3.0.0 version, 5–8 ranked findings (topic, ruleId, evidence, supporting and counter factors, importance, limitations), eight chapters, technical-only elements, three highlights. The free-model AI receives ranked verified evidence, not 10 prewritten editor chapters. The deterministic eight-chapter consultation works with AI switched off. Existing saved material is not rewritten.

## Interpretation order
1. Rising sign and ascendant lord, Sun and Moon nakshatra.
2. Largest genuine whole-sign classical planetary cluster, or a verified ruler-based alternative if none.
3. Mars/Saturn conjunction only when they actually share a D1 house; otherwise explain why there is no conjunction.
4. Seventh lord, Venus, Moon and D9 comparison for partnerships.
5. Tenth and ninth lords, plus D10 context for vocation.
6. Second and eleventh lords for resources.
7. Actual as-of-date mahadasha and antardasha; no fabricated events if no active period.
8. Final synthesis of ascendant, leading configuration, relationships, vocation and time.

Only supported facts can anchor findings. Do not invent aspects, additional yogas, Shadbala, life history, diagnoses or certain financial/health/fertility/death outcomes. Jyotish is communicated as a serious spiritual interpretive tradition, without asserting scientific proof of personal predictions. Readers receive confident, respectful, practical-language prose with meaningful interaction of factors rather than self-help exercises.

## Rendering and accessibility
The core narrative has eight visible chapters. Element distribution has moved to a collapsed technical appendix; there is no repetitive 'Interpretive key' card. The central bilingual glossary continues to annotate new and old renderable texts on hover, keyboard focus and tap.

## Validation / release
Use targeted checks first: npm run test:report, npm run test:glossary, npm run test:ai, npm run test:engine2, then npm run test:all, npm run build, npm run test:swagger, npm run test:integration and npm run test:e2e in a safe isolated environment. The report test contains twenty synthetic whole-sign chart permutations plus cluster/validation tests. CI is required before merging. Actual prose quality must also be accepted with separate real charts and independent Jyotish review.

## Limitations and follow-ups
- Rule-based findings are substantive but currently selected from the implemented subset of Parashari logic. More validated strength/yoga rules and a stronger natural-language synthesis may be added incrementally.
- AI commentary remains optional; the prose validator filters unsupported precise claims and is not a complete formal proof system. Never claim LLM facts were independently verified solely because a response was grammatical.
- All 20 synthetic test cards are structural/regression fixtures, not independent Swiss or Jagannatha Hora cross-checks.
- No business identity, payment provider, wallet secret or donation link is introduced in this release.
