# R3.2 — search visibility, brand identity and technical SEO

**Created:** 2026-11-01  
**Source branch:** `fix/mobile-header-account-dialog-20261101` (includes earlier mobile, news NMT, horoscope and ASE work; verified by GitHub comparisons).  
**Work branch:** `fix/r32-search-brand-and-sitemap-20261101`.  
**Status:** CODE IMPLEMENTED; production live baseline audit COMPLETED (94 URLs), CI rolling validation; deployment and post-deploy audit NOT YET VERIFIED.

## Evidence at start

Owner supplied Google Search Console screenshots dated November 1:
- Domain property `galaxiora.com` verified.
- Sitemap `https://galaxiora.com/sitemap.xml` accepted as Success; 94 discovered URLs.
- `https://galaxiora.com/uk` was already in Google index over HTTPS.
- Google AI Overview for branded query `galaxiora` erroneously described it as a generic word or nickname, despite the official website showing as the first organic result. An AI answer is not proof of malware or domain blacklisting. It cannot be manually controlled.
- Assistant requests to public site from web runtime failed; Google screenshots/user confirm public access. **GitHub Actions runner subsequently performed a read-only 94-URL production crawl on November 1.** Production deployment SHA or AWS console access is still not independently established.

### Actual pre-deploy public crawl (GitHub Actions run 41319286232)

Read-only `node tools/r32-seo-audit.mjs` from a GitHub-hosted runner reached the public production website and reported **94 checked, 92 HTTP 200, six error signals, two H1 warnings**. Errors all come from the two already identified redirected aliases and the new About pages not yet deployed:
- `/en/astrology` and `/uk/astrology`: listed in sitemap but return HTTP 307 to `/astrology/jyotish` (4 audit signals).
- `/en/about` and `/uk/about`: required by new release but absent from **old** production sitemap (2 audit signals).
- `/en/tarot` and `/uk/tarot`: initial HTML missing H1 (2 warnings); added original localized H1 in `PortalSection.tsx` to R3.2 branch.
- No additional canonical, hreflang, language, noindex, title or HTTP failures were found in the initial crawl. The audit has since been tightened to check **exact alternate URLs** and meta descriptions, so results from the revised check must still be reviewed.

CI initial production build and SEO checks were successful (run 41319039870). A follow-up browser run detected that a test locator incorrectly matched both a true HEAD canonical and a stale BODY canonical after client navigation; **not an independently verified server HTML problem**. The test was corrected to target `head link[rel=canonical]`. Re-run test + Chromium on the final SHA before deployment.

Synthetic browser performance measurements were added for nine critical routes in desktop/mobile modes, but are **lab** measurements only; do not report them as CrUX 75th-percentile field INP/LCP. Real-world Core Web Vitals data are unverified until available from Search Console/PageSpeed.


## Changes made

1. `apps/web/lib/site-indexing.ts`: remove noncanonical /astrology alias (redirects to /astrology/jyotish) from sitemap paths, add canonical /about.
2. `apps/web/app/sitemap.ts`: only canonical public bilingual routes; remove unreliable `changeFrequency` and `priority`; keep dynamic published Academy/Yoga CMS route support and language alternates. No fake `lastmod`.
3. `apps/web/app/layout.tsx`: provide a stable `WebSite` and `Organization` JSON-LD graph with first-party domain, name and logo, without invented office/address/social media/company claims.
4. `apps/web/app/[locale]/about/page.tsx`: original substantial Ukrainian and English official brand pages with visible module descriptions, privacy-conscious authenticity and source/method links. Dedicated metadata, hreflang and AboutPage.
5. `apps/web/app/components/PortalShell.tsx` and `PortalHome.tsx`: sitewide navigation to About and accessible visible `What is Galaxiora?` homepage description with links to methods and official information.
6. New read-only production `tools/r32-seo-audit.mjs`: audits every sitemap URL for HTTP 200, self-canonical, robots noindex, locale, hreflang, title and public/private boundaries; outputs structured results and fails on blockers.
7. Contract tests `tools/r32-seo.test.mjs`, updated `tools/a4-seo.test.mjs`, browser regression `e2e/r32-seo.spec.mjs`, npm scripts `test:r32:seo`, `r32:seo:audit`; new test included in `test:all` (browser suite discovers new E2E automatically).

## What is verified and not verified

- GitHub file writes / source checks and package.json parsing have been performed.
- V8 syntax parse (without executing network) of `tools/r32-seo-audit.mjs` passed.
- **No** node_modules installation, `npm run build`, actual test suite, deployed mobile Lighthouse runs or production audit have executed in assistant's runtime: direct network access to public domain/GitHub is blocked there.
- A PR is to be reviewed and tested via actual GitHub CI or user's Windows environment. **Do not claim R3.2 complete or production deployed before the final gates pass.**

## Large practical release step, not many small tasks

1. **Identify current production SHA (do not replace with old main):** check live checkout/worktree and current branch on AWS; check `git status --short` for uncommitted production changes. If server is built from an older integration branch, reconcile rather than force checkout.
2. **Run tests:** `npm install`, `npm run test:seo`, `npm run test:r32:seo`, `npm run test:all`, `npm run build` and `npm run test:e2e` with disposable test DB. Existing CI must be green for the actual head. E2E assumes `NEXT_PUBLIC_SITE_URL=https://galaxiora.example` and `SITE_NOINDEX=0` as in CI. Keep private DB/secrets untouched.
3. **Only then deploy** tested code using existing guarded production deployment procedure and confirm live revision. Do not change DNS, site indexing switch, ephemeral preview, payments or database.
4. **Run live audit after deployment from the deployment host or GitHub Actions runner:** set `R32_SITE_ORIGIN=https://galaxiora.com`, run `npm run r32:seo:audit`. Expect all sitemap URLs 200, self-canonical, correct hreflang, noindex absent; new /uk/about /en/about in sitemap; no redirected astrology aliases. If errors, fix *root causes* before declaring acceptance.
5. **Measure performance** (can't be faked): run Google PageSpeed Insights mobile and desktop for /uk, /en, /uk/astrology/jyotish, /uk/horoscope, /uk/panchanga, /uk/news, /uk/community, /uk/about. Capture LCP, INP/field data if available, CLS, mobile layout. Target good Core Web Vitals at p75 where field data exists: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1. Without data, mark unverified.
6. **Search Console:** after actual deploy, inspect and if necessary request fresh crawl of /uk and /uk/about (not all sitemap URLs). Check real Pages/Indexing and structured data. Google AI Overview is independently generated and may remain inaccurate until new crawl and third-party brand corroboration.

**Blocker handling:** If public audit fails because the assistant network cannot resolve Galaxiora, run it on AWS (correct environment) and analyze result; do not diagnose site outage solely from tool failure. If 301 alias remains in sitemap, check deployed version and Next build cache. If /about 404, deployment didn't include release. If CI fails, fix commit and retest before production. If Google AI Overview still invents definitions, improve independently verifiable social/domain references later (R4), never spam fake citations.

## Next after R3.2

R3.3: independently researched UK/EN query targets; content clusters for Jyotish, 78 Tarot card semantics, Panchanga, 2027 events; link each to existing live calculators, prioritize genuinely useful content. R4 acquisition and repeat visits; R5 data-led scaling.
