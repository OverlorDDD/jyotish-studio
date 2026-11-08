# N4.4 — Classical Reader 8: book-grounded rules, synthesis, source traceability
Prepared 2026-11-07. Branch: feat/n4-d60-certified-precision-20261107. Draft PR #143. No AWS production release and no merge authorized by this work.

## Verified repository source inventory

- `research-library/primary-texts/brihat-jataka-iyer-1905-ocr.txt` — Varahamihira, **Brihat Jataka**, N. Chidambaram Aiyar, second revised edition **1905**. Relevant observed OCR lines:
  - 7444–7480: Chapter X/1, occupation / tenth house from lagna or Moon / navamsa sign ruler of the natal tenth-house ruler. This is a **three-step contextual rule**, not a guarantee of a job title.
  - 7482–7549: Chapter X/2–3, occupational associations of navamsa dispositors (Mercury: writing/accounting, Jupiter: learning/mentoring, Venus: aesthetics, Saturn: long work). Modern professional mapping is our **editorial adaptation**, not literal reproduction.
  - 11095–11153: Chapter XX/2–4, selected Sun/Moon natal houses, including Moon in 4th/5th. Historical literal/health/children claims are NOT turned into predictions.
  - 11177–11216: Chapter XX/6–8, selected Mercury/Jupiter/Venus natal meanings, used only as conditional thematic context.
  - 11234–11262: Chapter XX/10, explicit context for house reading, planetary sign status and 6th/8th/12th exceptions; this is why single placement cannot stand alone.
  - 11264–11293: Chapter XX/11, modifying statements by planetary dignity; historic fractions are **not** numerical real-world success estimates.
  - 11295–11344: Chapter XXI/1–2, sign rulership, exaltation and debilitation in the varga discussion. Applying this principle to the entire 15-varga Shodashavarga viewer is expressly a **modern extension** and is not asserted to be a direct verse about D27/D40/D45.
- `research-library/primary-texts/laghu-parashari-jha-1900-ocr.txt` — **Laghu Parashari**, Sitaram Jha edition **1900**. OCR lines:
  - 177–187: first-prakasha, stanza 3 (this text chooses Vimshottari rather than Ashtottari).
  - 274–296: antardasha duration as proportional fraction with denominator 120.
  - Hindi/Sanskrit OCR is noisy and requires competent translation and scan checks before more detailed fruit/phal rules become active.
- `research-library/primary-texts/brihat-samhita-iyer-1884-ocr.txt` — Brihat Samhita, **not** a general natal reading manual; retained as contextual text, not promoted to individual reading rules.

All citations are encoded in `apps/api/src/reader-classical-n44.ts` as `{id, edition, chapter, stanza, path, startLine, endLine, anchor, review, scope}`. Tests read the actual repository text at each cited line range and verify the anchor exists. This certifies **OCR-text presence only**: none of these excerpts is claimed to be independently checked against the facsimile scan.

## Engine architecture implemented

1. `reader-classical-n44.ts` checks full `jyotish-integrity-v3` and bound N4 varga source via `verifiedVargaSource`, then extracts actual D1 dignity, D9 profession-vocation link, tenth-from-lagna and tenth-from-Moon, conditional Moon/Mercury/Jupiter/Venus context, Dn dignity and active dasha. Explicitly **no D60 personal interpretation**.
2. Each activated rule records source ID, exact deterministic fact tokens, `direct_natal` versus `modern_varga_extension` versus `dasha_arithmetic_only`, resource/friction/context/timing and bilingual conditional wording. No LLM inference.
3. `reader-v8.ts` combines these with the 15 topic-specific verified Reader 7 facts. It adds tension handling when the D1 and Dn dignity status differs, does not interpret lack of evidence as unfavorable, and selects three lead themes by the current chart rather than a fixed order.
4. `ReaderV8View.tsx` presents these outcomes in approved Galaxiora styling: headline, strength/resource, challenge, classical context, concrete step, optional math/book evidence. Source review state and extension type are visible under a disclosure.
5. Reader v6 full long chapters and Reader v7 are **retained for backward compatibility**. The visible page prioritizes Reader 8 when present, avoiding two sets of 15 duplicated cards.
6. Cloud AI prompt uses bounded Reader 8 context in place of Reader 7, while deterministic Reader 8 works offline. Existing AI refusal rules for D60, wrong lordship, fabricated chart positions and repetitive filler remain in place; cache keys include `READER_V8_VERSION`.
7. The isolated real-birth local HTTP preview (Swiss Ephemeris -> calculations -> report -> local Next site) now advertises Reader 8; it accepts an optional configured real Gemini key without committing or logging it. No PostgreSQL, Docker or AWS required.

## Source versus editorial interpretation

- A book statement about a planet in a sign or house is a **historical astrological statement**; it is not empirical evidence that a real person has that trait or will experience an event.
- Avoid medical, fertility, death, criminality, deterministic wealth or marriage predictions copied from original books.
- Every added modern topic (especially D27/D30/D40/D45) must be labelled as an **extension**, not a purported literal source from the books.
- No externally certified individual D60 Lagna or house stability: never produce birth-specific D60 phala or past-life verdicts.
- Planetary aspects, combustion, shadbala and cancellation-of-debilitation logic were **not added** without independent method/ephemeris validation. The Reader must not silently claim these calculations.
- Source rights: the repository contains historical OCR and registry, but redistributing third-party modern translations or turning them into an unlicensed LLM training corpus is out of scope.

## Acceptance gates and local preview

- `node --experimental-strip-types --test tools/n44-classical-reader.test.mjs` — source anchors, bilingual 15-theme synthesis, evidence, varied charts, D60 and forged data.
- `node --experimental-strip-types tools/n44-reader-preview.mjs` — printed examples from 3 different **synthetic test cases** (UA/EN) for editorial reading; not live provider or real birth data.
- `node --experimental-strip-types --test tools/n43-live-preview-api.test.mjs` — actual local Swiss calculation, both language reports and AI-source provenance.
- Existing Reader 7, Reader v6, N4 D60, complete Core/API/Next build, and Playwright mobile/desktop tests must remain green.
- Human comparison: read the result for **three distinct real birth inputs** in a private local preview; judge whether the source-grounded sections are more informative than Reader 7 and which interpretations can be supported by evidence. The engine is a traditional interpretation, not a validated predictor of personal outcomes.
- To launch locally on Windows after stopping any existing servers on ports 3000 and 4000:
```powershell
Set-Location "$env:USERPROFILE\galaxiora-n4-preview"
git pull --ff-only origin feat/n4-d60-certified-precision-20261107
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tools\n44-preview.ps1 -SkipGitPull
```
- Expected: `N44_CLASSICAL_READER_8_PREVIEW_READY` and http://localhost:3000/uk/astrology/jyotish ; compare "Читати без AI — Reader 8" versus AI. The AI reading is authentic only if a real provider returns a labelled output, otherwise user sees plain deterministic Reader.
- No `main` merge, no production deploy and no users' birth records uploaded or stored by these test steps.
