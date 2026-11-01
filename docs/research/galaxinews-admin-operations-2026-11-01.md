# Galaxiora — GalaxiNews freshness incident + Admin Operations upgrade
Date: 2026-11-01. Branch: fix/news-freshness-admin-ops-20261101.

## Evidence and preliminary diagnosis
- Production status API could not be read externally from this investigation. Actual AWS .env and journalctl are not accessible over GitHub. The user's two-day stale feed is reported, not independently verified with database evidence. The definitive blocker MUST be verified using the SSH checklist below.
- Code inspection: newsIngestionEnabled previously returned false in NODE_ENV=production unless NEWS_INGESTION_ENABLED=1. As a result a missing flag prevented onModuleInit from scheduling any scan. The updated policy enables production service by default, but explicit NEWS_INGESTION_ENABLED=0 still shuts it off (maintenance), as do CI/test runs.
- News admin overview was loaded once on mount and had no freshness timestamp or auto-refresh. Manual news refresh returned requested:true without checking if a local cycle was already running. UI labeled an AI editor even though production news translation uses NMT, and it conflated last scan with latest accepted article.
- News editorial processing still requires the independently approved NMT configuration (NEWS_TRANSLATION_CONTENT_SCOPE=headlines and NEWS_TRANSLATION_HEADLINES_APPROVED=1, or full scope with NEWS_TRANSLATION_QUALITY_APPROVED=1). This is not automatically bypassed. Translation readiness and reason are exposed in admin diagnostics.
- News source failures, GDELT rate-limits, 404/403 responses, source blocks, duplicate-only scans and DB leases are distinct failure modes. They are now visible rather than reported as generic absence of news.

## Delivered changes
1. Production-safe ingestion schedule: explicit off remains possible; default production service starts the 15-min cycle and 15-second initial scan, logging its activation.
2. Persisted health: compare last NewsScan.createdAt and newest **discoveredAt** of a published NewsArticle (not its possibly historical publisher date). Distinguish disabled, never scanned, scan stale (45m), feed stale (36h), degraded source failures and healthy; report last publisher timestamp separately.
3. Staff-only operations: process-local scheduler started, next scheduled cycle, scan running, last started/finished, last error, lease/local skip, translation reason, translation approval and pending titles; never expose provider keys or user PII.
4. Manual refresh returns requested:false when local job is running; UI does not claim the scan finished. Lease conflicts are reported as status after an attempt.
5. Admin overview: no-store JSON, server 'as of' clock, manual refresh plus 60s in visible browser, seven-day new users/charts/orders, actual editorial statuses; retain reported-only AI tokens and never invent spending.
6. News admin diagnostics auto-refresh every 45s with actionable blocker text, NMT readiness instead of AI claims, source-level rejection reasons, source moderation, and a one-click backfill.
7. No DB migrations or LLM calls added. User auth + same origin remain enforced for mutations. Other site data and unrelated AI functions stay intact.

## Competitor research — features worth adopting
- Strapi CMS admin home supports customizable overview widgets and editorial lifecycle; Releases identifies Ready/Blocked and schedules coordinated publication: https://docs.strapi.io/cms/features/admin-panel and https://docs.strapi.io/cms/features/releases . Galaxiora uses status KPIs and makes publication blockers explicit, without copying a paid Releases feature.
- Ghost offers article performance and scheduled publishing with a timezone: https://ghost.org/help/post-analytics/ and https://ghost.org/help/publishing-content/ . Galaxiora has no real per-post event analytics yet, so inventing visitor counts is forbidden; add only real activity numbers now.
- Directus supports auditable activity with filters: https://directus.com/features/activity-log and https://directus.com/docs/guides/auth/accountability . Galaxiora already has role-change history; preserve it and expose operational source history and scan failures for responsible troubleshooting.
- Do not store or expose user conversations, private natal charts or contact data in operational dashboard metrics.

## Verification in GitHub / local
Check the latest run of Galaxiora release safety gate for fix/news-freshness-admin-ops-20261101. It runs real Swiss/horoscope tests, news tests, operational health policy, auth, release, npm build and desktop/mobile browser regressions.
Optional on Windows with Docker Desktop: git fetch origin; git switch fix/news-freshness-admin-ops-20261101; git pull --ff-only; npm install; npm run db:generate; node --test tools/news-operational.test.mjs; npm run test:news; npm run build.

## Production recovery (AWS Ubuntu systemd, NOT Windows Docker)
First read the running instance state and check critical flags WITHOUT printing values for credentials:
```bash
cd /opt/galaxiora/app
systemctl status galaxiora-api.service galaxiora-web.service caddy.service --no-pager
sudo journalctl -u galaxiora-api.service --since '48 hours ago' --no-pager | grep -Ei '\[news\]|ingestion|translation|lease|prisma|error' | tail -100
grep -E '^(NEWS_INGESTION_ENABLED|NEWS_TRANSLATION_ENABLED|NEWS_TRANSLATION_CONTENT_SCOPE|NEWS_TRANSLATION_HEADLINES_APPROVED|NEWS_TRANSLATION_QUALITY_APPROVED)=' .env || true
curl -fsS http://127.0.0.1:4000/api/v1/news/status
git rev-parse HEAD
```
If NEWS_INGESTION_ENABLED=0, this is an explicit production stop. Review maintenance policy, set to 1 using the normal secure environment procedure and restart only the API. Never echo credentials. If no flag exists, the new build enables ingestion by default. If a scan is recent but there is no new article, inspect source rows, GDELT cooldown and reject counters in staff dashboard, not Docker.

Deploy ONLY the exact 40-character SHA of a green CI run. From authenticated SSH:
```bash
cd /opt/galaxiora/app
git fetch origin fix/news-freshness-admin-ops-20261101
git show FETCH_HEAD:tools/galaxiora-news-admin-production-update.sh > /tmp/galaxiora-news-admin-production-update.sh
bash -n /tmp/galaxiora-news-admin-production-update.sh
bash /tmp/galaxiora-news-admin-production-update.sh EXACT_CI_GREEN_COMMIT_SHA
```
This script preserves prior SHA/.env, checks Git ancestry and service health, canary builds API with ingestion explicitly OFF on port 4001 (no duplicate scheduled workers), verifies public news freshness schema and unauthenticated 401 for staff routes, then cuts over and checks web/api routes. On failure, restores prior SHA and rebuilds. No migrations, resets or key changes. If ancestry is incompatible, STOP rather than forced checkout or reset.

After deployment, open /uk/news, /en/news, and /uk/personal admin tab as ADMIN. Confirm scheduler starts, first scan completes, source errors and article discovery move independently, last new article timestamp changes if a legitimate article is accepted, and that no automatic synthetic stories are fabricated to fake freshness. If scan still stale after 30-45m, capture journal tail and health JSON (no cookies). The automated CI cannot certify live article arrival without live AWS connectivity.