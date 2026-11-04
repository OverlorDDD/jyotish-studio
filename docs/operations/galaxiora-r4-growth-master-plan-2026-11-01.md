# R4 — Galaxiora organic acquisition, engagement and retention
Status: IMPLEMENTATION IN PROGRESS, not production deployed. Dated 2026-11-01.
Owner-confirmed live SHA before this branch: `40ff2b13c48b7a77625488e95ecbcd44a400c2e7`; `R33_AUTHORITY_RELEASE_VERIFIED`, 94+ production pages audited automatically. This is a launch-stage site, not an established traffic property.

## Objective and first principles
Build sustainable growth for an original bilingual Ukrainian/English Jyotish, Tarot, Yoga, Panchanga, and cosmic discovery service. No guarantee of top rank or imaginary visitor counts. Prioritize high-intent search → useful free tool → original explanation → optional account → return visit. Keep spiritual-tradition voice confident without inventing astronomical facts, expert credentials, testimonials, reviews, scientific proof of interpretations, or conversion metrics. Be respectful of health, privacy, minors, or sensitive birth data.

## R4 workstreams — four coherent packages

### R4.1 Distribution + findability (this branch first)
1. Canonical UX fixes: the 2027 calendar was buried after the much longer Panchanga explanations although the existing `EclipsePanel` already answers local visibility. Move the **prominent, complementary link directly below the interactive eclipse visibility module**, explicitly explain that the calculator gives local visibility and the NASA calendar describes five worldwide 2027 events. Remove the duplicate buried CTA.
2. Build natural low-friction sharing for original pages: use native Web Share API when available, fallback to clipboard or a selectable visible public URL. Only public canonical paths; never include chart inputs, coordinates, Tarot questions, account details or tracking IDs. No social SDKs loaded by default.
3. Create editorial discovery paths: Tarot library ↔ GalaxiTarot tool, eclipse calendar ↔ Panchanga real geometry, Jyotish lessons ↔ natal calculator; search engine crawlers should see anchor hrefs in initial server HTML. Ensure UA and EN labels, text and language alternates.
4. Distribution: propose official Telegram channel, one short-form social format (short explainer videos) and authentic partnerships only **after owner creates accounts**. No automated platform posting without authorization, no fake social identities or purchased links. Weekly cadence: two useful source-linked micro-posts, one short tool demo, one article spotlight. Social previews should be checked live before crossposting.

### R4.2 Privacy-first funnel and measurement (follow-on implementation)
- Search Console Domain property already verified; monitor query/page/locale/country trends weekly, compare branded/non-branded. Await real performance data rather than claim nonexistent traffic.
- Define funnels: search result → landing page → non-sensitive tool start → tool completion → optional signup → returning visit. Define anonymous coarse event names only; never log personal natal/birthplace/date/time, user ID, Tarot questions or journal details, email or IP for a marketing dashboard.
- **Do not inject Google Analytics/Meta pixel now.** For EEA + UK/Swiss visitors Google consent policy requires consent controls for relevant Google tags and a valid choice. In a later distinct R4.2 PR, select a lawful setup with opt-in consent, accessible withdraw controls, documented data processing, cookie policy, and production event tests. Keep all ad-personalization denied unless purposefully enabled and consented. Google Consent Mode by itself is not a banner.
- Analytics operational dashboards: 7-/28-day eligible impressions/clicks/CTR, indexed pages, new-user journeys (only consented), tool-start/finish conversion, signup conversion, 7-day retention; do not invent baseline. Where data unavailable, show `not yet measured`.

### R4.3 Editorial retention, not spam
- Weekly original `What is happening in the sky?` source-linked carousel based on verified astronomy; contextual link to Panchanga and 2027 eclipse calendar, only after originality checks.
- A concise `What to explore next` section from each original article; Personal content remains behind auth and never enters sitemap. A saved/bookmarks feature should only use existing user-authorized data, avoiding private data in search or share URLs.
- Optional reminder/email digest requires opt-in/opt-out, anti-spam and verifiable sending domain; **do not send emails or implement background subscription without owner setup**.
- Improve returning journeys by relevance not manipulation (e.g. Tarot card meanings → free deck, Panchanga event → city calculator; Yoga → actual timer).

