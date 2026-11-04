# Galaxiora — GP-SEO-2: Search indexing and acquisition audit
Audit date: 2026-11-04 | production code assessed: `aaba34ed3fe5d68b0d8758b3fb6a1cb17969420a` (owner-confirmed deployment).
Evidence grades: A = direct first-party GSC/GA4 or release log, B = exact versioned GitHub source/CI, C = cited Google technical policy, H = hypothesis requiring further verification.

## Core answer
Google automatically discovers crawlable links and submitted sitemap URLs; Search Console's per-URL Request Indexing is a limited supplementary action, not a required manual workflow or guaranteed inclusion. Google's Indexing API is **not** authorized for astrology/Pedia/news article URLs: it supports qualifying JobPosting and livestream video pages only. The Search Console URL Inspection API can **read** Google's indexed state for an authorized property but cannot request indexing or run a fresh live test. Windsor.ai's currently connected GSC integration exposes search analytics and sitemap metrics, not per-URL URL Inspection status; do not claim that it can.

## Direct evidence
**A. Sitemap:** property `sc-domain:galaxiora.com`, `https://galaxiora.com/sitemap.xml` submitted 2026-11-01 14:36 UTC, last downloaded 2026-11-03 07:49 UTC, reported submitted URL count 116, errors 0, warnings 0. This is **before** GP-SEO-1 live release on 2026-11-04; 116 does not measure the newly released pages. Do not resubmit an unchanged sitemap or equate discovered pages with indexed pages.
**A. Search analytics:** GSC page breakdown 2026-11-01: `/uk` 11 impressions, `/en/astrology` 1; 2026-11-02 `/uk` 11 impressions/1 click, `/en/astrology` 10, several western-sign pages and `/uk/yoga` impressions. A separate day-aggregated connector call returned only 2026-10-31 and 2026-11-01, so daily totals do not reconcile with page reports; do not state global totals or precise organic growth yet. Google did discover/serve some older pages.
**A. GA4:** GA4 property `561822944`, first-party connector 2026-11-03 and 2026-11-04: two direct sessions each day (4 total, 3 engaged), landing paths `/en`, `/en/astrology/jyotish`, `/uk/horoscope`, `/uk/news`. These may be test/owner sessions, not necessarily new users. Consent means GA4 does not capture every traffic source.
**A. Production deploy:** official owner-shared logs show 8/8 Pedia tests, 3/3 A5, 202 Next pages built, 14/14 launch checks, new Pedia topic pages HTTP 200, old Learn URLs HTTP 308, HTTPS 200, final `GALAXIPEDIA_SEO1_PRODUCTION_VERIFIED`. This proves tests and sampled reachability, **not** every sitemap URL and not actual Googlebot indexability.
**B. Code:** sitemap includes 14 new original bilingual guides, 6 bilingual topic hubs, Academy and CMS content; localized content routes expose title, canonical, hreflang, robots flags; CMS hub now creates crawlable HTML links. `SITE_NOINDEX=0` confirmed by deployment mode; root `/robots.txt` produced from indexing policy. The public site is crawlable in principle, subject to actual Googlebot/network observations and page-specific checks.

## Confirmed code-level defects (patch in this PR, not yet production)
1. Legacy alias `/en/astrology` and `/uk/astrology` calls `redirect()` inside `PortalSection`: Next.js emits a temporary redirect rather than permanent consolidation to `/{locale}/astrology/jyotish`. Search Console page data still mentions the old alias. Patch adds `permanentRedirect()` at the route level, with noindex/follow metadata for the alias and explicit E2E assertions. **Not proven** as the cause of all non-indexed Pedia URLs.
2. R4 read-only auditor had outdated path `/uk/learn/nakshatras` expected HTTP 200 even though migrated to permanent 308, and tested anchors using old `learn` name instead of `pedia`. Patch updates both. Without patch, R4 audit can falsely report a broken site.

