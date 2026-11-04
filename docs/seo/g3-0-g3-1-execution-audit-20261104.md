# G3.0 + G3.1 — public funnel instrumentation and evidence-backed competitor intelligence

**2026-11-04** · Prepared and committed to GitHub · **Not deployed to AWS** · Owners: Growth (evidence/definitions), Engineering (rollout/QA), business owner (accounts, spend, publishing).

## Executive decisions

1. **Current problem is an acquisition cold start, not a demonstrated onsite bounce problem.** GA4 and Search Console have very small samples. Do not invent dropout rates or claim conversion lifts before real visitors.
2. **Public Tarot has a registration barrier.** Source currently calls `GET /api/v1/tarot/readings` on the tool page and shows sign-in instructions on unauthorized responses; the draw button is disabled until loading/remaining limits resolve. This is a measurable hypothesis about first-use friction, not proof that visitors leave. Do NOT bypass auth without separate anti-abuse/privacy design.
3. **The former Panchanga `panchanga_calculation_completed` counts successful automatic day fetches**, not necessarily a user choice. It must not be used as the human-qualified funnel KPI. G3 separates explicit user action from default page load.
4. **No analytics raw inputs or private results.** GA4 continues to load only after opt-in; server anonymous counters are coarse requests rather than visitors. No cookies/fingerprints/PII added.
5. **No premium API claims:** Ahrefs MCP returned `UNAVAILABLE: Insufficient plan`; Similarweb MCP returned `403: no API/MCP credits`. Their accounts/plugins can be connected without unlocking paid query access. No imaginary competitor traffic, ranking, CPC or backlink values.

## G3.0 — actual first-party baseline

Windsor.ai connected GA4 account `561822944` and Search Console property `sc-domain:galaxiora.com`. Read on **2026-11-04**.

| Source | Scope | Observed values | Caveat |
| --- | --- | --- | --- |
| GA4 | 2026-11-03 | 2 total users, 2 sessions, 2 engaged sessions; two sessions direct / none and Ukraine | Might both be QA; no independent external users proved |
| GA4 | 2026-11-01..04 | `page_view=5`, `galaxiora_debug_ping=4`, `user_engagement=4`, `first_visit=2`, `session_start=2` | No public-tool completion events surfaced in available data; does NOT prove all funnels fail |
| GA4 | 2026-11-03 | landing `/en` (1), `/en/astrology/jyotish` (1) | Consent-limited; too little traffic to infer retention or location-market demand |
| GSC | 2026-11-01 | 12 impressions, 0 clicks; keyword `d24 calculator` 1 impression, position 31 | Search Console suppresses/aggregates low-frequency queries and reports with delay |
| GSC | 2026-11-04 request | No additional dated rows were returned beyond above | Unknown newer indexing or impressions; do NOT label missing rows zero |

**Source classification:** (A) first-party connected observations above; (A) code at pre-change `release/growth1-preserve-live-ga4-20261104`; (A) directly inspected competitor public URLs dated 2026-11-04; (D) Reddit professional anecdotes. Source (A) does not imply any observed post-release users or that a mobile signup flow was completed.

### Verified original code audit

- `apps/web/lib/growth-metrics.ts` allowed only coarse event names, no input payload.
- `apps/web/app/components/GrowthConsent.tsx` opts GA4 in, sanitizes public routes, emits `page_view`, listens to coarse events.
- `apps/web/app/astrology/jyotish/page.tsx` emits `jyotish_chart_completed` **after** verified `jyotish-integrity-v3` success; there was no unified `started/failed` client-side funnel event.
- `apps/web/app/components/TarotStudio.tsx` emits `tarot_spread_started/completed`, but only on form submit; page GET 401 was not separately counted.
- `apps/web/app/components/PanchangaHub.tsx` emits `panchanga_calculation_completed` on a valid automatic day fetch even when user did not interact.
- `apps/api/src/visitor-aggregate.ts` counts 2xx POST chart, 2xx POST Tarot, and 2xx GET day/range responses. Those counts are **HTTP successful requests, not independent human completions** and must be labeled separately.

### G3.0 code changes in this PR

New privacy-safe `public_tool_viewed`, `public_tool_started`, `public_tool_completed`, `public_tool_failed`, `public_tool_auth_required` events:
- Only 3 fixed `tool` values: `jyotish`, `panchanga`, `tarot` and `locale: en|uk`. No arbitrary event params.
- `viewed`: exactly once per visible public tool route under existing consent; no private route.
- `started`: submitted Jyotish or Tarot form, or user selected a Panchanga date/city and generated a day calculation.
- `completed`: Jyotish verification passed, Tarot API returned valid data, or **user-initiated** Panchanga day loaded. Does not include initial automatic Panchanga fetch.
- `failed`: corresponding explicit tool action errored, without sending exception/message/free text.
- `auth_required`: Tarot initial readings GET explicitly returned 401; a coarse barrier metric. Browser consent may mean some guests not measured.
- Existing legacy `*_completed` events remain for backwards compatibility; **do not add** legacy Panchanga auto completion to verified human QETC.
- `safeGrowthToolForPath` validates only exact public localized tool paths. Consent listener rejects forged tool names and events claiming another tool.
- No mutations to public content, birth chart calculations, auth/registration policy, AI prompt, Google consent contract, database schema, server visitor counters or logo.

