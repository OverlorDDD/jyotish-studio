# A8.1–A8.5 implementation and acceptance report

## Reading context

Source material reviewed: `/mnt/data/Galaxiora_Jyotish_Research_Pack.zip` (audit, classical bibliography, Reader v4 standard, roadmap); historical edition metadata in `docs/research/a8-classical-source-registry.md`; the public-domain marked 1885 Iyer `Brihat Jataka` catalog at https://wellcomecollection.org/works/afmgm695, and third-party https://github.com/maximally0/jyotisha-corpus (not independently certified). The archive contains Markdown research, NOT scanned book contents. We did not train a model on copyrighted full modern books or claim to have read them entirely.

## Code and status

- **A8.1 (mechanical fixes):** React evidence accordion now suppresses empty list markers, renders rule and readable meaning. AI attribution explicitly says automated claims checks, not professional verification. A false family-house Saturn ruler in Cancer ascendant is rejected by semantic gate. First chapter retains clearly labeled local fallback if external model fails.
- **A8.2 (classical computation):** `reader-classical.ts` computes all 12 functional house lords for any sidereal D1 ascendant; roles of kendra/trikona/dusthana; six special yogakarakas (Taurus Saturn, Cancer Mars, Leo Mars, Libra Saturn, Capricorn Venus, Aquarius Venus); sign dignity using existing deterministic rules; and actual Vimshottari major/minor lord house ownership from the chart. Does NOT pretend to calculate Shadbala, combustion or strength not already implemented.
- **A8.3 (sources):** `CLASSICAL_METHOD_SOURCES` has bibliographic edition/source IDs and explicit review status; relevant method hints are internally attached to planet role records. **Do not claim a particular shloka or verse has been verified** without comparing the actual historical edition and Sanskrit/translation. Licensing audit remains required before mirroring texts.
- **A8.4 (Reader v4):** version `4.0.0`; old eight-finding cap widened up to 24 for distinct functional and yoga analysis; yoga-karaka description inserted into the main configuration and career themes; chapter-specific AI facts now up to six items. English and Ukrainian natural prose prompts stress correctly verified functional roles; numeric positions or unsupported fact claims remain restricted. Explicit incorrect house-lord declarations are detected, their chapter rejected to deterministic fallback, and not counted as accepted LLM. **This is a partial mechanical language gate, not a complete AI proof system**; more synonyms, implicit and multilingual claims need expert evaluation.
- **A8.5 (QA):** `npm run test:a8:reader` validates 12 ascendants × 12 house lords, six yogakarakas, exact Cancer 4/7/10 ownership, English/Ukrainian flawed ruler phrase rejection, 20 synthetic whole-sign distinct chart reports, dated dasha role assignments, stable output and bilingual yoga-karaka content. GitHub CI adds existing DB and Chromium checks. These are **synthetic QA charts, not an independent Jagannatha Hora parity test**.

## Mandatory manual release gates (not completed by automated tools)

1. Run real 2026-10-21 birth chart after update, check for factual errors in all eight AI sections; verify Groq key still enabled/free.
2. Independently compare ten consented birth charts to Jagannatha Hora (sign/house, D9/D10, active periods, DST and boundaries).
3. Qualified Parashari astrologer to review every chapter's lordship, sign dignity, yogas, synthesis and timing on 10–20 diverse cases. Record per-chart written acceptance and zero critical factual errors.
4. Test `[portrait]` rejection path: if model returns a factually wrong clause, model section must be discarded and deterministic one shown. Check HTML rendered accordion has no empty list items.
5. Verify source quote/page-level attribution before promoting any `bibliography_review_only` to verified textual citations.
6. Privacy consent and legal/commercial licensing review before public sale.

## Windows handoff

```powershell
cd C:\Users\Note\jyotish-studio-git
git pull --ff-only origin main
npm install
npm run test:a8:reader
npm run test:report
npm run ai:verify-live
docker compose up -d db
npm run db:generate
npm run dev:full
```

No DB migration required for this patch. Full historical reports are not silently overwritten. External model live responses are not testable with the private key in CI, therefore provider success and human astrological quality remain separately unverified.
