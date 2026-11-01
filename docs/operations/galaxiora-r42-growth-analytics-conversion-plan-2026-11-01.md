# Galaxiora R4.2 — Growth Analytics & Conversion Engine
**Prepared 2026-11-01** | Current owner-verified production prior to this work: `3380892c7a99d86dc77b3b70aff88f6ed2fc756b` for R4.1; subsequent owner-reported browser update to cosmic G, production HEAD not independently read. This branch is based on cosmic-G release `40289d83d7cd424705a65bae4a25e4f3120bfc1c`. **Do not assume these changes are deployed.**

## Product outcome and scope
Build a trustworthy feedback loop: **organic query or Telegram discovery → public page → high-value tool → optional signup → eventual return**, by locale, without sending birth details, location, private Tarot questions, emails, user IDs or forum content to analytics.

We cannot promise to make Galaxiora the most popular site through code alone. R4.2 will first establish accurate, ethically obtained baseline and measurement; then use actual evidence to improve conversion and returning visits. Separate technical delivery from traffic outcomes.

## Source-based research, not invented competitor traffic
- **Google Search Console** (owner has verified Domain property): primary authority for impressions/clicks/CTR/search queries/landing pages; its Performance reports must not be mistaken for GA4 sessions, and it can take time for new data. Search Console Search Analytics API is optional later; no Google OAuth token/secret in GitHub or browser.
- **Google Analytics 4**: good for agreed event taxonomy and funnel exploration, but explicit visitor consent is needed for GA tags in EEA and for appropriate use in other applicable jurisdictions. Basic Consent Mode blocks loading Google tags until consent; Consent Mode alone is not a banner. Use a real choice and allow withdrawal. Reference: https://support.google.com/analytics/answer/14275483 and https://support.google.com/analytics/answer/14009635 and https://support.google.com/analytics/answer/14183469
- **Plausible**: lightweight cookieless alternative with readable referrer/channel dashboard, publicly described as not using cookies; its data policy still needs legal review based on actual installation and jurisdictions, and it is not necessarily free. Reference: https://plausible.io/docs
- **PostHog**: deep product funnels and retention/cohorts, but session replay, person-identification or autocapture would be unnecessary/intrusive for sensitive natal-chart interactions. Use only purposefully chosen coarse events if considered later. Do not deploy replay automatically.
- **Astro-Seek / Astro.com**: calculator-first journey; the visitor can evaluate a free chart without creating an account first. Galaxiora must preserve free guest access and track the dropoff from *view → start → complete*, not optimize purely for signup banners.
- **Drik Panchang**: location-first calendar; first verify accuracy and city selection. Do not capture birthplace/city coordinates in third-party analytics.
- **Labyrinthos**: educational Tarot cards, guided learning and repeat interactions; the practical retention loop is meaning → free spread → related lesson. Avoid exporting reading content or using manipulative streaks.
- **Telegram:** @Galaxiora is an owner-reported *account*, **not necessarily a public Telegram channel**. Telegram documents separate user accounts vs channels: https://telegram.org/faq_channels; usernames support `t.me/<username>` but must identify the correct actual peer. Do not auto-insert `sameAs` or a footer CTA until the channel is actually created and its public URL verified.

## Delivery packages (R4.2.0–R4.2.4)
### R4.2.0 — data privacy and taxonomy (implemented in this feature branch)
- Routes are normalized into a finite public allowlist. `/uk|en/account`, `/personal`, private forum topics, any URL containing query strings or private input, and unknown routes are blocked from outbound analytics pageviews.
- For card/lesson details, aggregate by public content cluster, not by question or individual. Public article→tool navigation event may contain only `from_section` and `tool` allowlist values.
- Consent choice is `accepted/rejected`, default no choice; optional GA4 Web Measurement ID must be explicitly configured. If absent, script and banner are absent (no implicit tracking).
- GA4 is loaded only after consent; no advanced-mode pre-consent pings; Google ad_storage/ad_user_data/ad_personalization always denied. Accessible bilingual accept/reject and an always-reopenable analytics settings control. Withdrawal stops sending our events.
- Privacy notice updated in both languages. No session replay, Google Ads, Meta pixels, cookies for marketing without choice, or auto-capture.
- Release requires no DB schema changes and no existing birth-data export.

### R4.2.1 — consent verification and trustworthy GA4 baseline
- Owner creates GA4 account/property and **Web** data stream for `https://galaxiora.com`; selects e.g. Ukraine reporting zone / EUR or UAH appropriate to accounting; obtains public Measurement ID in form `G-XXXXXXXXXX`, **not a secret**.
- Add `NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-...` to AWS `/opt/galaxiora/app/.env` (not GitHub), build/restart once. Because Next `NEXT_PUBLIC_` variables are compiled into the browser bundle, changing .env after build requires a web rebuild.
- Acceptance browser checks: with ID set and no consent, **no requests** to `googletagmanager.com`/`google-analytics.com`; Reject still no requests; Allow only public safe pageviews; navigate `/account`/private content → no sensitive page path emitted; withdraw → no new event hits. Check Chrome DevTools Network and GA4 Realtime/DebugView, allowing reporting delay.
- Run privacy/legal review for jurisdiction, storage, notice and Google DPA before enabling; Google Consent Mode v2 documentation is the reference if migrating to a CMP. No user IDs or advertising features.

