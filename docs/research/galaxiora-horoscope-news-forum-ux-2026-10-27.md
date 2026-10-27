# Galaxiora — Forum layout fix, GalaxiNews mini-feed and Jyotish Horoscopes v2 (2026-10-27)

## Scope of the owner review
Owner reported (1) uneven forum typography/control sizing; (2) compose form confined to a narrow sidebar within the toolbar; (3) empty Personal News card; (4) a need for a dedicated header "Гороскопи" section with 12 general readings plus verified natal-based personal readings, and non-robotic fact-linked texts.

### 1 — Forum geometry (root cause)
`GalaxiCom.tsx` accidentally put the composer **inside** `communityToolbar` (`display:flex`). The form was therefore a narrow flex item between display-name and safety widgets. We moved the composer to a full-width sibling after toolbar, preserved focus-scroll behavior, enforced box-sizing/min-width for form controls, harmonized font-size/line-height of utility rail, and added responsive rules for 320px+ screens. No alteration of thread/reply length limits, moderation rights or content.

### 2 — Real Personal News preview
`PersonalNewsPreview.tsx` requests `GET /api/v1/news/feed?sort=personal&limit=4&page=1` from the existing GalaxiNews relevance engine (signed-in personal space). It displays actual published article titles, publishers, dates and translated source teasers where available. Headline opens the actual external publication (safe http/https only, target rel noopener noreferrer). Empty/loading/error states distinguish unavailable news from articles found. The existing GalaxiNews module remains source of truth, with a prominent link to the full feed; no synthetic news, screenshots, scraped unlicensed full articles or fake fallback cards. Personalization opt-out is respected by existing backend sort=personal policy; when disabled, source returns diversified world results. Do not infer personal news from a private journal.

### 3 — Dedicated Horoscope section
- New `/{uk|en}/horoscope` in PortalShell main header, `/api/v1/horoscope/today` public read-only controller.
- Twelve readings are expressly for **sidereal natal Moon sign / Janma Rashi**, NOT western tropical Sun signs. This is stated on UI. Public visitors choose among 12 signs; each uses the **same calculated Moon at Kyiv local noon** and transit house counted from selected sign. Local noon is a snapshot, not an exact lunar ingress instant.
- The public API exposes verified calculated lunar observation, date and 12 deterministic reference interpretations; no natal identifiers, chart, saved locations or private birth times.
- For signed-in users with a **verified primary chart**, the "My personal reading" tab fetches existing `/api/v1/personal/overview` and `/api/v1/personal/calendar?days=7`, reusing the canonical natal+Lagna+Janma-Rashi+dasha evidence. Without a chart it shows an explicit route to My Universe, not a fabricated personalized reading.
- New `horoscope-editorial.ts` maps every one of the 12 houses to specific professionally edited **interpretive themes** and localized reading, cautions and reflective question. Shared by public and personal reading. This is more readable but **does not add unverified planetary influences, aspects, birth facts, fabricated life circumstances or concrete future events**.
- Personal guidance still checks `t.moon.houseFromLagna` and verifies natal Moon sign in saved chart. It also references `t.moon.houseFromMoon` and current valid dasha. All selected facts are sourced from the same ephemeris and verified chart, not an LLM improvisation.
- Technical facts (day, noon snapshot, method, sign/house, nakshatra, dasha) shown in expandable "На чому ґрунтується це трактування" rather than taking the lead.
- Existing Personal dashboard now links to full horoscope and reveals its own fact method behind disclosure. Daily and weekly texts remain one canonical source.
- API returns 503 when ephemeris is unavailable. UI displays honest error with Retry, not editorial boilerplate disguised as a calculated prediction.

### Research sources / source-of-truth, with boundaries
**Astronomical computation:** [Swiss Ephemeris documentation](https://www.astro.com/swisseph/swisseph.htm). Sidereal longitude is tropical minus configured ayanamsha; project uses its already configured Lahiri implementation. The reference does not validate each JHora match by itself.

**Classical interpretive basis:** [Phaladipika (Mantreswara), chapter 26: Transits / Gochara](https://www.wisdomlib.org/hinduism/book/phaladeepika-by-mantreswara-text-and-translation/d/doc1621598.html), verse 1 specifically prioritizes natal Moon sign, and verse 2 classifies lunar gochara. Editorial house themes are modern explanatory paraphrases, not verbatim verses or mathematically proved future events. A future expansion of graha drishti/Ashtakavarga would need independently verified facts, not assumptions.

**Information design:** [Microsoft Style Guide: Scannable content](https://learn.microsoft.com/en-us/style-guide/scannable-content/), [Nielsen Norman Group: Progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/) and [W3C WCAG 2.2 Reflow](https://www.w3.org/TR/WCAG22/#reflow). Lead with meaningful user intent, use short paragraphs and accessible mobile navigation, show technical evidence only on request.

### What a visitor actually wants to know, and what we can honestly provide
Readers primarily want: What part of life is emphasized? How does it relate to me? What is worth noticing? How was it calculated? The page makes these four questions prominent. **Accuracy of calculated lunar longitude, sign and current dasha is a technical question; the words "will meet X", "will get promoted" etc. would not be justified by those inputs.** Advice is an interpretation and invitation to reflect, explicitly not a verified event. This separation must survive future LLM writing.

### Tests and launch gates
- `tools/horoscope-editorial.test.mjs`: all 12 houses distinct from 12 reference signs, evidence dates and moon facts identical across selections, no invalid sign acceptance.
- `e2e/horoscope.spec.mjs`: public GET returns 12, sidereal method, standalone UA/EN route, source detail and user-only reading guarded from guests.
- Existing C0–C5/forum editing/Personal/calendar/JHora regression still run.
- JQA3 Lagna 19/20 and Moon 18/20 ≤1 arcsecond and exact Vimshottari boundary dates are **not solved here**. No change to numerical pass thresholds, timezone policy, primary-chart verification or claims of certified precision.
- Site remains pre-launch until owner UI acceptance and separate payment/privacy/production gates.

## Windows runbook
```powershell
cd C:\Users\Note\jyotish-studio-git
git status --short
git fetch origin
git switch fix/jqa3-windows-and-llm-recovery
git pull --ff-only origin fix/jqa3-windows-and-llm-recovery
npm install
docker compose up -d db
npm run db:generate
npm run db:migrate
npm run test:personal
npm run test:com
npm run dev:full
```

Test pages:
- http://localhost:3000/uk/community — click Create Topic, editor width 100%, no sideways overflow at mobile 375px, fonts/buttons aligned.
- http://localhost:3000/uk/personal — verified natal profile, real four-article personal News preview with source/links, horoscope and full news link. No results should say honestly "none" or error.
- http://localhost:3000/uk/horoscope — header link visible on all pages; choose all twelve signs, toggle personal/guest, open evidence, inspect date and timezone; English version at /en/horoscope.
- API http://localhost:4000/api/v1/horoscope/today or same origin /api/v1/horoscope/today according to frontend proxy. A public reading has `notAPersonalChart: true`, `reference: SIDEREAL_MOON_SIGN`, and exactly 12 `signs`.

QA: desktop 1440px, mobile 375px + 320px, focus keyboard Tab, collapsed evidence; compare "Мій Всесвіт" and public tab for same verified user and local day.
