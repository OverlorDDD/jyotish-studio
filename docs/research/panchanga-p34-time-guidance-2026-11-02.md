# P3.4 · Time Guidance Engine — implementation and release acceptance (2026-11-02)

## Approved sequence and scope
P3.1 My Day → P3.2 seven-factor Panchanga interpretation → P3.3 verified owned-natal resonance → **P3.4 exact time windows** → P3.5 7/30 Personal Calendar → P3.6 release/rollback. This stage is stacked on `feat/panchanga-p33-personal-resonance-20261102`, commit `2eb8247`. Do not merge `main`, deploy AWS or change brand, News, GA4, SEO, ads or billing before P3.6.

P3.4 provides UTC-bound, user-IANA-localized, *sunrise-to-next-sunrise* time windows for five user activities: Work, Money, Relationships, Travel, Personal. It may strongly advise against starting something when the evaluated traditional calendar/natal factors are adverse, including hard exclusions. This is **documented traditional electional guidance**, not a promise of an actual life event. An astronomically correct transit is an observation; a recommendation is a school-specific interpretation.

## External reference manuals and versioned source policy
1. Swiss Ephemeris official programming guide: https://www.astro.com/swisseph/swephprg.htm — calculation flags, Swiss ephemeris and UTC/Julian dates. We reuse the repository's *existing* JHora8 mean Lahiri/Delta-T and checked SWIEPH return flags; no unlicensed binary or new dependency.
2. Swiss Ephemeris library/docs overview: https://www.astro.com/swisseph/ — licensing and ephemeris limitations. Never suggest a new unrestricted commercial license is included.
3. MDN `Intl.DateTimeFormat`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat — display exact UTC instants in the observer's IANA time zone, including DST. Never add 24 hours to local wall time to find the next sunrise.
4. P3.2's reviewed traditional sources: Rashtriya Panchanga (Indian Meteorological Department) https://packolkata.imd.gov.in/panchang/en/explanation ; Drik Panchang nakshatra classification https://www.drikpanchang.com/panchang/nakshatra/classification/nakshatra-seven-category.html ; the existing source-specific P3.2 hard/caution policy remains canonical, not a new unsourced percentage model.
5. P3.3's approved lunar comparison and school-specific Tarabala/Chandrabala policy: `docs/research/panchanga-p33-resonance-2026-11-02.md`. Do not create a second natal chart algorithm or silently alter its ranking.

This document links the source instructions instead of copying copyrighted manuals or adding external packages. The repository already carries the Swiss implementation and approved calculation profile. Source/library installation remains governed by the existing JQA-3 ephemeris/licensing setup.

## Implementation
- `apps/web/lib/panchanga-p32-engine.ts`: strictly typed `at-instant` mode. Fail closed when selected UTC instant is outside the *verified sunrise day*; never silently revert to sunrise when the observer's local calendar date crosses midnight.
- `apps/web/lib/panchanga-p34-time-guidance.ts`: compile all four independently verified Sun/Moon anga period boundaries, Rahu Kalam start/end, sunset, sunrise-to-next-sunrise, and optional private Moon/planet sign ingress + verified Vimshottari major/minor period boundaries. Every consecutive UTC segment is independently reinterpreted at an exact point just inside its start. A missing/overlapping period, absent natal interval sample or mismatched observer/timezone terminates the affected private timeline.
- `apps/api/src/personal.ts`: authenticated `GET /api/v1/personal/panchanga/timing` reuses P3.3 owner's verified selected primary chart and one Swiss planet accessor, sampling ingress with a bounded 30-minute sweep then 1-second bisection. Return minimal transit facts for every segment, no birth input, cached browser data, or ID in query. Request is lazy (user must expand time view), per-user limited, `private, no-store` / `Vary: Cookie`.
- `apps/web/app/components/PanchangaTimeGuidance.tsx`: collapsible time windows under **one** canonical P3.3/P3.2 My Day recommendation. The selected topic reruns the pure evaluator without a new network request; show local start/end, one verdict for each segment, exact reasons, first upcoming supported segment with >=15 min left; do not invent a positive window if none exists.
- Guest/unverified chart/private endpoint error displays only the general seven-factor timeline and says it is NOT personal. UA/EN responsive <=320px, keyboard-accessible reasons, no astrology advice in public-indexed metadata.

