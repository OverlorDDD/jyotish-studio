# GalaxiNews 2026-11-01 — real AWS deployment succeeded; bilingual archive still in recovery

## Verified operator incident
The 2026-11-01 11:25 UTC terminal capture shows the NMT deployment switched from 0d39f640 to 5472c064 and printed UPDATE SUCCESS. The live Microsoft Translator bilingual sample translated both formerly BLOCKED Hindi titles and 3 regular English titles into Ukrainian and English. It then passed API canary, private staff route checks, production builds, 116-page Next.js build, public 200 responses and site:check. No failed deployment, Prisma migration or PostgreSQL outage was observed.
Subsequent strict `npm run news:quality:headlines` correctly returned status BLOCKED because 25 UK and 11 EN visible headlines across 175 PUBLISHED stories remained incomplete. Another 41 publisher-grounded teasers were pending; that is separate editorial debt under approved headlines-only mode. Last scan observed 35 sources, 7 errors and 12 cooldown states; 15 were OK, 1 empty. The 12 cooldowns include GDELT group suppression, not necessarily 12 independently broken feeds. Runtime localization reported `processed=6` twice — actual progress, not disabled translation. The external source failures were HTTP 429 (GDELT), HTTP 500 (Elephant Journal), and network fetch failures (Hinduism Today, AstroVed, AstroSage, Yoga Journal and Biddy Tarot). These remote services are not under Galaxiora control.

## Correct root causes
1. `enrichPendingNews()` previously classified articles with valid Ukrainian and native English source titles as still needing translation when optional `titleEn` was null. This caused work-loop churn, unnecessary per-record attempt increases and potential quarantine. Align work selection, success criteria and Azure meter with `publicTitleForLocale`: English native source is a valid fallback; no `titleEn` copy is required.
2. The status BLOCKED is a strict factual launch-quality gate, not an indicator that API or Azure failed. The new report separates true eligible work, cooldown, manual review and ready, plus an actionable next step without silently passing incomplete content.
3. Staff diagnostics now expose the same read-only backlog classification on their **latest 600 sample**. It is labeled as a sample, never misrepresented as total if the article database exceeds 600.
4. RSS/GDELT cooldowns previously lived only in process memory and would reset after a systemd restart. They are now restored from existing `newsSourceScan` history (250 newest audit records) with no schema changes, improving behavior on HTTP 429/500 and network errors after deployment. Upstream feed availability itself is not asserted fixed; only reduced repeat hammering is confirmed.

## Research
- Microsoft Translator service limits: https://learn.microsoft.com/azure/ai-services/translator/service-limits — billed by input characters and target languages; hourly distribution and 429 limits, independent of the project's internal 100,000-character monthly budget.
- Microsoft's F0 pricing: https://azure.microsoft.com/en-us/pricing/details/translator/ — current stated offer includes 2 million free characters/month, but verify actual Azure subscription tier and metrics.
- GDELT DOC community integration: https://github.com/cyanheads/gdelt-mcp-server/blob/main/docs/design.md — documentation reports a 1 request per 5 seconds rate constraint and 429 response; Galaxiora already spaces GDELT requests by 6.5 seconds and adds an hourly circuit on 429. Restoring cooldowns after restarts prevents unnecessary repeats. This third-party guidance is not a provider SLA.

## Verify before deploy
Open GitHub Actions for the full SHA on branch fix/news-nmt-backlog-drain-20261101. Required successful checks include new `tools/news-nmt-backlog.test.mjs`, the complete news suite, astro/backend, builds and browser regressions. Do NOT deploy a red, pending, or different SHA.

## Guarded AWS release
On the existing AWS Ubuntu SSH host (not Windows/Docker), once the full SHA is green:
```bash
cd /opt/galaxiora/app
git fetch origin fix/news-nmt-backlog-drain-20261101
git show FETCH_HEAD:tools/galaxiora-news-backlog-production-update.sh > /tmp/galaxiora-news-backlog-production-update.sh
bash -n /tmp/galaxiora-news-backlog-production-update.sh
bash /tmp/galaxiora-news-backlog-production-update.sh FULL_GREEN_COMMIT_SHA
```
The updater verifies old health, Git ancestry and SEO/security settings, creates previous-SHA/.env recovery, builds API and runs test plus a real short Azure bilingual QA before production cutover, launches isolated API on port 4001 with ingestion and translation off, then builds web, cutovers systemd services and validates public routes. If a check fails, do not force reset or manually delete user data; report the exact STOP stage.

## After deploying (do not mistake a backlog gate for another broken release)
1. Open Admin > GalaxiNews and inspect backlog: `eligible`, `cooldown`, `manualReview`, `missingUk`, `missingEn` (latest 600 only). Successful scheduler `localization: processed=N` shows active gradual repair. A fully localized native-English source should not be translated again.
2. Run `npm run news:quality:headlines` read-only. Until both `missingTitles` and `missingEnglishTitles` reach zero, `status: BLOCKED` and exit 2 are **expected**. Preserve the gate; never change the condition just to see green. Note `sourceDegraded` can be true when externally broken feeds remain.
3. Allow normal scheduled translation cycles to drain eligible records first. Do not run bulk repair concurrently with the running background localization worker. Monitor `npm run news:azure:budget` and real Azure Portal metrics.
4. Once successful live bilingual QA and a database backup are confirmed: `npm run news:localize:requeue` is DRY RUN and does not mutate. Only if manualReview is nonzero and the fixed model sample is satisfactory, `npm run news:localize:requeue -- --apply` resets up to 30 exhausted rows, retaining titles, source URLs, images and reactions. Thereafter let the scheduler retry.
5. If the scheduler is deliberately stopped for a maintenance period, `npm run news:localize:repair` may perform a bounded archive backfill. Avoid competing batch jobs on a live server.
6. Verify `https://galaxiora.com/uk/news` and `/en/news` with independent manual review of Hindi-origin and ordinary titles. The headline-only gate is NOT a claim that full article summaries are bilingual. A failed/missing source description should not be fabricated.
7. Inspect errors per source in admin. HTTP 429 -> honor cooldown; HTTP 500 and fetch failed -> retry with backoff, validate current public publisher endpoints before any feed replacement. Disable a persistently unreachable feed only after operator review. Do not silently add unverified RSS URLs.

## Completion criteria
CI green and pinned AWS rollout healthy; existing data preserved; current published UK and EN article titles all have valid localized public text (or clearly quarantined and hidden pending review under a separately authorized editorial policy), no source numerals lost, 0 ongoing eligible backlog after normal cycles, and external source degradation is tracked without declaring it solved by translation fixes. R3 SEO growth should follow verified quality and source freshness.