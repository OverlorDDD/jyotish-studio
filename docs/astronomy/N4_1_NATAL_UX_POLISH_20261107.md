# N4.1 — Natal UX Polish (pre-release)
Date: 2026-11-07. Scope: draft PR #143, **no merge/no AWS deployment**.

## Approved requirements and implementation

1. **Layered sky, not a tropical wheel.** `NatalSkyLayers` is an original CSS/SVG multi-plane constellation illustration, with mouse parallax, four clickable themes and reduced-motion safeguards. The scene is explicitly marked as non-calculated. It never pretends to show real birth planet positions or a tropical circular chart.
2. **First-screen benefit.** UA/EN hero leads with **16 карт життя / 16 life charts**, traditional strengths and blind spots, relationships and career, free chart CTA, and a secondary discovery link. Benefit cards describe concrete D27/D30, D9/D12 and D10/D24 use cases. Traditional symbolic reading is distinguished from psychological diagnosis.
3. **All 16 immediately discoverable.** `N4RcExplorer` renders all 16 theme tabs in a responsive grid without hidden details/accordion. D1 is always on the left and any selected Dn appears to the right. D1 selection explains how to choose a comparison instead of duplicating D1. Square 1:1 fixed-sign chart cells, small-screen stacking, explicit D60 precision notes unchanged.
4. **Approved spiral #6.** Original SHA-locked `apps/web/brand-assets/galaxiora-approved-spiral-6.png` is unchanged. `npm run dev:web` now generates `/galaxiora-favicon.png`, ICO, Next app/icon.png and header PNG before local Next starts, as the production `prebuild` already did. Stable favicon URL for Google Search remains the same; Google SERP cache refresh is outside our control.
5. **Quality and SEO.** Updated localized description and OpenGraph benefit texts while preserving canonical and hreflang. E2E checks 16 open tabs, D1/D24 square comparison, clickable sky, reduced browser overflow ranges, and actual header image loading.

## Acceptance and release gate

- Node/core/web build and the original independent D60 mathematical certification must pass.
- Browser QA in UA/EN at 320, 360, 390, 430, 768, 1024, 1440px: no horizontal overflow; two square charts at desktop and stacked on mobile; controls keyboard focusable; logo loads without 404.
- D60 remains provisional for individual birth-time uncertainty; no new unverified astrological claims or AI reader integration.
- Review locally with the PR branch, then explicitly approve a separate production release. Do not treat CI success as proof of production, or production favicon correctness as Google SERP cache correctness.

## Local Windows preview

In `C:\Users\Note\galaxiora-n4-preview`, run `git pull --ff-only` then `npm run dev:web`. Existing `.env` and npm dependencies can be retained. Browser at `http://localhost:3000/uk/astrology/jyotish`. Actual calculated charts additionally require the local API and PostgreSQL; for UI-only visual review, the empty-state navigator, interactive hero and logo work without them.