**Primary funnel:** GA4 `public_tool_viewed → public_tool_started → public_tool_completed` grouped by `tool`, `locale`, `landing_page`, `session_source_medium`; separately `auth_required` and `failed`. Registration of GA4 custom dimension `tool` in GA4 Admin → Custom definitions may be needed before standard reports show the parameter; DebugView can display it first. Event numbers before deployment remain unknown.

**QETC measurement:** Only the subset of observed `public_tool_completed` that can be reliably attributed to qualified external arrivals, excluding owner QA, may be called qualified external tool completions. A GA4 session from `direct / none` is **not** independently verified external traffic. No cross-device identity, fingerprinting or fabricated uniqueness.

### Verification and acceptance for engineering owner

1. GitHub workflow `G3 Public Funnel / Competitive Evidence`: source tests, GA4 consent regression, GROWTH-1 SEO, production build, isolated browser test with collector shim and mockable live API.
2. On approved deployed SHA, manually check `https://galaxiora.com/en?ga4_debug=1` with opt-in; navigate through 3 tools. Test only a synthetic birth chart, no personal user data.
3. In Google Analytics **DebugView**, confirm `public_tool_viewed`, `public_tool_started`, `public_tool_completed`, and that only `tool/locale` parameter values appear. Simulate failure safely or inspect test env; do not cause genuine users' errors.
4. Test guest Tarot once: `public_tool_auth_required` where applicable. Test signed-in Tarot and guest Jyotish end-to-end.
5. Change Panchanga city/date once, verify one explicit start/completion. Opening page and allowing it to load must **not** create `public_tool_completed`.
6. Verify rejection sends no GA4 events and no birth date, birth time, text question, exact city, lat/long, user ID or private page URL in network payload.
7. Record actual production SHA and GA4 DebugView evidence. **Until this is done, G3.0 is coded and CI-tested but production delivery is pending.**

## G3.1 — competitor tool benchmark

Source table: [g3-1-competitor-tool-benchmark-20261104.csv](g3-1-competitor-tool-benchmark-20261104.csv). **Seven publicly inspected tool landing pages**, not a claim to have personally completed every flow or tested every mobile device:

