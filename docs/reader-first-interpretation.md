# Reader-first interpretation: product and rule specification

## Goal

The typical visitor should understand the **meaning of the traditional symbolism**, the connections between placements, and practical reflections without seeing an engineering log. The report begins with a coherent editorial narrative. Verified numeric placements are available only in the expandable “Astrological calculations and sources” section. This avoids confusing the reader with the 30+ D1/D9/D10 technical sections.

This approach takes inspiration from the organization of personal readings (identity, strengths, relationships, resources, challenges, guidance) on https://myarcana.com.ua/destiny-matrix and the example submitted by the project owner. Neither their text nor their destiny-matrix calculations are used in our application.

## Jyotish method is not Western tropical/Placidus astrology

Background comparisons:
- https://www.kaalveda.com/blog/vedic-western-calculation-differences
- https://satyori.com/jyotish/articles/vedic-vs-western-astrology-complete-guide/
- https://jyotishivani.com/learn/vedic-vs-western-astrology/

Our actual calculation uses the sidereal Lahiri system, Swiss Ephemeris, D1/D9/D10, classical whole-sign houses, nine grahas and separately validated Parashari sign-rulership rules. The reference screenshot shows Western tropical/Placidus houses, Uranus/Neptune/Pluto, degree orbs and arbitrary dominance scores. These values are *not portable to our Jyotish method*. Do not copy them or use them as proof of a calculated Vedic interpretation.

## Reader content, grounded calculations, and limits

- Source: apps/api/src/editorial-reading.ts. Report structure: apps/api/src/report.ts. UI: apps/web/app/components/DetailedReport.tsx.
- Sections: core personality (Lagna + actual Sun/Moon signs and houses), elements (7 classical planets counted by sign element), concentrations of classical planets by whole-sign house, strengths (Sun and conditional shared-house Mercury), relationships (Venus and verified 7th lord), career (Sun/Mercury and verified 10th lord), resources (verified 2nd lord), challenges (Saturn and Moon signs), growth (Jupiter), conclusion.
- **Element percentages are integer-rounded counts/7**. They are not psychological measurements, Shadbala, aspect dominance, energy strength or predictive probabilities.
- Never say “Mars is dominant at 15.50%” or cite precise orb-based opposition unless the real method has been explicitly implemented and validated for Jyotish.
- Conditional connections appear only when those positions truly share a D1 house. House rulerships come from the versioned rules engine.
- Paragraphs discuss *possible symbolic themes for reflection*. Avoid asserting certain personality, relationship outcomes, medical diagnoses, future employment or income. A precise “you are a born leader” assertion is unverified.
- Every editorial section has traceable source facts. Identical calculated chart + rules version + reference date gives identical canonical report.
- Free LLM is supplementary. It receives summaries of source-linked editorial chapters and may explain them in different words; its generated facts do not override calculation. Rejected/failed model output is hidden from the public-facing main report. The old AI-first filler and errors do not appear when an editorial report is available.
- Saved historical reports are snapshots and are not silently rewritten. New reports contain the new editorial format.

## Manual QA for Windows

1. Stop running API/Next/ngrok processes with Ctrl+C. Keep Docker Desktop running.
2. `cd C:\Users\Note\jyotish-studio-git`
3. `git status --short` before pulling; preserve any local edits.
4. `git pull --ff-only origin main`
5. `npm run test:report`; `npm run test:engine2`; `npm run test:ai`; `npm run test:all`; `npm run build`
6. Start `npm run dev:full`; open http://localhost:3000 and hard-refresh with Ctrl+Shift+R.
7. Run a fictional chart in Ukrainian and generate a **new** report (not an earlier saved snapshot). Observe meaningful main chapters, four-element counts adding to seven planets, chart-specific placements, actionable reflections, final summary. Confirm technical sections are collapsed by default.
8. Switch to English and generate a new report. Check all section headings and chart data, no invented astrology numbers.
9. Change Sun's or Venus's sign using fictional birth details and inspect changes in the linked narrative; verify no ungrounded claims.
10. Disable OpenRouter with `AI_MODE=local` in the local `.env`, restart API, and verify full editorial report persists with no error wall. Restore the previous AI_MODE afterwards. Never post API keys, passwords or real birth details.
11. Register/login, save, reopen a new report. Verify anonymous users cannot save and guest history remains unauthorized.
