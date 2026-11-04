# N4.8–N4.12 — execution and release strategy
**Galaxiora Natal | 2026-11-04 | Draft PR #120 | EN/UK | Production unaffected**

## Goal
Turn 16 accurate symbolic divisional charts into a reliable, understandable and genuinely useful birth-chart reading. A mathematically correct varga calculator is not an automatically certified prediction engine or a high-quality AI consultation.

## Execution order and stop conditions
| Phase | Work | Acceptance |
|---|---|---|
| N4.12a | Focused desktop + mobile Chromium, 16 selectors, D1 comparison, 360px overflow, D60 caveat, accessibility | Real independent GitHub-run PASS, no screenshots of private birth data |
| N4.8 | Vimshottari year mode, historical JHora period date reconciliation, DST and boundary cases | Independently verified original same-profile major/minor dasha UTC dates; keep current dates pending certification |
| N4.9 | D1-led, D9/D10-required rich consultations with 2–3 selected supplementary D lenses | Two languages, chart-specific editorial brief, evidence/semantic checks, independently reviewed real-model outputs |
| N4.10 | Boundary/uncertain birth-time UX, ephemeris re-sampling only when real timestamps supplied | No invented minute stability from angular distance; D60 restricted until accurate birth time |
| N4.11 | Versioned internal N4 server facts contract with owner and gate protection | No personal identifiers, UTC, place, date, coordinates or raw longitude in public/LLM annex; no unauthenticated personal chart route |
| N4.13 | One owner Windows QA and explicit approved release | Full CI + original JHora oracle + owner approval, pinned SHA, safe rollback |

### External mathematical and temporal certification
An actual PyJHora 4.8.7 independent GitHub job has already PASSed all **8,000 / 8,000** 50×16×10 longitudes/signs. This tests the explicit PyJHora method selection, **not** original JHora 8.0 or day-exact Vimshottari dates.

For JHora 8.0, use publisher-owned software with authenticated source/version, hash its raw archive, record the calculation INI settings and use original clipboard exports for **50 fully synthetic cases**. Compare each 16×10 sign against identical sidereal D1 inputs and identical variant settings. On the GitHub runner all three publisher hosts yielded HTTP 406 or HTTP 429 for short/full installers. Never substitute a mirror or self-derived expected signs; pause downloads when throttled. The only authenticated original JHoraKit sample has 44 method-variant sign differences out of 160 comparisons and must remain diagnostic evidence, not certification.

Vimshottari audit is separate. Distinguish solar-year and 360-day/year reference conventions, instant of nakshatra balance at birth, mean/true node and ayanamsa choices, planetary/Moon epoch and civil timezone/DST. Do not change the legacy JQA3 reference dates by guessing a year convention. AI must not promise an exact day for a life event while this gate is open.

### N4.9 AI content architecture
1. Keep **D1 primary**, existing **D9 and D10 mandatory**; do not change Reader v6 or its existing integrity fingerprint.
2. Produce a deterministic and **per-chart** brief selecting three extra thematic charts from actual D1 house occupancy/rulers, D1 anchor planet and derived D sign/house; no raw personal birth metadata is sent. Examples of lenses: D2 money habits, D4 home, D7 creative or caring work, D20 practice, D24 education, D30 corrective habits. These are domains for traditional interpretation, not verified facts about someone's lived history.
3. In the model prompt, require an interpretation of **at least two** extra D lenses: a verified D1-to-D connection; the opportunity and a grounded trade-off; a realistic **hypothetical scene**; one actionable choice. Vary angle, examples and nuance by the chart instead of repeating stock text. Always include chart-specific D9 and D10 insights.
4. Never infer children's sex/fertility, diagnoses, investment gains, deaths, property purchases, exact marriage or career event dates. Do not claim yogas, drishti or signs/houses unless actually present in the verified source facts. Exclude D60 narrative without accurate birth-time evidence.
5. Use a **bounded single corrective retry** if generated text ignores the selected D lenses or asserts the excluded D60. Fallback is no enhanced N4 reading rather than confident unsourced content. The legacy reading remains available when N4 is OFF.
6. Before public enabling: evaluate at least **12 synthetic charts × 2 languages × 2 topic mixes**, using actual model responses with consented provider keys in isolation. Manually score each (0–4): correct planetary facts, D1↔D9↔D10↔new D synthesis, relevance, non-repetition, natural idiomatic language with striking but realistic examples, usable practical advice, and responsible Dasha/time uncertainty. Any invented sign/house or unsupported precise event date blocks release; target >=3/4 in each other dimension.
7. Deterministic unit tests and synthetic mock outputs validate the data pipeline and retry logic. They are **NOT** proof that the provider writes moving, accurate text. No live provider calls from default CI and no logging raw responses/birth dates.

### N4.10 uncertainty policy
A varga chart is computed from physical D1 longitude and sector rules. Angular proximity to a sector boundary is an observable geometric result. It does **not** imply tolerance in civil minutes. A true birth-time stability experiment requires recomputing the Swiss ephemeris/ascendant for +/− actual time offsets, respecting time zone and DST, then comparing chart signatures. A "stable" label may only apply to the tested sample points, never the entire gap between them.

### N4.11 privacy and authority
Maintain the existing `jyotish-integrity-v3`, `D1/D9/D10` behavior and public/private separation. Build an internal, versioned N4-only read model from verified natal computation, exposing signs/houses/rule profile and explicit `external_reference_pending` status without natal timestamps, birthplace, owner ID or physical longitudes. Keep all N4 AI, Personal and API flags OFF until sign + dasha + prose review + owner acceptance. Never expose another owner's chart.

### Release checklist
- Independent PyJHora 8,000 positions PASS.
- Real JHora 8.0 same-method 50-case oracle PASS (pending installer).
- Historical Vimshottari date/year mode PASS (open).
- N4 domain/story correctness and two-language model evaluation PASS (open).
- N4 engine, security, N4-specific Chromium, full Jyotish Core CI, canonical build all PASS at **the same head SHA**.
- ONE final owner Windows QA and explicit PR merge + AWS deployment approval.
