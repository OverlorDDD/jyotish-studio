# Galaxiora — canonical SEO & audience-growth roadmap (R3–R5)

**Approved strategy recap:** 2026-11-01. **Project:** https://galaxiora.com. **Repository:** https://github.com/OverlorDDD/jyotish-studio. **Languages:** Ukrainian `/uk/` and English `/en/`. **Current execution stage:** R3.1 GOOGLE SUBMISSION CONFIRMED; R3.2 comprehensive technical SEO audit NEXT. R3.1 production code/crawler-wide audit is still not independently certified. **Owner instruction:** Work in large coherent phases, investigate and resolve blockers, resume from the last verified gate on errors, preserve production, give exact owner actions, and report evidence. Do not scatter work into endless microtasks.

## 2026-11-01 owner-verified Google Search Console checkpoint

The owner provided **Google Search Console screenshots** with these trustworthy outcomes:
- Domain property **galaxiora.com** is available to the owner (ownership verified).
- Submitted `https://galaxiora.com/sitemap.xml`, Search Console status **Success** dated 2026-11-01, with **94 discovered URLs**. This is *discovery*, not 94 indexed pages.
- URL Inspection for `https://galaxiora.com/uk` reports **"URL is on Google" / page indexed**, and HTTPS recognized.
- The owner submitted an additional **Request Indexing**; Google accepted the request. No need to repeat this on all pages.
- The owner opened `/robots.txt` and `/sitemap.xml` in their browser and reports both visibly load.
- Search Console performance data are still processing (normal immediately after verification).
- Assistant's external browsing environment could not directly access Galaxiora URLs; do not mistake this for evidence the live site is down or noindexed.

**Next recommended whole phase R3.2**: audit all 94 sitemap URLs (canonical/redirects/noindex/errors/UA-EN), check server-rendered crawlable content especially news and community, validate title/description/hreflang/schema and privacy, measure mobile performance, build minimally invasive fixes and release only after confirming actual deployed SHA. Known code suspect: sitemap lists `/uk|en/astrology`, while `PortalSection.tsx` redirects `astrology` to `astrology/jyotish`. Don't assert production defect without testing; if true, omit redirected URL from sitemap. Watch for published CMS lessons omitted due to `publishedList` being unavailable at sitemap execution. Keep originality and syndicated-news limits.

**Owner action now:** no more DNS/TXT work, no repeated sitemap submissions, no need to request indexing for all 94 URLs. After indexing report populates, owner may provide screenshot from Search Console > Pages and later Performance; for tests requiring AWS shell access, give minimal non-secret read-only commands. **Preserve completed Search Console property**. Resume at R3.2 audit first, only investigate individual R3.1 issues if evidence arises.

## Product and differentiation

Galaxiora is a bilingual astrological and spiritual portal, **not** merely a daily horoscope feed. Value proposition: accurate astronomical calculations + source-grounded Vedic/Jyotish and Western interpretations + practical daily use + community. Existing modules: Swiss Ephemeris/Lahiri Jyotish D1/D9/D10, Vimshottari; Astrological Synthesis Engine (ASE 1–3 branches); natal and personal daily/weekly readings, Western and Vedic horoscopes, global-city Panchanga, 78-card Tarot, Yoga/breathing, original Academy lessons, GalaxiNews RSS aggregator with Azure NMT UK/EN, GalaxiCom forum, Personal dashboard. Preserve the existing calculation engine and privacy boundaries. Site writing voice: warm, confident, concrete practitioner of Jyotish/Tarot/Yoga; no canned hedges or invented promises. Use original, high-quality English translations.

Core audience goals: discover via Google and other search engines, experience valuable free tools, return to a personal dashboard, join community, eventually convert to legitimately available paid services (checkout is a separate launch track). Ukrainian organic segment is the initial attainable niche; English is a parallel long-tail strategy, not an immediate challenge to Astro.com across broad head terms.

## Reality checks / confirmed repository implementation (NOT proof of production status)

