# Jyotish Quality Acceptance — validated calculations before every chart and LLM
2026-10-23 · Implementation: `apps/api/src/jyotish-integrity.ts` · `jyotish-integrity-v1`

## Decision: stop retuning prose, verify the input-to-natal chain
The current sample (Cancer ascendant, Moon in Gemini/H12, four D1 planets in Pisces/H9, Jupiter Sagittarius/H6, Saturn mahadasha/Moon antardasha) is clearly more personalized, coherent and balanced than earlier outputs. Editorial review: roughly **8/10 on writing and synthesis**, not a blanket certification of natal fact accuracy. Remaining issues: two practical actions fused into one paragraph, occasional English terms ("Lagna 4") in Ukrainian, "ургентність" or categorical dasha-based advice, and deterministic Reader prose coexisting with model prose. None justifies returning to the broken eight-part AI generator.

**Design principle:** birth → UTC civil-time verification → Swiss sidereal positions/ayanamsa/ascendant → sign/nakshatra/whole houses and D9/D10 → Vimshottari/12 house lords → **fail-closed integrity certificate** → return chart data and SVG/tables → deterministic Reader v6 + fixed one-call CQv2 LLM.

## Audit of what already existed
- `localToUTC` rejects calendar errors, DST gap and DST fold rather than silently guessing time.
- `getEphemeris` uses native Swiss Lahiri (mean node) or Python pyswisseph fallback.
- `calculateChart` computes nine grahas, Whole Sign houses, D9/D10, nakshatra/pada and 120-year Vimshottari.
- `validateRuleInput` previously checked D1 sign/longitude/house and duplicates, but not D9/D10 cross-derivation, UTC↔Julian day, Rahu↔Ketu, birth-date-based dasha chronology, or strict pre-display passage.
- `buildChartFactGraph` provides 12 sign lords/aspects and evidence IDs to LLM but is not a substitute for verifying raw astronomy.

## New `verifyCalculatedChart`: problems and actions
| Threat | Check before publishing |
|---|---|
| Incorrect local civil time or historical DST assumption | `validateBirth` + `chart.utc===resolvedUtc` (timezone data still requires independent historical review) |
| Ephemeris computed for wrong instant | Julian day equals UTC epoch-converted JD within 1e-5 day, finite ayanamsa and sidereal Lagna |
| Missing planets or mistaken Rahu/Ketu | Exactly one of the 9 expected grahas, finite longitude/speed, nodes opposite 180° |
| Wrong D1 house or sign | Longitude, sign, sign name, degree, Whole Sign house and graha identity all checked |
| Wrong nakshatra/pada/retrograde | Derivation repeated from Moon/planet longitudes and speeds |
| D9/D10 drift or accidental use of D1 coordinates | Derivation of every varga graha AND divisional Lagna checked from the natal longitude |
| Wrong 12 Parashari house lords | Each whole-sign house ruler checked against fixed 12-sign ruling table and actual ruler house |
| Wrong birth-dependent mahadasha and antardasha | All 9 mahadashas and their 81 antardashas checked against Moon nakshatra fraction, exact boundaries and order |
| Wrong methodological mode | Lahiri/Whole Sign/Mean Rahu-Opposite Ketu/dasha year-length checked against fixed method |
| Incomplete result sent to UI or model | `runCalculation` verifies before returning. `POST /api/v1/reports` requires a valid certificate or fails without calling LLM; UI independently checks it before showing charts and digest matches before displaying a report. Older saved charts trigger recalculation first. |
| Stale output and provenance uncertainty | Version `jyotish-integrity-v1`, digest and internal-only certificate; saved alongside charts/Reader, can be compared |

## Two VERY different meanings of verified
**1. Internal invariant verification (automated)** proves the chart consistently implements the configured calculations and that incoming ephemeris values match the supplied UTC/JD. Repeating `divisionalLongitude` and `vimshottari` from the same source can detect tampering and wiring mistakes, **not a shared mathematical bug in the formula itself**. Never display or claim "independent astronomically verified" on the basis of this step.

**2. Independent numerical accuracy (not yet complete)** needs external trusted numerical reference calculated with matching Ayanamsha, node type (mean vs true), Whole Sign, D9/D10 conventions, Vimshottari year length 365.2425 and DST/timezone. The current fixtures `tests/fixtures/swiss-reference.json` and `tools/reference-check.mjs` are pinned Swiss output (three places/dates) plus cross-method internal Swiss check; they are NOT an independent JHora comparison.

Swiss documentation: `swe_houses_ex` supports sidereal ascendant with SEFLG_SIDEREAL; Whole Sign houses are assigned by the ascendant's sign, not by Placidus house cusp. See https://ephe.scryr.io/swisseph/doc/swisseph.htm section 6, and https://www.programmiastral.com/Documentazione/Documentazione%20Swiss%20Ephemeris.pdf section 12.3. Do NOT silently substitute True Node for currently approved Mean Rahu or a different dasha-year convention.

## Acceptance tests (real + synthetic)
- `npm run test:jyotish:acceptance`: pinned Swiss fixture chart certificates; 9 grahas, nodes 180°, UTC/Julian day, D1/D9/D10, all house rulers and dasha timelines; failure injection for wrong graha, longitude, sign, nakshatra/pada, retrograde, Mahadasha/Antardasha; 12 sign ascendants and varga boundaries; DST fold and gap.
- `npm run test:reference`: pinned sidereal Swiss reference cases and cross-method Swiss checks.
- `npm run test:jyotish:quality`, `npm run test:jyotish:integrity`, `npm run test:jyotish:direct`: CQv2 evidence, nonblocking model QA and reliable single-call/cloud fallback.
- `npm run test:e2e`: **real browser**, real Next/Nest/Python Swiss calculation, Reader v6, reporting contract with identical digest; UA and EN plus mocked geometric chart view.
- `npm run test:integration`: account authorization, verified saved chart/AI report handling.
- `npm run build`: Nest and Next production compile.

## Outstanding work, explicit release blockers
1. Export precise numeric records from JHora for 10–20 birth cases (UTC, Lahiri ayanamsa, Ascendant, Moon and 9 planets D1, D9/D10, antardasha boundaries); compare with tolerance settings. This is **an external oracle** and cannot be truthfully reported done without that evidence.
2. Real Gemini/Groq consultation quality review across varied charts, balanced negative and positive traits, no categorical financial/medical/fate assertions; UA/EN semantic copy-edit.
3. Clarify if chart entered during historical DST changes: timezone database versions can affect very old dates even when mathematically consistent.
4. Publish/cache versioned report snapshots based on certificates, retain graceful recovery for older saved charts. Final PR merge after full green CI and human acceptance.
5. Verify Swiss Ephemeris public/commercial-use licensing and model/provider quotas before public beta.

## Windows launch for acceptance branch
```powershell
cd C:\Users\Note\jyotish-studio-git
git fetch origin
git switch feat/jyotish-quality-acceptance-v1
git pull --ff-only origin feat/jyotish-quality-acceptance-v1
docker compose up -d db
npm run dev:full
```
Use `http://localhost:3000/uk/astrology/jyotish` and `/en/astrology/jyotish`. The existing one-call AI model path remains unchanged. `npm run test:jyotish:acceptance` and `npm run test:reference` provide local verification.
