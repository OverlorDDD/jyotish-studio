# Galaxiora — GSC indexing and coverage audit (2026-11-16)

## Source of truth and scope
- Owner's GSC Page Indexing screenshots, report updated 2026-11-13: **364 indexed**, **88 excluded** in seven classifications. These totals are not a statement that every excluded URL is broken.
- Connected Windsor.ai Search Console Sitemaps read on 2026-11-16: `https://galaxiora.com/sitemap.xml` reports **754 submitted** with **0 errors and 0 warnings**; `news-sitemap.xml` reports 8 submitted with 0 errors/warnings. Sitemaps metrics cannot substitute for the Page Indexing report or per-URL URL Inspection.
- Read-only live review of robots.txt, sitemap, root, EN/UK natal pages, EN/UK Delhi Panchanga, selected horoscope pages, Tarot Hermit, About Me, privacy, legacy sign query and EN alias: no incorrect canonical or indexing directive observed among these samples. This is **not** an exhaustive validation of all 754.
- Existing recovery PR #146 was merged 2026-11-09 (legacy sign query consolidation, /learn/ links, root canonical). Allow Google reprocessing time; compare URL examples and last crawl dates before additional canonical rewrites.

## Two confirmed monitoring defects corrected in this PR
1. `tools/r32-seo-audit.mjs` stopped with `Audit capped at 500 URLs`; the current public sitemap has 754. Raise the fail-closed bound to 2000, retaining 5-request batches. This only enables a previously intended read-only test, not production writes or indexing requests.
2. `tools/g32-organic-health.mjs` expected /en and /uk to return HTTP 200 and to appear in the sitemap. They now redirect permanently to locale natal canonical routes and intentionally are not sitemap entries. Require permanent redirect (301/308) to the correct destination and check only real 200 pages for canonical/hreflang.

## Google Search Console follow-up (requires URL Inspection / drilldown export)
- **24 Alternate page with proper canonical:** leave as-is if selected canonical is the intended indexable 200 page. Canonical alternative is not intrinsically a bug.
- **9 Duplicate without user-selected canonical:** review exact example URLs and last crawled date against PR #146; if old `?system=...` query variants, confirm new 308/301 routes, do not rewrite the whole site.
- **7 Redirect:** expected for HTTP, www, /en, /uk and legacy lessons if target is correct.
- **5 Excluded by noindex:** verify they are intentionally private/legal; never force-index personal/admin content.
- **2 Not found:** check each exact URL; genuine nonexistent garbage paths should stay 404.
- **27 Crawled, not indexed + 14 Discovered, not indexed:** prioritize useful public pages, internal links and distinctive content; no code change can guarantee Google selection.
- **Selected canonical, last crawl and example URLs** are **not** available through Windsor.ai Search Analytics/Sitemaps fields; the user's GSC interface (or a separately authorized URL Inspection API) is needed to distinguish new problems from historical statuses. Do not claim validation completed in Google Search Console.

## Release criteria
- Run `npm run test:g32:organic`, `npm run test:r32:seo`, then `npm run r32:seo:audit` from CI or trusted network with a timeout sufficient for 754 pages.
- Read the full `r32:seo:audit` report before any production changes; a passing technical crawl is not proof of Google indexing.
- No changes to canonical production metadata, logo assets, private routes, analytics, astronomy, or AWS deployment in this PR.
