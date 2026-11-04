# G3.2 post-merge browser CI recovery — 2026-11-04

## Incident and evidence
- Affected release: main `a78786eb27b860dde1330931b322805b6b87208c` (merged PR #121), **not deployed to AWS** as of the investigation.
- Failed workflow: `Jyotish Core CI` run [41847002794](https://github.com/OverlorDDD/jyotish-studio/actions/runs/41847002794), job `Chromium accessibility, SEO and user smoke`.
- Result: 118/394 E2E cases failed, while module/unit tests, JHora Windows fixtures, PostgreSQL integration and canonical main build all passed.
- Failure examples: obsolete P2 `Calculate day` button and P3 `p31-my-day`, retired astronomy panels, old Academy `/learn` CTA, wrong `/horoscope?sign` URL, and consent tests running with `NEXT_PUBLIC_GA4_MEASUREMENT_ID` **absent at build time**.
- Historical UI contracts predate P4.10 and GalaxiPedia. Their failures must not be mistaken for missing P4.10 functions. Their status remains an open, separately reproducible *historical compatibility debt*, not certified PASS.

## Repairs
1. Configure a synthetic `G-TEST123456` only in GitHub Chromium CI. This is **not** production GA4 and avoids silently compiling analytics out of browser tests.
2. Maintain a version-appropriate **current production browser contract** covering: desktop GalaxiPedia, original guides, auth, current P4.10 Panchanga daily guidance, verified astronomy and privacy, JQA natal navigation, horoscope, Tarot, yoga, GA4 consent + collection, news, SEO; plus explicit mobile runs.
3. Preserve all legacy specs, unchanged, under `npm run test:e2e` for manual archaeology and incremental migration. **Do not claim this historical 394-test inventory is passing.** The required GitHub job is explicitly the current production contract, not a disguised run of the legacy suite.
4. Fix the genuine G3.2 event attribution bug: public `/uk|en/pedia` article routes were missing from `safeGrowthPath`; add coarse `/pedia` mapping and article-to-tool click recognition. Allowlist only published SEO slug paths, never arbitrary user input, query strings, birth data or account paths. Add regression tests for Pedia -> Panchanga.
5. Update `G3.2` release gating after the fix is merged: previously downloaded deploy script pins old main SHA, so it **must not** be re-run unchanged after the merge. A new script must be pinned to the fresh main merge SHA with full current-CI checks and unchanged AWS preflight rules.

## Unresolved scope and honest acceptance
- Historical `npm run test:e2e` has 118 reported failures; it remains useful for tracking old UI contracts but **is not accepted evidence of current production correctness**. Modernizing remaining features is a separate tested task. In particular, old tests expecting daily horoscope copy to change in *every* field on *every* day are stricter than a tradition-grounded daily sky model; any actual repeated-content issue deserves its own focused product QA.
- Merge and deploy only when `Jyotish Core CI`, `Canonical main integration`, G3.2 tests, protected browser regression and all required GitHub checks for the **exact merged main SHA** are green.
- No bypass of a failed current browser test, no `git reset --hard`, `git clean`, Docker deploy, manual noindex/GA4 changes, or unreviewed migration.