## Constraints and likely growth bottlenecks
- **H/A** New domain, nearly no attributable organic traffic yet; no verified external referring domains. Lack of independent relevant mentions, search intent match, and brand recognition are plausible limiting factors. Verify backlinks before claiming an absolute number.
- **H/B** Multiple horoscope sign pages are templated; only limited unique details visible in source. Avoid expanding similar day/city/zodiac URLs before editorial review and GSC evidence of demand. Assess whether each page adds distinct interpretive value.
- **H/B** News is an aggregator; published excerpts must remain clearly source-attributed and offer meaningful original value. Do not build SEO strategy on scraped article mirrors.
- **B** Pedia source references and examples exist, but the guide UI does not show a real named subject-matter reviewer or documented factual review date. Strengthen verifiable provenance without inventing an expert identity, credentials or arbitrary dates; distinguish astronomical positions from cultural interpretations.
- **B** No trustworthy `lastmod` in sitemap by design. Not a blocker, but publication timestamps of approved editorial items could support accurate selective `lastmod` once tracked. Never set `lastmod` to current time on every request.
- **Unknown** Google URL Inspection API per-URL coverage state, selected canonical, mobile crawl, last crawl time and referring URLs. Windsor GSC connector doesn't expose these. Requires authorized Google Search Console API read scope or individual GSC screenshots/exports.
- **Unknown** External Googlebot HTTP accessibility, `www`/HTTP redirect policy, host/firewall restrictions, actual Core Web Vitals/PageSpeed and broad backlink profile. Last production test from local HTTPS reverse proxy does not prove these. External web retrieval from this assistant's crawler failed, which is **not itself evidence of Googlebot being blocked**.

## Action plan, evidence first
P0 (now, read-only): On AWS run `npm run r32:seo:audit` after GP-SEO-1, capture summary + specific 200/noindex/canonical/hreflang failures for every live sitemap URL. Run `npm run r4:search:audit` only after deploying its corrected audit source or expect false positives on legacy URLs. Confirm live `/robots.txt`, `/sitemap.xml`, `/en/pedia/topic/panchanga` 200 for a Googlebot-like user agent, external DNS, HTTP and www permanent redirects; verify Search Console Page Indexing report and Manual Actions/Security Issues tabs.
P1 (code): Merge and safely deploy this minimal 308/auditor PR after CI. Do not mutate GSC indexing via fake automated Google Indexing API.
P1 (GSC automation): Authorize a dedicated service account with Search Console's **read** scope and verified ownership (not a user secret uploaded into chat), enable Search Console API, use `urlInspection.index:inspect` to monitor selected live canonical URL states. Preserve 2000 daily per-site inspection quota; store only index coverage status and URL, no birth data. No arbitrary mass request-index API exists.
P1 (authority): Publish 1 link-worthy, independently reproducible same-day three-city Panchanga comparison, invite 5–10 relevant educators/publishers to check it, and produce targeted product demos instead of mass generic SEO posts.
P2 (content quality): Audit templated western horoscopes and GalaxiNews originality, deepen useful answers with original diagrams/examples, sources, scope/methodology and clearly labelled traditional interpretation. No fake human reviewer or unsupported medical/life-outcome promises.
P2 (measurement): GSC compare canonical landing impressions, clicks and coverage by locale for 7/14/28 days; GA4 onsite consented sessions and public tool completions by source, with owner QA excluded when known.
P3 (trust/performance): Run PSI mobile/desktop on home, `/en/pedia`, `/en/panchanga`, `/en/astrology/jyotish`; check LCP/INP/CLS and actual images/assets. Monitor new hostname/favicon name in Google (not controllable on a fixed schedule).

## Definition of done
- Every sitemap URL: 200, HTML, intended robots, self-canonical, EN/UK reciprocal hreflang; any exceptions documented.
- Confirmed 308 on both astrology aliases, and corrected read-only audit no false positives.
- GSC URL Inspection status for all 28 GP-SEO-1 localized guides (and 12 topic URLs) with last crawl and Google selected canonical, or explicit 'permission unavailable'.
- At least one independent relevant external mention and actual referral/organic landing observed, not owner QA.
- Owner's GSC and GA4 counts are reported with provenance, incomplete datasets never silently interpreted as zero.
- Do not claim index success from HTTP 200, sitemap submission, or request indexing.

## Primary official references
- https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl
- https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect
- https://developers.google.com/search/apis/indexing-api/v3/quickstart
- https://developers.google.com/search/docs/essentials/technical
- https://developers.google.com/search/docs/crawling-indexing/troubleshoot-crawling-errors
- https://developers.google.com/search/docs/essentials/spam-policies
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
