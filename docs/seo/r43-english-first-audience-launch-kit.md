# Galaxiora R4.3 — First Real Visitors: English launch kit

**Prepared 2026-11-02.** Drafts only — no posts sent, accounts created, ads purchased or traffic fabricated. Do not publish until the actual production URL returns HTTP 200 and the new bilingual content has been deployed.

## One offer and one path

**Audience:** English-speaking people comparing their familiar Western Sun sign with a Vedic Moon-sign result, including Jyotish students worldwide. **Offer:** a factual, example-based explanation; link to a working free Vedic birth-chart calculator. **No accounts or dates of birth in tracking URLs.**

Entry page when released:
- English: https://galaxiora.com/en/astrology/moon-sign-vs-sun-sign
- Ukrainian: https://galaxiora.com/uk/astrology/moon-sign-vs-sun-sign
- Calculator: https://galaxiora.com/en/astrology/jyotish

Intentionally separate from the existing sidereal-and-tropical Academy lesson: this article compares **four different measurements** (Western/Vedic × Sun/Moon) with a worked, explicitly illustrative example, birth-input checklist, and calculator next step. Later GalaxiPedia can consolidate educational navigation without deleting or duplicating current canonical URLs.

## Copy-ready English content

### Short video #1 (35–45 sec), Shorts / TikTok / Reels

**On-screen title:** "Why your Vedic zodiac sign doesn't match your Western sign"

- 0–6s: "Your Western Sun sign is Aries, but your Vedic chart says something else? First check WHAT you're comparing."
- 6–15s: Show **Sun** versus **Moon** labels: "Western Sun sign and Vedic Moon sign are different celestial bodies."
- 15–27s: Show the comparison guide table: "Western charts commonly use tropical signs; Jyotish uses sidereal signs. Galaxiora uses Lahiri ayanamsha for its Vedic charts."
- 27–36s: Show *illustrative* 12° Aries tropical Sun → approximately 18° Pisces sidereal Sun; add "example only — not an individual's chart" visibly on screen.
- 36–45s: "Compare Sun with Sun and Moon with Moon. See the free explanation and calculate your own chart at Galaxiora."

**Caption:** "Sun sign vs Moon sign AND tropical vs sidereal: two different comparisons. Here's an illustrated breakdown and a free Vedic chart tool. https://galaxiora.com/en/astrology/moon-sign-vs-sun-sign?utm_source=youtube&utm_medium=social&utm_campaign=r43_moon_vs_sun"

**Use:** only your own screen recordings / logo assets, no third-party video music or people's birth data. Don't claim scientific proof of astrology predictions.

### Helpful forum answer (no drive-by link drop)

> "Two different things can be changing at once: (1) the Sun vs the Moon, and (2) tropical vs sidereal zodiac. If you're comparing a Western Sun-sign horoscope to a Vedic Moon sign, they're not directly comparable. For an apples-to-apples test, compare the same planet at the same birth time and check the ayanamsha. I built a short illustrated guide that separates all four values, if a link is useful and this community permits it."

**Only share the URL in a relevant conversation if the community rules allow self-promotion**, and disclose affiliation ("I work on Galaxiora"). Never disguise ads as organic reviews or post the same message in bulk.

### Educational social post (LinkedIn / X / Threads / relevant groups)

**"My Vedic sign is different from my Western sign — is one chart wrong?"**

Not necessarily. People often compare a *Western Sun sign* with a *Vedic Moon sign* and miss that these are two separate objects. On top of that, most Western charts use the **tropical** zodiac while Jyotish uses a **sidereal** zodiac. If you want to check whether two calculators actually disagree, compare the same celestial body, the same birth instant, and the same zodiac reference.

We built a clear comparison with a four-row table, an illustrative example and a checklist, alongside a free Vedic chart calculator: https://galaxiora.com/en/astrology/moon-sign-vs-sun-sign?utm_source=organic_social&utm_medium=social&utm_campaign=r43_moon_vs_sun

### Short creator outreach (manual and personalized; 1:1 only)

