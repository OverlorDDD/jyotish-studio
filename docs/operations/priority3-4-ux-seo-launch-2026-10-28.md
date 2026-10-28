# Galaxiora — Priority 3 + Priority 4 release acceptance
**Date:** 2026-10-28
**Working branch:** `fix/jqa3-windows-and-llm-recovery`
**PR:** https://github.com/OverlorDDD/jyotish-studio/pull/52

## P3 — UX and editorial quality

- Explicit distinction between **Western Sun sign** (the familiar popular
  sign), **sidereal natal Moon sign** (Janma Rashi) and **sidereal Ascendant**
  (Lagna). The generic 12-sign view allows manual reference sign selection;
  it does **not** alter saved natal data.
- Verified natal profiles display the **actual** Moon sign and Lagna from the
  saved chart; an obvious action switches the public example selector to
  the true natal Moon sign. The personal view shows BOTH:
  (1) the canonical Lagna/transit/Dasha daily orientation and
  (2) the distinct natal-Moon horoscope. It clearly explains why an Aries
  example may differ from a Gemini natal-Moon reading.
- Source of the public signs is Swiss/Lahiri noon transit. For a sign S and
  transit lunar sign M, the whole-sign house is `((M - S + 12) % 12) + 1`.
  The same calculation is reused in natal-Moon reading.
- Removed repeated “coming later”/“coming soon” descriptions from
  live categories and reduced defensive process-oriented copy in landing,
  horoscope and public news sections. **Do not suppress** actual privacy,
  safety, licensing, pregnancy/mobility guidance or independent verification
  limitations when they matter to the user's decisions.

## P4 — search discovery and organic growth

- Explicit SEO safety: NO indexing by default. A real HTTPS-owned domain
  **and** `SITE_NOINDEX=0` are required to expose a sitemap, allow robots
  and mark public pages indexable. Never index temporary ngrok or Cloudflare
  previews.
- Localized `title`, `description`, canonical URLs, `hreflang`,
  Open Graph/Twitter metadata for Panc​hanga, Horoscopes and Moon-sign guides.
- 12 original evergreen Moon-sign guides in both UA and EN:
  `/uk/horoscope/aries` and `/en/horoscope/aries`, etc.
  These explain Jyotish meanings, planetary rulers, elements and ways to
  explore further; **they do not fabricate daily forecasts**. Each guide
  links to the real Swiss-backed live reading with `?sign=`, the natal
  chart calculator, Panchanga and the Academy.
- Multilingual sitemap lists all 24 guides and public Panchanga, GalaxiNews,
  GalaxiCom and other indexable pages, with duplicate CMS slugs removed.
  Personal, admin, member profiles and private pages stay nonindexed.
- Original brand Open Graph PNG image available as
  `/opengraph-image` for share previews (Next.js ImageResponse, no tracking
  scripts or third-party images). Optional Google verification token comes
  from **your own** Search Console, not a fabricated value.
- Dedicated release tests `npm run test:release34`, native integration,
  and `e2e/release-priority34.spec.mjs` verify the key discrepancy
  case (Aries chosen publicly, Gemini Moon in verified natal chart) and
  canonical UA/EN landing page routes.
- `npm run launch:verify` checks the live local site, bilingual routes,
  private API proxy health, horoscope and city geocoder, current news
  scheduler state and robots/sitemap readiness. No database mutation.

## Owner acceptance — Windows 10

From the **actual repository root**, not `C:\Users\Note`:
```powershell
cd "$HOME\jyotish-studio-git"
Test-Path .\package.json
git status --short
git fetch origin
git switch fix/jqa3-windows-and-llm-recovery
git pull --ff-only origin fix/jqa3-windows-and-llm-recovery
npm install
py -m pip install pyswisseph
npm run test:release34
npm run test:all
npm run jqa3:certify
npm run build
npm run security:check
npm run dev:full
```
In another PowerShell window:
```powershell
cd "$HOME\jyotish-studio-git"
npm run launch:verify
npm run site:check
Invoke-RestMethod http://localhost:4000/api/v1/news/status
```

### Manual browser acceptance