| Site | Verified first action / strategy | Relevance and opportunity |
| --- | --- | --- |
| [Drik Panchang](https://www.drikpanchang.com/panchang/day-panchang.html) | Local city/date, sunrise, Tithi/Nakshatra, timings, explanatory FAQ; calendar multilingual and richly interlinked | We can win novice clarity with positive `what to do today, when`, not raw data volume |
| [PanchangBodh](https://panchangbodh.com/) | First-screen Kundali + Panchang + horoscope + free/no-signup language; 2027 paid report and period choices | Clear action hierarchy and honest free preview/paid depth separation |
| [AstroTalk](https://astrotalk.com/freekundli) | Kundli form includes name/gender/birth date/time/place plus a sample report preview | Synthetic sample can reduce birth-information trust anxiety |
| [AstroSage](https://www.astrosage.com/freekphorary/default.asp) | Instant Janma Kundali explicitly without registration, separate registered full software flow | Distinguish rapid free chart from premium account-led interpretation |
| [Tarot.com](https://www.tarot.com/readings-reports/tarot-readings/free) | Optional question → Shuffle Cards → three positions Self/Situation/Challenges | Guest-first Tarot is a hypothesis for a major conversion win |
| [Labyrinthos](https://labyrinthos.co/pages/free-online-tarot-readings) | Question-led Yes/No, Love, One Card, 5 Card and Money entry; education/journal loop | Clear task-language CTAs, not generic Tarot category |
| [Horoscope.com](https://www.horoscope.com/us/horoscopes/general/index-horoscope-general-daily.aspx) | Twelve sign choices with direct day-specific teasers and Card of the Day | Distinct sign/day content and a daily habit vs undifferentiated generic copy |

**Limitations:** Astro-Seek was considered but blocked `403` to our independent web reader, so is NOT claimed as inspected. Native click-through, every tool's auth requirement after submit, actual competitor search volumes, mobile recordings, and competitor conversion rates are **unknown**. We did not submit personal birth data to external sites.

## Ten prioritized opportunities

Full scorecard: [g3-1-ten-ranked-opportunities-20261104.csv](g3-1-ten-ranked-opportunities-20261104.csv). Exactly 10 choices, each with market, public evidence URL, our landing, score components (0–5 audience fit, evidence of demand, differentiated value, execution feasibility), effort (1–5), uncertainty, primary KPI and stop/blocker.

1. **Tarot guest-first reading test** — highest product friction hypothesis. Needs separate security/abuse/limited anonymous-session review, not an unaudited quick auth bypass.
2. **Synthetic sample Vedic chart and result preview** — visually demonstrate trusted outputs before user enters information.
3. **Positive Panchanga daily recommendation on the first visible screen** — existing implementation; verify instead of duplicating.
4. **One chart-backed explanation of Sun vs Vedic Moon sign** — answer actual beginner confusion with link to chart.
5. **Question-led Tarot quick 1-card entry** — reuse existing spread engine, do not duplicate pages.
6. **Kundli / Nakshatra contextual SEO cluster** — English-first, no thin Hindi placeholders.
7. **Panchanga two-city timing/method comparison** — original source-linked asset for earned editorial references.
8. **Daily horoscope clearly distinguishes Vedic Moon sign and general Western basis** — coordinate with the separate horoscope upgrade.
9. **Existing 2027 eclipse guide** — improve its credibility and discoverability only after verifying local visibility rules.
10. **Original creator videos and safe UTM linking to completed-tool KPI** — unlike SEO-only activity, directly seeds audience.

**Scoring is editorial prioritization**; not validated keyword volume, expected visits, or A/B confidence. Demand scores based on visible competitor products and previously dated vidIQ estimates, and may be reweighted when connected vendor credits unlock. Rank #1–3 for research, not immediate uncontrolled feature deployment.

## 3 bounded acquisition experiments ready for next phase

- **E1 · US/EN Tarot:** 15–30-second original `Pick a Card` video, `/en/tarot`; measure attributable signed-in completions and auth barrier. If audience clicks but cannot begin, address guest route before buying ads.
- **E2 · India/EN Vedic:** chart-backed `Why is my Vedic Moon sign different?` educational short, `/en/astrology/jyotish`; use synthetic examples and measure chart success.
- **E3 · Panchanga worldwide:** two verified cities compared for one actual date and time-zone; `/en/panchanga`; measure **explicit day interaction**, not default prefetch.

Prepared only; **no videos posted, users messaged or ad money spent in G3.0–G3.1**.

## SaaS/community/operator context, with evidence caveats

- In a [2026 r/SEO account](https://www.reddit.com/r/SEO/comments/1wedu5w/google_vs_bing_seo_for_a_new_website_is_this/) one new utility site saw much earlier search clicks in Bing than Google. Anecdote suggests measuring them separately, not that Bing guarantees results here.
- [r/WebsiteSEO Oct 2026 discussion](https://www.reddit.com/r/WebsiteSEO/comments/1xdurz6/i_honestly_dont_understand_how_people_are_growing/) challenges bulk programmatic near-duplicate pages and discusses topic authority and citations. Some replies speculate about opaque Google engagement signals; **do not treat such speculation as established ranking factors**.
- [Semrush's 2026 first 90-day SEO sequencing](https://www.semrush.com/blog/seo-for-new-website/) supports treating crawl, indexing, impressions and first clicks as separate early milestones.

### Connected source limits and next access actions

- **Connected now (verified):** Windsor.ai for GA4 and GSC; GitHub; vidIQ.
- **Ahrefs:** connected but MCP `Insufficient plan` even on subscription info; paid API access not enabled. Can still use verified-site browser features independently.
- **Similarweb:** connected but MCP `403 insufficient credits / required product claims`; do not retry without credit upgrade (no payment without owner decision).
- **Windsor.ai Bing Webmaster:** available but not connected. Manual API key and verified site required; request key via secure Windsor onboarding, never paste into chat.
- **Windsor.ai YouTube Analytics:** available but not connected. Owner OAuth is required; choose authorized **Brand Account**, not unrelated personal account.
- **Clarity:** no verified connection and no approved tracking plan. For later, ensure field masking and privacy compliance before any runtime script deployment.

## Next owner actions

1. Review and merge this PR into the actual current production line after checking EC2 HEAD; no direct `git reset --hard`, no legacy image override.
2. Deploy with a reviewed release script; QA event delivery (see above). Until then, funnel tracking is not live.
3. Owner grants Bing Webmaster and owned YouTube account authorization via their official/connector flows; do not share API keys in chat.
4. Growth runs G3.2 experiments **after** confirmed custom events; free-first and 0 advertising spend pending explicit owner approval.
