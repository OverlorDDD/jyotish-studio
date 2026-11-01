# Galaxiora R3.3 — authority library release candidate (2026-11-01)

## Evidence and current verified production

- Repository: `OverlorDDD/jyotish-studio`; production: `https://galaxiora.com`, AWS Ubuntu EC2 path `/opt/galaxiora/app`, Next.js + NestJS + PostgreSQL systemd.
- **Last owner-confirmed production SHA:** `56d056e4794e141b5eeeae042226937df837ca0d`. `galaxiora-web` and `galaxiora-api` active. `npm run site:check` PASS, `npm run launch:verify` 14/14 PASS, `npm run r32:seo:audit`: **94 URL / 94 HTTP 200 / 0 errors / 0 warnings**, `R33_VERIFIED_SUCCESS` printed.
- R3.1 Google Search Console Domain property verified, 94 sitemap URLs discovered, /uk indexed, no invented indexing claims.
- Earlier implemented R3.3 Jyotish and Panchanga original SSR explanations are **live** at that SHA. The current phase adds Tarot and 2027 content **not yet deployed**.
- Before declaring this phase complete, next chat must compare live SHA with release branch and run production smoke + sitemap crawl *after* deployment.

## Editorial / SERP findings (first-party and research, no invented ranking volumes)

Competitive patterns: Astro.com and Astro-Seek win with reliable specialist tools; Drik Panchang with locality-specific astronomy/ritual calendars; Labyrinthos and Biddy Tarot with searchable individual-card meaning pages; astrology/2027 competitors with annual event guides. Galaxiora's differentiated offer is verified positions + rooted traditional interpretation + accessible interactive free tools + original bilingual educational content. Our moat is calculator-backed explanation, **not** bulk AI text.

Primary sources:
- Google Search Central people-first content: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google scaled-content spam policy: https://developers.google.com/search/docs/essentials/spam-policies
- Google breadcrumb schema: https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
- Google Article schema: https://developers.google.com/search/docs/appearance/structured-data/article
- Google Discover image guidance: https://developers.google.com/search/docs/appearance/google-discover (future only: no fictional 1200px hero added)
- NASA GSFC eclipse 2027: https://eclipse.gsfc.nasa.gov/OH/OH2027.html
- NASA Science 2027 solar/lunar visibility: https://science.nasa.gov/eclipses/future-eclipses/

**SEO guards adopted:** 8 substantial and individually distinct Tarot Major Arcana pages, **NOT 78 cookie-cutter pages**; each has original Ukrainian + original English adapted text, symbolism, upright, reversed, spread, reflective prompt, next/prev and links to GalaxiTarot + Academy. Separate `/uk|en/tarot/cards` library index. Native `/uk|en/eclipses/2027` page lists **two solar and three lunar** NASA events (UTC catalog dates Feb 6, Feb 20, Jul 18, Aug 2, Aug 17); mentions physical phenomena, observing regions, local date/visibility caveat, certified solar-eye protection, NASA primary links, Panchanga and method links. **No Event rich result schema**: an eclipse isn't a bookable attendee event. No false author, datePublished, testimonials, search volumes, current live data, personal birth information, claims of 2027 local times without calculated zone. Uses breadcrumb structure tied to real visible navigation and Article markup only where authored Tarot prose is visible.

## Implemented changed paths

- `apps/web/lib/tarot-guides.ts`: eight original bilingual Tarot interpretations
- `apps/web/app/[locale]/tarot/cards/page.tsx`: library hub
- `apps/web/app/[locale]/tarot/cards/[slug]/page.tsx`: guide details, native metadata, canonical/hreflang, Article/Breadcrumb
- `apps/web/app/[locale]/eclipses/2027/page.tsx`: five verified NASA events, local-time caveats, safety, Breadcrumb
- `apps/web/app/components/PortalSection.tsx`: library link from GalaxiTarot
- `apps/web/app/[locale]/panchanga/page.tsx`: eclipse link from Panchanga
- `apps/web/lib/site-indexing.ts`, `apps/web/app/sitemap.ts`: canonical routes, 8 guide details × 2 locales, 2 hubs, 2 eclipse pages: **20 new canonical URLs expected on top of 94 = ~114** (subject to published CMS lessons and final sitemap).
- `tools/a4-seo.test.mjs`: updated exact canonical route set
- `tools/r33-authority.test.mjs`, `e2e/r33-authority-library.spec.mjs`, dedicated GitHub workflow for production build, editorial contract and browser checks
- `docs/operations/r33-search-content-growth-2026-11-01.md`, `docs/seo/r33-uk-en-search-intent-map.csv`: original R3.3 roadmap and 27 hypotheses, NOT verified keyword search-volume data

## Acceptance and next-phase guide

1. Confirm final R3.3 branch head and GitHub CI passed, including **real browser checks for every tarot URL and eclipse locale**. Fix any test or build error on branch; do not call it deployed prematurely.
2. Owner AWS: current checkout must still be `56d056e...` (or independently identify a newer SHA and safely reconcile); `git fetch origin feat/r33-authority-library-eclipses-20261101` then `git merge --ff-only FETCH_HEAD` and invoke the single checked-in release script `bash tools/r33-authority-release.sh`. Avoid past release error of running `site:check` before web restart.
3. After deployment: both services active; `site:check` and `launch:verify` pass; `r32:seo:audit` reports all current sitemap URLs (expected ~114) 200, 0 errors, 0 warnings. Check exact SHA, actual /uk/en canonical guides, original pages, no private content indexed. Source fixture audit and browser mobile.
4. Google: existing Search Console sitemap auto-refreshes. **Do not flood 114 manual indexing requests.** Verify a representative `/uk/tarot/cards`, `/en/tarot/cards/moon`, `/uk/eclipses/2027` via URL Inspection; index inclusion may take days/weeks.
5. R3.3 remaining in next phase: demand-backed query priority using Search Console Performance (once ready), original lessons for under-served topics, editor-reviewed expansion beyond initial 8 guides based on evidence, privacy-considerate tool events and return-visit analytics, then R4 Telegram + one video format. Do not promise #1 rankings or invent traffic results.

**Release caveat:** The user's acceptance is verified production success, **not** a green GitHub job alone. If a release fails, resume from its exact command and inspect logs; never discard working-tree changes or reset the DB blindly.
