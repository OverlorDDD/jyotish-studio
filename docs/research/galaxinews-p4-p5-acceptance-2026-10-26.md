# GalaxiNews Personal Interests — P4/P5 acceptance, 26 October 2026

## Product contract and source hierarchy
- World retains verified headline ranking (no hourly forced rotation) and Latest remains chronologically sorted.
- Personal uses deterministic interests and explicit votes; publisher metadata, not raw article text or Tarot/journal/natal data.
- World/P1/P2 are accepted by user. P4 and P5 aim to complete preferences, controls and safety verification.

## P4.1: explicit negative-feedback similarity
- The dismissed article is always excluded from owner Personal feed.
- Related articles are excluded where they share the same topic and a *specific* additional interest tag (e.g. pranayama or natal charts), OR where two or more meaningful headline words overlap at >=60% of the shorter headline.
- A generic topic overlap such as Tarot, Astrology or Yoga is NOT enough to hide all stories from that category. Other, less-similar topic stories remain eligible, while soft negative signals lower their rank.
- Classification is transparent, deterministic, limited to publisher-derived title/topic/tags; there is no LLM classification of user character. A reaction can be undone and excluded similar articles return automatically. Explicit World/Latest are not globally edited or suppressed.
- Optimization: weakly cached headline tokens and negative votes grouped by topic, so 100s of articles and reactions do not repeatedly tokenize the same strings.

## P4.2: personalization control and historical record
- Additional additive PersonalProfile.newsPersonalizationEnabled boolean, default TRUE for existing accounts, with Prisma migration. Turning it OFF returns diverse World rankings even on personal sort and refuses newly recorded reactions. Existing tags and votes remain available for re-enabling or deletion.
- In-page responsive collapsible "Керування рекомендаціями" in the existing Galaxiora dark-navy/gold visual system. It holds explicit toggle, vote history, undo, export, reset and a short explanation. Avoid creating competing navigation sections or decorative large forms.
- Each history entry lists title/source/original publisher link, vote, timestamp in the API, and undo control. Screen shows first eight records plus "Show more" up to last 1000.
- Guest local mode is not uploaded to an account without explicit consent. A local-clear action removes browser-only reaction signals. Account data never flows into localStorage.
- Export GET /api/v1/news/privacy/export includes explicit news topics, preference toggle and reactions; no birth details, natal chart or private journal content. When volume exceeds 10000 reaction records, response explicitly marks complete:false and total count.
- DELETE /api/v1/news/reactions removes all personal votes. DELETE /api/v1/news/privacy/reset transactionally clears only news reactions/news tags and restores default personalization. Unrelated Personal topics such as Academy, all account and chart data remain unchanged. UI deletion requires explicit confirmation.

## P5: acceptance, security and performance
- Auth: no anonymous server feedback/export/settings; owner-scoped queries and writes; account A vs B isolation; CSRF sameOrigin for all mutations; data validation rejects nonboolean toggles and invalid UUIDs/votes; disabled mode returns 409 on new reaction writes; idempotent repeated writes.
- Ranking: soft negative alone cannot suppress all of Tarot; one close niche or highly similar headline is suppressed; undo restores eligibility; World is unchanged; discovery remains up to one per five when selected interests are narrow; cold start uses World; deterministic tie-breaking.
- Privacy: documented data retention until explicit deletion/account deletion; no passive browsing logs, dwell time, health inference or use of Jyotish birth inputs. DB deletion is cascade on account/article deletion.
- Operational limits: up to 600 published candidate stories and 1000 latest reactions used for current ranking, bounded source diversity and headline token caching. Rates for a single Nest instance are protected by existing in-memory limiter; for *multi-instance production* upgrade this to shared Redis/Postgres before horizontal scale. Do not claim performance SLO without live load evidence.
- Testing: unit tests for similarity and reversibility; Chromium E2E for preferences, opt-out, export, separate accounts, reset preserving Academy; production build, migrations/PostgreSQL, Windows JHora and general browser suite.
- User manual acceptance after local git pull: account login, two close stories and one general story, NO hides close in "Для мене" but not World, undo restores, toggle off/on, export, clear history, reset, check unrelated profile retained.
- External GDELT 429 and sporadic RSS failures remain source-availability issues, independent of Personal P4/P5; publication images need publisher rights and approved metadata.

## Milestones
P1 saved account topics — accepted.
P2 explicit vote persistence — accepted.
P3 baseline Relevance Engine v2 — accepted for initial use, P4 adds similarity discrimination.
P4 privacy/controls/similarity — OWNER ACCEPTED 2026-10-26; in PR #52.
P5 tests/security/quality contract — OWNER ACCEPTED 2026-10-26; baseline GitHub CI 4/4 PASS (run 40342456864, commit 9ee3363). Subsequent Stage 2 code needs its own CI result.
Quality & Discovery Stage 2 — documented in galaxinews-quality-discovery-2026-10-26.md; live publisher rights and performance are independent release gates.
Later optional natal/transit personalization is NOT part of P4/P5 and still requires separate consent and verified astronomical facts.
