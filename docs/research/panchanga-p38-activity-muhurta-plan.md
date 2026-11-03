# P3.8 — Panchanga & Muhurta Decision Engine: implementation plan and stage gate

Baseline: P3.7 `04e645dbc02706c37db6afff0314bf0e4c8a1e48`. This branch must **not** be deployed to AWS until independent source/rules QA and activity-specific interface acceptance have been completed. Existing P3.7 production remains unchanged.

## Why P3.7 is algorithmically insufficient

### Audit: exact code cause

- `apps/web/lib/panchanga-p32-engine.ts` returns `avoid` whenever **any** of seven evidence factors has `blocks`, `caution` whenever any caution, `supported` when two supports. The seven factors overlap: Paksha is derived from Tithi (same Moon–Sun elongation), Karana is half-Tithi, and a single global lunar restriction can dominate all activities.
- `apps/web/lib/panchanga-p33-resonance.ts` returns `caution` whenever *any* challenged or first-cycle Tara, *any* weaker Chandra placement, Saturn Sade Sati, or Mars 8th sign from natal Moon triggers. This collapses unrelated activities and can mask strong suitable time.
- `apps/web/lib/panchanga-p34-time-guidance.ts` accurately segments UTC boundaries but passes each segment to that *same flawed* P3.2/P3.3 verdict model. Accurate boundaries do not rescue incorrect interpretive semantics.
- P3.7 UI labels broad topic a fixed "selected activity" the user never chose.
- Time-window section is detached from key user decision. Routines and new irreversible beginnings are treated almost identically.

### Non-negotiable requirements

1. **No invented positivity.** Neither a purely neutral star nor absent exclusion is enough to certify a good muhurta. Show `undetermined` where rules do not identify preferred time.
2. **No invented negativity.** Absence of a positive star is NOT a prohibition. A personal caution is not automatically a ban on all ordinary actions.
3. **No double counting.** Panchanga still has exactly five limbs. Tithi/Karana/Paksha are mathematically linked, not three independent probabilities.
4. **Source scope:** for each `activityId`, retain a citation and whether the rule is **direct classical**, **modern analogy**, **special/full election**, or **ordinary routine**.
5. **Same verified moment:** every datum is anchored to the identical UTC instant, IANA observer zone, local sunrise-day and natal report. Exact next change split requires P3.4 1-second verified boundaries.
6. **Positive recommendation requires actual matching documented activity criterion** and no verified exclusion. A hard choice is never manufactured by an arbitrary +20 / −15 scoring model.
7. **Sensitive natal data:** only owned, verified chart in private no-cache APIs; not in public URL, analytics, logs or guest HTML.
8. **No claims of outcome science:** mathematical precision can certify planetary positions and rule execution, not future successes in personal life, trade, marriage or health.

## Specific activity support and boundary

Code: `apps/web/lib/panchanga-p38-decision.ts`; 8 categories, 25 distinct activities:
- Work: job start, interview, salary discussion, shop opening.
- Finance: starting sales, borrowing money, financial agreement, major purchase.
- Relationships: making friends, first date, reconciliation, engagement, wedding.
- Travel: short journey, long journey, business journey, moving residence.
- Education: starting a course, art/music study.
- Home: foundation, entering a new house, starting repairs.
- Spiritual: daily meditation (routine, NEVER globally barred), starting Hatha Yoga sadhana (specific rule).
- Personal: starting a creative project (explicitly a modern analogy).
  
**Dating vs marriage:** friend-making/gentle Nakshatra is a documented classical action. Extending it to a romantic first date is a modern analogy, not a named ancient rule. Different events require different evidence; no "successful relationship" prediction.

## Source register (audit entries)

