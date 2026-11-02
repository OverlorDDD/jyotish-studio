# P3.2 — Panchanga Interpretation Engine · research, rule policy and acceptance · 2026-11-02

## Product outcome
One concise topic-specific statement, one concrete action and seven clickable evidence rows from **verified** local sunrise/day transitions: Tithi, Nakshatra, Vara, Nitya Yoga, Karana, waxing/waning Moon, and Rahu Kalam. Do not write two opposing verdicts. This is **traditional, general, electional** guidance, not a statement that a real-world event is guaranteed or a personalized chart reading. This stage does not recalculate Sun/Moon, add a paid ephemeris integration, create another LLM channel, invent eclipse data, introduce database changes or alter GA4, SEO, the brand icon, or public security.

## Sources assessed
1. Indian Meteorological Department, [Rashtriya Panchanga explanatory guide](https://packolkata.imd.gov.in/panchang/en/explanation): nationally published definitions of the five limbs and lunar cycle. **Definition/geometry, not personal forecasts.**
2. [Drik Panchang, seven nakshatra categories](https://www.drikpanchang.com/panchang/nakshatra/classification/nakshatra-seven-category.html): 27 lunar stations grouped by suitability for *kinds of activities*, especially travel, lasting commitments, gentle/fierce work.
3. [Traditional Muhurta overview and activity grouping](https://astrojar.in/muhurat/): Rikta tithis 4/9/14, weekday/topic categories and avoidance of unsuited beginnings. Interpreted as a versioned and revisable electional policy, not certified universal doctrine.
4. [Classical Muhurta syllabus and warning about priorities](https://parasharasoftware.com/Muhurta/Download/SM%20English%20manual.pdf): conflicting beneficial/adverse factors require priority and specific exceptions; source shows individual green/red values may coexist. No blanket numeric probability.
5. [BAVA overview](https://www.bava.org/articles/an-alternative-system-of-murhurta-electional-astrology/): five independent factors must be evaluated for choosing an action.

These sources **do not establish scientifically demonstrated predictions**. Some classifications vary across teachers or the chosen rite (e.g. Pushya for trade but not marriage). Therefore P3.2 deliberately limits claims to the five supported user topics and the recorded rules. Another tradition/rite requires a separate policy version and approval; do not pretend that all possible Muhurta doshas, 28th Abhijit star, natal hora or all graha conditions are already computed.

## Implemented design (P3.2)
- Pure `interpretPanchanga` in `apps/web/lib/panchanga-p32-engine.ts`. Takes the one verified local `/api/v1/panchanga/day` payload **already available** in P3.1; no second astronomical fetch and no licensing/API change. Computes the moment **from actual `periods` and UTC instants**, not a sunrise-only status when values have transitioned.
- Fail-closed on impossible UTC bounds, missing/overlapping active periods, invalid numeric limb indices, mismatched Yoga/Karana/Vara names/indices, wrong sunrise weekday or inconsistent Tithi Paksha.
- Exactly 7 factors, each with ID, evidence category, traditional source, UA/EN explanation and optional precise UTC interval. Versioned output `panchanga-interpretation-p32`; explicitly `scope:traditional-calendar-only`, `personalized:false`, `natal:false`, `exactMuhurta:false`.
- **No simple score or percentage.** Ranking: hard traditional exclusions (Vishti/Bhadra Karana, Vyatipata/Vaidhriti Nitya Yoga, active Rahu Kalam) → caution (Rikta 4/9/14, Amavasya, sharp/fierce nakshatra for gentle activities) → activity-aligned supporting factors → neutral. At least 2 independently supporting calendar factors and no exclusions/cautions are needed for a limited positive verdict. Activity-specific nakshatra groups matter: **movable can suit travel**, not automatically a salary negotiation; a gentle star suits conversations. Weekday correspondences are minor supporting evidence, never a universal veto.
- Direct user-facing actions: do not *start* a relevant major undertaking during adverse windows, prepare documents and postpone starting, or consider the action but check personal chart and exact Muhurta first. A favourable factor is **not a guarantee of success**, nor a proof that the interval is universally suitable.
- Moon waxing/waning is an explicitly named lunar phase property from verified tithi; no fabricated first/last quarter or eclipse. Real visible eclipses stay in the separate prominent, opt-in Swiss calculation from P3.1.
- A future/selected civil date is **sunrise snapshot**, never labelled `now`. The closest next transition is derived from the boundaries (P3.4 will evaluate a complete timetable and choose alternate hours).
- The P3.1 first screen shows **one** recommendation for selected Work/Money/Relationships/Travel/Personal, one clear subject/action, a concise reason and a closed-on-entry `Why?` with all seven factors. Existing natal upgrade link still present. P3.1's old one-factor Rahu headline is no longer shown as a contradictory second verdict.

## Risk register & blocked claims
1. **Technical integrity**: the day API and current-time angas must agree. No optimistic fallback to guessed text if malformed; visible alert instead.
2. **Mixed signals**: hard exclusion always prevails; one or more caution factors prevent a positive verdict; positives never “cancel” Vishti or the current Rahu interval.
3. **Time scope**: previous sunrise day before local sunrise is explicitly distinguished from upcoming selected-date sunrise snapshot; never call a future state `now`. No full 24-hour Muhurta verdict yet.
4. **Tradition choice**: this is a stated policy for broadly choosing beginnings and 5 user topics, **not** all spiritual ceremonies, marriage/medical surgery rules, Hora, planets or full natal evaluation. Source IDs and rule categories are visible for auditing.
5. **Birth data**: do not infer user finances, marriage or profession. P3.3 later incorporates verified chosen natal chart and Tarabala/Chandrabala with coherent override. Until then clear link to create a chart.
6. **AWS resource budget**: no additional API, Python processes, translation LLM or per-minute server recalculation; a pure memoized browser computation when minute/topic/day changes.
7. **Commercial/licensing**: continue previously approved Swiss Ephemeris use only, no expanded use or new binaries. Requirements for any future paid license remain unchanged.
8. **Research provenance**: no bulk copying copyright-protected astrology prose; advice wording is short and independently authored in Ukrainian/English.

## Acceptance gates
- Unit: all seven factor identities, Rikta vs supported movement, Vishti/Rahu overrides, exact boundary changed after sunrise, a future-date sunrise snapshot and corrupt/inconsistent measurements.
- Browser UA+EN: single verdict, seven source-specific rows on demand, topic changes action, natal CTA, under 320px layout, no new heavy requests.
- Complete legacy P2.1–P2.5 + P3.1 Swiss-backed browser and compilation/SEO/brand tests green on same SHA.
- No main merge, production deploy or DB migration until user completes six stages and P3.6 production acceptance.
- **Next P3.3:** verified natal Moon, lagna, active Dasha, precise gochar, traditional Tara/Chandra strengths and combined source trace; do not declare a personal outcome without verified birth input.
- **Next P3.4:** exact event-boundary timeline, all time blockers and alternate window search with multi-factor reevaluation per segment.
