# Galaxiora R3.3 — bilingual search-demand and original content release

**Date:** 2026-11-01. **State:** planning/research ready; **implementation gated on verified AWS deployment of R3.2**. This document is the canonical R3.3 execution brief for future project chats; do not treat a GitHub document or PR as publication to galaxiora.com.

## Why now

Search Console owner-verified `galaxiora.com` domain property, successful sitemap with 94 discovered URLs, `/uk` indexed, and first organic brand result. R3.2 corrected canonical sitemap aliases, branded Organization/WebSite + About, favicon and Tarot H1 on branch `fix/r32-search-brand-and-sitemap-20261101` (CI 3 jobs success at commit `209a3485bf74f17f1bf1f1bdec15cc3a69bd3f6f`). As of this document's creation, AWS production still ran at SHA `0cadadd25499e8c081932cf4ead877fb39beef08` in detached HEAD, active web/API services, working tree has generated modified `apps/web/next-env.d.ts` and untracked `package-lock.json`. `git merge-base --is-ancestor HEAD FETCH_HEAD` produced `FAST_FORWARD_OK`; **production still needs R3.2 code update, build, smoke and postdeploy 94+ URL audit before claiming completion**.

Priority is **real useful search experiences**, not keyword dumping. Existing assets that MUST NOT be duplicated: 8 original Academy lessons (`vimshottari-life-cycle`, `sidereal-and-tropical`, `nakshatras`, `divisional-charts`, `tarot-questions`, `tarot-reversals`, `mindful-practice`, `yoga-roots-and-safety`), 12 sidereal Moon sign guides per locale, 12 Western sign guides per locale, 4 original Yoga practices per locale, core free chart and Panchanga, fully client Tarot. Dynamic published CMS Academy/Yoga lessons may add existing content, so query CMS before new slug creation.

## Audience / competitor research

**Geographies:** Ukrainian (UA) first, English long-tail globally second. **Intents:** calculate a natal chart; explain the natal chart with a traceable method; today lunar calendar by city; upright and reversed Tarot meanings; know why tropical Sun and sidereal Moon signs differ; timed breathing. Competitor patterns: Astro.com exact calculators and editorial depth; Astro-Seek free specialist tools; Drik Panchang time/location calendar; AstroSage/Prokerala annual horoscopes and tools; JyotiSoft, Карта Долі and Astrokolo Ukraine natal tools; Ukrainian Tarot card-of-day sites. Avoid false claims of market share or keyword volumes.

**Research status:** primary-source Google Search Central documentation reviewed, live competitor/search results explored at a qualitative level. **Search demand volumes, CTR and difficulty are NOT VERIFIED**. They require owner-authorized Keyword Planner/Trends and Search Console reports; classify every initial query as hypothesis until backed by data. Owner does not need to share Google credentials; screenshots or exported aggregate reports suffice.

Sources:
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://developers.google.com/search/docs/essentials/spam-policies
- https://developers.google.com/search/docs/specialty/international/localized-versions
- https://developers.google.com/search/docs/appearance/structured-data/article
- https://developers.google.com/search/docs/appearance/site-names
- https://eclipse.gsfc.nasa.gov/OH/OH2027.html (2027 eclipse events are UTC; convert with astronomy engine to selected location and distinguish visibility from date)
- https://science.nasa.gov/eclipses/future-eclipses/

## Four complete implementation packages (avoid dozens of microtasks)

### Package 1 — Search demand map and gap proof (research + first optimization)

Build one data-backed `docs/seo/r33-uk-en-keyword-intent-map.csv` and a page-to-query matrix. Include columns `locale,query,intent,cluster,existing_url,proposed_url,competition_observed,demand_evidence,priority,content_owner,status`. Use individual queries **as hypotheses**, rank not by imaginary traffic counts but by ability to answer with Galaxiora's existing product and observed SERP. Check Google Trends UA, manual incognito SERPs, Keyword Planner if available, new GSC Search Results once populated. Inspect what is already in `/uk|en/learn`, `horoscope`, `panchanga`, `tarot` and CMS; avoid duplicate intended URLs, doorway pages and canonical conflicts.

Initial query groups:
- UK: «натальна карта онлайн безкоштовно», «ведична натальна карта джйотіш», «як дізнатися асцендент», «накшатра місяця», «даша вимшоттарі», «сидеричний і тропічний зодіак», «панчанга сьогодні», «тітхі що це», «таро карта дня», «значення перевернутих карт таро», «квадратне дихання таймер», «сонячне затемнення 2027».
- EN: 'free Vedic birth chart', 'Jyotish natal chart D1 D9 D10', 'sidereal Moon sign calculator', 'Vimshottari dasha calculator', 'nakshatra of the Moon', 'Panchanga today by city', 'tithi meaning in Panchang', 'tarot reversed card meanings', 'box breathing timer', '2027 solar eclipse date'.
Map **one primary intent per page**, variants to same canonical page. No keyword stuffing.

