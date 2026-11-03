# GROWTH-1 · International SEO, brand discovery & first real visitors

**2026-11-03 — researched, implementation PR.** This file is a living decision log, not a guarantee of rankings or a claim that promotion is already published.

## Evidence / blockers

**Actual Search Console read through connected data source (2026-10-29 to 2026-11-03):** available 2026-11-01 data: **12 Google impressions, 0 clicks**, 11 impressions on `/uk` from Ukraine and one on `/en/astrology` from Brazil for `d24 calculator` (position 31). Daily Search Console data is delayed and privacy-filtered. Not enough evidence to estimate demand for the brand, judge CTR, or conclude GA4 has zero human visitors.

**GA4:** the owner confirmed that collection was repaired on 2026-11-03. The connected GA4 report still returned no rows when fetched during this preparation, so do not assert a live 24-hour count or use it as proof of failure. The separate GA4 reliability PR #106 and anonymous visitor aggregate work are outside this PR.

**Indexing:** earlier public-domain audit reported no accidental `noindex` on checked priority pages and valid public sitemap. This does not imply every page is indexed. Verify the *live built HTML and Google indexed/live test* after each deployment. The code requires `SITE_NOINDEX=0` and `NEXT_PUBLIC_SITE_URL=https://galaxiora.com` at build time.

**Bing Site Scan:** earlier report found four robots-blocked URLs, two long-title warnings, two multiple-H1 notices, but did not include affected URL lists. The four robots blocks might be correctly protected private URLs; classify exact URLs before changing robots. Never unblock login, account, admin, personal, or API for a superficial zero-error score.

**Brand confusion:** Existing Google search does not reliably surface the new Galaxiora brand. Authentic names: `Galaxiora`, `galaxiora.com`, Ukrainian `Галаксіора`; Cyrillic variant `Галаксиора` is explained visibly as a spelling variant, not treated as separate official brand. **`galaxia` is broad/ambiguous and is not an alternate name**; do not hijack another site/word by injecting misleading structured data, adding hidden keywords, or making doorway pages. Site name remains consistent in `WebSite`, `Organization`, homepage, About and correct branded assets.

## One coordinated execution plan — three workstreams

### A. Protect indexability and turn brand searches into visits (P0, week 1)

**Implemented in this PR**
- Authentic `WebSite` + `Organization` alternative site-name data for English/UA; about-page visible transliterations and official domain.
- Three direct **first-screen actions**: free Vedic birth chart, Panchanga today, free Tarot; no new navigation tabs or alterations to calculations and branding.
- Intent-aligned Panchanga title/description for English and Ukrainian; Jyotish uses Kundli in honest tool copy, with `x-default` English fallback.
- Source-backed international keyword evidence and regression tests/CI to prevent keyword stuffing and accidental brand hijack.

**Release gate**: compare exact EC2 HEAD to branch; integrate after latest GA4/Panchanga-approved commit and retain logo #6, noindex handling, internal URLs and consent mechanisms. Run `npm run test:growth1:seo`, `npm run test:r32:seo`, `npm run test:r43:seo`, `npm run test:panchanga` and the normal production build. Inspect the live rendered `/en`, `/uk`, `/en/panchanga`, `/en/astrology/jyotish`, `/en/tarot`, `/en/about` and `/uk/about` for status 200, meaningful H1, canonical/hreflang, absence of `noindex`, and mobile CTA layout. **Do not merge to stale main or blindly deploy a PR ref**.

**Owner/UI dependencies:** Bing Site Scan affected URL list; GSC Live URL Inspection for `/en`, `/en/panchanga`, `/en/astrology/jyotish`; Bing IndexNow ownership key on server. Indexed page count, brand visibility and favicon cannot be forced by source code alone.

### B. Win broad and specific searches with useful products (weeks 1–4)

Evidence file: `docs/seo/growth1-international-demand-evidence-20261103.csv`, with Semrush **country-specific estimated monthly Google search volumes for September 2026**. These are *keyword/market signals*, not the number of Galaxiora visitors or a guarantee of Google ranking.

