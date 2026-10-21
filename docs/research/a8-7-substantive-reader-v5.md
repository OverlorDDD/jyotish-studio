# A8.7 — substantive Jyotish Reader v5, acceptance and transparency

## Root cause (reproduced on chart-derived Cancer/Ardra example)
Earlier Reader 4.1 generated two short generic deterministic fallback paragraphs per chapter, then asked one free Groq call for eight sections. Groq yielded 4/8 accepted sections with the rest regressing to generic blurbs. A regex and word count do not create expert reasoning. The LLM prompt and fact selector were amended multiple times, but **the editorial base content remained inadequate**.

## Implemented architectural change
1. `apps/api/src/reader-narrative-v5.ts` generates eight distinct, **three substantial paragraphs each** from verified calculated D1 house placements, functional lordships, yogakarakas, relevant own/debilitated sign states, Moon nakshatra, D9 Venus, D10 tenth-lord placement and exact major/sub-period boundaries. This is a traditional **authored interpretive reading**, not an automatically certified factual prognosis.
2. External free LLM receives a `sourceDraft` + domain focus + verified context. Its role is editorial enrichment of something already meaningful, **not reconstruction from a handful of keywords**. Rejected/short/hallucinated replies fall back to the long authored text.
3. `consultation-ai.ts` rejects an LLM overlay that would be substantially poorer than the drafted baseline. The number of accepted AI chapters is not a quality score.
4. Cache key is bumped to v5 and UI provenance labels correct. No DB migration.
5. `tools/a8-7-substantive-reading.test.mjs` replays fully synthetic chart with the reported Cancer ascendant, Pisces 9th cluster, Jupiter in Sagittarius 6th, Mercury in Pisces, Venus in Aries 10th, Moon Ardra 12th, Sagittarius D9 lagna / Venus D9 1st, Leo D10 lagna / Mars D10 6th, Saturn-Moon periods. **Never attach real birth date, name, birthplace or coordinates to the test corpus.** `npm run a8:preview` prints the guaranteed eight-chapter base interpretation without needing an external model key.

## Limits and remaining acceptance gates
- The synthetic preview uses deliberately constructed divisional placements: it checks the **narrative**, not ephemeris parity. Real D9/D10 and UTC period boundaries still need independent Jagannatha Hora verification on 10–20 consented charts.
- Book corpus from historical source editions is under `research-library/primary-texts/`. Source references are bibliographic **not falsely claimed exact Sanskrit verse citations**. Where exact verse authority is required, compare the historic scan and review translation with a qualified expert.
- GitHub CI tests cannot call the user's private Groq API; real Groq 8-section generation and model polish must be tested locally. A model failing is never a reason to publish thin boilerplate.
- Narrative output should be read and accepted by a knowledgeable traditional Jyotish practitioner before claiming expert-grade validity; it is not an empirically established method of predicting future events.
- No public release without professional quality review, privacy consent for sending derived chart data to cloud LLMs, and Swiss Ephemeris license compliance.

## User commands
```powershell
cd C:\Users\Note\jyotish-studio-git
git pull --ff-only origin main
npm run test:a8:substantive
npm run a8:preview
npm run ai:verify-live
docker compose up -d db
npm run db:generate
npm run dev:full
```
Create a report using the SAME birth details as before. The target acceptance criterion is **meaningful prose for all eight topics even if external Groq is missing**. Verify specific D9/D10, Jupiter, Mercury and dated dasha information, not merely the AI chapter count.