### R4.2.2 — funnel completion events (partially implemented, remaining callbacks follow-on)
- **Implemented in this branch:** after explicit consent, the real Tarot submission dispatches a start event; only a successful API result dispatches \`tarot_spread_completed\`. The Panchanga emits \`panchanga_calculation_completed\` only after the user submitted the form and the day API succeeds; the automatic initial day load and failed requests do not count. Events are name-only without private fields.\n- Remaining instrumentations: verified Jyotish calculation completion and confirmed signup success. Instrument **verified actual-success callbacks**, not button clicks alone: `jyotish_calculation_started`, `jyotish_calculation_completed`, `panchanga_calculation_completed`, `tarot_spread_started`, `tarot_spread_completed`, `sign_up` after verified confirmation. Do not emit on server response error, fake/demo success or merely pageview.
- Strict payload shape: `tool` enum, `locale` enum, `success` boolean. **Never** birth date/time, place/coords, rendered chart, question, member ID, email, account existence or signed-in status.
- Define stable versioned metrics interface shared by Next tool components, with unit and Playwright tests. Track no more than one start/completion per *real* interaction. Respect visitor consent across tool components.
- No event inside a background publisher, scheduler or auto-refresh timer; avoid falsifying conversion by background computation.

### R4.2.3 — owner-readable scorecard and experimentation
- Owner-facing weekly GSC + GA4 scorecard by language, source and landing page (no private data), with explicit `not yet measured` when evidence missing. Distinguish GSC clicks vs GA4 sessions, consent/sample limitations, and local time-zone offsets.
- Core metrics: nonbranded search impressions and clicks, tool entrance → completion, article→tool clicks, optional verified signup, returning visitors after 7 days *only if measurable with consent and sufficient sample*. Baseline first 2–4 weeks.
- 2 hypotheses at a time, avoid A/B tests with fake data: e.g. Panchanga calendar card placement and Tarot article CTA; define numerator/denominator, guardrails (CLS, privacy, accuracy), minimum data thresholds. Do not claim statistical significance with tiny site traffic.
- If GA4's own ads settings/enhanced measurement could collect unwanted `search_term` or URLs, turn off those enhanced measurement types and review their settings before going live.

### R4.2.4 — ethical Telegram + brand distribution and retention
- Owner's `@Galaxiora` can be used to administer a **new public Telegram channel**; verify public username, role and URL before displaying an official footer link and Organization `sameAs`.
- Telegram editorial schedule: 2 concise useful posts weekly (one Astro/Panchanga, one Tarot/Yoga) and 1 short demonstration. Each link to an original tool and cite correct astronomical sources; no unlicensed images and no automated posting without authorized bot permissions.
- Add a `?utm_source=telegram&utm_medium=social&utm_campaign=...` link *in outbound channel content* only; analytics strips query string from measured page paths. No private info in UTM parameters. Validate channel link works before shipping.
- Later optional user-initiated reminder/digest with explicit opt-in/opt-out, no unsolicited mass messages.

## Deployment and fail-safe
- Branch `feat/r42-consent-gated-growth-measurement-20261101`; base cosmic-G release `40289d...`. Confirm actual production SHA/dirty state and GitHub CI before deploying; fast-forward only.
- Keep GA4 ID unset on first installation: analytics stays **OFF** and no consent UI is rendered. Test public site, private route noindex, full `npm run r32:seo:audit`. This safely closes R4.2.0 without external analytics.
- After owner has a verified Web Measurement ID, enable in .env and explicitly rebuild + restart. Run browser consent tests with temporary test ID separately from live GA4 property; never flood production analytics with synthetic tests.
- If the integration is blocked by consent/legal or a provider failure, leave ID unset and continue GSC/manual aggregate reporting. This preserves full site usability.

## Acceptance criteria
- Unit tests for public route normalization, safe campaign mapping and event allowlists; tests confirming GA4 disabled by default and no intrusive third-party scripts/PII payloads. Chromium tests build with a dummy test ID and mock analytics requests to verify reject/accept/scrubbing/withdrawal without transmitting live test events.
- Production Next.js build and existing SEO contracts pass; no regressions in signup, calculators or NMT news.
- Post-deployment both systemd services active; site:check/launch:verify pass; all canonical sitemap URLs report 200/zero errors/warnings.
- Analytics tests with GA4 enabled: deny by default, opt in explicitly, withdraw works, never send private paths or identifiable chart fields. Owner must approve measurement and verify their actual GA4 property.
- R4.2 is *fully closed* only when real funnel events and scorecard become available; implementation of R4.2.0 is not equivalent to entire R4.2.

## Real-world metric scorecard
| Metric | Current known baseline | Evidence |
|---|---|---|
| Public sitemap technical crawl | Last user-confirmed full crawl PASS | AWS CLI, not Search Console indexed count |
| GSC Domain property | Verified by owner | Search Console |
| `/uk` indexed | Owner previously reported | URL Inspection |
| Organic clicks, impressions, CTR | Unknown | GSC Performance pending |
| GA4 sessions / engagement | Not measured | GA4 Web stream not connected |
| Funnel completions / 7-day retention | Not measured | Actual instrumented event callbacks not yet wired |
| Telegram channel followers | Unknown / channel not established | Owner needs public channel |