## Priority and timing rules
1. General P3.2 `avoid` (e.g., Rahu/Vishti/Yoga exclusion) outranks any natal supports.
2. Personal P3.3 Ashtama Chandra hard exclusion overrides favorable Tara and general good periods.
3. General caution, inconsistent lunar supports or sensitive natal transit => caution rather than misleading support.
4. `supported` requires multiple independent calendar supports and both favorable natal lunar indicators (if private). Underlying Dasha lord remains contextual; an unsupported planetary dignities/aspect calculation cannot secretly change rank.
5. Each closed-open interval `[startUtc,endUtc)` is reported independently; positive windows are NEVER extended across a transition, active Rahu or next sunrise.
6. No minimum interval for truthful report; **recommend** a positive start only when at least 15 minutes remain. The 15-minute threshold is an *app usability rule*, not a classical astrological measurement.
7. Explicit IANA time zone and lat/lon identify the observer, no guessed city offset; geometry is independent of narrative certainty.

## Blockers / risk register
| Risk | Countermeasure / acceptance |
|---|---|
| P3.3 not present on main | Stack PR on P3.3's exact branch, no cherry-pick to older main |
| UTC, DST or local midnight scope | Solar sunrise UTC interval is canonical, Intl handles IANA presentation; unit covers 23-hour spring transition |
| False sunrise/noon-wide advice | Explicit `at-instant` mode plus every verified limb/Rahu boundary re-evaluation |
| False attractive windows | Hard avoid > caution > positive, exact per-topic evaluation and no positive if insufficient time |
| Stale/fabricated natal data | Owner-only P3.3 verification, bounded batch and strict matching samples to P3.2 UTC moments |
| Swiss CPU on AWS | One on-demand private batch per observer/day, 12 per-hour user cap; user can switch topics locally |
| 30-minute ingress bracket could skip double crossing within interval near a station | **Open certification caveat**: ingress enumerator is bounded and accurate to 1 second for detected sign changes, not independently certified exhaustive for arbitrarily fast station reversals. Before marketing as a full precision muhurtam, add adaptive speed-bound crossing verification and independent reference |
| Classical whole-rite muhurtam outside P3.2/P3.3 rules | No Hora, Panchaka, Abhijit, 28th nakshatra, arbitrary yogas or full Graha Drishti claims without separate policy and computation |
| CI/runtime baseline | Validate full panchanga unit, app build, playwright desktop+mobile and owner/guest privacy before declaring P3.4 completed; do not claim PASS without green runs |
| Production | P3.6 must include backup/rollback, `site:check`, `launch:verify`, private leak checks and explicit user's release approval |

## Stage acceptance checklist
- [ ] `npm run test:panchanga` all existing P2.1–P3.3 plus new P3.4 unit tests pass on final commit.
- [ ] `npm run build` and type-check pass on final branch SHA.
- [ ] Playwright real browser for UA, EN, desktop/mobile, one verdict, toggle, alternate window, topic changes, time zone, guest auth, two separate chart owners; all pass.
- [ ] Boundary integrity crosschecks on dates when Tithi/Nakshatra/Yoga/Karana change and sunset/Rahu occur; no fabricated fallback.
- [ ] AWS impact, no-store, rate limit, security, response size/perf reviewed; accept only if bounded.
- [ ] Open draft stacked PR, retain P3.3 and previous PRs, do not deploy production until P3.6.

Next: P3.5 computes verified 7/30-day personalized calendar using this P3.4 engine (with batch/rate limits, day scoped UTC boundaries). P3.6 performs full integration, certifies identified open issues, user accepts release and performs controlled deploy/rollback.
