# Galaxiora — Google Search Console recovery (2026-11-09)

Source: 7 owner-exported GSC Coverage Drilldown ZIP reports, 47 distinct URL examples. The user-facing CSV inventory contains the full URL list and classifications. Google indexing is not guaranteed by changing code.

| GSC classification | Count | Resolution |
|---|---:|---|
| Duplicate with no user-selected canonical | 10 | One old `/en` alias redirects; 9 `?system=...&sign=...` URLs select horoscope UI state. Generate new hash links while accepting old queries. |
| Noindex | 3 | Privacy and terms pages: intentional; keep noindex. |
| Redirect | 3 | `http://` and `www` variants: intentional permanent redirects. |
| 404 | 2 | `/&`, `/$`: no corresponding pages; preserve real 404, not a soft-404 homepage redirect. |
| Discovered, not indexed | 20 | Three `/learn/` legacy URLs redirect to `/pedia/`; link directly to canonical lessons. Seventeen public landing pages require Google crawl and ongoing editorial/internal link review. `1970-01-01` in this export is a sentinel, not real crawl date. |
| Crawled, not indexed | 7 | 4 HTML pages (EN/UK About Me and EN Tarot Hermit/Sun) need prioritization; 3 favicon/OG image URLs are not indexable HTML landings. |
| Google-selected canonical mismatch | 2 | EN and UK natal charts: fix duplicate root `/` canonical (PR #146), keep real localized self-canonical EN/UK, verify Google-selected URL in URL Inspection. |

## Code changes

- Root `/` remains public HTTP 200 for visitors but points its canonical and x-default at `/en/astrology/jyotish`; remove duplicate root `<loc>` from sitemap.
- Sign-guide links use `/[locale]/horoscope#vedic-aries` or `#western-aries` and the horoscope client validates recognized sign slugs; legacy query links keep working.
- Crawlable education links now go directly to `/pedia/...`, with original permanent redirects retained.
- Add `tools/gsc-coverage-recovery.test.mjs` to the `test:r32:seo` suite; preserve legal page noindex and genuine 404 behavior.

## Verification and remaining owner action

1. CI: `npm run test:r32:seo`, build, Playwright navigation, then full GitHub Actions gates. Do not merge if red.
2. Before production deployment verify the *actual running AWS commit* and new natal changes; release only matching reviewed code.
3. After deployment inspect root/EN/UK `<head>` canonical + hreflang, robots, sitemap, deep links and legacy redirect paths.
4. In Search Console URL Inspection for the **two natal URLs**, check **Google-selected canonical** (the ZIP does not reveal it); optionally request indexing of these canonical URLs after live QA.
5. Re-evaluate seventeen not-yet-crawled public pages and four crawled HTML pages; monitor Google's crawl and indexing, do not submit changed URLs indiscriminately. Leave legal noindex, protocol redirects, bogus 404s and static image exclusion alone.

Official references: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls ; https://developers.google.com/search/docs/specialty/international/localized-versions