Audited branch `fix/mobile-header-account-dialog-20261101` (commit `0cadadd25499e8c081932cf4ead877fb39beef08`). GitHub `main` was old (commit `25002424e5aa33a0a9ed40f3b09cb65d94b9f4fa` from October 22) as of November 1. Other distinct newer branches include `feat/news-bilingual-teasers-20261101`, `feat/astrological-synthesis-engine-v2-v3-20261031`, `fix/news-nmt-backlog-drain-20261101`. **Never overwrite live code with an unverified `main` deployment or merge blindly.** Determine the exact live SHA/branch and integration status first.

Relevant paths:
- `apps/web/lib/site-indexing.ts`: `publicIndexingEnabled()` requires exact `SITE_NOINDEX=0` and a valid `NEXT_PUBLIC_SITE_URL=https://galaxiora.com` (HTTPS, root URL, no port/path); otherwise pages are marked nonindexable.
- `apps/web/app/robots.ts`: preview disallows all; public robots references sitemap and forbids private/API paths.
- `apps/web/app/sitemap.ts`: localized static routes, moon + Western sign guides, built-in and CMS Academy/Yoga lessons; no private pages.
- `apps/web/app/layout.tsx` and localized pages: metadata, robots, hreflang, canonical, OG/Twitter. Root `/` is intentionally noindex while `/uk` and `/en` are canonical.
- `apps/web/lib/seo-structured.ts`: truthful Article JSON-LD on authored lessons; `/uk|en/methodology` describes Swiss/Lahiri/JHora verification.
- `apps/web/middleware.ts`: when `SITE_NOINDEX=1` sends `X-Robots-Tag: noindex, nofollow`; do not confuse deployment build env and runtime.
- `apps/web/app/[locale]/[section]/page.tsx`: public section metadata; NewsWorld/GalaxiCom are client-heavy components. `apps/web/app/[locale]/[section]/topic/[threadId]/page.tsx` has `noindex`.
- Existing checks: `npm run r3:seo:check`, `npm run test:seo`, `npm run test:r2-r3`, `npm run launch:verify`, `npm run site:check`; optional IndexNow: `npm run r3:indexnow` (never submit without proof/config).

At strategy review, live requests for https://galaxiora.com/robots.txt, /sitemap.xml, /uk and /en **could not be independently confirmed from the assistant environment** (connection/resolver/tool limitations possible). This does NOT prove the site is down. Owner previously confirmed site live. Production settings, Google ownership, crawl/index state and exact live SHA are UNVERIFIED. User has said product technical work is finished and wants SEO next; avoid reopening unrelated engineering.

## Execution policy

- User requested **one large step at a time**, a comprehensive plan, blockers resolved before advancing, and explicit stopping/resume point for user-reported errors.
- **No deployment or DNS change without testing the target**, no server secret disclosures, no destructive DB commands, no checkout activation or private data indexing.
- Treat `URL reachable`, `crawlable`, `indexable`, `indexed`, `ranking`, `traffic` as different milestones. No promise of search rank or indexing timing.
- Capture each phase in this document as: stage status, verified evidence, exact PR/commit, owner action required, unresolved blockers, next resumption step.
- Google and Bing property verification depend on user's actual domain control; don't invent DNS TXT records; user supplies actual token and adds it via authoritative DNS provider. Prefer Domain property for `galaxiora.com`.
- Only modify production environment with owner-authorized, tested deployment; never treat CI green or GitHub commit as proof of live deployment.

## R3.1 — FIRST PRACTICAL PHASE: public discoverability, domain property, sitemap

**Complete this as one coherent phase, not dozens of independent tickets.**

