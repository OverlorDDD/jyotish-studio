# Galaxiora P3.8.6 — Clean Panchanga UX + wedding Muhurta certification roadmap

**Owner:** Galaxiora / Jyotish. **Baseline:** P3.8.5 PR #94. **Current branch:** `feat/panchanga-p386-clean-day-ux-20261103`. **Release:** pending CI and production quality gate. Do not deploy as a stand-alone alternative to existing P3.7 production.

## 1. Visitor problem and cleaned screen

Visitors come to **choose a time to begin a SPECIFIC undertaking** and understand *which measured classical criteria* explain the choice, not to browse 40 cards.

Single page order:
1. Narrow observer/date selector. The currently saved/natal city is prefilled **inside the world-city search field**. Picking another city automatically fills latitude, longitude and IANA time zone; the day recalculates. Optional profile saving; no duplicate location dropdown/coordinates panel, no dummy Calculate Day.
2. Three tabs **Day / 7 days / Month**; the retired fourth “My calendar 7/30” duplicates Week and is removed. Day is a full interpretation. Week shows seven horizontally swipable concise sunrise snapshots and opens any day. Month retains the familiar month/event grid. Amanta/Purnimanta belongs under **Month → Calendar settings** with a clear statement that the switch affects lunar month names, not today's five limbs.
3. **My Day**: eight real categories and **a separate, visible and controlled specific activity selector**, 25 P3.8 documented activities; no unselected “Chosen activity” line. One concise source-scoped traditional verdict derived from P3.8.3 rather than P3.2’s universal caution. Never surface P3.2’s generic task-preparation script.
4. A restrained **small percentage ring** *only* when at least two independent, actually triggered classical evidence groups have source-cited positive/caution/exclusion interpretations. Numerator = unique **supporting groups**, denominator = supporting+caution+exclusion groups; Tithi and Karana are merged into **one Sun–Moon elongation group**, no double-counting. Unchecked/missing criteria do not become positive or negative. A `special_election`, routine, hard exclusion, missing source-documented **activity-specific positive** criterion, or 0/1 decisive evidence case gets **no percentage**. In particular, supportive Tara + Chandra alone cannot show misleading 100% for an undertaking whose selected Nakshatra is not a documented suitable class. The label means **share of supporting observed traditional signals**, *not probability of success*, not a calibrated Shastra formula and not numerical accuracy of future outcomes. Always expose exact numerator/denominator and a touch/keyboard accessible explanation.
5. **Time Finder in the SAME verdict area**, not a disconnected “When to begin” section. Explicit user button runs the expensive owner-scoped 7/30-day Swiss service (max 2 calls/hour). Never auto-spam the API on topic toggles. Candidate window and **screened ceremony requiring further review** are visually distinct. A past date cannot prompt future searches. Without a verified primary natal chart, provide a link to create/save it; for wedding/engagement choose the partner from the owner’s saved chart list (the server checks ownership and distinct ID). No fabricated next date.
6. Compact **five limbs**: 5 tidy icon tiles display current value and named class; explanation/source are disclosed on click, keyboard Enter/Space or screen reader (not only hover). No unhelpful hedging pasted into visible summaries. Detailed period math remains in an optional technical section after primary content.
7. A small **personal Moon** section displays concrete Tara/Chandra values when validated against the owned chart; no duplicated verdict or inactive Refresh button. Technical data (Swiss geometry, exact transitions, Rahu/Yamaganda/Gulika, source methodology) at the end.

This screen is NOT intended to imply that the interpretive beliefs are scientifically validated causal predictions. We can independently verify Swiss ephemerides and faithful implementation of documented classical rules.

## 2. Core implementation and blockers

- `PanchangaHub.tsx` now owns observer/date, profile city save/reset, single selected day, and Week/Month reuse. `CitySearch.tsx` takes `selectedPlace` rather than displaying a blank field with the actual city below it.
- `PanchangaCleanDay.tsx` is the new active Day UI; P3.7 `PanchangaMyDay` is NOT rendered. `panchanga-p386-evidence.ts` is a pure, testable evidence aggregation routine.
- P3.8.5 still needs **30-day EC2 CPU/memory and request latency benchmarking**, and its special wedding/foundation rules are not yet 100% complete. The UI does not auto-certify ceremonies or claim full election from absence of a prohibition. Existing preview routes stay private/no-store.
- 320px mobile, touch, keyboard, screen reader, Ukrainian/English, and no horizontal *page* overflow are release criteria. Week’s cards may scroll horizontally **within their own container** on mobile.

## 3. Wedding Muhurta: exact certification roadmap, not premature claims

**Authoritative tradition for this version:** B. V. Raman, *Muhurtha (Electional Astrology)*, Chapters 3, 5 and 9 and his closing Summary:
- https://ved.bz/_jyotish/books/muhurtha.html#chapter-3
- https://ved.bz/_jyotish/books/muhurtha.html#chapter-5
- https://ved.bz/_jyotish/books/muhurtha.html#chapter-9

**Define certification precisely**: (A) verifiable astronomical positions and time zones, (B) source-linked rule coverage **and exceptions**, (C) deterministic output parity with separately prepared worked references, and (D) full audit of missing inputs and rule conflicts. This is an **internal computational/traditional-rules certification**, NOT certification that astrology can predict actual wedding success.

### M1 — Complete source-rule catalogue

