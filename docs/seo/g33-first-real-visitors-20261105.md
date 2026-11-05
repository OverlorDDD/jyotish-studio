# Galaxiora G3.3 — First Real Visitors: controlled EN Jyotish test
**Prepared:** 2026-11-05 | **State:** experiment kit + measurement contract prepared; **no outreach, advertising or production deployment performed by this document**.

## Why this experiment (evidence, not a traffic promise)
- G3.2.2 merged PR #123 to main `b1586f0ef051b6ea994da013e18e19ec858c8224`; same-SHA CI and manually dispatched read-only GSC workflow #42022570496 succeeded. GSC reports `verified_read_only`, 12 impressions and 0 clicks for finalized 2026-10-23..2026-11-01. It does **not** establish a working external acquisition channel.
- Independent Windsor.ai GSC 2026-11-01..03 showed 37 impressions and 1 click; GA4 2026-11-03..04 showed 7 `(direct)/(none)` sessions, of which a substantial share could be owner QA. No proven independent tool completion cohort yet.
- The existing public tool events include `public_tool_viewed`, `public_tool_started`, `public_tool_completed`, `public_tool_failed` (and existing names `jyotish_chart_completed`, `panchanga_calculation_completed`, `tarot_spread_completed`). They are **consent-limited** in the current front end; the report must not mislabel absent GA4 events as zero users. No birth dates, times, places, chart results or free-text questions in analytics.

## First experiment: G33-E1 · real humans, one destination
- **Hypothesis:** A clear, independently shared English explanation of why Vedic Moon / Ascendant can differ from Western Sun-sign labels can generate a qualified start of the Galaxiora chart tool from English-speaking Jyotish beginners.
- **Destination:** `https://galaxiora.com/en/astrology/jyotish` (existing indexable landing; no new doorway page or signup promise).
- **Audience:** 10–20 consenting English-speaking first-time users outside the development team, e.g. acquaintances with relevant interests and one or two willing educators. No scraping, spam or paid seeding. Avoid soliciting minors or collecting birth details.
- **One approved share link for invited testers using Telegram:** `https://galaxiora.com/en/astrology/jyotish?utm_source=telegram&utm_medium=social&utm_campaign=astro_basics`.
- **One approved link for a genuinely participating education partner:** `https://galaxiora.com/en/astrology/jyotish?utm_source=partner&utm_medium=social&utm_campaign=astro_basics`. Only use partner when a real partner shares it.
- **Owner approval gate:** Messages and posts remain drafts until the owner expressly approves the channel, recipients and final text. No code or workflow may send them automatically.
- **Budget:** $0 until explicitly approved. No ads, link buying, synthetic traffic, mass translation or fake engagement.

## Ready-to-review English creative (NOT sent)
**Short educational hook:** `Your Western Sun sign and your Vedic Moon sign answer different questions. A Vedic chart also depends on your birth time and the sidereal reference. Compare your Ascendant, Moon and Nakshatra — not just the sign name.`

**One personal invite / user test note:**
> I'm testing a new English Vedic birth-chart experience for Galaxiora, and I'd value your candid feedback. If you're interested, open the chart tool, try to understand your Moon sign and Ascendant, and tell me where you hesitate. No need to send me your birth details or screenshots of your chart. Here's the tool: [approved Telegram campaign link]. If you'd rather not participate, no worries.

**Three uncoached questions after the visit:**
1. What did you expect this tool to do, and what did it actually do?
2. Where, if anywhere, did you get stuck? Device/browser and general step only — no private data.
3. Would you use it again or share it? What specific value would bring you back?

**Video concept (not recorded or published):** 20–30 seconds: contrast Western Sun sign with Vedic Moon/Lagna as *different variables*, show a non-private fictional or public-domain birth example **only after** calculation QA, then show real Galaxiora tool screen. No claim of prediction accuracy or free unlimited features unless verified in the current deployed product.

## Instrumentation and experiment ledger
- **Before any invitation:** operator confirms G3.2.2 production release and mobile path; GA4 DebugView verifies a test `public_tool_viewed` and actual `public_tool_started/completed` lifecycle on the deployed chart tool. If completion event doesn't fire on a real result, pause outreach and open a small instrumentation fix PR. A `page_view` is not a completion.
- **Use existing allowlisted attribution only:** `utm_source=telegram|partner`, `utm_medium=social`, `utm_campaign=astro_basics`. Analytics code sanitizes URL and event payloads; no name/email/birth details in params. GA4 event reporting depends on affirmative analytics consent. Do not alter consent to inflate observed visitors.
- **Exclude owner QA:** maintain a simple internal test schedule and report owner QA separately. No persistent device fingerprinting or hidden user matching.
- **Record anonymized outcomes** in `docs/seo/g33-first-real-visitors-tracker-20261105.csv` *after* real observation: date, channel, approved creative, delivered count (if known), reported clicks/sessions, consent-eligible GA4 starts/completions, anonymous opt-in feedback count, QA exclusions and caveats. All future fields start `unknown`, not `0`.
- **Qualitative data:** keep only consented anonymized summaries, never upload screenshots containing private charts or birth info.
- **Weekly compare:** GSC changes by landing; GA4 `session_source_medium` + sanitized landing + relevant public tool completion; `direct/(none)` remains unattributed; GSC clicks and GA4 sessions are different metrics and do not sum.

## Bounded review / decision
- **T+0:** production release and instrumentation smoke green, human-reviewed creative and share destinations ready; no invitation sent yet.
- **T+3 days after operator-authorized outreach:** review delivery, available attribution, and 3+ uncoached usability reports if offered.
- **T+7 days:** evaluate at least 10 attempted *consented* relevant invitations (not guaranteed traffic), first-party campaign-sourced session evidence, actual tool starts/completions and 5 honest feedback reports if available. All counts must be actual; if small mark `insufficient_sample`.
- **Go:** at least 2 verified non-QA completions plus identifiable permission-based source OR 3 actionable independent usability findings warrant a product fix; scale only the verified channel / fix.
- **Pivot:** real page views but no starts → inspect promise/first CTA/mobile; starts but no completions → inspect forms/errors/auth gates.
- **Stop:** low relevance, disallowed community rules, privacy risk, missing completion instrumentation, or zero interest after a few human-approved small outreach batches; do not send repeated unsolicited followups.

## Release boundary
The paired `tools/g33-aws-release.sh` is an operator-run **code-only** AWS release: preflight exact main commit, ancestor and narrow diff, green checks, env, working tree including generated Next file, ignored/untracked file collisions, backup (including old Next build) and rollback. No Docker, no DB migrations, no provider key exposure, no reset/clean. The script must run on the EC2 host; a GitHub connector cannot inspect EC2 or invoke SSH. It is **not** evidence that production was updated.

## Why no new app page or paid traffic right now
G3.2.2 already added the bilingual tool guidance UI, and the chart has an existing destination and consent-aware funnel events. A new experimental page or redesigned CTA without external users would introduce extra changes but not validate acquisition. First learn from 10–20 real visitors, then implement the highest-impact proven defect through a reviewed PR.
