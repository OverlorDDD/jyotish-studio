# Jyotish Engine 2.0 — versioned rules, evidence, reproducibility

## Reference basis and scope

- Brihat Parashara Hora Shastra English translation, chapter 3 verses 49–54 (seven classical exaltation/debilitation sign pairs and degree-specific extra dignities): https://vedic-astro.s3.amazonaws.com/books/bhrihat_parasara_hora_shastra.pdf
- Classical ruler table and twelve whole-sign house lords: https://www.astrocentral.com/articles/own-sign-exaltation-debilitation and https://steer.coach/house-lords/
- Pancha Mahapurusha yoga criteria from Lagna (five non-luminary grahas, kendra 1/4/7/10 and own/exalted sign): https://www.shreekundli.com/vedic-astrology/yoga/pancha-mahapurusha-yogas

## Versioned and tested facts

The implementation lives in packages/jyotish-core/src/rules.ts, RULESET_VERSION=2.0.0. It calculates:

1. All twelve house sign lords from the actual Lagna in D1; each fact has a house, sign, traditional ruler and its actual D1 sign/house.
2. Seven classical graha sign-level dignity statuses: exalted, debilitated, own sign, other. Rahu/Ketu intentionally receive unassigned, because node dignity varies across schools.
3. Five possible Pancha Mahapurusha yogas: Mars=Ruchaka, Mercury=Bhadra, Jupiter=Hamsa, Venus=Malavya, Saturn=Shasha. Formation is checked from Lagna in houses 1/4/7/10 and own/exalted sign. The lack of a detected yoga does not imply the absence of other yoga families.
4. Unique evidence-backed rule records: fact ID, rule code, subject, machine-readable values, input evidence. A changed planetary position can change the facts and fingerprint.
5. SHA-256 digest from rule version, reference date (asOf), D1/D9/D10 facts and computed periods, without storing raw birth date/time/coordinates inside the hash payload.

## Important boundaries

These are sign-level classifications and a bounded yoga family, NOT quantitative Shadbala, deep exaltation degree strength, combustion, planetary friendship, retrograde strength, Nakshatra-specific yoga cancellation, Neecha Bhanga, ruler aspects or event predictions. We deliberately omit nodes' exaltation, yogas calculated from Chandra Lagna and yoga cancellation variants. This is a transparent tested subset, not an exhaustive implementation of every school.

## Rules before LLM: trust hierarchy

1. Swiss Ephemeris and Jyotish Core calculate D1, D9, D10 and dasha.
2. Jyotish Engine 2.0 validates nine unique D1 planets and whole-sign consistency, then calculates rule facts and evidence.
3. Server renders formal houses, dignities and yogas ONLY from those facts. LLM cannot add or overwrite these structures.
4. The free model receives an allowlisted fact payload that now includes verified rule values and currently active yogas; it must return unique known factId-linked passages.
5. The report-mode prose gate rejects numeric degree/house/date claims, independent strength classifications and unapproved yoga names. Unaccepted model output falls back to the exact deterministic report.

This validation catches known classes of hallucinated assertions but cannot prove the full semantic accuracy of unrestricted natural-language prose. The UI separates AI commentary from verified deterministic rules.

## What 'same input gives the same result' means

The exact canonical rule facts, report sections and SHA-256 digest repeat for the SAME calculated chart, language, rulesVersion and asOf date. The asOf date is explicitly sent by the browser, because the *currently active* Vimshottari period can legitimately change as the calendar advances. Underlying ephemeris and algorithm versions should also remain pinned for astronomical reproducibility.

Zero temperature reduces free-model variability but does NOT force different OpenRouter free underlying models to emit identical text. The application has a bounded 30-minute in-memory replay cache keyed by rules digest and language. Within a running server process repeated successful AI report requests return the same prose without a new inference call. Guest data is not persisted to PostgreSQL for caching. After a server restart, the first new free AI call can produce different prose; a saved account reading retains its original snapshot. Claiming guaranteed bit-for-bit LLM output across restarts would require a persistent snapshot (which conflicts with our guest no-save policy) or rendering ONLY the deterministic rules.

The generatedAt compatibility field on canonical reports now stores an asOf reference timestamp, not the wall-clock instant that the API generated the page.

## Manual Windows steps

1. Stop ngrok and npm run start:full with Ctrl+C before upgrading.
2. cd C:\Users\Note\jyotish-studio-git
3. git pull --ff-only origin main
4. npm run test:engine2
5. npm run test:report
6. npm run test:ai
7. npm run test:free-ai-retry
8. npm run test:all
9. npm run test:swagger
10. npm run build
11. npm run start:full
12. In another PowerShell: npm run test:full and npm run site:check

On a fictional chart: generate a long report and inspect new three sections (Lords, Dignities, Pancha Mahapurusha Yogas). Open 'Inspect rule IDs and source evidence' and note version 2.0.0, reference day and digest. Request the identical chart twice without changing the reference day: the canonical rule facts and digest must match. If OpenRouter responds successfully on the first attempt, the second result should reuse the in-process free-model prose. Restarting the server can change prose but must not change facts. Test a different chart or reference date and confirm a changed digest. Switch to English and repeat; verify signs and rule descriptions.

Never paste real birth details, AUTH_SECRET, OpenRouter key or a personal saved reading into chat; use synthetic profiles when debugging.
## Everyday-life reading and LLM reliability (October 2026)

A five-part whole-life portrait is generated **without LLM inference** from verified D1 positions and traditional 7th/10th house rulers: potential strengths, possible challenges, relationships, career, and personal growth. Each section offers an everyday example and a low-risk action that can be tried, with traceable D1 evidence. It is *traditional symbolism for reflection*, not evidence of innate personality, future events, health or financial outcomes.

The free OpenRouter model is requested to provide short, useful **plain-language paragraphs**, rather than being forced to emit an intricate JSON schema. Each paragraph is screened against unverified degrees, dates, placement and yoga claims. If this format fails validation, the free router retries with a fact-linked JSON format. Bad paragraphs are discarded rather than printed. A successful AI answer is a distinct optional commentary layer, and cannot alter astronomy, life-portrait facts or provenance. If no AI answer is safe, the five-part deterministic portrait and practical tips remain available to the visitor at no cost. Across runs, canonical source-linked content is reproducible; the same exact new LLM prose is not guaranteed after server restart.

Check manually using a fictional profile: force AI_MODE=local and verify that the life portrait and advice still appear; restore AI_MODE=free and test again. Refresh/recalculate without changing birth details and reference date to compare the same five chapters. Check both Ukrainian and English. Confirm that saved new reports contain the five chapters; existing historical snapshots will not be overwritten.
