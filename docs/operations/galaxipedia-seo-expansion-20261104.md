# GP-SEO-1 — GalaxiPedia semantic coverage release (2026-11-04)

## Source of truth
- Production **before** this release: `086b8c240bf915be284fec9821f04748f2804439` (owner's real AWS verified `GALAXIPEDIA_DEPLOY_VERIFIED`).
- Release branch: `feat/galaxipedia-seo-topical-clusters-20261104` (PR #112, base is PR #111 head).
- No rebase onto outdated `main`. Do not merge a branch not descended from the verified AWS SHA.
- Preservation gates: new GalaxiPedia lives at `/en/pedia` and `/uk/pedia`; eight Academy lessons and quizzes, CMS publications, progress storage, `/learn` 308 redirects, GA4, news, Panchanga 2.0, API, SEO, approved galaxy #6 unchanged.

## Editorial decision and limitations
Search Console (28 October–3 November 2026, query/page breakdown) supplied only one row: `d24 calculator`, one impression and zero clicks. This is insufficient to infer 100 winning keywords. The pilot chooses **14** distinct practical search intents, not 100 near-identical pages. No invented keyword volume, CTR, ranking promise or fake publication/update dates.
- Panchanga (5): `what-is-tithi-lunar-day`, `rahu-kalam-calculation`, `panchanga-time-by-city`, `nakshatra-today-location-guide`, `panchanga-sunrise-day-rule`.
- Jyotish (4): `vedic-ascendant-birth-time`, `how-to-read-vedic-d1-chart`, `twelve-vedic-astrology-houses`, `vimshottari-dasha-start-calculation`.
- Western (2): `astrology-aspects-angles-guide`, `astrology-aspect-orbs`.
- Tarot (1): `three-card-tarot-spread-examples`.
- Astronomy (2): `eclipse-visibility-your-city`, `lunar-nodes-astronomy-rahu-ketu`.

Each guide has 3 unique sections, 6 developed EN and 6 UK paragraphs, factual or methodological worked examples, 2+ internal related links, a relevant real tool link, source attribution. Existing 3 guides + new 14 = 17 canonical guide slugs × two locales. No separate pages for synonym variants.

**Six** topic hubs at `/{locale}/pedia/topic/{category}`, including the small practice hub. Hub HTML includes crawlable links; the existing `PediaCatalog` remains searchable and filterable, and published-only CMS entries are also linked server-side from the main hub. Both types of URLs appear in sitemap for EN/UK if public indexing is enabled.

Sources checked: US Naval Observatory for horizon definitions; NASA for eclipse safety, geometry and nodes; Drik Panchang for traditional eight-way daylight Rahu Kalam rule; Astrodienst for major aspects and orbs. Astrological/Tarot interpretations are labeled as tradition. Existing Galaxiora methods used for local conventions; no invented certified functionality, author credentials or exact local eclipse predictions.

## Tests before deployment
- `npm run test:pedia` — includes checks on all 14 new articles, 17 total guides, uniqueness, bilingual parity, citations and crosslinks.
- `npm run test:content:a5`, `npm run test:growth1:seo`, `npm run test:r32:seo`.
- GitHub Actions `GalaxiPedia Academy preservation and SEO migration`: production build and desktop+mobile E2E. Read all checks on **PR #112 exact head SHA**; only green is deployable.
- On AWS, no Playwright database fixtures, no `prisma migrate`, no new backend code.

## Safe production procedure (manual, owner-controlled)
1. Check actual AWS `git rev-parse HEAD`, `git status --short`, `systemctl is-active galaxiora-web`, `systemctl is-active galaxiora-api`, and current site. Production expected starting SHA exactly `086b8c24...` or an explicitly reviewed descendant. If not, stop and integrate a new PR.
2. Back up local **untracked** logo overlay, icon binary, `next-env.d.ts`, and relevant `.env` (private and permissions 0600). Do not expose secrets in logs and do not `git clean`, `git reset --hard`, or delete files with strange names.
3. Fetch release branch; pin and compare HEAD with **CI-approved commit SHA**. Verify `git merge-base --is-ancestor HEAD FETCH_HEAD`, ensure no untracked conflicts with Git tree, and reject unexpected modified tracked files.
4. Run only `git merge --ff-only FETCH_HEAD` (never force). No database/schema change.
5. `npm run test:pedia && npm run test:content:a5 && npm run build -w @jyotish/web`; preserve approved galaxy #6 file. If build fails, do not blindly restart; inspect logs.
6. `sudo systemctl daemon-reload`, restart **web only**, wait for `http://127.0.0.1:3000/` to return 200 with bounded retries. Then run `npm run site:check` and `npm run launch:verify`.
7. Check `/en/pedia`, `/uk/pedia`, `/en/pedia/topic/panchanga`, `/uk/pedia/topic/jyotish`, 2–4 new articles in both languages (200), `/en/learn` and a legacy lesson (308), sitemap and canonical/hreflang, HTTPS through local Caddy, and both API and Web active. Print `GALAXIPEDIA_SEO1_PRODUCTION_VERIFIED` only when all pass.
8. Manually verify GA4 Realtime with consent, favicon/logo #6, old Academy quizzes/CMS, and 360px mobile UI. If a check fails, preserve old SHA + logs, no automatic destructive rollback.

## SEO and analytics follow-up
- No guarantee of immediate indexing. Refresh and submit existing `https://galaxiora.com/sitemap.xml` only after verified production 200, not before.
- In Search Console, compare non-branded **impressions → indexed URLs → clicks → CTR → average position**, by EN/UK and by landing page. Do not claim ranking success solely from publish count.
- In GA4, segment Pedia entrances, engaged sessions and onward clicks to `/panchanga`, `/astrology/jyotish`, `/horoscope`, `/tarot` and `/eclipses/2027`; verify collection rather than assert a conversion rate.
- Expand the corpus only if actual query data reveals distinct gaps or the editorial team can add independently useful examples. Preserve 308 redirects for legacy links and do not generate daily near-duplicate pages.

## Primary public SEO guidance
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://developers.google.com/search/docs/essentials/spam-policies
- https://developers.google.com/search/docs/crawling-indexing/links-crawlable
- https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
