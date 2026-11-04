# GROWTH-3.2 Organic Acquisition Engine — G3.2.1 + G3.2.2 + G3.2.3
**2026-11-04 | Implemented on a separate GitHub branch; not released to AWS and no content automatically published.**

## Decisions
No paid ads, video obligations, paid AI generation or link farms. Preserve approved GalaxiPedia, logo #6, Swiss Ephemeris calculations, existing canonicals, GA4 consent and user privacy. Use organic, topic-specific real tool entrypoints; original readable bilingual explanations connecting users to vetted reference guides.

## Existing verified baseline
- Current canonical main before this branch: 2ebd254d877e0369afe5c26a96271b0ff7ccd3e0 (approved GalaxiPedia PR #111 + #112 + #117). The owner's AWS read-only check earlier returned deployed SHA 72e4b61380693bdd29c8cad1ba57b740af76e8d9 with a tracked generated Next file and untracked production artifacts. **No production file was changed by this feature branch.**
- 17 curated GalaxiPedia guides already exist with 14 original search-intent guides; no duplicate pages are needed. Existing sitemap.ts lists Pedia categories and articles with EN/UK hreflang.
- Earlier first-party GA4/GSC sample is tiny and may include owner QA. No independent user or first organic conversion is certified here.
- Some GSC query values are suppressed/anonymized, and GSC Search Analytics API prioritizes top rows, not a complete census.

## G3.2.1 — daily read-only SEO Health
`npm run test:g32:organic`, `npm run g32:organic:health`.

- Exactly 12 public GETs: robots, sitemap, both locale homepages, three bilingual tool landings, two Pedia hubs and two original article landings. Remote host is hard-pinned to https://galaxiora.com; only localhost/127.0.0.1 HTTP may be used in CI. No redirects followed or cookies submitted.
- Fails on missing canonical, reciprocal hreflang, wrong HTML language, noindex, missing H1/title, missing approved guide links, forbidden private sitemap entries and reachability failures.
- Exposes precise failure codes. Does **not** claim real Google indexing, CrUX field performance or independent visitor counts. Those remain unknown unless directly checked via GSC/CrUX.
- Existing `tools/r32-seo-audit.mjs` already crawls the whole sitemap; this smaller targeted daily monitor complements it. Avoid daily high-load full crawling.

## G3.2.2 — Search Intelligence
`npm run g32:organic:search` (unconfigured access reports UNKNOWN) or
`node --experimental-strip-types tools/g32-search-intelligence.mjs --csv path/to/owner-export.csv`.

- Uses **Google's official read-only Search Analytics API** if `GSC_SERVICE_ACCOUNT_JSON` is configured as an encrypted GitHub Actions repository secret and that service account has access to domain property `sc-domain:galaxiora.com`. This is OPTIONAL: there is no automatic access claim.
- Request is restricted to finalized web search rows grouped by query and page, a fixed property, a safe 10-day window ending 4 days back, and maximum 5000 rows. Data is not exhaustive.
- Query text and personal IDs never enter output artifacts; only aggregate counts for three pre-approved intents (Jyotish, Panchanga, Tarot), known canonical pages and known curated guide routes are emitted. Unknown/unsafe URLs discarded.
- Fewer than 50 observed impressions: explicit `insufficient_sample_keep_current_page`. Unknown is not reported as 0. No click-through-rate optimization or automatic publication from tiny samples.
- Credentials not configured → `GSC_API_not_configured`, all measures unknown and the report includes setup blocker.
- GSC exports can be analyzed locally without any new subscription. Do not commit raw exports, credentials or raw queries to GitHub.

### Optional secure integration
1. Use an existing Google Cloud project with **Search Console API enabled**, make/choose a dedicated service account with Search Console read-only property permission, not a general editor account.
2. Give it access to the verified Search Console domain property. Do not paste the private key in chat.
3. Add the full service-account JSON as the **GitHub Actions secret** `GSC_SERVICE_ACCOUNT_JSON` only after owner/security approval. Alternatively run the local CSV report without secret.
4. GitHub Actions daily scheduled run (after merge to main) emits `artifacts/search.json`. Verify that no raw search phrases or keys occur in the artifact. Do not infer indexing from Search Analytics.

## G3.2.3 — original Content Engine, no page factory
`npm run g32:organic:content`.

- Three updated live-intent templates (two locales): `/en|uk/astrology/jyotish`, `/en|uk/panchanga`, and `/en|uk/tarot`. Original practical steps, two deep links to existing verified GalaxiPedia/Tarot pages, explicit Tarot sign-in requirements.
- Shared `apps/web/lib/organic-intents.ts` is the curated source of intent and bilingual content, consumed by UI and optional GSC analysis. This keeps actual product content and search opportunity taxonomy aligned.
- Read-only content plan checks that guides already exist and refuses to create new indexable pages. Later topics need explicit distinctive value, references, calculation QA, full EN/UK copy and editorial approval. No fabricated `lastmod` or page dates.

## Automated workflow
`.github/workflows/g32-organic-engine.yml`:
- On PR: local health/search/content tests, existing GalaxiPedia + direct-intent SEO regressions, full production build in disposable CI.
- Once merged to main: daily at 04:31 UTC + manual dispatch. GET-only health and optional GSC report; artifacts retained 14 days. No external submissions, no IndexNow calls, no production deploy, no LLM or ad spend. Actual **automatic reporting is not active until merge**.
- A failed health check is a real technical QA alert, NOT a statement that Google deindexed the site. Run `r32:seo:audit` and Search Console URL Inspection for root cause.

## Acceptance and scope
- Required: all three topic bridges render in EN/UK, guide URLs exist, no blocked canonical, fail-closed read-only audit, privacy-safe low-volume GSC report, full CI build green.
- AWS deployment requires separate guarded release pinned to an approved merged SHA. With owner's dirty/untracked files, NEVER `git reset --hard`, `git clean` or blindly checkout. Back up and verify SHA ancestry, icon #6, existing GalaxiPedia and post-release GA4. Do not change server in this PR.
- NOT shipped: automatic content publication, Google indexing, paid marketing, first independent users, connected GSC secret, AWS deployment or real Search Console URL Inspection. These need explicit subsequent evidence.

## Sources
- Google Search Console Search Analytics API: https://developers.google.com/webmaster-tools/v1/searchanalytics/query
- Google Search Console prerequisites: https://developers.google.com/webmaster-tools/v1/prereqs
- Google people-first content: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google spam policies (scaled content abuse): https://developers.google.com/search/docs/essentials/spam-policies
- Google crawling: https://developers.google.com/search/docs/crawling-indexing/troubleshoot-crawling-errors
- Bing Webmaster Guidelines: https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a
- Bing IndexNow: https://www.bing.com/indexnow/getstarted
