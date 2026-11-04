# GalaxiNews Quality & Discovery — Stage 2, 26 October 2026

## Product decision
Owner ACCEPTED Personal Interests P4/P5 on 26 October. The acceptance is functional/visual; final live publisher/rights review remains a separate public-launch gate. Work stays on PR #52. Full high-precision JQA-3 is NOT_CERTIFIED.

## New implementation
1. Presentation-only event grouping in apps/api/src/news-quality.ts. Preserve ALL original NewsArticle DB rows, IDs, URLs, moderation, publisher provenance and owner-specific reactions. Collapse highly similar articles from multiple publishers on the World, Latest, and Personal results after ranking and before pagination; do not replace the World leader randomly.
2. Conservative matching: topic equal, date within 72 hours, four meaningful shared headline tokens, at least 75% of shorter and 50% of union; contradictory months/numbers explicitly guard against merging different events. Across languages compare translated UA title when available; do not invent cross-lingual equivalence. Rank and Latest chronological order preserved by keeping the first representative.
3. Authenticated ADMIN /api/v1/news/admin/health returns a bounded sample quality census: 600 latest publisher records, number of collapsed presentations, represented publishers/topics, last-48h articles, missing localized titles, missing grounded previews, image availability, GDELT observed timestamps. Counts are diagnostics, not an editorial quality certificate.
4. An RSS thumbnail is NOT publisher copyright permission: image display now requires explicit compatible license metadata or exact approved host in NEWS_IMAGE_ALLOWED_HOSTS. If unsure show original Galaxiora fallback art.
5. npm run test:news adds event tests for related/different stories, multilingual text, months, freshness, empty sample; old RSS license assumption adjusted. No schema changes, no user tracking, no new AI costs.

## Operations / honest limitations
- Real source quality depends on RSS availability and GDELT 403/429 and cooldowns. A 15-minute scan does not promise new stories every time; the API process must stay online.
- Source/metadata and image licences require case-by-case approval. RSS description and linked thumbnails are not automatically sublicensed for commercial reuse.
- This is deterministic lexical clustering, not semantic fact verification. False-negative duplicates can remain; false-positive grouping is limited by conservative gates. Raw source rows remain available for editorial review.
- Counts are not proof of 30+ articles / 8+ active publishers / 5+ categories or performance p95; verify these on live host with production-like network/data.
- Current single-process rate limits require shared storage before horizontal scale. Exact JHora longitudes/dasha calendar remain outside this feature.

## Regression and acceptance
npm run test:news; npm run test:all; npm run build; npm run test:integration; npm run test:e2e where appropriate; Windows JHora, Chromium, PostgreSQL CI.
Manually: global World lead stable, Latest chronological, For Me preference/negative suppression, two sources repeating an article show one card, unrelated stories remain, pagination, admin quality diagnostics, no unapproved third-party thumbnails, mobile and UA/EN.
GitHub PR #52 remains Draft until integration dependencies and release blockers are resolved.
