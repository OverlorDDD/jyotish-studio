# Galaxiora — ASE-2/ASE-3 research, methodology and operational acceptance

Date: 2026-10-31 · Branch: `feat/astrological-synthesis-engine-v2-v3-20261031`
Depends on: ASE-1 from PR #57 (`feat/astrological-synthesis-engine-v1-20261031`).

## Competitor and primary-source verification

ASE-1 research is retained in `docs/research/astrological-synthesis-engine-ase-v1-2026-10-31.md`: Astro.com, Astro-Seek, TimePassages, AstroSage and Parashara's Light. ASE-2/3 extend the calculation contract, not vendor text or copied proprietary manuals.

- **Swiss Ephemeris programmer manual:** https://www.astro.com/swisseph/swephprg.htm and https://www.astro.com/swisseph-download/doc/swephprg.pdf — UT, tropical positions, house cusps and calculation flags. All planet longitudes still pass the project's actual returned-SWIEPH guard. No silent Moshier.
- **Binding API:** https://github.com/swisseph-js/swisseph/tree/main/docs — installed `@swisseph/node`; verified tropical 7-planet calculations and `calculateHouses` for Placidus.
- **BPHS / classical Parashari:** Full sign-counted graha drishti 7th universally; Mars 4th/7th/8th; Jupiter 5th/7th/9th; Saturn 3rd/7th/10th. Rules are *not* Western ecliptic aspects.
- **BPHS Ashtakavarga:** 7 bhinna tables × 8 contributor positions (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Lagna); fixed sums respectively 48, 49, 39, 54, 56, 52, 39. Sarvashtakavarga **337** is the unreduced invariant. The module does NOT claim Trikona/Ekadhipatya Shodhana, Pinda, or numerical future-event probabilities. Reference comparison: https://www.wisdomlib.org/hinduism/book/brihat-parashara-hora-shastra/ and https://www.astrosage.com/astrology/ashtakavarga.asp . Numeric cross-check tables were researched from the public 8×7 traditional contribution grid; this is NOT a formal certified comparison against multiple independently computed natal charts.
- **Competitor lessons:** Astro.com distinguishes exact natal transits from daily general sky; TimePassages offers natal/transit and exact aspect timing; Parashara's Light publishes dasha/gochara/Ashtakavarga as separate tools. Galaxiora must keep independent evidence families and never force agreement between systems.

## ASE-2 implemented contracts

- `apps/api/src/western-natal.ts`: complete **seven-classical-planet** natal longitudes and tropical Placidus twelve cusps, house assignment, ascendant and MC at verified birth UTC + owner-held birth coordinates. Does not claim Uranus, Neptune, Pluto, Chiron, or house algorithms at polar latitudes. Rejects unsupported cusp geometry and latitudes above 66° instead of inventing houses.
- `apps/api/src/advanced-synthesis.ts`: exact ecliptic 0°, 30°, 45°, 60°, 90°, 120°, 135°, 150°, 180° natal and transit aspects, configured tight orbs, 1-hour finite-difference applying/separating classification, bound ±14 days and 2-hour sampled/bracketed Swiss exact aspect solving (rounded to 5-minute precision). A 14-day horizon cutoff is **CLIPPED**, never claimed to be actual onset/cessation. Multiple crossings may occur during retrogradation; no claimed station-precise event duration.
- `apps/api/src/ashtakavarga.ts`: full classical graha drishti, unreduced BAV and SAV 337 with strict input checks. Natal contributors are sidereal birth-chart signs; current transits are Lahiri; include transparent individual transit BAV/SAV and observed houses from Moon/Lagna.
- Current verified mahadasha/antardasha appear as timing context; **no invented numeric strength or fake dasha-weighted forecast**. A separate certified quantitative dasha interaction model remains future research, not falsely labeled complete.
- `GET /api/v1/personal/horoscope/synthesis/advanced?days=1|7`: authenticated owner chart only; output original ASE-1 day comparison + `advanced` evidence. No birth metadata in URLs or output; zero migrations/DB writes. Failed optional advanced calculations preserve the working ASE-1 summary with explicit `advancedStatus`, not fabricated enhanced evidence.
- UI `AstrologicalSynthesisPanel`: new expandable native Western chart, aspect timings, drishti/BAV/SAV and period context in UK/EN; existing day/week and guest protections preserved.

## ASE-3 implemented contracts and limitations

- `POST /api/v1/personal/horoscope/synthesis/reading`, JSON `{"consent":true,"locale":"uk"}` or `"en"`, requires signed-in owner + same-origin. **No automatic** LLM call on browsing/GET; explicit checkbox and click are mandatory.
- `ASE_AI_ENABLED=1` separately required on server. Only free-tier-confirmed Groq or Gemini; OpenRouter fixed free router/model. Provider keys stay server-only. Existing hourly provider limiter and 3 user requests/hour (in-process, not distributed). No paid fallback.
- Only a bounded list of **server-derived** V2 evidence IDs and short text descriptions leaves the server (never name, birth instant, coordinates, email, original chart JSON).
- Output must be valid JSON, 2–3 substantive paragraphs, each with existing evidence IDs, representing **both traditions**; reject invented numeric statements, invalid IDs, certainty-language patterns, large responses and provider failures. **These gates cannot formally prove semantic truth of every freeform sentence**. Model prose is visibly separate from quantitative evidence; a conservative default is AI disabled until manual review and human QA.
- Explicit fail-closed outcome and reliable deterministic ASE-1/ASE-2 reading continue if model response fails validation. Future research: semantic entailment checker/claim-graph and a more comprehensive personally verified multilingual test corpus, prior to offering AI narrative as fully validated expert interpretation.

## Test plan and unresolved release gates

```powershell
git fetch origin
git switch feat/astrological-synthesis-engine-v2-v3-20261031
git pull --ff-only
npm install
npm run db:generate
node --test tools/astrological-synthesis.test.mjs
node --test tools/astrological-synthesis-v2-v3.test.mjs
npm run build
npm run dev:full
```

1. Verify UK/EN, mobile/desktop, day/week: new evidence accordion; valid natal shows 12 tropical house cusps and seven planets; SAV values sum to 337. For every timed exact UTC ensure it lies within its listed window; clipped timing boundary never described as definitive onset/cessation.
2. Verify unauthenticated GET/POST 401. A registered owner cannot access another user's birth chart; an unverified/missing chart cannot see advanced evidence. If Placidus unsupported, base ASE-1 stays usable with an unavailable message.
3. With AI disabled, GET makes zero cloud requests and POST shows an explicitly disabled status. With AI enabled and a confirmed free key, user must check consent before POST; invalid or unknown evidence IDs, numbers, or missing both traditions are rejected; missing provider falls back deterministically.
4. Run CI release gate and Chromium two-locale/two-viewport integration regression, inspect all failures before merging. **Do not claim production deployment** from code commit or passing CI.
5. Independent numerical comparison of 20+ natal birth charts and verified exact moment tolerances remains to be completed as a **separate certification gate**, not satisfied by 25 synthetic conservation tests.

## Licensing and production caveats

Swiss Ephemeris / `@swisseph/node` has AGPL/professional obligations documented in ASE-1. A public commercial service must confirm legal license compliance before declaring production cleared. This work buys no proprietary license and does not copy software manuals.

Do not conflate traditional symbolic counsel with scientifically demonstrated life outcomes; recorded astronomical position, inference and interpretation remain separately labeled. No personal data or env keys should appear in logs, tests, tickets or documentation.
