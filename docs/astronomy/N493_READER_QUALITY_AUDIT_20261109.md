# Reader N4.9.3 — quality-first evidence-ranked interpretation

**Date:** 2026-11-09 | **Base SHA:** `3c7b474edf75ac4fd6935140abf15c5b6dc78712`
**Objective:** respond to owner's independent assessment that N492 is **4/10** by improving relevant personal meaning rather than word count.

## Sources and fidelity
- **Repository source audit:** `reader-meaning-n492.ts` preselected a single D1 lord for each varga, added nearly identical instructions, and repeated Mars in D10/D24 without presenting a useful unique conclusion; `ReaderN492View` showed a long sequential report with no ranked personal value up top. `reader-classical.ts` and `packages/jyotish-core/src/rules.ts` already implement classic functional D1 house lordship, yogakaraka kendra+trikona, seven-graha sign dignity and strictly limited Pancha Mahapurusha signs plus angular house.
- **External traditional method references:** BPHS, ch. 6–7, subject divisions and Vimsopaka; https://www.horasad.com/download/ebooks/BRIHAT_PARASHARA_HORA_SHASTRA_1.pdf and https://epandit.in/en/learn/varga/shodashvarga. These are source references for traditional meaning **not empirical validation of life forecasts**.
- **Important limitation:** the sources supplied to the project do not yet certify complete Shadbala, neecha-bhanga cancellations, all graha drishtis and aspects, event timing or individual D60 lagna and houses. No such claims have been added. Time-sensitivity of high vargas remains explicit.

## Implementation
1. `reader-insights-n493.ts`: seven conditional pattern families (career D1+D10+D24, partnership D1+D9 with distinct Venus, rising-sign ruler/Moon/Sun, wealth 2nd+11th/D2, education 5th/D24, cautious D1 debilitation, verified limited Pancha Mahapurusha) sorted by evidence relevance. Output 3–5 high-value headlines with one factual takeaway and rule-specific proof for each.
2. **No double voting:** the same planet with similar dignity in D10 and D24 is one correlated traditional indicator; selection suppresses duplicate education/career promotion if ruled by the same planet.
3. `reader-detail-n493.ts`: ten previously weak thematic D cards each now consider **two different planets** rather than one, their D1 and Dn house contexts and sign dignity. When the thematic reference planet equals the D1 lord, choose a distinct context indicator without treating it as an independent historical verse.
4. `reader-meaning-n492.ts` reuses these source-bound patterns and adds **all insights relevant to a topic**, avoiding silent loss when two top observations land in D1.
5. `ReaderN492View.tsx`: short 3–5 insight discovery list first, each anchored to its full D card, then 16 ordered D1→D60 cards, then ONE actual D1 career relationship synthesis (not a list of repeated earlier headlines). D60 remains a normal card with nine computed provisional planetary signs, never uncertified individual houses.
6. `presentationEdition=n493-ranked-patterns-1.0.0` in live API/browser cache ensures old saved cards are not accidentally shown under the new format.
7. CI/QA: `tools/n493-discovery-editorial-qa.test.mjs` saves **120 full synthetic fictional horoscopes × UA/EN** and checks exact source proof, special Cancer-yogakaraka pattern, nonduplication, text specificity, private-data stripping and correct card alignment. Existing Swiss native HTTP and browser 320–1440px tests remain mandatory. `tools/n493-aws-release.sh` uses no Docker, no migrations, safe pinned-SHA preflight and rollback, and validates 3–5 evidence-backed discoveries in public API.

## Qualitative acceptance and mandatory stop conditions
- **Grounding:** no wrong ascendant/ruler/sign/house, no fabricated classical verse or unstated aspect, no unsupported life event predictions.
- **Personal information density:** 3–5 real insights expressed as consequences of specific combinations, not weak headline templates; ten other cards show two thematic factors. Avoid raw fact recitations without any interpretation.
- **Dedup:** one planet appearing in D10 and D24 must not be treated as two independent victories, nor twice as a 'Venus + Venus' partnership indicator.
- **Language:** Ukrainian and English natural grammar, no 'important indicator' filler without a reason, no 'unknown = negative', no fake certainty.
- **Concise layout:** 16 cards in D1→D60 order, D60 same visual language, one summary, sources behind disclosure. Screen 320px no horizontal overflow.
- **Fail safely:** invalid source verification, stale cached edition, approx birth time not turned into personal D60 houses, server failures roll back if safely possible.
- **Do NOT label this objective 9/10** merely because CI is green. Qualitative evaluation of full generated texts must be reported separately with criticisms and unresolved certification work. An external Jyotish expert review is still a separate acceptance gate if a 9/10 claim is to be made.

## Release
`tools/n493-aws-release.sh` accepts exact 40-char Git SHA, `--preflight` then `--deploy`. It explicitly guards branch head equality, current deployed ancestor, tracked dirt, previous service health, expected public report schema, and attempts rollback. Only provide the SHA after exact-head CI success; **no manual Docker / force reset / destructive clean**. Production remains unchanged until owner executes the verified script.
