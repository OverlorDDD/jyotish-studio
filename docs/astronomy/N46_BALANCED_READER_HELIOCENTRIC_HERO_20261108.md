# N4.6 — Balanced Natal Portrait + Auto Reader + Heliocentric Hero

**Branch:** `feat/n4-d60-certified-precision-20261107` (draft PR #143). **Deployment:** not merged, not deployed to production.

## Owner-reported failures

1. "Підстава: тематична карта D10" appeared twice among the first three takeaways because the "best resource" selector could select D10 and "career" was always D10.
2. The Reader was eloquent in parts, but it still mixed boilerplate with unsupported upbeat text. User wants warmer, richer, more direct interpretation **including both strengths and genuine difficult patterns**.
3. Local Reader was a second manual action after the completed chart.
4. Hero art showed the Sun as one displaced planet on decorative arcs; not a physically coherent solar-system schematic.

## Changes committed

### 1. No duplicate chart evidence in takeaways
- `apps/api/src/reader-v8.ts`: primary and secondary insight selectors exclude D10 (reserved for career) and remain mutually distinct. Three takeaways reference **three different** thematic charts.
- `apps/web/app/components/ReaderV8View.tsx`: remove repeated "Підстава: тематична карта Dn" subtitles in the three highlights; keep exact source codes, source-book edition and numeric evidence in **one** expandable details panel per corresponding thematic story.

### 2. Thematic depth and real polarity
- `apps/api/src/reader-editorial-n45.ts`: maintains fifteen separately authored lyrical themes with their practical actions, **now upgraded to the explicitly versioned** `n46-balanced-portrait-1.0.0`.
- The voice distinguishes `supportive`, `challenging`, `mixed`, and `nuanced` based only on **actual activated source-verified support and friction**, not luck, random numbers or generated confidence.
- Each of 15 readings includes an opening, calculated potential, concrete real-world scene, possible blind spot, and one low-risk action. No fatalistic/hyperbolic outcome claims from historical texts.
- Main paragraphs are reader-facing; technical source IDs and OCR references remain inside disclosures. Historical text source validation and D60 no-personal-reading gate unchanged.
- `apps/api/src/nest.ts` successful-AI cache already includes the editorial version symbol (whose value now changes). All web/server/report E2E checks and local Windows preview scripts expect this new edition, preventing stale saved reports from masquerading as the new one.

### 3. Automatic reading after chart calculation
- `apps/web/app/astrology/jyotish/page.tsx` calls `interpret('local', calculatedChart)` immediately after *verified* successful calculation. Using the actual returned chart avoids the React state-update race.
- Reopening a saved chart without a compatible saved report also starts the local Reader. Cloud AI **never** runs on this automatic path.
- The Reader button has `aria-pressed=true` and visible gold emphasis when the deterministic report is active.
- Requests are versioned locally to prevent an obsolete/slow Reader/AI reply from overwriting a newly calculated chart or a newer consultation.

### 4. Astronomically coherent schematic
- `apps/web/app/components/NatalSkyLayers.tsx`: **Sun at an orbital focus**, actual radial order Mercury/Venus/Earth/Mars/Jupiter/Saturn/Uranus/Neptune; Moon is Earth's satellite on its local small orbit, **not** a ninth planet on an independent solar orbit.
- The eight solar ellipses use approximate real eccentricities. Canvas is rendered in a perspective-projected view, with art-directed **non-real-date** planet anomalies, illustrative body sizes, and schematic distances.
- The Sun, orbit rings, planets and Earth-Moon remain aligned during pointer motion. Cursor easing moves the sky background more than the stable Solar System; no forced planet movement or jitter.
- Original restrained navy/gold/mineral graphics, hover names and reduced-motion support remain. A subtle visible caption explains `orbits and sizes not to scale`; it is **not** a live ephemeris.

## QA

- `tools/n46-balanced-reader-hero.test.mjs`: checks 15 themes UA/EN for multiple synthetic charts, distinct 3 highlights, positive/negative/mixed styles based on flags, practical actions, provenance and Sun-focus geometry with increasing orbital radii and eccentricities.
- `e2e/natal-landing-seo.spec.mjs`: checks Sun-centred art, ten selectable bodies, all eight heliocentric orbital positions and reduced motion.
- `e2e/n4-d60-provisional.spec.mjs`: asserts **automatic local report request exactly once** after verified chart, Reader visible, pressed state true and no AI consultation.
- `.github/workflows/n43-reader-ai.yml` runs the new deterministic test before API/web production builds. Existing D60, browser, QA and Windows local preview remain in CI.
- Any queued/in-progress CI should be accurately reported as pending until exact-head checks finish; previous green runs from another commit do not certify this code.

## Preview on Windows without Docker

Close existing 3000/4000 preview terminals; if Git is stuck asking to retry deleting a `.idx` file, press Ctrl+C. In a **fresh** PowerShell:

```powershell
$ErrorActionPreference = 'Stop'
$branch = 'feat/n4-d60-certified-precision-20261107'
Set-Location "$env:USERPROFILE\galaxiora-n4-preview"
git config --local gc.auto 0
git config --local maintenance.auto false
git -c gc.auto=0 -c maintenance.auto=false fetch --no-auto-gc --no-tags origin $branch
if ($LASTEXITCODE -ne 0) { throw 'Git fetch failed' }
git -c gc.auto=0 -c maintenance.auto=false merge --ff-only "origin/$branch"
if ($LASTEXITCODE -ne 0) { throw 'Fast-forward failed' }
powershell.exe -NoProfile -ExecutionPolicy Bypass -File '.\tools\n44-preview.ps1' -SkipGitPull -ReaderOnly
if ($LASTEXITCODE -ne 0) { throw 'Local preview failed' }
```

Expected markers: `N44_REAL_SWISS_READER_8_REPORT_VERIFIED`, `N46_BALANCED_READER_VERIFIED`, `N44_CLASSICAL_READER_8_PREVIEW_READY`. Open http://localhost:3000/uk/astrology/jyotish ; enter birth details and press **Calculate chart** *once*. Reader auto-opens with the three different takeaways and 15 interpreted themes. The AI button remains a separate, opt-in action. To test AI deliberately, close both local servers and rerun without `-ReaderOnly`, with an actual privately configured provider key.

**Do not merge PR #143 or run EC2 deploy scripts until exact-head CI and human acceptance; this branch might be behind newer main.**
