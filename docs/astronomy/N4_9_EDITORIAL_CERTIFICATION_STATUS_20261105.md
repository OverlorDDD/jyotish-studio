# Galaxiora N4.9 — Editorial certification engineering status
Updated 2026-11-05. Owner-facing engineering record for PR #120, never a production release certificate.

## Intent and evidence hierarchy
Two separate products: (1) existing deterministic Reader v6 plus additive NO-AI N4 thematic reading; (2) Direct Jyotish through the **already configured Gemini, Groq, OpenRouter** free-provider fallback, augmented with N4 source facts. No new provider is necessary. Existing N4 user-facing approval switches remain OFF.

Reliable astrological method sources: [P. V. R. Narasimha Rao, Vedic Astrology: An Integrated Approach](https://www.vedicastrologer.org/articles/), [Vedastram practical D1→Dn workflow](https://www.vedastram.app/en/docs/divisional-charts), and [mPanchang Shodashavarga table](https://www.mpanchang.com/articles/astrology/divisional-charts/). Traditional interpretation must keep D1 primary, judge the relevant Dn from its own Lagna, use real D1/varga planet and lordship facts, and avoid claims of scientifically proven predictions. A mathematical parity check is **not** textual truth certification.

## Implemented in Draft PR #120
- NO-AI: add calculated D1 topical lord vs matching Dn house-lord context to each chapter's analysis, conditional scene and next action, in Ukrainian and English. Distinguish four actual house-context types, preserving traceable six fact rows and Reader v6 unchanged. The 12-profile × 2 locale and property-based variation checks belong to `test:n4`.
- AI: `n4-editorial-gate.ts` now supplies the **same strict minimum** for live delivery and 48-response corpus auditing. Missing two distinct, selected extra D placements, incorrect explicit sign/house facts, prohibited D60 or critical financial/house-lord/Ukrainian errors reject gated N4 results. This is a bounded syntactic detector only, NOT a general semantic hallucination detector. Existing N4 corrective retry remains max one; legacy Direct v2 without N4 stays unchanged.
- Research: same-profile A/B prompts now genuinely differ, provider/model identity must match each pair, and outputs use synthetic profiles only; no user birth metadata.
- Local blind comparison UI: `node tools/n4-ai-blind-review.mjs <absolute-synthetic-corpus.jsonl> <absolute-output.html>`. Reads 48 accepted synthetic response records, verifies provenance and provider pairing, generates 24 pairs with hidden A/B identity, side-by-side texts, six 0–4 rubric dimensions, a hard-critical-error checkbox, comments and local-only JSON export. Responsive at 700px. No server or real visitor data.
- Local human-score prerequisite: `node tools/n4-ai-human-review-check.mjs <reviewer1.json> <reviewer2.json>`. Scores all 24 pairs for each of 2 local submissions; critical errors, missing ratings, or any score below 3/4 fail. Even a green check is **eligible for manual signoff only**: it cannot verify different actual humans or the truth of astrology.

## QA and blockers
1. `npm run test:n4`: verify current exact HEAD GitHub Actions run before claiming PASS. Historical independent PyJHora has passed 8,000/8,000 cross-assignments, but it certifies synthetic sign arithmetic, not original JHora or personal predictions.
2. Real 48 accepted provider outputs: **NOT collected here (0/48)**. The existing AWS AI keys may serve site requests, but GitHub/ChatGPT cannot read them or prove available free-tier quota; never dump secrets or natal content. Run explicit isolated synthetic-only 2-call batches with the already configured provider after owner operational approval, using restricted local paths. Failure responses count as failures, not invented outputs. Test with all three configured providers if safe; 48 is the defined fixed-model A/B audit corpus, not 48 per provider.
3. Human native-language editorial verification: **NOT COMPLETE**. One user may use the blind viewer to score; final review needs two distinct human reviewers, confirmed manually. Assess D1/D9/D10 + selected extra D lenses, naturalness, lack of templated advice, alternative outcomes, exact factual references and uncertainty.
4. Original publisher JHora 8.0 full 50 same-profile source charts: **0/50**, official installer returned HTTP 406/429. Independent PyJHora 8k PASS is not a replacement.
5. Full CI, build, 360px Chromium, SEO/privacy checks, original Reader v6 fingerprint and one last Windows owner QA need PASS **on the exact final HEAD**. Do not treat cancelled runs or older SHA as release proof.

## Owner decision / remaining sequence
A. Freeze only this Draft branch after the focused tests and resolve any CI failure; do not merge.
B. In non-production, produce 48 genuine provider responses on 12 completely synthetic charts × UK/EN × editorial A/B, with one concrete pinned provider/model for the pairs; run `node --experimental-strip-types tools/n4-ai-evaluate-live.mjs <corpus>`.
C. Generate local HTML blind report; collect two independent editorial score exports, run human gate, inspect all critical facts manually and revise until editorial acceptance. A/B winner is an informed preference, not statistically proven superiority.
D. Obtain original JHora method-matched 50-chart corpus through a safe official route, certify the exact same interpretation configurations.
E. Final Core CI, mobile/desktop, bilingual proof, owner Windows acceptance, explicit approval for merging and separate AWS release; keep N4 gates OFF if any mandatory evidence is missing.

**Never label N4.9 editorially certified or production-ready while 0/48 genuine texts or 0/50 authentic JHora samples remain.**


## 2026-11-07 chronological update — original JHora now available, editorial still open
The statement above that 0/50 original JHora samples were available refers to 2026-11-05. A later owner-private original JHora8 50-case source set and native SWIEPH True Citra / US-Hora verification were actually executed on 2026-11-06/07 (50/50 sources; 8,000/8,000 **method-aligned** sign comparisons; N4.14 time sensitivity and 253/253 numerical transition refinements). That does not certify the *different* production Lahiri/SunMoon D2 profile or the JHora Vimshottari calendar-year method.

No evidence of the required 48 genuinely evaluated UK/EN LLM outputs or two independent human reviewer signoffs was supplied in the current mathematical audit. Therefore N4.9 enhanced AI publication remains BLOCKED. The existing deterministic Reader v6 and Direct Jyotish production behavior should remain unchanged; do not make chart-specific D60 or precisely dated dasha claims from the diagnostic experiments. AI/UI editorial work begins only after a complete same-profile mathematical gate and a separate reviewed launch plan.
