# GalaxiNews World — local recovery and source resilience (2026-10-26)

## Interpreting the reported log
- \`GET /uk/news 200\` and \`NestJS API ready\` mean local Next and Nest started. They do **not** prove the running browser is displaying the latest React revision.
- \`news:doctor\` reported unavailable just before the first visible successful \`GET /uk/news 200\`. The earlier doctor was a single five-second \`localhost:3000\` request. On Windows this can fail during compilation or if localhost resolves differently from 127.0.0.1.
- The repair log showed 108 published articles, no untranslated titles, eleven without Ukrainian teasers and ninety-two without publisher images. Missing publisher descriptions, image permission and metadata are separate editorial tasks, not proof of a broken Next deployment.
- GDELT timed out on thirteen sequential queries; older source registry contained confirmed HTTP 404 feeds. A 15-minute job should NEVER mean that exactly one news item must be added.

## Corrections
- \`news:doctor\` checks \`127.0.0.1:3000/uk/news\` first, falls back to \`localhost\`, gives actual connection/HTTP errors, and distinguishes a reachable old UI from an unreachable Next process. It also prints the **local Git branch and SHA**.
- \`npm run dev:full\` now fails fast if old processes already occupy ports 3000 or 4000. It never kills processes or database containers automatically. Check conflicting Windows PID with \`Get-NetTCPConnection -LocalPort 3000,4000\`.
- Replaced two confirmed 404 RSS paths with publisher listed \`horoscope.astrosage.com/feed\` and \`astroved.com/blogs/feed\` candidate endpoints; removed several repeatedly confirmed 404 candidates. The new URLs can still fail from a specific user's network; no feed is guaranteed until recorded as \`ok\` in NewsSourceScan.
- A retry policy pauses a 404 candidate for one day, HTTP 500 for 45 minutes, and network timeouts (starting at 30 minutes) with increasing cooldown. The per-service GDELT circuit breaker pauses the remaining GDELT queries in that cycle after a connectivity/rate-limit problem; it does not block other RSS sources. Paused attempts are recorded as cooldown, not misreported as articles added or successful fetches.
- GDELT requests use documented DOC 2.0 article-list mode, with bounded results, narrower search intervals and a 14-second timeout instead of repeated 9-second timeouts. This reduces load but does not guarantee external server reachability. Caching/deduplication remains on.
- All error counts and source identities remain visible to admin at /api/v1/news/admin/health. Never fabricate stories when a publisher is unreachable.

## Safe local commands
In the first PowerShell window, stop the previous site using Ctrl+C. Verify there is no stale process listening on ports 3000/4000:
\`Get-NetTCPConnection -State Listen -LocalPort 3000,4000 -ErrorAction SilentlyContinue | Select-Object LocalPort,OwningProcess\`

From \`C:\Users\Note\jyotish-studio-git\`:
\`git status --short\`
\`git switch fix/jqa3-windows-and-llm-recovery\`
\`git pull --ff-only origin fix/jqa3-windows-and-llm-recovery\`
\`npm run dev:full\`

When the terminal shows frontend ready and \`GET /uk/news 200\`, in a second PowerShell run \`npm run news:doctor\`; it should report \`CURRENT v1.5 (tabs search)\` and show its local Git SHA. Do not use the pre-start result to infer which frontend is running. Hard-refresh /uk/news with Ctrl+Shift+R.

## Open requirements
Live verification of at least one success from AstroSage/AstroVed replacement feeds, successful GDELT after cooldown, meaningful publisher images and source-descriptions remain dependent on the external providers and explicit syndication rights. If GDELT remains blocked in the user's ISP/network, a separately sourced licensed news index will be needed; do not bypass publisher access restrictions or create synthetic headlines.

References: https://www.astrosage.com/rssfeeds/feed.asp ; https://www.astroved.com/corporate-info/rss-feed ; https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
