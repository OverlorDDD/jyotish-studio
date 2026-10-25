# GalaxiNews World — first stage, 2026-10-25

## Goal and scope
Guest-accessible bilingual news discovery, NOT horoscope prediction or user profiling. Astronomy has its own category and never silently masquerades as astrology. NASA and scientific websites are not main astrology content sources. Exact source URLs and publication timestamps are attributed; full third-party article texts, images, and translations are NOT copied or generated. This is a source-linked *discovery* service, not a licensed syndication service.

## Implementation
- \`NewsWorld\` and module CSS render source-linked cards, topic cloud, Highlights/Latest/For me and inline feedback every fifth card.
- Preferences and yes/no feedback are **browser-local only** in this phase; they are not uploaded, do not use chart, journal, Tarot questions or user account. Later phases may add explicit opt-in account sync.
- \`NewsController\` serves public \`/api/v1/news/feed\` and \`/topics\`, owner-protected admin status moderation and health.
- \`NewsIngestionService\`: documented 15-minute in-process scheduler with exclusive PostgreSQL lease, capped RSS and GDELT DOC 2.0 queries, conservative 5.2s GDELT pacing, 10-second fetch deadlines, no following redirects; per-run errors recorded.
- \`NewsArticle\` metadata persisted with canonical URL hash and strict topic matching; article bodies and unlicensed imagery are never stored.
- The RSS addresses are **candidate adapters**, not a claim of proven live access. Some publishers block automated clients; failed sources are logged and do not generate fabricated content.
- Initial publication availability depends on network access, source terms and ingestion being enabled. No fabricated seed stories.

## Operation and acceptance
- Application process must stay online to check every 15 minutes. In production use a persistent process/scheduler; a GitHub scheduled workflow alone is not a reliable clock.
- Enable with \`NEWS_INGESTION_ENABLED=1\` (opt-in). If not set, existing stored articles still serve; CI runs without outbound news retrieval.
- Run \`npm run db:generate && npm run db:migrate && npm run dev:full\`, then observe \`/uk/news\`. First scan begins after 15 seconds when enabled.
- If the feed is empty, check the admin-only \`/api/v1/news/admin/health\` and network access; never claim a live source is ready merely because CI is green.
- Acceptance: API filters/status/auth; real RSS/GDELT data when reachable, no repeats by canonical URL, empty fallback; UA/EN; responsive/guest/browser-local tag storage; no horoscope-derived ranking yet.
- Limitations: no semantic cross-publisher story clustering, no per-source verified syndication licences, no cross-language article translation, no server-side user preference persistence. These require later stages.

## Sources consulted
- GDELT DOC API: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
- Astrodienst Astro Moment: https://www.astro.com/feed/feed_e.htm
- Astrology.com feeds: https://www.astrology.com/rss.html
