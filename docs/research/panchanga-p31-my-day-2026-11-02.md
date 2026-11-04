# P3.1 — My Day UX and evidence contract (2026-11-02)

## Product goal and owner-approved constraints
Panchanga should answer **what does this mean for me, what action should I take, and what astronomical event can I actually observe from my city?** Short, direct Ukrainian and English wording. Severe traditional inauspicious intervals can be stated categorically **within the chosen tradition**; do not create unsupported predictions of actual life outcomes. If the user has no birth chart, offer a direct path to create or verify it. Keep astronomy prominent, especially exact location-dependent eclipse visibility. Retain current Swiss Ephemeris integration and its approved usage model; this stage adds no new libraries, provider, or license-related operations. Galaxiora design and approved spiral #6 are untouched.

## P3.1 implementation
1. A single `PanchangaMyDay` component appears immediately after compact date/city and calendar controls, before the long technical calendar. Local date, observer time zone, traditional lunar waxing/waning and exact sunrise/sunset are shown without presenting the next sunrise as 'now'.
2. Topic selector: Work, Money, Relationships, Travel, Personal. `panchanga-p31-model.ts` derives ONE clear start-time caution from existing verified sunrise-based Rahu Kalam boundaries. For Work, for example, it specifies when not to start a salary negotiation. It does NOT classify the rest of the day as auspicious or fabricate 'full five-limb synthesis' or a chart reading. On the exact interval, the wording is categorical; off it, the exact interval is displayed.
3. Prominent sky module: one deliberate, resource-bounded, on-demand request to **the existing Swiss-backed `/api/v1/astronomy/eclipses`** for the selected observer and 366 days. Show **only** events flagged `visibleHere` and their local maximum instant. An empty result explicitly reports no computed visible eclipses for that time window, not "no astronomical events". Unavailable results show a retry message, never invent visibility. Weather and solar-protection limitations are explicit. Expensive eclipse search is NOT automatically made for every page view. Existing NASA 2027 page remains linked in detailed tools.
4. Previous five-limb cards, exact transitions, festival/phase and lunar-month evidence, daytime intervals, personal Lunar Rhythm and planetary events are retained within ONE collapsible technical section `p31-details`. This avoids loading the heavy overview and personal analysis on initial page view; it also makes duplicate sunrise cards unnecessary. Old independent EclipsePanel tab is removed from this view, because first-screen local visibility search now owns that feature. The separate file/API remains available for other consumers.
5. The long SEO explanation survives within a collapsed guide, preserving UA/EN headings and content in SSR. No redundant table pushes the decision-related content below the fold.
6. `P31AdviceContract`: versioned payload; precise scope (`calendar_only`), topic, observer date/zone, evidence IDs/UTC bounds, personal flag and missing-data IDs. Future P3.2-P3.4 services implement five-limb and natal synthesis against this contract instead of returning a second competing interpretation.

## Explicit P3.1 limitations: blockers for the next stages
- **Five-limb synthesis is NOT implemented in P3.1.** The current output only speaks about traditional Rahu Kalam start-of-new-work convention. P3.2 must build an evidence-reviewed rule registry (tithi/nakshatra/vara/nitya yoga/karana, lunar phases, relevant astronomical events) with topic-specific conflict resolution. Avoid empty "take a step back" and content rotation without astronomical evidence.
- **Personalization is NOT implemented in P3.1.** P3.3 must compute the verified natal chart and exact observer-time transits and combine Tarabala/Chandrabala into a coherent documented verdict. Without a verified chart, disclose `calendar_only` and link `/{locale}/personal`.
- **Precise hour-by-hour recommendations are NOT implemented in P3.1.** P3.4 must evaluate all relevant time boundaries, plus birth-context constraints, rather than making noon-snapshot claims for time intervals.
- **Month cards aren't fully interpreted in P3.1**. P3.5 takes user topic and overview evidence into 7/30-day comparisons; do not relabel unknown dates as beneficial.
- **Eclipse visibility is geometry, not weather/observational certification**. Do not show generic new/full Moon as an eclipse, and do not make public auto queries against the limited two-worker Swiss pool. For ancient/polar dates, fail closed.
- **P3.1 is NOT a production deploy**. Work is in a draft stacked PR on top of verified P2.5; existing EC2 has local next-env.d.ts modifications already discussed. No Git merge to outdated main, no migration/deploy until all six approved stages and explicit release preparation.

## Test/release gates
- Node unit `tools/panchanga-p31.test.mjs`: no fabricated personal claim, exact Rahu interval, before-sunrise isn't 'now', corrupt timing fails closed.
- Browser `e2e/panchanga-p31.spec.mjs`: first-screen UA/EN and topical labels, personal birth-chart CTA, **zero** expensive eclipse or overview/personal requests until selected, mocked eclipse visibility not inferred from phase, 320px viewport.
- All P2.1–P2.5 E2E tests still exercise verified tables and personal lazy views by explicitly opening detailed-calculation disclosure. Existing old 50-test suite is not silently deleted.
- Full Next + Nest build, Prisma generate, `npm run test:panchanga`, `npm run test:vedic-calendar`, desktop/mobile Playwright. No source modifications to natal/Swiss calculations, payments, GA4, brand, translation or public SEO address.

## Acceptance criteria for stage one
- Main screen answers "where/when", "what lunar state", "what action is traditionally avoided during verified Rahu" and "how to check if an eclipse is visible here".
- Clickable topic instantly updates an evidence-scoped statement. No confidence percentage, no invented auspicious windows, no apparently personalised advice without chart.
- Precisely labelled conditions remain inspectable and time-zone aware; default page has no duplicate heavy five-anga charts, traditional-hour table and empty event-filter boxes.
- Guest gets a direct, accessible link to their natal setup.
- UA/EN copy and mobile regressions pass, old verified outputs retained in advanced disclosure.
- Stage 1 approval is **source/CI** only; the product doesn't claim comprehensive personal consultation until subsequent stages.
