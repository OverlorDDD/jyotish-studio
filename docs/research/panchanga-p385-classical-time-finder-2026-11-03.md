# P3.8.5 — Classical Muhurta Time Finder, source-backed wedding/foundation filters

**Status:** preproduction GitHub branch, child of P3.8.4 PR #93. Existing P3.7 AWS runtime and user-facing Panchanga remain untouched. Do not deploy this branch before P3.8.6/7 UI and independent integration sign-off.

## Audit and architectural corrections

- P3.7's broad "avoid" verdicts were based on a general `blocks.length || cautions.length` rule; using it to choose a "best" wedding hour would inherit old incorrect all-days-negative logic. **P3.8.5 does not reuse those verdicts.**
- The existing P3.8.3 `evaluateP38` is source-scoped but a *partial* election check; it can yield a **calendar candidate** for an explicitly documented simple start, not a complete wedding or foundation muhurta.
- P3.8.4 has exact **event** Lagna from Swiss UT and event coordinates. It does not select an optimal time. P3.8.5 now enumerates Lagna sign crossings to one second and combines them with verified five-limb, Rahu, sunset, Moon/other planetary sign ingresses, Rahu ingress and Vimshottari major/minor boundaries. Each candidate is freshly computed from native SWIEPH at that specific UTC instant, never from noon or a guessed favorable hour.
- Primary birth chart with verified D1, **D9** and **D10** must be selected and owned. D9 is preserved for marriage-specific review; D10 for career context; **neither is a fabricated additive score or automatically a favorable hour**.
- Very important: **Panchaka** (Raman's modular election calculation) is distinct from **Panchanga** (five limbs). The event Lagna of a future wedding/foundation is never replaced by the owner's natal Lagna or D9/D10 Lagna.
- Visual redesign awaits P3.8.6/7; this stage adds server-side audit/source data only.

## Source register and implemented classical special rules

Primary reference: [B. V. Raman, *Muhurtha*, complete web text](https://ved.bz/_jyotish/books/muhurtha.html), Chapter 9 Marriage, Chapter 12 House Building, Chapter 3 Birth Moon/Star.

**Wedding** (Raman Ch 9):
1. Exact event election D1 7th whole-sign house unoccupied (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, native SWIEPH Mean Rahu/opposite Ketu).
2. Mars **not** 8th; Venus **not** 6th.
3. No Sun/Mars/Saturn/Rahu/Ketu in event Lagna; avoid Lagna hemmed by malefics in 12th and 2nd.
4. Moon should not have planetary association; we check SAME SIDEREAL SIGN conjunction and traditional graha-drishti from seven classical planets; other non-Parashari aspects require additional review.
5. Tuesday excluded; Shukla Tithis 2,3,5,7,10,11,13 specifically preferred; Rikta/6/8/12 and waning 11–Amavasya excluded.
6. Exact Moon Nakshatra one of Raman's 11 listed; **Magha/Mula first pada and Revati last pada** excluded, using **actual Swiss Moon longitude of the event**, not sunrise pada.
7. Explicit adverse 27-Nitya-Yoga names, Vishti/Bhadra Karana; preferred Gemini/Virgo/Libra event Lagna; support for the exact Ardhama Yoga configuration.
8. Two partner charts: verify both owner-controlled JQA3 D1+D9+D10, compute Janma-nakshatra **Dina Kuta in both directions** without assuming sex or assigning "bride/groom" roles. Do not use one directional result as a definitive marriage decision, and do not fabricate missing Gana/Nadi/Yoni/etc. compatibility.

**Foundation stone** (Raman Ch 12):
1. Eight explicitly preferred and seven medium Nakshatras; remaining ones excluded.
2. Odd Tithis other than 9, plus even 2/6/10; Saturday avoided, waning Moon Monday avoided.
3. Fixed event Lagna (Taurus, Leo, Scorpio, Aquarius) preferred; movable rejected; dual signs require separate benefic strength.
4. Election 8th whole-sign house must be VACANT including verified Mean Rahu/Ketu; malefic (Sun, Mars, Saturn) graha drishti to 8th checked. Parashari whole-sign drishti: all classical planets aspect 7th, Mars 4/8, Jupiter 5/9, Saturn 3/10. Nodes' differing traditional drishti schools are deliberately not invented; only node occupation is checked.
5. One of Raman's specifically listed beneficial exact configurations checked, while source's further combinations, solar month and regional Vastu considerations remain review gates.

**Other activities**: modern first-date analogies never receive hard wedding doshas. D10 remains a career contextual division, not a magical day selector. For engagements, until an engagement-specific classical rule corpus is verified, no wedding-specific exclusions are silently copied.

## Unfinished full-muhurta blockers (explicit, not silently marked favorable)

- Raman warns of **21 election doshas** and exceptional neutralizations; not all have been independently source-verified. Some require event Lagna lord's strength, chart-only benefic dignity and Navamsa detail, and tradition-specific choice.
- Partner complete Kuta match (Dina alone is not sufficient): Gana, Yoni, Rashi, Graha Maitri, Rajju, Vedha, Varna, Nadi, and 7th/8th natal strength and exceptions. Requires individual classical source audit and partner roles/consent; no inferred sexes. Rejection is not based on one proxy.
- Foundation season/Vastu geographic ritual details; house 8 malefic aspect definition may differ by adopted school. Treat engineering/permits as independent of astrology.
- Confidence in astrological *outcomes* is not scientifically certified by precise planetary positions; the verifiable claims are arithmetic, ephemerides, classical rules and traceability.

**Release policy:** `screened_requires_review` for any ceremony even if *all currently implemented* rule subsets pass. `excluded` when a documented hard exclusion applies. Only direct, source-supported ordinary activities with personal Tara/Chandra can produce `candidate`, and this remains **calendar-screening**, not a promise of success.

## Algorithm: exact candidate intervals

`apps/api/src/panchanga-p385-windows.ts`: for each observer sunrise day, enumerate:
- source-verified Tithi, Nakshatra, Nitya Yoga, Karana transitions from P3.1;
- **108 exact lunar Nakshatra pada boundaries** (3°20′ each), critical for Raman's Magha/Mula first-pada and Revati last-pada marriage exclusions. Swiss Moon scanned every 10 minutes and bisected to 1 millisecond before rounding up to the first safe UTC second; never extrapolated from Nakshatra sunrise pada;
- Rahu Kalam begin/end and actual sunset from P3.4;
- 12 event Lagna sign ingress edges, adaptive 2-minute Swiss sampling + bisection to 1 second, reject missing/nonmonotone/angular jumps, no boundary extrapolation;
- Sun/Moon/Mercury/Venus/Mars/Jupiter/Saturn sign ingress from P3.6 speed-aware bisection;
- native SWIEPH Mean Rahu sign ingress;
- owner's active Vimshottari Mahadasha/Antardasha boundaries.

Each interval is half-open `[startUTC,endUTC)`; sampling occurs **15 seconds after** the chosen segment start, outside a sign-edge ambiguity, and we require **at least 15 minutes** to remain after the requested start. A transition closes the interval without borrowing minutes from the next one.

`apps/api/src/panchanga-p385-search.ts` computes consecutive **1–30 full verified observer sunrise days** (API requests 7 or 30) at a selected event city and exact future UTC moment; handles time **before local sunrise** by choosing the previous sunrise day; observer coordinates and IANA zone are one immutable tuple. Never silently treat a civil midnight as a Vedic sunrise. Exact Swiss planetary snapshot and event Lagna are recomputed for the selected interval. No external AI or estimated ingress.

Output:
- `candidate_found`: directly documented simple activity has a verified calendar candidate; source rule IDs and accurate UTC bounds returned.
- `review_only`: special ceremony has a possible interval, but further traditional review is REQUIRED. It is **not** a fully auspicious muhurta.
- `none_in_checked_range`: no accepted candidate within the audited horizon; never fabricate "tomorrow at 10:00".

Hard guards: consecutive sunrise times, identical observer time zone, 1–30 days, max 400 planetary/lagna transitions per day, 6000 evaluated windows per request, strict native Swiss and natal owner verification. No database writes, no LLM, no DOB in API query, no arbitrary luck score. Production execution time/resource certification for **30-day** searches remains pending on target EC2; do not deploy without that benchmark.

## API design, privacy and QA

`POST /api/v1/personal/panchanga/time-finder` requires signed-in cookie, same-origin protection, private no-store, 2 searches/user/hour. Body:
```json
{"activityId":"foundation","atUtc":"2027-05-10T15:00:00.000Z",
"timeZone":"Europe/London","latitude":51.5074,"longitude":-0.1278,"days":7}
```
Optional `partnerChartId` only when the selected undertaking requires a saved verified partner chart belonging to that same user account. Personal natal charts are loaded server-side and NEVER returned as raw birthday/birth location.

The existing `POST /api/v1/personal/panchanga/event-lagna` now additionally returns `specialRules` for exact wedding or foundation event, including reason IDs and pending gates, with no blanket "best wedding time" claim.

QA: `npm run test:p385` covers special marriage/foundation houses, event nakshatra/pada, tithis/weekday, exact Graha Drishti, D1/D9/D10 source validation, two directional Kuta, direct vs analogies, boundary root precision, 30 contiguous days and source-verified failure modes. `npm run test:panchanga` includes P3.1–P3.8.5; GH workflow compiles NestJS/NextJS and runs existing browser regressions.

No visual changes on live Galaxiora at P3.8.5. Next: P3.8.6 unified clean location/date/activity/day UX, P3.8.7 Day/Week/Month unified calendar, P3.8.8 independent classical source, runtime/CPU and production acceptance.
