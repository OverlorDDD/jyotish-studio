# A8.9 Consultation Intelligence — implementation and acceptance plan

Status: **IN PROGRESS / NOT ACCEPTED**. First PR adds only the typed chart fact graph; the website and Reader v5 remain unchanged.

## Findings from main at 0376920 (2026-10-21)
- `reader-narrative-v5.ts` authors eight chapters from many explicit placements but also uses special-case prose for one Cancer-lagna configuration.
- `consultation-ai.ts` evaluates independent chapter prose; `resilient-consultation.ts` retains partial chapters. An all-document argument and all-document factual provenance do not exist.
- `rules.ts` validates D1, derives twelve house lords, dignities and a narrow Pancha Mahapurusha subset. It does not certify every traditional interpretation.
- `PROJECT_MAP.yaml` still refers to A8.6 as current; it is not an authoritative release ledger.

## Primary-text review and license gate
- Brihat Jataka (Iyer 1905, complete OCR): natal chart methodology, technical caveats, and commentary. Translator's introduction must not be rebranded a Varahamihira verse.
- Laghu Parashari (Jha 1900, complete OCR): Vimshottari, period lordship; OCR of Devanagari and Hindi is especially damaged. Only individually checked passages can be considered for rules.
- Brihat Samhita (Iyer 1884, complete OCR): largely mundane/natural astrology, **not** a substitute for a natal consultation rulebook.
- Repository contains the complete OCR files; the presence and size of a file do not constitute verified, exhaustive, line-by-line review. Confirm scan page, translation, jurisdiction and rights before promoting a passage from research to production.

## Target pipeline
```
CalculatedChart (versioned astronomy) -> ChartFactGraph (typed, source-linked)
 -> ReviewedClassicalRules (conditions, contraindications, edition/page and review status)
 -> ActivatedClaims (evidence node IDs; confidence/limits; topic)
 -> GlobalConsultationPlan (3–5 themes; contrasts; unique claims by section)
 -> Single-document cloud Writer (UA/EN; strict free-provider gate)
 -> Claim-level verifier + bilingual editor -> one coherent document or NO AI replacement
```

Do not accept OCR text itself as an executable rule, do not infer medical/financial outcomes, and do not feed raw birth identifiers to cloud models. No paid API or Ollama.

## Bounded releases
1. **A8.9.1 Fact foundation (this PR):** typed D1/D9/D10 grahas, D1 lords and dispositors, sign drishti, supported yogas, active Vimshottari periods, fingerprints, referential integrity and tests. No writer or UI changes. Classical rule provenance beyond the existing ruleset is **not** certified yet.
2. **A8.9.2 Reviewed claims:** provenance schema, blocked/unreviewed distinction, explicit preconditions and counterindicators, editor-approved classical citations checked against scans; test false yogas/weakness and source ambiguity.
3. **A8.9.3 Global planner:** rank 3–5 chart-specific themes, reconcile conflicting indicators, allocate nonredundant claims; property tests across varied charts.
4. **A8.9.4 Cohesive author/editor:** one canonical story with UA/EN narrative, optional chunked cloud inference within confirmed Groq/Gemini/OpenRouter free limits; never splice independently accepted LLM sections.
5. **A8.9.5 Claim-level verification and release gate:** assertions linked to node IDs; unsupported statements rejected, not merely pattern-filtered; grammar/coherence comparison; real chart casebook (10–20 consented cases), JHora parity and external Jyotish editorial review, user acceptance. Feature flag before gradual switching.

**Acceptance is not a passing synthetic test.** No production switch and no A8.9 DONE without comparative real natal reports reviewed by the user. Keep other portal modules unchanged.
