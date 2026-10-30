# Galaxiora Personal — My Astrological Path, 24 October 2026

## Decision and competitor research
- **CHANI**: Today/This Week/This Year, daily lunar reading, themed meditations, journal prompts, and distinct collective weekly weather vs personal natal transits. Source: https://chaninicholas.zendesk.com/hc/en-us/articles/8711720295187-A-Tour-of-the-CHANI-App and https://chaninicholas.zendesk.com/hc/en-us/articles/4406728790419-When-CHANI-content-updates
- **The Pattern**: daily "My Lens" check-in, life cycles, personal transits, and self-reflection. Source: https://www.thepattern.com/app-features and https://thepattern.zendesk.com/hc/en-us/articles/15273929936020-How-do-I-access-my-daily-updates
- Distinctive Galaxiora offering: sidereal Jyotish / Vimshottari life-cycle explanation **tied to the verified personal chart**, plus same-day local-noon Moon observation and an optional practice. No artificial scarcity, fabricated events, addictive streaks, or guaranteed future predictions.

## Implementation contract
- `apps/api/src/personal-guidance.ts` is a deterministic, bilingual, curated traditional interpretive layer. It receives **only** factual current period and natal positions from a verified saved chart and Swiss/Lahiri local-noon observations.
- `GET /api/v1/personal/overview`: `journey.period` (null if chart not verified or no active period) and `journey.daily` (general fallback without chart). Every text includes `evidence` and calculation method; both stay private/no-store.
- `GET /api/v1/personal/calendar?days=7|30`: `weekHighlights` for **only the first seven days**, maximum five entries, including opening day, changes between noon snapshots and genuine Vimshottari starts. It does not fabricate sign/nakshatra ingress instants.
- Frontend adds `astrological-path` (life-cycle + daily orientation), a `daily-advice` with optional journaling, and `week-highlights` under 7/30 lunar grid.
- A meaningful daily return comes from changing real sky observations and user's ongoing journal, not random regenerated LLM prose. No Tarot daily quota is consumed.

## Test gates
- Unit: natal-house association, precise evidence, UA/EN, deterministic repeated output, general mode, week-event provenance, 7-day focus of 30-day calendar.
- Browser: populated verified chart, both languages, 7/30 days, responsive layout, journaling anchor, no data from other users, normal birthless fallback.
- Keep JQA-3 full numerical precision NOT_CERTIFIED: these are traditional interpretations of the documented **Galaxiora method**, not claims that JHora's date modes have been exactly cloned.
- Never use journal text for news personalization without explicit opt-in.

## Official references
- https://nextjs.org/docs/app/api-reference/functions/fetch (no-store for private requests)
- https://docs.nestjs.com/controllers (validation / DTO and response patterns)
- https://www.astro.com/swisseph/swephprg.htm (ephemeris conventions)

## 25 October 2026 — correction: one natal-grounded daily reading (Personal v2.2)

### Verified root cause
The earlier API produced one recommendation from `buildDailyGuidance(transit)` and a **different, deliberately substituted** same-day action via `complementary` in `buildWeekHighlights`. The house-nine template also falsely assumed the person had a school application or mentor. Worse, the generic fallback could be rendered in the personalized location without a verified natal chart. These were defects in **content architecture**, not ephemeris or JQA-3.

### Source-grounded rule
Classical Dasha interpretation requires the natal position and house rulership of each relevant lord, not its name alone. Nakshatra and house headings are **traditional topics**, not evidence of the user's job, children, schooling, friendships or specific events. Swiss Ephemeris provides astronomy; it does not validate the personal advice.
- https://vedicpupil.in/library/books/brihat-parashara-hora-shastra/chapter-51
- https://www.astro.com/swisseph/swephprg.htm
- https://mokshology.com/learn/antardashas

### Contract
1. An owner-selected saved birth chart **must be reverified**; without it `journey.daily` is null and `calendar.weekHighlights` is empty. The raw lunar calendar may still show *general astronomical positions*.
2. The single canonical `buildDailyGuidance(transit, verifiedNatalContext)` uses lagna, natal Moon, natal D1 positions, the Dasha active at the **same local-noon sample**, the transiting Moon's sign/nakshatra/pada and its house **relative to that verified lagna**.
3. The API exposes an `evidence` object with sample method/time, natal lagna/Moon, Moon transit house, the current major/sub lords and their natal houses. It never fabricates biography or timing of ingress.
4. The week references **the exact same daily object** for today. The current-day weekly row is a link to the one daily reading: it does not show another "What to do today" card. Future highlights are generated from each date's verified natal context.
5. House-specific `action` guidance stays optional and broadly applicable. No inferred mentor, school, occupation, children, relationships or other life circumstances. No LLM generation, stochastic diversification or social profiling.
6. Account boundaries, private/no-store endpoints and chart recovery behavior remain unchanged. `JQA-3` full numerical certification is **not implied** by these tests.

### Regression gates
- Same day & chart: `GET /personal/overview.journey.daily` equals the current-day `GET /personal/calendar.weekHighlights[0]` text, source evidence and action.
- Missing/mismatched/unverified chart: no personal recommendations even when general ephemerides are available.
- Two differing natal contexts can produce differing, evidence-linked readings for the same sky.
- Desktop/mobile has exactly **one** `Що зробити сьогодні` label and a week `#astrological-path` anchor.
- Validate UA/EN, 12 house recommendations and explicit prohibition of ungrounded assumed life facts.
