# G4 — AI Search Visibility & Authority (2026-11-11)

## Scope and actual baseline
Galaxiora's public natal tool serves sixteen Shodashavarga divisions:
D1 D2 D3 D4 D7 D9 D10 D12 D16 D20 D24 D27 D30 D40 D45 D60.
**The evidence levels are not identical.** The N4 server-derived 15-chart group
D1–D45 is internally checked against a pinned Parashari method and the source D1;
D60 is a separate *provisional symbolic reference*, not a per-birth externally
certified stable ascendant/house placement. JQA-3 same-profile comparison claims
apply to the documented coordinate, D1/D9/D10 and dasha corpus only.
Do not imply all 16 have identical independent certification.

## G4 sequence and gates
1. **G4.1 Source audit**: read N4 RC, D60 and Reader contracts, compare live descriptions,
   freeze sixteen-chart inventory. PASS when no legacy three-chart-only marketing
   claim remains in user-facing methodology, discovery link copy or AI index.
2. **G4.2 Discovery hub**: publish server-rendered bilingual
   /en/astrology/divisional-charts and /uk/astrology/divisional-charts with unique
   text per 16 divisions; avoid generic 16 thin redirect/doorway pages.
3. **G4.3 Search intent**: surface terms Shodashavarga, divisional chart D1 to D60,
   Hora, Drekkana, Saptamsa, Navamsa, Dashamsa, and all other traditional names
   in context. Link to *actual* working 16-chart calculator, not a fictitious endpoint.
4. **G4.4 Evidence**: document Lahiri/Swiss, Sun/Moon D2 Hora, unequal D30 method,
   internal-vs-external certification, birth-time sensitivity of D60.
   Include honest WebPage/ItemList JSON-LD backed by visible content, not
   fabricated star ratings, FAQ rich-result claims or citations.
5. **G4.5 Internal architecture**: sitemap, localized canonicals, hreflang,
   GalaxiPedia navigation, methodology, calculator and optional llms.txt.
6. **G4.6 Measurement**: GA4 `ai_search_landing` only on allowlisted public
   routes, after existing consent; report ONLY provider+locale, never birth data,
   prompts, search parameters, PII or unsanitized referrers. Track real
   OAI-SearchBot visits via verified vendor IP when logs and IP lists exist;
   user-agent strings alone are *not* verified crawler evidence.
7. **G4.7 Tests**: static contracts, Next.js build, existing technical SEO,
   user-flows and bilingual live HTML, privacy, sitemap and N4 regression.
8. **G4.8 Release**: only deploy approved hunks to moving production AWS HEAD
   using a clean isolated worktree; no Docker, no API/DB restart; backup,
   canary verification, rollback; read back live metadata/robots/site maps.

## AI Search test prompts (EN-first, UA second)
Run identical questions in ChatGPT Search, Perplexity, Gemini, Claude Search and
Copilot using *fresh sessions* and record the actual URLs cited; ask vendors
where and why they found each citation; do not send traffic or fake queries to
the site to inflate metrics. The prompts are in `docs/seo/g4-ai-search-prompts.csv`.
The prompt set contains all sixteen divisions, not just D9/D10.

## Baseline and success definition
First 7 days: all new page responses HTTP 200, canonical/hreflang, sitemap,
one H1, 16 unique chart IDs in raw HTML, readable without hydration, links
to actual calculator, no private info or API routes.

At 14/30 days compare same GSC query sets and positions, true AI
referral events, bot status/IP verified vs unverified, and manually
confirmed citations across identical prompt panels. Do not claim a position
increase or ChatGPT recommendation merely from changing robots.txt,
publishing llms.txt or adding schema.

## External dependencies and uncertainties
- Existing production N4 branch may have moved; release must detect conflicts.
- Some GitHub Actions Chromium jobs may fail due to runner DNS; distinguish
  install errors from application failures, rerun only infrastructure failures.
- Access logs might be disabled; missing logs mean *no evidence*, not zero visits.
- Ahrefs Brand Radar did not return results under the connected plan
  (insufficient plan). Use manual prompt/citation tracking until data is available.
- OpenAI states OAI-SearchBot access and verified IP allowance make a site
  eligible for search, but recommendation placement is not guaranteed.
- Google states its regular Search guidance applies to AI Overviews/AI Mode;
  special LLM markup is not a ranking shortcut.

References:
https://help.openai.com/en/articles/12627856-publishers-and-developers-faq
https://help.openai.com/en/articles/9237897-searching-the-web-with-chatgpt
https://developers.google.com/search/docs/appearance/ai-features
https://developers.google.com/search/docs/appearance/structured-data/software-app