- [Drik Panchang Seven Nakshatra Groups](https://www.drikpanchang.com/panchang/nakshatra/classification/nakshatra-seven-category.html). Fixed/Sthira includes service and foundations; Movable/Chara includes journeys; Swift/Kshipra includes shop openings, selling, study; Gentle/Mridu includes making friends and arts; Teekshna includes Sadhana and Hatha Yoga. The source explicitly states Gentle may do fixed work and Swift may do movable work. **Abhijit is supplementary, not a 28th equal 13°20′ sector** in a 27-way ephemeris.
- [B. V. Raman, *Muhurtha*](https://ved.bz/_jyotish/books/muhurtha.html): Chapter III (Tarabala, Chandrabala, cycle-specific exceptions; short journeys/interviews vs ceremonies); Chapter V (Panchanga Suddhi, Nitya Yoga and Karana restrictions); Chapter IX (wedding; requires Lagna and partner natal factors); Chapter XII (House Building); Chapter XIV (Travel; Bharani, Krittika, 8th/9th Tithi); Chapter XVII (Borrowing, trade and house move).
- [Muhurta Chintamani, Adhyaya VI](https://karmasakha.com/texts/muhurta-chintamani): event Lagna fundamental to marriage election.
- For any source dispute, register both readings and explicit chosen tradition. Do **not** silently combine contradictory Chandrabala conventions. Existing Galaxiora P3.3 chosen convention uses signs 1/3/6/7/10/11; Raman's own simplified electional checks may differ.

## Genuine mathematical checks introduced first

- Reject invalid/overlapping active UTC segments, mismatched verified Panchanga day, wrong star name/index, weekday/karana/yoga name/index, and impossible Tithi–Karana alignment (`ceil(karanaSlot/2) === globalTithiNumber`).
- Distinguish exclusion by purpose: Bharani and Krittika are named travel exclusions, not an all-activity nightly ban. Tithi 8 and 9 excludes journey starts under Raman's chosen rule; this is **not** an invented global prohibition.
- Rahu Kalam/Vishti influence **new auspicious starts**, not continued daily meditation.
- Base yoga cautions are **not** unconditional activity bans; missing remedies need further classical verification.
- General calendar screening returns `candidate | mixed | avoid | undetermined | routine`. If full event election required, return `needs_full_election` rather than automatically `candidate`.
- P3.4 time interval search can return next 15-minute **calendar candidate only** after exact transitions; event-Lagna election requires additional explicit complete computation and cannot silently reuse birth Lagna.
- Personal Tara/Chandra only after `validateP33Report`; first-cycle challenged Tara and non-supporting Chandra can change a supported candidate to `mixed`, not universal `avoid`. Check exceptions before ever claiming final election. Any missing private sample rejects the personal search.

## Phased rollout and test gates

**P3.8.1 Accuracy Audit** (begun): source inventory; all hardcoded decisions; factor independence; time-zone, solar and lunar ingress tests; edge cases and false-positive proof. Acceptance: before/after classification report with reproduced failure cases.

**P3.8.2 Classical Rule Registry** (begun): above activity taxonomy, documented source links and method per activity. Acceptance: 25 IDs, 8 categories, no duplicate IDs, no unsourced or invented event-specific associations.

**P3.8.3 Decision Engine v2** (prototype begun): independent decision model that ignores old P3.2/P3.3 statuses and only reuses **verified data validation**; exact UTC P3.4 windows; direct source-based activity differentiation; one rule explanation per decision, rather than generic scripts. Acceptance: at least two actual activities with genuinely different outcomes from identical Panchanga input; at least two different day classes; explicit no-"all days bad" proof in source-level test corpus; no forced positivity.

**P3.8.4 Personal Muhurta** (not implemented): birth chart owner, Janma star/Moon, cycle-specific exceptions and event Lagna. High-stakes wedding/house foundation require event **location and candidate moment**; for wedding, both partners' verified natal data where required. Develop Swiss event ascendant solver and selected doshas with traceable classical rules. Birth Lagna is **not** event Lagna. Chart absent → create/select verified natal chart; missing event location/partner → ask only for missing fields.

**P3.8.5 Multi-day Time Finder** (not implemented): extend P3.4 boundary search across requested 7/30-day range, including moon-rashi boundary for Chandra, source-complete rules, sunrise/daylight, additional event-Lagna transitions and all exceptions. Search until proven candidate or explicitly return "none in verified range". Never label partial P3.8 calendar candidate as full wedding muhurta.

**P3.8.6 Unified Clean UX** (not implemented): One controlled location/date selector auto-populated from saved observer, else natal city; one search dropdown; auto-evaluation, no duplicate calculate button; actual activity dropdown; compact statement and near-term time; five pictograms / concise data with pointer/keyboard/touch details; no vague prewritten preparatory tasks; current personal reasons collapsible but not hidden from accessibility; technical panel last.

**P3.8.7 Unified Calendar** (not implemented): Day / 7-day horizontal overview / month event grid; remove separate 7/30 Personal view; click any day to open identical personalized day details; location and activity persist between views; observances, exact phase and planet ingresses, certified visible eclipses, clearly distinct day-only sunrise snapshots versus exact windows. Amanta/Purnimanta switch belongs only within detailed lunar-month method settings.

**P3.8.8 Independent QA & Operator Release** (not implemented): Swiss ephemeris reference and independent astronomical data (not a fabricated date); benchmark 27 stars/30 Tithis/27 Yogas/60 Karana slots, at least 20 owned chart dates and time-zone/DST boundary corpus, real birth charts with no unauthorized access, rendered UA/EN at 320px; old P3.1–P3.7 regressions, no old UI until cutover complete, full safe production backup/rollback, no Docker dependency in operator instructions without confirmed permissions.

## Currently enforced deployment firewall

The experimental `panchanga-p38-decision.ts` is NOT imported by current `PanchangaHub`, `PanchangaMyDay` or the public API. It only runs under `npm run test:p38` / `npm run test:panchanga` and CI.

**Reason:** source-grounded partial candidate evidence does not yet certify the full personal election and user should not see "favourable" based on missing event Lagna, unreviewed exceptions or incomplete multi-day coverage. Do not roll out partial calculations as live advice. Preserve P3.7 production while P3.8 gates are worked through.
