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
