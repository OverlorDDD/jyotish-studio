# GalaxiNews World v1.1 — scope, operation, licensing and acceptance (2026-10-25)

## Why v1.1
The user's World feed showed about two articles from The Astrology Podcast. v1 had only three RSS candidates and five GDELT queries, headline-only classification and no per-source rejection counters. A passing CI did not prove an active, diverse feed. Stage v1.1 fixes the diagnostic and ingestion architecture; actual source coverage must still be measured on the user's running backend.

## Implemented
- Registry: 25 individually named RSS *candidates*, nine narrow GDELT queries. Do not claim candidate URLs are live until logged as successful. Failed feeds never generate fake articles. Astronomy never backfills the main spiritual/astrology categories by analogy.
- Initial backfill: the first scan with new NewsSourceScan records searches GDELT two months back (150 max/query); subsequent scans search seven days (60 max/query). Admin can explicitly request backfill again.
- Source audit table records each source's candidate count, newly inserted, rejected (per reason), duplicates, errors, status and duration. Last 120 attempts exposed only to ADMIN.
- Rankings prioritize relevant recency, source-description context, and diversify the top feed with at most three entries per publisher before overflow.
- Metadata: original URL, publisher, title, category, date provenance; GDELT seendate displayed as **observed**, not verified publication time.
- One paragraph per article: a short, sanitized, source-attributed RSS description is displayed ONLY for explicitly permitted preview sources. Otherwise a UA/EN headline-grounded paragraph clearly labeled as such; it never asserts facts absent from the publisher metadata. Original story content remains on publisher site, no third-party images.
- Public endpoints: /api/v1/news/feed (sort=relevance|latest, category and tag filters), /topics, /status; admin endpoints: /admin/health, /admin/refresh?backfill=true, /admin/:id/status. Admin writes require session/role + same-origin.
- Public browser refresh every 15 minutes only while tab is visible plus manual refresh. Topic cloud and yes/no votes remain browser-local (Personal Interests phase to follow).
- Schema changed additively, with no existing natal, Tarot, user or Personal data migrated/destructively updated.

## Running it
In repository root, pull branch, start Docker database, run npm install, npm run db:generate, npm run db:migrate, set NEWS_INGESTION_ENABLED=1 and npm run dev:full. First scan starts shortly after API startup. After updating existing v1 database, missing NewsSourceScan records cause v1.1 automatic backfill once. If the older process still has the lease, wait until its expiry or restart the server once. Admin may request a fresh backfill from POST /api/v1/news/admin/refresh?backfill=true; inspect status with GET /api/v1/news/admin/health.

## Important limitations
- **No guarantee** of thirty articles / eight publishers / five categories until real scans establish it. All RSS addresses are candidates; some fail due to blocking, rate limits or changed URLs.
- GDELT does not supply article-level paragraphs in the DOC article-list results. Its fallback previews explain the headline topic and explicitly mark the lack of article-derived description. A stronger original synopsis requires licensed excerpts or a permitted first-party summary service; never invent article claims.
- RSS feed descriptions are not automatically public-domain; per-source excerpt rights require editorial review and must be disabled if terms prohibit republication. The current allowSnippet whitelist is limited to The Astrology Podcast RSS as a provisional configuration pending actual rights review.
- No publisher HTML scraping, unlicensed photos, article-body ingestion, natural-language UA translation of source excerpts, near-duplicate semantic clustering or account sync. Those need dedicated permissions/QA.
- Scheduler runs in the API process, not in a sleeping free host. Continuous 15-minute behavior requires an always-running backend. Backend scan cadence does not imply new articles every 15 minutes.

## Acceptance checks
- npm run test:news, npm run test:all, npm run build, npm run test:swagger, DB migration/integration, desktop/mobile Chromium E2E.
- Live: inspect ADMIN source breakdown; resolve 403/429, empty feeds, topical false exclusions. Target >=30 relevant materials, >=8 independent working publishers and >=5 active topical categories before declaring content quality PASS.
- Copyright/terms: no source excerpt published without clearance; remove excerpt flag when unverified.
- Browser: each card has a paragraph and a provenance distinction; accurate observed/published time; feedback and filters work without account; changing categories reloads correctly.

## Editorial image / translation follow-up
Image candidates are extracted only from RSS metadata; display requires CC0/CC-BY rights in item metadata or a publisher host explicitly approved via NEWS_IMAGE_ALLOWED_HOSTS (comma-separated *exact* hosts, only after permission review). Broken images fall back to native Galaxiora covers. NEWS_EDITORIAL_AI_ENABLED=0 disables model editorial; with an available GROQ_API_KEY/GEMINI_API_KEY/OPENROUTER_API_KEY, the metadata-only batch translator handles up to 12 unlocalized records per scan. This is a controlled *translation*, never a license to republish full articles. Generic legacy title-context boilerplate is removed via migration; no sourced facts means no fabricated paragraph.


## World v1.2 editorial polish
- Generic text such as "Це орієнтир за назвою матеріалу" and under-card "Орієнтир за заголовком" are retired. Additive migration clears v1.1 template copy in stored records; frontend also refuses to render old template strings.
- Editorial worker in apps/api/src/news-editorial.ts: factual metadata only (title plus bounded RSS description); bounded at most 12 records / scan (six per AI batch). It translates titles into Ukrainian, creates distinct Ukrainian/English micro-summaries only if source data supports factual content. No AI key or ungrounded RSS/GDELT title -> keep original title, no fabricated teaser. NEWS_EDITORIAL_AI_ENABLED=0 can explicitly disable. Providers reuse existing GROQ_API_KEY, GEMINI_API_KEY or OPENROUTER_API_KEY, and do not receive birth data, user profiles or article bodies.
- For article metadata from RSS media:thumbnail / media:content / image enclosure, display is gated on explicit CC0/CC-BY-compatible metadata OR a specifically approved exact host in NEWS_IMAGE_ALLOWED_HOSTS. Do not set that environment variable without publisher permission. Hotlinking is not by itself copyright clearance. Credit caption is visible; failed images use Galaxiora's ornamental thumbnail.
- Publisher summary/derived teaser is not invented from article headlines. The first priority is an informative glimpse; when there are no underlying details we intentionally show the headline and original source, rather than a robotic fake paragraph.
- A new additive Prisma migration 20261025210000_galaxinews_editorial_images introduces titleUk, feedDescription, imageUrl, imageCredit. Existing accounts and charts are not migrated.
- Editorial design cues: Flipboard Editions uses supplied headline/image/excerpt metadata; Google News guidance favors relevant thumbnail by title, accurate snippet and visibly attributed source. See https://flipboard.team/read and https://support.google.com/news/publisher-center/answer/9607104.
- Acceptance requires a real production provider call and publisher permission check for images; CI only verifies deterministic fake-provider output, sanitized RSS, frontend rendering, fallback, UA/EN, desktop/mobile, build and PostgreSQL.
