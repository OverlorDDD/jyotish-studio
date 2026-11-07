# Galaxiora — Google Search favicon refresh (2026-11-06)

## Diagnosis
- The only approved brand source is `apps/web/brand-assets/galaxiora-approved-spiral-6.png` (Git blob `c6a467d3ddfd2848181203382f16f60d9030b139`). Never replace it with a letter G or an earlier draft.
- Existing generator `tools/brand-icons-build.mjs` produces PNG 64/128/180/192/512, multi-size ICO and Next `app/icon.png` from this one locked asset at build time.
- Live root and /en HTML was checked on 2026-11-06: HTTP 200, robots index/follow, /favicon.ico and versioned PNGs in head. The HTML alone does not prove which binary Google currently cached.
- The prior Google Brand CI ran only on a retired 2026-11-01 branch; an older "Cosmic G" workflow also listened to an obsolete feature branch.
- Google Search explicitly supports PNG and ICO, recommends a square icon larger than 48px, stable favicon URLs, and crawler access to homepage and icon; the SERP cache may update after days/weeks and no code change guarantees immediate recrawl.

## Change
- Keep the exact approved spiral artwork and build generator.
- Advertise exactly one `rel="icon"` candidate: stable (no query parameters) 64px PNG at `/galaxiora-favicon.png`. Keep `/favicon.ico` and Next's generated `/icon.png` as valid legacy assets, without advertising multiple competing favicon URLs in the HTML head.
- Header logo uses the same stable PNG path.
- Google Brand CI now protects PRs to `main` and relevant pushes. It generates all image variants BEFORE verifying them, then builds.
- The old "Cosmic G" workflow is manual only and renamed to identify approved spiral #6. The release script no longer mentions SVG/G branding.
- E2E verifies ICO includes the same approved 64px PNG frame, and tests reject versioned/legacy branding references.

## Verification
1. On CI, check **Google Brand and Favicon** succeeds on the PR SHA; test `npm run brand:icons:build && npm run test:brand-favicon && npm run test:brand:icons`.
2. Deploy a CI-approved commit onto AWS through the established verified release flow. Never assume a GitHub merge has deployed the server.
3. From the production server, confirm HTTP 200 for `/galaxiora-favicon.png`, `/favicon.ico`, `/icon.png`, `/robots.txt`, `/`, `/en`, `/uk`. Compare downloaded `/galaxiora-favicon.png` and `/icon.png` **byte-for-byte** with the approved PNG source; `/icon.svg` must be 404.
4. Validate HTML on `/`, `/en`, `/uk`: primary `rel=icon` references stable `/galaxiora-favicon.png`, meta robots allows indexing, and `Organization.logo` points to `/galaxiora-logo-128.png`.
5. Use Google Search Console > URL inspection > `https://galaxiora.com/` > Request indexing once after successful production verification. Monitor branded results in the following days/weeks. Do not repeatedly resubmit unchanged URLs. Google controls the search-results favicon cache.

This release is only branding/SEO. No database, astrology calculations, account data, Google OAuth, GA4, environment secrets, or AWS server settings are changed.

## 2026-11-07 SERP cache discrepancy and tightened verification
- User-supplied Google screenshot shows an obsolete blue/gold star and obsolete Ukrainian page title for the hostname, while current production homepage title is the English natal calculator title. This demonstrates a stale indexed presentation; it is **not evidence** that the current icon source still contains the star.
- Google supports only one favicon per hostname and recommends a stable URL. The HTML now explicitly advertises only the user-approved `/galaxiora-favicon.png` candidate. Do not add URL version parameters, switch file names or substitute the retired G/star logo.
- `tools/google-favicon-production-audit.mjs` compares live PNG, ICO and Next /icon.png bytes with the immutable approved asset; checks no old `icon.svg` is linked, checks indexable root title, robots and direct Googlebot-Image access. It reports source-readiness **only**, never claims the Google SERP cache is refreshed.
- Once a deployment has passed this independent production audit, use Google Search Console URL Inspection for `https://galaxiora.com/` and request indexing once. Google-controlled SERP refresh may take days to weeks; no GitHub or AWS release can guarantee instantaneous replacement.