- Enumerate Raman’s **21 Mahadoshas** individually with exact chapter/page/condition, required Swiss/natal inputs, applicability for marriage vs other elections, exception, priority, and `applied | excluded | not_applicable | unresolved`.
- Current P3.8.5 already checks key wedding conditions: event 7th unoccupied, Mars 8th, Venus 6th, Lagna malefics and hemming, Moon association, weekday, named Tithis/Nakshatras/padas, Yogas and Vishti, elected Lagna and activity-specific Panchaka.
- Still missing dedicated, independently attested calculations for **Surya Sankramana +/-16 ghatis, Karthari, Shashtashta Riphagatha Chandra, Udayasta Suddhi, Lagna Thyajya, Tithi/Nakshatra Gandanta, Papa Shadvarga, Ashtama Lagna relative to EACH partner, Kunavamsa, solar/ecliptic eclipse star exclusions, Krura Samyuta, and applicable meteorological/seasonal cases**. Some of these are compound checks with exceptions. A template return `screened_requires_review` stays in place until their coverage is audited.
- Do not incorrectly conflate the 27 `Nitya Yoga` number 17 Vyatipata with astronomical `Mahapatha` without an explicit chosen definition; similarly separate Panchaka (mod-9 event formula) from Nakshatra Panchaka (star-group interval) and Panchanga's five limbs.

### M2 — Both natal charts + complete compatibility

- Fetch **two distinct, user-owned or explicitly shared-with-consent, verified** natal D1/D9 charts. Strict birth time, place, time zone/DST, ayanamsa and JQA-3 verification. Never presume user’s role, sex, or which chart is bride/groom.
- Compute **both-direction Janma Nakshatra counts**. Existing DINA KUTA is an *initial* indicator only; implement the other named Kutas that the selected **documented source school** requires (Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot/Rashi, Nadi, and any school-specific Rajju/Vedha/Mahendra/Stree Deergha checks). Do not silently mix incompatible North/South schemes.
- Independently calculate each chart’s **D1 7th/8th houses, lords, aspects and conjunctions; D9 Lagna, D9 7th lord, dignity, lord relationship, Janma Rashi and relevant role-dependent exceptions**. D10 is NOT a wedding suitability factor: use D10 for career elections and keep it informational otherwise.
- Privacy: no partner birth details in public page, analytics, URLs, shared requests or logs. Add explicit permission flow before non-owner partner chart input, rather than working around ownership rules.

### M3 — Exact future event chart

- Native Swiss verified **election event** Lagna, D9, 7 grahas + mean Rahu/Ketu, JQA-3 Lahiri, 1-second UTC transitions, selected city, sunrise-day/Vara and Moon’s exact **108 Padas**.
- Special event houses, classical planetary aspects (graha drishti), strengths (uccha, svakshetra and selected functional benefics/malefics), Lagna lord and 7th lord; no fake whole-sign “occupancy” standing in for unequal bhava cusps unless the house convention is explicitly selected and documented.
- Correct threshold root-search not only for Moon Nakshatra/Pada and event Lagna, but *any remaining rule’s threshold* (planet-house entry, Sun ingress buffer, dosha windows, exact eclipse contacts); otherwise an apparently stable 15-minute interval can contain an unchecked change.

### M4 — Rules and exceptions engine

- Store each rule as immutable `source, location/chapter, mathematical inputs, event type, predicate, exception, warning severity, exact evaluatedAtUTC`.
- **Do not turn all 21 Mahadoshas into an arbitrary sum.** Certain doshas are special absolute exclusions in Raman’s marriage chapter; other negatives may be neutralized by explicitly recorded and verified exceptions. Do not mark exception as applied just because some benefic is in Lagna.
- Rule evaluation has **4 states: pass / fail / exception_applied_with_evidence / pending**. Unknown does not mean PASS or FAIL. If a *required* rule is pending, the engine may show a *reviewable interval* but never a “certified full Muhurta.”
- Product UI must show **the nearest candidate after all source thresholds**, and also if no suitable time exists **within the checked 7/30-day range**, not invent a perfect date.

### M5 — Independent reference QA and acceptance

- Swiss Ephemeris ↔ independent PySwissEph ↔ independently exported JHora 8.0 with identical Lahiri/house convention and birth time; test exact ASC/planetary longitude <=1 angular second for same-profile points near house/sign/pada boundaries.
- Minimum **30 date+location event chart references** (time-zone offsets, DST folds/gaps, high latitude inside supported domain, both hemispheres), **20 verified two-chart matching scenarios** with complete source output, **12 each pass/fail boundary cases** for hard wedding constraints, and **all 21 Mahadoshas individually** including exception tests and missing inputs.
- Prove no expected favorable interval is lost and no forbidden interval is labeled verified. Every recommended interval must be re-evaluated at its start, near its end, and at all exact rule-boundary crossings.
- **M5 signoff:** source audit table 21/21 resolved or explicitly excluded as not applicable with documentary proof, all applicable partner Kutas reviewed, independence of test oracle, CI green + 7/30 EC2 runtime safety + personal consent + UA/EN accessible 320px UI. Only after those checks may a vetted internal full-wedding designation be exposed.

## 4. Release sequence

P3.8.6 changes live frontend markup and therefore requires **desktop/mobile browser acceptance** before any merge or AWS deploy. Follow with P3.8.7 unified week/month event integration, P3.8.8 independent astronomical & tradition QA, migration-free controlled production deployment and rollback test. Preserve the approved Galaxiora spiral brand asset.
