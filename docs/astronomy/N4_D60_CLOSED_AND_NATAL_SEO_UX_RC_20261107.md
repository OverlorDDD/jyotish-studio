# N4 D60 — FINITE FORMULA CERTIFICATION CLOSED + NATAL SEO / UX RC

**Date:** 2026-11-07 · **PR:** #143 → draft #142 · **Status:** Formula certification CLOSED, UI RC under review, no production deployment.

## Exact mathematical verdict

**`N4_D60_TRADITIONAL_SYMBOLIC_MATHEMATICS_CERTIFIED_CLOSED`**, based on:
- Original pinned JHora 8.0 Traditional D60 source: **500/500 signs**, across 50 authenticated private original synthetic cases (original binary SHA256 `3DDBE5FB0458AD1F0AD91B002C7EFB8BBA9F08891D3F46190ABA97D570B17908`).
- Independently executed PyJHora 4.8.7 Traditional chart_method=1: **500/500 signs and 450/450 relative houses**, across 50 fresh synthetic position cases, including near 0.5° boundaries.
- Source-bound Galaxiora `vargas.ts` Git blob SHA1 `3a4f2dec84a0ed13cb692f52a76612e0de1306e6`; method `JHora8-Traditional-own-rashi-inclusive-D60`.

The **symbolic D60 formula is certified and its research stage is CLOSED**. Do not start another redundant 500-case formula audit without a source-method change.

This certificate does **not** guarantee that an individual birth record's civil time, hospital time rounding, longitude, coordinate provenance or D60 Lagna are exact. Existing private native Swiss sensitivity diagnostics observed D60 Lagna differences at ±15 seconds in **11/50 test cases**, and at ±30 seconds in **25/50**. These are sample observations, not real-world probabilities. Numerical sampling alone does not prove every trajectory in every period stable between samples. Unknown minute precision remains an ordinary **input confidence** issue, not an incomplete mathematical formula certificate.

## Unified 16-chart UI, no separate D60 block

- D1/D9/D10 primary; 13 thematic tabs include D60 alongside D30, not in a separate accordion.
- D60 uses the same North Indian chart viewer and placements table, fed by the separate digest-bound `n4D60` validated backend payload; this keeps the earlier 15-chart API contract stable while the UI shows 16.
- Date, time and selected city are the only main fields. Beside time is a simple checkbox `I don’t know the exact minutes / Не знаю точних хвилин`. Native HTML `type=time` always has minutes when valid, so **missing precision cannot be detected solely from HH:MM**; the checkbox represents user-provided confidence, without guessing from a legitimate :00.
- If minutes are unknown, show a short caution beside the time field and on D60. Even with minutes provided, its Lagna and houses are labelled provisional due to seconds sensitivity.
- No default fictitious Delhi or birth date. Preserved existing historical DST rejection and no server-side AI reading of D60.

## SEO and user-first design

**Target intent:** non-expert free birth chart / kundli interest, then deeper 16-varge exploration, not only expert Jyotish users. English-first global with complete Ukrainian copy.

1. One readable H1 with birth chart benefit, short promise, one `#birth-details` CTA, original CSS celestial diagram, no third-party artwork/assets or copied competitor graphics.
2. Three steps → empty date/time/city form → immediate calculator → 16 charts and existing Reader v6.
3. Original benefit cards for Moon, rising sign, relationships and work, plus accurate local-language FAQ addressing sidereal difference and birth-time precision.
4. Semantic heading hierarchy, focus-visible controls, accessible names, balanced responsive grid at 320–1440px, `prefers-reduced-motion` safe.
5. Updated EN/UK title, meta description and OpenGraph; retained existing canonical and hreflang in `app/[locale]/astrology/jyotish/page.tsx`. Root `/` remains English natal landing, no redirect change; favicon, robots, GA4, Panchanga, reader and account remain untouched.
6. Structured data remains only the trusted sitewide `WebSite` / `Organization`, no fake FAQ rich result promises or unproven star ratings. Do not store birth data in query links or analytics.

**Competitive/Google context:** Astro.com and Cafe Astrology offer clear date/time/city entry and explicit unknown-birth-time pathways; our UX has a similar transparency but is original. Google Search Central emphasizes people-first unique content, descriptive titles and accessible server-rendered content. Neither SEO rankings nor new visitor acquisition are guaranteed by a redesign.

Sources:
- https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://www.astro.com/free/free_chart_e.htm
- https://astro.cafeastrology.com/natal.php

## Remaining steps (not another D60 mathematical stage)

- Exact-head CI must pass build, external PyJHora, typed contracts, UA/EN browser screenshot-equivalent scenarios, mobile 320–1440 widths and SEO canonical/title. No claim of production before explicit approval and site verification.
- **Next product step remains:** user reviews natal UX design; then extend deterministic Reader v6 for all 16 cards with source bounds and time uncertainty; after editorial QA integrate AI interpretation under explicit approval. D60 house-based AI remains disabled until per-birth stability is supported.
- **No merge** of #120 or #142 or #143, no AWS production deployment and no live-site SEO changes in this work.
