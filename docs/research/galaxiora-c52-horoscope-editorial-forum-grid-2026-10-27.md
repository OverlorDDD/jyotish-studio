# Galaxiora / C5.2 — horoscope editorial split and community grid, 2026-10-27

## Observed issue
Two Personal cards displayed the same `buildDailyGuidance` payload; its text mixed house numbers, stock phrases and unsupported assumptions about responsibilities. In GalaxiCom the utility controls used a long flex-wrap chain and scattered moderator controls below the composer, producing different heights and orphan rows at desktop width.

## Evidence-based market/editorial review (official, live sites)
- CHANI: https://www.chani.com/astro-education/how-to-work-with-astrology-on-a-daily-basis — short general daily transit prompts vs chart-specific live transit interpretation; excerpts prioritize a clear life theme.
- Astrodienst: https://www.astro.com/faq/fq_fh_transits_t.htm — selects meaningful natal transits instead of presenting the same reading on every day.
- AstroSage: https://www.astrosage.com/astrology/weekly-horoscope.asp — clearly identifies Vedic forecast with **Moon sign / Janma Rashi**, not western sun sign.
- The Pattern: https://www.thepattern.com/app-features — understandable insights organized as life patterns, relationships and cycles rather than a long listing of raw planet positions.
- Co–Star: https://www.costarastrology.com/faq — links transits to saved chart data and offers further question-driven interpretation. Its own personalization is not our calculation method.
- NN/g: https://www.nngroup.com/articles/why-does-a-design-look-good-part2/ — grid alignment, uniform controls, consistent type system.

These are content **design** comparisons. No competitor prose is copied, and their interpretative accuracy is not independently verified.

## Implemented separate products
1. `journey.horoscope`: **Janma-Rashi Moon-sign forecast** from verified natal Moon sign and calculated lunar transit. No claim to know partner, career, children or specific future event; the same Moon sign may intentionally have the same lunar text for different natal charts.
2. `journey.daily`: **natal/transit orientation**, using the verified natal Lagna, available validated non-lunar transit planets and their whole-sign houses, plus current Vimshottari context. Planet selection is deterministic **editorial rotation** across actual computed non-lunar planets and explicitly NOT a claim to select the most exact or strongest transit. The Moon is only a fallback when no verified non-lunar candidates are available. There are 12 conditional, practical problem-solving scenarios, each with alternatives for users who have no stated problem. No profession, marital status, parenthood or diagnosed condition is guessed.
3. `personal/calendar.horoscopes` uses Janma-Rashi, while `weekHighlights` remains the natal daily-orientation pathway. Same user, same date, distinct explainable methods.
4. The technical calculation evidence is preserved for audit: `planet`, `sign`, `house`, natal anchors, dasha, timezone, noon sample and selection policy. No time-of-ingress or exact aspect is inferred from the noon samples.
5. Both UK/EN texts avoid forms like “choose a task, track productivity” as unsupported blanket demands. Adulthood and audience age guide tone, not assumptions about family or paid work.

## Forum implementation
A two-tier **CSS Grid** groups public community actions with equal height, aligned buttons, predictable breaks, and expanded full-width disclosure. Primary row: display-name, inbox, optional privileged moderation; secondary row: safety, popular, bookmarks and profile. Secondary content appears only on demand. Moderator queue is no longer an orphan below the full-width composer, and editing/permissions/limits are unchanged.

## Acceptance checklist
- Run `npm run test:personal`, `npm run test:com`, `npm run build`, and the real Chromium e2e jobs.
- With a verified saved primary chart, compare `/uk/personal` Moon-sign horoscope to its lower natal-orientation card. They must differ in text, advisory and evidence kind.
- With no verified chart, no pretend personal horoscope. Check EN text and all 12 natal-house scenarios in unit tests.
- With real news, forum and community fixture, compare viewport widths 1440, 1024, 375, 320; toolbar buttons should align and not create horizontal overflow. Expand inbox, safety, bookmarks, profile and moderator queue, verify keyboard navigation. Composer remains full width and publishes a topic.
- JQA-3 remaining Lagna/Moon 1-arcsecond cases and exact Vimshottari boundaries remain outside this UX work; no precision thresholds are changed. The editor is deterministic rule-based, NOT yet a multi-stage live LLM writer with grounded claim verification.
