# Consultation Quality v2 — audited Jyotish reading method
2026-10-22 · Galaxiora · CQv2.0 · research and implementation record

## Accepted product design and active AI boundary
The user accepted the dark-and-gold D1/D9/D10 workbench and the one large editorial document. In PR #41 the working production path is:
birth → Swiss/Lahiri sidereal + whole-sign D1/D9/D10 + Vimshottari → compact facts → **one fixed instruction + one LLM completion** → unfragmented markdown. Reader v6 remains an offline alternative.

CQv2 extends the **data sent to that same ONE completion** with ranked, evidence-linked interpretive tensions; it does not restore A8.9 per-chapter cloud generation, force a second model, alter birth calculations, or demand eight mandatory sections.

## Source review — verified editions and access rights
Primary study materials already physically present in the repository (not copied into public website):
- `research-library/primary-texts/brihat-jataka-iyer-1905-ocr.txt`: 1905 English edition of Varāhamihira's *Brihat Jātaka* (~553k characters). Inspected historical introduction, distinctions between planetary positions and Lagna, yoga terminology. Original scanned public-domain edition: https://en.wikisource.org/wiki/File:The_Brihat_jataka_(IA_brihatjataka00varaiala).pdf ; historical 1885 translation in Wellcome: https://wellcomecollection.org/works/afmgm695 . **OCR is not a mechanically valid edition for exact quotations or verse citations.**
- `research-library/primary-texts/laghu-parashari-jha-1900-ocr.txt`: 1900 Sitaram Jha Sanskrit/Hindi scan (~142k OCR characters), examined the source ledger and prior documented passage study relating Vimshottari and lordship. Devanagari OCR quality is limited; no rule is approved merely because a keyword occurs in OCR.
- `research-library/primary-texts/brihat-samhita-iyer-1884-ocr.txt`: 1884–85 historical compilation (~962k characters). Relevant as historical context **not a natal interpretation manual**; not used to create new natal predictive rules.
- *Bṛhat Parāśara Horā Śāstra* (BPHS) online Sanskrit chapter map and reviewer-status notice, https://vedicspace.com/bphs . Selected chapters: 6–8 vargas and aspects, 25 effects of lords, 35 functional benefics/yogas, 47–58 Vimshottari and Antardashas. Its new English translation is still under review; this is **source orientation**, not licensing to reproduce text or proof of controversial rule interpretations.
- Mantreśvara *Phaladīpikā* ch.15 on bhāva judgment (house ruler, placement, occupied house, support/counter-indicators): https://vedicpupil.in/library/books/phaladipika/chapter-15 . Ch.18 two-graha conjunctions: https://vedicpupil.in/library/books/phaladipika/chapter-18 . Ch.20 dasha of house rulers: https://vedicpupil.in/library/books/phaladipika/chapter-20 . Contemporary page translation belongs to its publishers, so do not redistribute chapter text.
- Additional historical bibliographic/access registry: `docs/research/a8-classical-source-registry.md`.

**What was studied:** targeted full relevant sections and source descriptions about house judgment, co-presence, vargas, lords and dashas, plus available historic OCR corpora. This is not a claim of having read every page of every existing Jyotish book or of verifying every Sanskrit śloka. The software only implements narrow rules mechanically provable by the validated chart.

## Distinguish three levels of evidence
1. **Astronomy/calculation:** D1/D9/D10 signed graha placement, retrograde, nakshatra, lagna, Vimshottari interval from `packages/jyotish-core` and Swiss ephemeris adapter.
2. **Traditional rule computation:** whole-sign Parashari sign lordship, own/exaltation/debilitation statuses, verified selective pancha-mahapurusha yogas, listed sign-based Parashari drishti, dispositor and certified current period in `consultation-fact-graph.ts`. Not all possible classical strengths are implemented.
3. **Traditional interpretive inference:** `consultation-quality-v2.ts` assigns priority to the high-impact lords, notable sign dignities, house concentrations and cross-chart corroboration. These **weights are our editorial heuristics**, not numbers prescribed by classical authors. Support / friction are possible expressions, not diagnoses or biographies.