**Assistant/developer block:** (a) Identify final production git SHA, branch and deployed env; reconcile newest needed feature branches into a safe release branch without regressing mobile/news/ASE and tests. (b) Audit public URLs on actual host: root vs `/uk`, `/en`, `/uk/horoscope`, `/en/horoscope`, `/uk/astrology/jyotish`, `/uk/panchanga`, `/uk/methodology`, `/uk/learn`, `/uk/news`, `/uk/community`; 200/301/404, HTML robots meta, HTTP X-Robots-Tag, canonical, hreflang, linked content, robots.txt, sitemap.xml. Verify www → apex 301 and HTTP → HTTPS; no parameter duplicates; noindex/private APIs. Fix true blockers, run focused SEO+launch+CI gates and deploy **only** final verified commit. Compare production HTML with expected page markup after deploy. (c) Keep audit evidence, reports and explicit status. If live inaccessible, diagnose DNS vs TLS vs network vs AWS systemd/Caddy first, not an invented SEO fix.

**Owner block:** Visit https://search.google.com/search-console/welcome, select **Domain** property, enter only `galaxiora.com`, copy Google's real TXT verification value, add it as a TXT record at the *authoritative* DNS provider with name `@`/root as the provider requires (do not remove existing A/CNAME/NS, leave DNSSEC intact), then click Verify. Domain property covers http/https and subdomains. DNS record may take time; keep it in place. Once sitemap publicly healthy, in Search Console → Sitemaps submit `sitemap.xml`; inspect and request indexing manually for 3–5 core URLs, not for every page. Send screenshot/status/errors rather than private credentials; TXT values are domain-verification markers, still avoid exposing account keys. Assistant can guide screen-by-screen when necessary.

**Acceptance:** Search Console domain verified; public `robots.txt` and `sitemap.xml` return 200 and expected directives; core pages indexable with correct canonical UK/EN; no private content open; sitemap submitted (processing/acceptance visible); URL Inspection for core URLs shows no technical preventions; all relevant tests and final production SHA recorded. **Index inclusion is NOT required as a same-day gate**; track it afterward.

**External guidance:** https://support.google.com/webmasters/answer/9008080 ; https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap ; https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl

**Known blocker playbook:** GSC "TXT not found" → check correct authoritative DNS zone, record name, value and public DNS lookup; avoid duplicate domain suffix; allow propagation, no unrelated DNS changes. `robots disallow /` or `noindex` → inspect both production env and built frontend, ensure `SITE_NOINDEX=0` and valid HTTPS origin, rebuild/redeploy safely; clear only relevant caches. Sitemap empty/500 → check public gate and upstream CMS fetch; a failing CMS API can silently exclude dynamically published lessons. 403/5xx/SSL → inspect Caddy/AWS service/network and Cloudflare/WAF before assuming search-engine issue. Sitemap lists 404 → verify slug/locale contract and prune invalid dynamic CMS entries. Google `Discovered - currently not indexed` or `Crawled - currently not indexed` → separate indexing pipeline/content quality from technical allowlisting; do not spam submit.

## R3.2 — technical SEO + bilingual site quality

Audit localized title, description, H1, canonical, reciprocal hreflang, structured data appropriate to actual visible content (Organization/WebSite/BreadcrumbList/Article, moderated DiscussionForumPosting later), unique OG cards, accessibility and responsive layout. Test Google-visible server HTML for content-heavy routes; prioritize material SSR where clients currently render empty news/community skeletons, without indexing translated syndicated copies. Test actual mobile Core Web Vitals (good target LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 at 75th percentile) and fix bottlenecks without changing approved style. Sitemap `lastmod` only when truthful; Google ignores `priority` and `changefreq`. Avoid mass auto city pages.

## R3.3 — keyword research & original content

Make separate UK and EN query inventories using Google Trends, Search Console after data accrues, Google Keyword Planner and manual SERP review. Prioritize based on relevance, intent, difficulty and ability to satisfy with an existing live tool. Build distinct hubs:
1. Jyotish/natal chart: ascendant, signs, houses, nakshatras, grahas, D1/D9/D10, dashas, planetary movement; tools linked to explanations and transparent methods.
2. Tarot: deep meanings for 78 cards, upright/reversed interpretation and spread how-tos; publish first the highest-quality/high-priority group, don't mass-generate similar pages.
3. Panchanga/lunar events: tithi, nakshatra, Moon phase, astronomy/cultural observances with location/time grounding.
4. Western/Vedic sign comparisons: enrich existing **24 Moon-sign + 24 Western guide pages across two locales** before adding near duplicates; keep accurate Sun/Moon distinction.
5. 2027 transit/event annual editorial content based on computed verified dates, not recycled generic forecasts.
6. Yoga: interactive box-breathing and guided practices supported by content.

