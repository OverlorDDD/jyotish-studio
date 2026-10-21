# A8 — Jyotish Reader v4 professional consultation standard

## Concrete A7.4/Groq audit

Current live response: 7/8 LLM chapters, chapter 1 `portrait` deterministic. It's technically real model output, **not yet an acceptable professional consultation**. The generated text overuses the same 9th-house Mars/Saturn/Moon motifs, misses sign dignity/functionality, and makes an objectively invalid lord claim: for a **Cancer** whole-sign ascendant, Saturn owns **7 and 8**, never 4 (Venus rules 4 and 11). Mars owns 5 and 10, so `yogakaraka` is a crucial verified finding; Jupiter owns 6 and 9 and must be considered distinctly from Mars.

The existing `apps/api/src/interpretation-v3.ts` is limited to **eight most important findings** (and relatively generic meanings); `consultation-ai.ts` only supplies up to four vaguely matching findings per section. `parseAiConsultation` gates prose style and hallucinated numeric facts but cannot prove that a sentence about the *ruler of the family house* is correct. Improve semantic verification rather than relying on `verifyFreeProse` as a correctness certificate.

UI `DetailedReport.tsx` shows an evidence accordion and `<ul>` after every chapter. User copied empty bullet markers. Independently confirm whether CSS/text extraction or actual empty list entries are responsible, and render a clear empty state instead of an empty list. Never label unsourced content as verified.

## Classical reading workflow / canonical order

1. Verify date/time/timezone/DST, geocentric sidereal Lahiri, house conventions and birth-time sensitivity; distinguish uncertain placements.
2. Lagna + lagnesh, Moon/nakshatra/pada, Sun; judge dignity, house placement and relationships.
3. For all twelve houses compute *house ruler + its roles for that lagna + located house + actual dignity/aspects*. Functional auspicious/malefic status and yogakarakas are required, not optional stylistic adjectives.
4. Evaluate house lord signs, exaltation/debilitation, moolatrikona, dispositor, conjunction, relevant Parashari aspects and *actual* combustion/retrogradation only when mathematically implemented and tested; otherwise `not_calculated`.
5. Verify selected named yogas via predicate rules. Include exceptions, cancellation conditions, counterevidence, source and rule version.
6. Synthesize topics using multiple relevant findings: D1+D9 in relationship sections; D1+D10 for work; 2/11/10/5 and current dasha for resources; don't extrapolate unsupported money or marriage outcomes.
7. Time periods: exact Vimshottari maha/antara lords, start/end and their house ownership/status; confirmed transits only after separate computation, never as natal facts.
8. Present the strongest 3–5 conclusions, underlying evidence, genuine counterweights and one or two specific low-risk practices/choices. A thoughtful practitioner voice in excellent Ukrainian and English, not deterministic lists, generic self-help or blanket skepticism.

## Strict data contract

```ts
type ClassicalRule = {
  id:string; school:'parashari'; sourceIds:string[];
  preconditions:ReadonlyArray<Predicate>; conditions:ReadonlyArray<Predicate>;
  result:TraditionalMeaning; exceptions:ReadonlyArray<Predicate>;
  confidence:'verified'|'review_needed';
};
type ReaderFinding = {
  id:string; ruleId:string; chartEvidenceIds:string[];
  school:'parashari'; houseLordPairs:Array<{house:number;graha:string}>;
  positiveFactors:string[]; restrictions:string[]; unknowns:string[];
  weight:number; topic:string;
};
type NarrativeClaim = {
  text:string; assertionType:'house-lord'|'placement'|'combination'|'interpretation'|'timing';
  findingIds:string[]; semanticCheck:'pass'|'fail'|'not_applicable';
};
```

Every **house-lord** statement must match `D1.lords[house]` exactly. Avoid the current loophole where «Сатурн — управитель сімейного дому» passes a prose-only regex checker. Claims with unsupported yoga, dignity, dasha or Vargas fail closed. Use a deterministic claim checker, then a separate fluent prose renderer.

**No guaranteed future events**, no diagnosis, no unfounded death/illness/fertility/income prediction. Avoid false scientific validation of traditional spiritual claims. Only calculations and rules can be mechanically verified.

## Structure of each of the 8 chapters

- Dominant individual motif (not copy-paste).
- 2–4 specific rule-backed cross-connections in THIS chart, explaining why the motif appears.
- A non-trivial contradiction or limiting factor where it exists.
- An intelligible area of life where a person may recognize or explore the theme; no fabricated biography.
- For high-level conclusion/timing: named dasha and accurate dates when sourced, actionable reflection grounded in those factors.

**Do not use the same graha combination as the main insight in more than two sections** unless its distinct lordship/dasha role is explained.

## QA and release criteria

- 12 lagna whole-sign lordship tables, 12×12 functional lords, 6 known yogakaraka patterns, invalid and boundary dates, DST, 1–2° boundary cases, independently compared against Jagannatha Hora.
- 10–20 varied anonymous test charts with 8 distinct chapters, including several Cancer ascendants. Zero hallucinated lords, signs, D9/D10 placements, yogas and active dashas.
- Manual expert/astrologer review using a rubric: specificity, correctness, multi-indicator synthesis, counterweights, timing accuracy, Ukrainian/English prose, relevance. Aim ≥8/10 per report with **zero critical errors**.
- Provenance label per paragraph; fail to deterministic fallback when fewer than four chapters pass, missing chapters distinctly marked; unsupported statements never passed as verified.
- Full UI smoke test for evidence accordions (non-empty or sensible empty state), glossary, small screens, accessibility.
- Provider success is not equivalent to astrological quality: record separately the real LLM provider/model, accepted chapter count and semantic acceptance.