Subject: A free Vedic vs Western signs explainer your audience might find useful

Hi, I build Galaxiora, a bilingual astrology learning site with an independent Jyotish chart calculator. I noticed your audience often asks why Western Sun signs and Vedic Moon signs disagree. We made a practical public guide that compares the four measurements rather than recycling horoscope descriptions. If the topic fits your content, I'd be happy to share the link for a factual review. No obligation and no expectation of a backlink. If you see a correction we should make, I'd appreciate it.

## Measurement and acceptance: real visitors only

| Metric | Tool | What counts | Guardrail |
|---|---|---|---|
| Public URL availability | Browser + server health | HTTP 200, proper EN/UK page, no noindex | Do not submit URLs before production deploy |
| Search discovery | Bing & Google Search Console | Indexed canonical pages, impressions and clicks separately | Submission does not mean indexed |
| Referral sessions | Opt-in GA4 | A visitor navigates from an actually published public post | Consent limitations; no unique visitor guarantee |
| Meaningful engagement | Opt-in GA4 tool success callbacks | Human starts/completes actual Jyotish chart | Never send date/time/place/chart/questions |
| Audience learning | Manually recorded channel feedback | Specific questions, what users couldn't understand | No fake testimonials, spam or bought traffic |

**First milestone:** 10 confirmed genuine non-owner visits across public channels and 5 successful tool uses, as *goals* not claims of achievement. No need to wait for 10 organic Google clicks to start human feedback. Separate Google vs Bing search, referral social, and direct traffic; only promote channels that yield meaningful actions. Don't infer all 24-hour traffic from a 30-minute Realtime chart.

## First seven days after deployment

1. **Day 1:** live mobile smoke-test EN/UK article, calculator CTA, canonical, hreflang, sitemap; Bing URL Inspection; Google Search Console URL Inspection on one EN URL, no repeated spam submissions.
2. **Day 2:** create one original 35–45-second demonstration and post it to ONE channel you own with the declared tagged URL.
3. **Day 3:** participate in a relevant discussion naturally; answer accurately before mentioning the project, and only link where permitted.
4. **Day 4:** review actual landing sessions / direct feedback, identify friction; fix demonstrable UI blockers.
5. **Day 5:** publish a second demo: "Panchanga changes with your city" *only if Panchanga 2.0 is fully deployed and verified*; do not reuse old screenshots.
6. **Day 6:** one respectful individual pitch to a relevant creator; no automatic bulk messaging.
7. **Day 7:** produce scorecard with dated evidence, decide which content/channel to continue next week.

## Deploy-blocking dependencies

- Panchanga PR #80 is under active parallel development. This PR is based on the existing R4.3 IndexNow PR #79, **not** an older main branch. Before merging into production, verify the **newest Panchanga SHA**, logo #6 assets, and GA4 runtime; merge without losing any other PR's changes.
- Bing import and sitemap submission were completed by the owner. Read their statuses in Bing Webmaster Tools; assistant does not have credentials to claim indexing.
- IndexNow remains opt-in. The public key and real changed-URL submission require the owner to follow docs/seo/r43-first-real-visitors-2026-11-02.md on the AWS server **after** a compatible deploy. An IndexNow 200/202 is not proof of indexing.
- GalaxiPedia migration of GalaxiLearn belongs to another chat. Preserve /en/learn and /uk/learn canonical continuity and article link to the already-existing Academy lesson.
- A real published video or community post requires the owner's chosen accounts; the code/CI cannot create a real audience.
- The brand-approved logo #6 must not regress; test icon and preview after merging, especially mobile.

## Reference principles

Google Search Central: https://developers.google.com/search/docs/fundamentals/creating-helpful-content

Google localized versions: https://developers.google.com/search/docs/specialty/international/localized-versions

Bing Webmaster Guidelines: https://www.bing.com/webmasters/help/bing-webmaster-guidelines-30fba23a

Article structured data: https://developers.google.com/search/docs/appearance/structured-data/article