### R4.4 Public brand corroboration + partnerships
- Keep canonical official About + Organization schema, favicon, transparent methodology, editorial ownership of originals, real contact email when configured. Consistent website name/profile across owner-controlled Telegram, YouTube/short-video and relevant communities.
- Outreach to truly relevant creators/educators for actual collaborations, never buy backlinks or arrange fake citations. A short media kit with brand one-liner, real features, URL samples, limitations and logo-use link; consent needed before sending messages.
- Social link `sameAs` in schema **only** after real public profile URL has been established and confirmed, never speculative.
- Monthly competitor review: Astro.com, Astro-Seek and Drik Panchang for calculators/location UX; Tarot educational sites such as Labyrinthos/Biddy Tarot for card guides. Copy zero copyrighted text/images.

## Five practical phases and gates

**A. Foundations / in-repo implementation (this PR):** structural EclipsePanel fix; native public-page sharing; organic release/playbook; small tests. No DB or DNS; no external networks or social API.
**B. Release / verify:** production build and browser tests green; owner SSH fast-forward from `40ff2b...`; build/restart; smoke and sitemap audit; verify two locales and link discoverability on small mobile view. Owner confirms visual placement of calendar near EclipsePanel.
**C. Audience channels (owner actions):** official Telegram channel and one short-video account with matching brand/verified domain, real links; publish first three high-value posts after editorial review. Optional actual partner outreach via approved messages only.
**D. Analytics and retention:** separate consent/privacy-engineering PR after owner confirms analytics provider and lawful consent choice. Validate telemetry sampling, privacy, and opt-out; track only aggregated events and anonymous funnel.
**E. Observe + optimize:** weekly Search Console review for six weeks, first 1–2 low-performing page iterations based on actual data. Then begin R5 monetization tests only when consistent conversion/traffic signal exists.

## Operational KPIs (hypotheses, not guaranteed)
- Technical: 0 blocked public canonical URLs in live sitemap audit, private URL not indexable; no excessive mobile overflow.
- Content: 100% of published source-linked originals connected to a real tool and at least one relevant adjacent resource.
- Search: increase non-brand impressions and clicks from an as-yet unknown initial baseline; use a 4-week trailing comparison after enough data, split UA/EN.
- Product: count tool start → completion and page-to-tool clicks **only after valid measurement setup**.
- Retention: observe 7-day return rate for opted-in analytics; aim to improve rather than fabricate a fixed percentage.
- Acquisition: genuine Telegram follows, referral sessions and optional email opt-ins; no fake accounts or forced popups.

## Key research documents
- Google people-first content https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- SEO Starter Guide https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- Google EEA Consent Policies https://support.google.com/analytics/answer/14275483
- Google Consent Mode https://support.google.com/analytics/answer/10000067
- Google Search Console performance: https://support.google.com/webmasters/answer/7576553
- Last documented R3 release: `docs/operations/r33-authority-release-2026-11-01.md`

## Blockers and solutions
1. **No GSC performance baseline yet**: leave demand/CTR unknown and avoid numerical outcome claims; use Search Console once available. No owner Google credentials required.
2. **No official social account URL yet**: create approved editorial drafts, do not publish fake profiles/links.
3. **No consent/analytics provider set**: ship zero tracking scripts in this PR; stage R4.2 with privacy review.
4. **No newsletter provider and no verified sender**: avoid unsolicited email, defer optional digests.
5. **Existing local eclipse visibility already works**: preserve it and keep historical NASA article distinct; remove low-position duplicate, highlight contextual link adjacent.
6. **Next.js production release order**: test → build → restart web → readiness wait → preflight/launch → live full-sitemap audit (old error was checking before restart). No DB migration in R4.1.

## Acceptance for next project chat
Confirm PR/head SHA and CI. Owner deploys from matching production SHA; page /uk/panchanga should display contextual 2027 calendar link directly **below the local eclipse module**, not after the long guide; /en likewise. /uk/en original Tarot card guides and eclipse article display privacy-safe 'Share' with native or copy fallback. GitHub tests, production build, browser, release, sitemap clean. Only then proceed with optional account/channels/analytics R4.2–R4.4. Treat this as **R4.1 deliverable**, not the entirety of R4 completed.