Publish substantial authored content UK with high-quality EN localization, meaningful internal linking and transparent expertise/methodology, no spun SEO text or made-up authors.

## R4.1 — discovery and acquisition

Prioritize organic Google + a Galaxiora Telegram channel + **one** short-video channel (Instagram Reels or YouTube Shorts after testing), then partnerships and legitimate citations/communities. No spam, bulk backlinks, fake testimonials or paid traffic before conversion/retention tracking. Useful video demonstrations of real tools are preferable to generic predictions. Integrate opt-in distribution and attribution links/UTMs.

## R4.2 — retention/product habit

Personal dashboard is return destination: chart-derived daily/weekly cues, Moon/Panchanga, saved Tarot, personal GalaxiNews and GalaxiCom follows. Consider voluntary weekly email/Telegram digest only with explicit consent, unsubscribe and privacy safe content. Add events to a privacy-aware analytics plan (actual chart calculation start/completed, Tarot use, registration, day-7/day-30 return, forum participation). No birth data in analytics.

## R5 — measure, optimize, monetize cautiously

Connect GA4 or privacy-aware equivalent with valid consent handling; GSC/Bing; weekly dashboard tracking indexed core pages, nonbrand impressions/clicks/CTR, organic visits, tool usage, conversions and 7/30-day retention. Working 90-day *hypotheses*, NOT guaranteed: 100% of critical URLs free of technical crawl/index blockers; 20–30 original/meaningfully improved publications; 500–1500 monthly organic visits by period end; 10–20% 7-day new-user return. Re-baseline after real traffic. Launch paid consultation only after separate compliant billing/privacy/licensing gates.

## Competitor positioning / research reference

International: Astro.com (calculation depth), Astro-Seek (free specialized tools), Drik Panchang (local panchanga and festivals), AstroSage (Jyotish ecosystem), Prokerala (horoscope/events), Astrology.com (tarot/horoscopes), CHANI (editorial voice). Ukrainian adjacent: JyotiSoft, Карта Долі, Astrokolo. Differentiate with combination: verified astrological computation, coherent synthesis, two traditions clearly labelled, useful daily workflow, original content, community. Benchmark for product patterns; never copy their content or claim traffic/rank without independent data.

## GalaxiNews special handling

Azure NMT ensures display-language UK/EN for feed items, not automatically original SEO value. Aggregated external article previews link to the publisher; don't mirror/paywall/copy full source body or create a mass of thin indexed pages. Distinguish **original Galaxiora analytical/editorial articles**, with new calculation/context/primary-source citations and honest Article markup, which may be indexable. Respect publisher images and rights. GalaxiCom topic detail currently noindex; only after moderation/security review consider indexing valuable public discussions server-rendered, with owner consent and personal info safeguards.

## Continuation prompt for new project chat

> We are continuing the **Galaxiora** project (https://galaxiora.com; repo OverlorDDD/jyotish-studio). Read `AGENTS.md`, `PROJECT_MAP.yaml`, and `docs/operations/galaxiora-seo-growth-roadmap-2026-11-01.md` before any changes. Current work is **R3.1: production-to-GitHub alignment + crawler readiness + Google Search Console domain verification + sitemap submission**. User prefers large self-contained stages, barrier root-cause resolution, concrete verification and exact owner instructions, and resuming at the failure checkpoint. Do not touch unrelated site modules, calc engine, payments or private data. Before editing, identify live SHA and current SEO state, then implement only needed fixes. Report evidence, branch/PR/commit and which step requires domain owner action.
