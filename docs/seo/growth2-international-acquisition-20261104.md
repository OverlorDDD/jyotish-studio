# GROWTH-2 — Galaxiora International Acquisition & SEO Intelligence

**Prepared: 2026-11-04. Status: research and execution-ready marketing playbook, NOT deployed.** Supersedes none of GROWTH-1 (#107). The owner explicitly plans to coordinate the GROWTH-1 deployment separately. This PR changes no runtime, schema, analytics, indexing or website interface.

## Decision

Make Galaxiora **findable as a genuine brand** and **useful as a place-based calculator**; turn three distinct demand pools into real visits:
1. Vedic chart / Kundli / Nakshatra (EN + India and diaspora).
2. Panchang today / Tithi by city (EN + India and diaspora).
3. Free Tarot / birth chart explainers (EN / USA, UK, Canada, Australia).

Compete for broad terms over time, but win early from specific searches where a living calculator does something static answers cannot. Treat Google search, Bing search, Bing AI citations, external referrals and returning visits as separate channels.

**Avoid:** hidden keyword dumps, falsely claiming `galaxia` is a brand alias, bulk translated doorway pages, purchased links/karma, fake community discussions, auto-publishing private birth details, fake rankings or manipulating search volume. Genuine spellings are Galaxiora / Галаксіора (visible variant Галаксиора).

## Evidence and uncertainty

- GSC, connected through Windsor.ai, was queried for 2026-10-30 to 2026-11-03. Available observations: 2026-11-01 **12 impressions and 0 clicks**, and privacy-filtered queries. The old baseline is too small to infer CTR weakness or keyword leadership. Daily data has reporting latency.
- GA4 is configured and the owner reports recently successful event delivery; the connected historical GA4 query returned **no rows** at the time of this research. This is not proof of zero visitors and must not override the known GA4 real-time observations. Align future regular report intervals with the site's actual post-fix collection date and consent limitations.
- Bing's earlier Site Scan showed 4 `robots.txt` blocks, 2 long titles and 2 multi-H1 notices without affected URLs. Exact URL lists are still needed to close the issues; never open protected `/api`, `/account`, `/admin`, `/personal` routes just to satisfy a warning.
- Existing PR #107 contains branded `WebSite` and `Organization` schema, bilingual CTAs and metadata; it is **not production deployed by this playbook**.
- Prior source-backed keyword/market notes live at `docs/seo/growth1-international-demand-evidence-20261103.csv`. Semrush estimates are modeled by country, not exact or current Google counts. Ahrefs or another live keyword database should validate regional difficulty, content gaps and intent before new article production.

## Sprint 1: Week 1 — first 20 real testers and search readiness

**One launch offer:** "Get your free Vedic chart — and understand your Moon sign". A distinct audience segment for "Panchang today by city" has its own CTA and content, no one-size-fits-all homepage spam.

- Integration owner deploys approved GROWTH-1; verify `/en`, `/en/astrology/jyotish`, `/en/panchanga`, `/en/tarot`, and `/uk` plus logo #6, 200/robots/canonical/hreflang, no accidental noindex.
- GSC: check URL Inspection for the three priority EN landing pages, sitemap processing, index status, queries by page/country. Google requests are one-time for newly important URLs, not daily re-submission loops.
- Bing: export URL-level Site Scan errors, URL Inspection and AI Performance/Topics Portfolio if available. IndexNow for *changed, published* canonical URLs after the verified ownership key is live; NEVER send outdated routes.
- Read GA4 event sources by 7-day date window and compare to privacy-safe server aggregate; label consent coverage and synthetic/self tests. Measure **actual chart completion** and landing sessions, not only anonymous requests.
- Ship one **short product demonstration**, one **allowed feedback request** and five meaningful replies in related communities. Do not repost a prior Reddit-filtered promo to evade spam filters. Ask moderators before any self-promotional link.
- Owner chooses one low-friction feedback intake (e.g. public forum EN thread) so English visitors can reply without encountering predominantly untranslated Ukrainian topics.

**Milestone target:** 20 external testers and 5 genuine completed charts/readings in first week, conditional on distribution activity; this is **a target not a prediction**.

## Sprint 2: Weeks 2–4 — search visibility plus earning references

Three **linkable assets**, each grounded in currently reliable calculations:
1. **"Why Sun sign ≠ Vedic Moon sign"** — a four-way comparison and reproducible example linked to the free chart.
2. **"Why today's Panchang changes by city"** — screenshot or data table calculated for 3 real cities with correct date, UTC offset, sunrise, Tithi/Nakshatra transition and methodology; no invented values.
3. **"2027 eclipses: dates and local viewing caveats"** — NASA-sourced calendar; local visibility claims only if checked by a validated visibility method.

Each asset gets one canonical EN landing page, accessible headings and meaningful interlinks; use current stable EN routes already present where possible. Do not add a second competing page for an existing canonical query.

**Digital PR distribution:** one personalized, non-paid outreach to a relevant creator or independent publisher per day for 10 working days (maximum, no automated mass DMs). Invite genuine technical review, corrections, and optional citation. Prioritize astronomy educators, Jyotish education/newsletters, tarot reviewers, open-source astronomy reference curators and accessible web-tool roundups. Never pretend to be independent of Galaxiora. Don't treat backlinks as guaranteed.

**YouTube:** 3 original videos per week: chart comparison, real Panchang city selection, Tarot demo. Shorts descriptions and comments don't have clickable URLs; add real Galaxiora URL to the channel profile link (YouTube Help). If a specific format does not create engaged sessions, adapt hook or channel instead of blindly increasing output.

**Goal:** 1–3 voluntary relevant third-party mentions, first search clicks, material improvement in engaged external sessions. **No artificial backlink target or paid link schemes.**

## Sprint 3: Weeks 5–12 — measurable expansion

- Use GSC/Bing trends and Ahrefs content gap to decide which **single** content cluster deserves 4–6 new original pages. Do not generate 100k keywords, date/location duplicates or machine-translated thin content.
- Evaluate brand search `Galaxiora`, `галаксіора`, `галаксиора` as a **navigational cohort**; keep `galaxia` out (ambiguous, external term). Monitor exact brand search visibility separately from category query visibility.
- If there is meaningful interest from Brazil or Spanish-speaking countries, plan one fully localized end-to-end tool journey with human QA, legal/privacy copy, hreflang and internal navigation. Do not launch an unlocalized `/pt` shell merely to capture queries.
- Explore *optional* shareable, privacy-safe Panchanga results by city/date (never a personalized natal chart by default), subject to the main dev team's technical review. Measure share-to-visit funnel without embedding birth data in URLs.
- Add Bing AI Performance and Google Generative AI Performance where the account provides them, but count citations separately from human clicks and completions.
- Review Core Web Vitals and mobile usability of the three main tools. Inspect actual CrUX field data where available, not only lab screenshots.
- Retention: direct user-consented email digest or opted-in notification only if compliance, content pipeline and unsubscribe mechanisms are ready; until then use on-site bookmarks, regular daily Panchang and useful return journeys.

## Weekly measurement / stop-or-scale

| Measure | Source | Decision |
| --- | --- | --- |
| Indexed eligible pages and robots errors | GSC + Bing URL Inspection | Fix actual blockers before producing more content |
| Impressions, clicks, CTR and position by query/country/page | GSC + Bing | Under 50 impressions per page or at unstable positions: diagnose, don't overreact to CTR |
| Brand navigational queries | GSC and Ahrefs | Observe whether authentic names are discovered; never buy branded searches |
| Sessions by source, landing and geography | GA4 (consent-limited) | Attribute actual campaigns and note coverage |
| Anonymous HTTP aggregates | server-only Galaxiora | Rough traffic floor, **not unique humans** |
| Actual `jyotish_chart_completed`, Panchanga and Tarot success | GA4 + instrumentation | Optimize product friction before scaling promotion |
| 2-minute video engagement, channel profile clicks | YouTube/vidIQ | Identify winning hooks; don't mistake views for site visits |
| Voluntary mentions and referred sessions | Ahrefs + GA4 | Prioritize relevant referring sites |
| AI cited pages | Bing AI Performance / GSC Generative AI | Citation ≠ click, useful for discovering clarity gaps |

**Weekly order:** check technical failures → correct attribution → identify best query + landing → identify friction → choose ONE experiment for the next week. Maintain a control week where possible. On a young site, don't rewrite titles based on one impression.

## Plugin architecture — use the minimum set

Already connected in ChatGPT:
- **Windsor.ai** with GA4 and Google Search Console. Keep as source of truth for first-party observations.
- **GitHub** for code, CI, reviewed PR and controlled releases.
- **Google Drive/Sheets** for the experiment tracker, optionally Gmail for carefully reviewed, manual outreach (no bulk unsolicited sends).

Recommended additions offered in ChatGPT:
- **Ahrefs**: real geo-specific Keywords Explorer, competitor content gap, backlinks, site audits and brand/AI mention reporting. Check account/subscription limitations before assuming premium data.
- **vidIQ**: YouTube keyword research, competitor video outliers, titles and video/channel analytics. Connect only if willing to make and operate an owned video channel.

Optional, when justified:
- **Bing Webmaster** through Windsor.ai API key (must be explicitly authorized); this is not the same as connecting a Microsoft Ads account.
- **Microsoft Clarity** with masking, consent and privacy assessment before session recordings; not a prerequisite for the first 20 visitors.
- **Metricool** for scheduling only once there are multiple active owned social accounts. Do not install everything before discovering a winning channel.

## Reviewed professional sources (official + independent/community)

- Google Search, 2026 AI guidance: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Google Search Central updates (2026): https://developers.google.com/search/updates
- Ahrefs: https://ahrefs.com/blog/ai-overviews-reduce-clicks-update/ ; https://ahrefs.com/blog/keyword-strategy/ ; https://help.ahrefs.com/en/articles/852499-what-makes-a-high-quality-backlink
- Ahrefs Reddit SEO field guidance: https://ahrefs.com/blog/reddit-seo/
- Editorial.Link survey of 518 SEO professionals (2026): https://editorial.link/link-building-statistics/
- Reddit community example, anecdotal, *not causal proof*: https://www.reddit.com/r/WebsiteSEO/comments/1wmzoz5/how_did_you_get_your_first_few_visitors_to_your/
- Reddit rules: https://support.reddithelp.com/hc/en-us/articles/360043504051-Spam
- Bing Topics Portfolio beta (Oct 2026): https://blogs.bing.com/webmaster/2026/10/introducing-topics-portfolio-beta-in-ai-performance/
- YouTube clickable URLs (Shorts limitation): https://support.google.com/youtube/answer/13748639
- Google Trends normalization: https://support.google.com/trends/answer/4365533

**Implementation separation:** No PR merge, live AWS deployment, social post or API submission executed by this playbook. Developer chat remains sole production release owner.


## Verified plugin reconnaissance — 2026-11-04

**Ahrefs:** Plugin is connected in ChatGPT but even the free `subscription-info-limits-and-usage` request responded `UNAVAILABLE / Insufficient plan`. No site explorer, keyword difficulty, backlinks, or competitor rankings were obtained via Ahrefs in this check. **Do not claim Ahrefs data as confirmed or pay for an upgrade blindly.** First check account/plan eligibility and compare any quotes to expected research needs. Previously cited Semrush estimates are external secondary evidence, not live Ahrefs output.

**vidIQ:** Connected and working. These are **estimated YouTube monthly searches worldwide** for English/Latin-letter keyword research, NOT Google search volume, and country-specific figures were frequently unknown. vidIQ uses a separate 0–100 volume/competition score; when returned `<750`, preserve it as a censored estimate, **not 0**.

| Seed phrase | vidIQ estimated monthly YouTube searches | Competition score | Operational use |
| --- | ---: | ---: | --- |
| `vedic birth chart` | <750 | 20 | Precisely targeted calculator explainer, but too narrow for primary video reach |
| `panchang today` | <750 | 41 | Strong on-site product / search intent, weaker YouTube exact-term discovery |
| `free tarot reading` | 4,471 | 32 | Good conversion-oriented Tarot video theme |
| `vedic astrology` | 37,198 | 48 | Wider educational entry point; verify content intent |
| `jyotish` | 12,178 | 42 | Community education opportunity; estimated demand down 11.7% in returned sample |
| `tarot reading` | 152,998 | 61 | High-reach but more competitive |
| `pick a card` | 122,223 | 42 | Strong short-form video format suitable for an actual free Tarot tool |
| `tarot card reading` | 214,550 | 41 | Broad educational demonstrations; short-term trend +50.3% in snapshot |
| `love tarot reading` | 19,588 | 42 | Prominent interest but avoid exploitative certainty about personal relationships |

These estimates are vidIQ provider outputs on the check date, are modeled (not direct Google/YouTube first-party reporting), and may change. Country `US` was requested; a **null countryVolume is unknown, NOT the national zero**. Keyword related terms can include irrelevant signals (`gemini`, `shorts`, `yt`), so the list was editorially filtered.

**vidIQ video outlier caveat:** An English-filtered `pick a card tarot reading` Shorts search returned mostly **Uzbek-language** titles from one channel despite the query language filter. Some outlier performance scores were strong (5.7×–18× versus that channel's own norm) but the sample is linguistically mismatched and unrepresentative of English-speaking audience. Do **not** treat those specific Shorts as English competitor proof. Test an original English 15–30 second `pick a card` demo; only scale if actual profile-link clicks and completed readings appear.

**Revised first experiments:** Lead *video reach* with `pick a card`, `tarot reading`, `vedic astrology`; lead *high-intent owned-site SEO* with `free Vedic birth chart`, `Panchang today by city`, and genuine `Galaxiora` branded discovery. Use the video to invite users into verified free tools. Cross-check results with GA4/visitor aggregates, not video views alone.