- **US / EN:** `birth chart`, `moon phase today`, `free tarot reading`, `daily horoscope`. Lead with working tool and related learning, not artificially repeated keyword variants.
- **India / English + transliterated:** `kundli`, `today tithi`, `choghadiya`. English-only content will NOT fully address Hindi-language intent; do not advertise full Choghadiya or wedding Muhurta verification unless live features and QA confirm it.
- **Brazil / Portuguese:** `tarot sim ou não`; research demand first. **Do not publish an /pt-br route until its interface, core guide, consent and tool experience are actually localized**.
- Other candidates: Spanish, French, Hindi, German, Arabic and Indonesian. No frequency numbers are claimed until regional sources are available. Treat translated query phrases as research questions, not proven opportunities.

Build a five-page authority cluster (English-first) around **Vedic birth chart + Moon sign**, **Panchanga by city + tithi/nakshatra**, **free Tarot + card explanations**, **horoscope daily vs natal**, and **existing GalaxiPedia/Academy**. Expand original content only when it answers a distinct question; avoid bulk thin calendar/date/city landing pages and keyword stuffing. When adding any language, require fully localized visible content and mutual `hreflang`.

### C. Generate and measure first real traffic (weeks 1–12)

- Publish only after URL, calculator and GA4/event collection have been verified on production. **The assistant has NOT posted content, purchased ads, created social accounts, or generated traffic.**
- **Campaign 1: English chart:** short original screen recording “Why is my Vedic Moon sign different from my Western Sun sign?” with `/en/astrology/moon-sign-vs-sun-sign` and verified chart CTA.
- **Campaign 2: Today by city:** original screen recording showing exact Panchanga timing for a real chosen city; `/en/panchanga`. Use correct time zone and visible calibration, never false universal timing.
- **Campaign 3: Tarot:** short visual demonstration of a real three-card spread, linking to `/en/tarot`. No invented testimonials, fake engagement, or prohibited images.
- Distribute by one owned video channel + one approved discussion/community. Reddit previously removed a new-account post by automated filters; do not repost identical promo to evade moderation. Participate authentically and check self-promotion rules. Contact 3–5 relevant independent creators with transparent personal messages (no spam or purchased links).
- Only authorized, public `utm_source` / `utm_campaign` values. Never include personal data or sensitive birth information. Existing growth-metrics allowlist must be reviewed if a campaign source is added; do **not** hand out ad-hoc UTM strings that will silently be discarded.

**Weekly review:** GSC by date, page, country, query -> impressions/clicks/CTR/position, then GA4/Visitor Aggregates by landing, channel and completed tool events; distinguish indexed URL from impressions and unique users from anonymous raw HTTP requests. Compare actual brand variants with category terms; mark not enough data instead of extrapolating from 12 impressions. Avoid treating an unknown keyword as “zero” and avoid changing titles from one impression.

## Acceptance criteria

| Gate | Evidence |
| --- | --- |
| Build/CI | GROWTH-1 source regressions, R3.2/R4.3 SEO tests and web build pass |
| Brand | WebSite / Organization signals match actual brand, public About mentions variants, never `galaxia` as false name |
| Discoverability | Three live localized hero CTAs navigate to working pages; correct mobile layout |
| Crawl | Actual GSC Live URL and Bing samples have no accidental noindex/robots block |
| Keyword quality | All numeric demand estimates have market, period, source, no unsupported brand metrics |
| Measurement | GA4 events verified on actual property and privacy-safe anonymous aggregates distinguished |
| Growth | First genuine external visits and completed tool interactions observed (not promised by merging) |

**Stop conditions:** If CI fails, new source is behind the live EC2 tree, GA4/Panchanga regress, site unexpectedly becomes noindexed, key assets change, or mobile layout breaks: do not deploy.

## Trusted references

- https://developers.google.com/search/docs/appearance/site-names
- https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- https://developers.google.com/search/docs/specialty/international/localized-versions
- https://developers.google.com/search/docs/monitor-debug/trends-start
- https://support.google.com/trends/answer/4365533
- https://www.bing.com/webmasters/help/why-is-my-site-not-in-the-index-2141dfab
- https://www.semrush.com/website/astro-seek.com/overview/
- https://www.semrush.com/website/drikpanchang.com/overview/
- https://www.semrush.com/website/horoscopovirtual.com.br/overview/