1. `http://localhost:3000/uk/horoscope?sign=aries`: Aries is
   preselected; explain this is a **reference natal Moon sign**, not a Western
   Sun sign. Log in with a **verified** chart whose natal Moon is not Aries,
   check the actual name and Lagna appear; the “Use my lunar sign” button
   changes only the public selector, never the personal forecast.
2. Personal view shows the **canonical daily natal guidance** first and a
   separate **natal Moon** reading next. If you recognize your Western Sun
   sign as Aries, do not assume the sidereal natal Moon is Aries.
3. `/uk/horoscope/aries` and `/en/horoscope/aries`: meaningful
   original localized content, link to `?sign=aries`, other internal links.
4. `/uk/panchanga`, `/uk/news`, `/uk/yoga`, `/uk/community`:
   no obsolete “not implemented” text; content loads.
5. `/robots.txt` in preview **must** disallow all. Public launch on an
   owned domain with `SITE_NOINDEX=0` should display a sitemap URL.
   `/sitemap.xml` should include both languages and the 24 sign pages.

### To open a public preview *today* without hosting

Keep `SITE_NOINDEX=1` and `NEXT_PUBLIC_SITE_URL=` empty.
Once Docker, packages and .env are configured, the existing
`npm run dev:public` workflow can run a production Next+Nest build on
local ports 3001/4001 and create a temporary Cloudflare URL **if
cloudflared is installed**. Temporary preview URLs should never be
advertised as your permanent public search domain. Keep user account
creation restricted to trusted beta participants until you verify all
external interfaces. Alternatively use a separately configured ngrok
tunnel to the local website port. Do not publish the PostgreSQL/Redis
ports or the Nest API directly.

### To launch and start Google indexing on an owned domain

1. Purchase/configure **your own domain**, HTTPS reverse proxy/hosting,
   persistent PostgreSQL/Redis, secure secrets, backups and monitoring.
   Deploy Next and Nest under one public origin and confirm Nest API
   is private (proxied via `/api` only).
2. Set on the **actual production host**:
   `NEXT_PUBLIC_SITE_URL=https://YOUR-REAL-DOMAIN`
   `SITE_NOINDEX=0`
   `NEWS_INGESTION_ENABLED=1`
   `SESSION_COOKIE_SECURE=1`
   `AI_MODE=free`
   and a fresh strong `AUTH_SECRET`. Add a licensed commercial
   geocoder for revenue-generating use; demo Open-Meteo terms do not
   automatically license paid services.
3. Rebuild frontend after changing `NEXT_PUBLIC_SITE_URL`; run
   `npm run security:check`, `npm run launch:verify`, JQA3 and smoke
   tests against the deployment. Confirm that `robots.txt` permits
   public pages while `Personal`, Admin and private API are not indexed.
4. Register the domain in **Google Search Console** and add its real
   `GOOGLE_SITE_VERIFICATION` value. Verify ownership and submit
   `https://YOUR-REAL-DOMAIN/sitemap.xml` after launch.
5. Validate public pages with Google Rich Results Test/URL Inspection.
   Indexing and rich snippets are not guaranteed simply by having
   metadata. Review server access logs, backups, real upstream news
   status, data/privacy policies and moderation after opening.
6. Do not enable unreleased commercial payment checkout or pretend it
   accepts real money. Production billing and formal licensing remain
   separate, explicit launch gates.

## Scope still requiring external user action / independent verification

- The real permanent HTTPS domain/hosting, DNS, TLS and site ownership
  are not provided here; GitHub pushes and CI do **not** publish the site.
- External GalaxiNews publishers may fail with 404/429/500; check actual
  administration diagnostics rather than assuming every scan adds news.
- Photos require rights; first-party thematic graphics substitute.
- Open-Meteo's free city API is for noncommercial use; switch provider
  before monetization.
- Exact ritual/fasting observances need independent tradition-specific
  prioritization; AE-P7 labels candidates.
- Do not claim health or life outcomes from moon phases.

Official guidance:
- https://developers.google.com/search/docs/fundamentals/get-started
- https://developers.google.com/search/docs/crawling-indexing/canonicalization
- https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
- https://developers.google.com/search/docs/appearance/structured-data/organization
