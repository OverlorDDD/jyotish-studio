# Galaxiora A8.9 opt-in consultation preview — 2026-10-21

## Important acceptance status
**Engineering preview only, NOT a quality-accepted professional reader.** This changes the report endpoint only with `GALAXIORA_A89_PREVIEW=1`; the default remains Reader v5. The full historical OCR corpus has not been exhaustively verified against scans. The new claim list certifies calculations, not biographies or classical textual interpretations. No real-person consultation was independently checked against Jagannatha Hora or human astrologers.

## Why the old site says AI 4/8
`resilient-consultation.ts` uses two free-provider groups and retains independent successful sections. `DetailedReport.tsx` then substitutes those individual sections into Reader v5. This produces a composite report with discordant voice. `interpretation-v3.ts` previously also truncated the first highlight mid-sentence.

## Opt-in architecture implemented
1. `buildChartFactGraph(chart,asOf)`: deterministic D1/D9/D10 and active dasha facts with provenance. No birth name, place, coordinates or time sent as source identifiers. Graph includes lords, dispositors, classical drishti offsets, and a limited verified yoga subset.
2. `buildSupportedClaims` and `planConsultation`: derived, machine-readable factual claims and 3–5 chart-wide themes; a global thesis and chapter-level fact bundles. `calculation_verified` means engine consistency, not a scan-verified classical quote.
3. `generateConsultationIntelligence`: reuses confirmed FREE cloud providers. Performs bounded generation, rejects anything short of all eight chapters, performs an additional **single whole-document editorial cloud pass**, and requires eight complete final chapters before accepting any AI overlay. Failed or quota-limited results yield the full deterministic Reader v5, not a 4/8 patchwork.
4. `verifyUnifiedConsultation`: strict chapter completeness, minimum depth, hard disallow list for Western factors unavailable in this chart, explicit house/lord consistency detection, and high-risk certainty markers. It is not a perfect semantic verifier; implicit claims and literary quality still require expert/human assessment.
5. UI: marks accepted final AI document as unified; does not advertise the deprecated AI 4/8 mix in the new mode. Keeps glossary, evidence accordions, original routes and existing report shape.
6. First-page leading highlight no longer cuts an entire sentence in half.

## Windows launch from local project
Open PowerShell:

```powershell
cd C:\Users\Note\jyotish-studio-git
git status
# When the branch has been merged to main:
git pull --ff-only origin main
docker compose up -d db
npm install
npm run db:generate
$env:GALAXIORA_A89_PREVIEW = "1"
npm run dev:full
```

If not merged, use the exact PR branch via `git fetch origin feat/a8-9-fact-graph-foundation` and `git switch --track origin/feat/a8-9-fact-graph-foundation` (only on clean working tree). Existing `.env` must already hold authorized **free** Groq/Gemini/OpenRouter accounts. Do not set paid AI mode.

Open `http://localhost:3000/uk/astrology/jyotish` and create a new Jyotish natal report. For English use `/en/astrology/jyotish`. When disabled, restart API without the flag (`Remove-Item Env:GALAXIORA_A89_PREVIEW` and `npm run dev:full`).

## Test commands
```powershell
npm run test:a8:graph
npm run test:a8:intelligence
npm run test:a8:reader
npm run test:a8:quality
npm run test:a8:substantive
npm run test:a8:resilience
npm run build
```
No migration is required for the feature. `npm run ai:verify-live` invokes a real external provider and can use free quota; it does **not** prove the new holistic reader's quality. UI compare with the same inputs in flag off/on; capture provider and word count. If free cloud unavailable, the flag-on UI honestly falls back to legacy Reader v5.

## Manual QA / human acceptance — PENDING
- Test the same authorized real chart with flag off/on, comparing structure, reader resonance and UA/EN grammar.
- Try a second chart with very different lagna and distribution to detect hardcoded Cancer motifs.
- Compare D1/D9/D10, planetary longitude and exact Vimshottari boundaries with Jagannatha Hora; record discrepancies before trusting claims.
- Force cloud timeout/empty/missing one chapter: **zero** AI chapters should be mixed into the final document.
- Check no invented tropical squares, Chiron/Pluto/Lilith, invalid yogas or misleading guarantees; verify accordions and glossary.
- Obtain 10–20 consented real chart examples and professional editorial review. Never label synthetic fixtures real.
- Review style and depth. Real acceptance is an explicit user decision; automated green CI is not enough.

## Known gaps
The final reviewer depends on short free-cloud quotas and may fail, yielding deterministic Reader v5. The conservative gate checks a subset of explicit facts, not every possible paraphrase; no scholarly passage-level classical source registry has been approved. Full semantic coverage, translation quality, robust provider reliability and JHora parity require further work. **A8.9 is NOT DONE.**