## Root causes in the first successful consultation
The LLM wrote attractive prose but underweighted the same graha controlling both Lagna and Karma (example: Jupiter for Pisces is both H1 and H10 lord); it omitted important primary rulers of partnership or Moon, praised too generously, used debility as a fixed fate and asserted dramatic outcomes without corroboration. Compact raw placements alone did not tell the writer what deserves priority. The risk is not another response-format bug; it is loss of chart structure when synthesizing literary prose.

## CQv2 architecture
- Compute `buildChartFactGraph(chart,asOf)`, a bounded evidence graph with unique IDs, deriving no new source-of-truth from LLM.
- Establish exact house lords by ascendant, record all owned houses (especially double lordships), real D1 location, sign dignity and yogakaraka if actually established.
- Prioritize only observed 2+ classical graha co-presence; **same sign is not necessarily close-degree conjunction or named yoga**. Preserve dispositor link.
- Include selected calculated Parashari drishti *only as a secondary nuance*, not as Western aspects or exact orb strength.
- Include D9 Venus relationship lens and D10 D1 tenth-lord career lens as supplementary, never replacing D1 lords.
- Include actual current mahadasha/antardasha if present; do not infer future events from their names.
- Six interrelated themes `identity`, `relationships`, `career`, `resources`, `inner-life`, `timing` include **potential, friction and/or mixed** signals only when supported, evidence IDs and a meaningful practice suggestion. Never invent an adverse factor just to appear balanced.
- A compact priority brief complements, never replaces, the raw chart facts. Birth address/time/name not transmitted to providers.
- Fix one system instruction (versioned as `direct-v2`) demanding thematic synthesis, tradeoffs, conditional examples, non-flattering but sensitive treatment of difficult factors, D1/D9/D10 separation and real period lords.
- **Provider recovery remains unchanged**: Gemini → Groq → OpenRouter (configured free-tier only), 1 text completion per available provider, no chapter quota/JSON/editor.
- Minimal accepted-response checks preserved to avoid rejecting expressive writing for missing tokens or exact headings. Detected lord-claim contradictions trigger bounded operational warnings for review rather than discarding a full consultation.

## Risks and exclusions
- Sign-level dignity alone is not shadbala, combustion analysis, exact graha-yuddha, verified neecha-bhanga cancellation, or a certain life result.
- A 6/8/12 placement indicates a traditional complexity lens, not automatic harm or fixed disease.
- Graha drishti uses the restricted implemented model in `consultation-fact-graph.ts`; schools disagree about some node aspects.
- Statements about pregnancy, infertility, health, mortality, divorce, guaranteed wealth, a person's history or specific future events require much stronger grounds and are not licensed by this model.
- No copyrighted modern translations are bundled, displayed, or used for model training.
- Human literary ratings and factual source reviews remain required; CI passing cannot prove an individual LLM's interpretation is insightful or correct.
- Swiss ephemeris redistribution/license obligations and multi-chart JHora comparison should be checked separately before public paid release.

## Acceptance tests and human evaluation
1. 12 synthetic ascendants, correct signed owners and all priority evidence IDs found in graph.
2. Pisces lagna + Jupiter in Aries H2: explicit dual ruler 1/10; debilitated Saturn H2 is friction **not inevitable financial ruin**.
3. All supported areas receive grounded positive/negative/mixed context without fabricated indicators; zero unsupported sign/aspect/yoga claims from deterministic planner.
4. Provider tests: fixed system instruction, compact data plus priority brief, single completion, 503 failover, accepted final response.
5. Browser tests: real Nest/Next D1 calculation, Reader v6 fallback, UA and EN, direct LLM document formatting; repair old UI test naming.
6. **Manual real model:** run `npm run ai:verify-live` and create two actual reports in Ukrainian and English. Compare all graha/lord/dasha factual assertions against the generated table. Human score factual precision, depth, negative/positive nuance, literary voice and case specificity from 1–5. Do not merge solely on automated tests.