### Package 2 — Original authority cluster publishing (content/code + release)

Start with a **small original bilingual group** (target 8–12 high-quality articles/tools, then additional up to 20–30 total only as quality and demand evidence permits). Publish in existing native Academy CMS if its content format is adequate; if a tool or structured article needs an indexable static route, implement actual Next.js page only with preflight and corresponding sitemap tests.

Batch A / Jyotish: improve `/uk|en/astrology/jyotish` with substantial crawlable SSR explanation and obvious birth-chart entry point; enhance existing 4 Academy Jyotish lessons rather than duplicating them; create *new* unique pages only for house-based Lagna interpretation or Moon-sign vs Western Sun if original examples and verified chart methods are provided. Be explicit about ayanamsha/time zone/DST/birth time and what is calculated vs interpreted.

Batch B / Panchanga: public search-friendly explanation of Tithi, Nakshatra, Yoga, Karana, Rashi; actual daily timing calculated from user's selected city, not fabricated global universal day. For 2027 eclipse editorial, source UTC events and location visibility from official NASA catalog, check exact date/time and local date conversion. Initial verified NASA dates: 2027-02-06 annular solar, 2027-08-02 total solar, with lunar/penumbral details per NASA catalog; validate each before publish. Cite primary astronomical sources, don't make a random city URL factory.

Batch C / Tarot: leverage existing 78-card classic draw and `tarot-reversals` Academy lesson. Create a curated small set of **individually meaningful** card guides, then expand toward 78 only after editorial quality gates. Each should distinguish upright/reversed, art symbolism, position/context and a concrete reflective question. Link to a real functioning draw. No unlicensed rehosting of artwork or invented predictive certainty.

Batch D / Yoga: enhance discoverability of existing box breathing timer with server-visible instructions, duration, gentle safety, links to original Practice library; avoid health treatment claims.

Each article: original UA text first with high-quality natural English adaptation, H1/title/description, specific questions actually answered, truthful creator/publication metadata where appropriate, readable mobile HTML, contextual links to tools and relevant glossary/methodology. Never invent author qualifications, fake testimonials, fabricated data or mass-generated translated publisher news. Avoid making every changing daily horoscope its own indexed thin page.

### Package 3 — Publishability, validation and brand loop

For every new URL: 200, self-canonical, reciprocal /uk-/en hreflang, correct locale lang, appropriate robots indexing, sitemap entry only when published, useful HTML initial response, no empty shell, preview/404 correct, no private birth details, first-party Article JSON-LD where visible content qualifies, links from relevant navigation hubs. Run focused `npm run test:seo`, `npm run test:r32:seo`, publication/module tests, Next production build, mobile/desktop Chromium, and **post-deploy full sitemap audit**. Keep aggregated GalaxiNews feed UX but no mass index of translated source snippets. Add meaningful cross-links and title/description improvements to existing guides where supported by SERP demand.

### Package 4 — Observe, improve, handoff to R4 acquisition

After Google crawls publication: Search Console weekly impressions, actual search terms, indexed valid pages, organic CTR, average position *interpreted as directional*, organic traffic (GA4 consent or privacy-preserving equivalent), calculation start and completion, new registrations, day-7 return. Label baselines and hypotheses. Double down only on pages proving user utility; improve underperformers on evidence before adding new articles. Form a 6-week editorial calendar, prioritizing original calculation-linked answers and 2027 astronomical calendar events. Then R4 executes Google + Telegram + one video channel (no spam or bought backlinks).

## Initial operational gate / success

R3.3 implementation starts when the user confirms postdeploy R3.2 on AWS: `git rev-parse HEAD` equals tested R3.2 SHA, web/API healthy, `npm run r32:seo:audit` returns no technical blockers, and `/uk/about`, `/en/about`, PNG favicon load. If not, **continue R3.2 deployment, not R3.3 publishing**, while using this plan for research.

R3.3 is accepted when bilingual intent map is backed by documented SERP/actual demand evidence; first editorial batch is live and passes HTML/sitemap/structured-data/browser and substantive QA; internal links work; no near-duplicate page explosion or copyright issue; Search Console submission/index coverage is monitored; measurement baseline and next batch priorities are recorded. Google indexing/rank/traffic numbers are outcomes to monitor, not a binary same-day guarantee.
