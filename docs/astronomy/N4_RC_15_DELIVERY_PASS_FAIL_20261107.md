# N4 Release Candidate — delivery report and strict PASS / FAIL criteria
**Date:** 2026-11-07
**Scope:** draft PR #142 from current main, separate from research PR #120. No production, main, AWS, data migration or Reader v6 mutation.

## Delivery snapshot (source of truth: GitHub Actions per exact commit)

| Check | Last observed evidence | Verdict |
| --- | --- | --- |
| Selective main-based new branch instead of PR #120 wholesale merge | New branch `release/n4-natal-15-varga-rc-20261107`, draft PR #142; ~18 dedicated files only | **PASS** |
| Original symbolic rules preserved | `packages/jyotish-core/src/vargas.ts` Git blob `3a4f2dec84a0ed13cb692f52a76612e0de1306e6` (same independently 8000/8000 symbolically validated method) | **PASS for symbolic method alone** |
| Safe API | `runCalculation` first verifies `jyotish-integrity-v3` and D1/D9/D10, then creates digest-bound 15-card N4 annex; API no D60; same D2 Sun/Moon Hora | **PASS 7 contract-negative tests** |
| UK/EN natal UI | No automatic birth date/time/Delhi; controlled city selection or explicit advanced manual location; only 15 charts, D60 excluded; no duplicate D1; versioned method and year-mode text; preserved Reader v6 | **IMPLEMENTED, browser CI needed** |
| Real production same-profile Lahiri external 20-card audit | Actual GitHub Actions PR run 42377858637 (job candidate-unit-build) replayed all 20 genuine pinned JHora8 original charts with real native SWIEPH. D1 200/200, D9 200/200, D10 200/200, Moon 20/20 within 1 arcsec, Lagna 20/20 within 1 arcsec; maxima Moon 0.0059392852 arcsec, Lagna 0.8809024174 arcsec | **PASS within original JHora20 D1/D9/D10 scope** |
| Full source independent 50-chart 15-varge external certification | Original 50 **Lahiri/SunMoon** charts and all 15 varga original sign exports NOT available; True Citra/Uma-Shambhu 50 is DIFFERENT | **FAIL — release blocker; do not fabricate** |
| Source-bound unit tests, tamper, D60 and 1 arcsec negative | 10/10 actual GitHub CI PASS on 1f2d436... | **PASS** |
| Full current API runtime test | Actual N4 SWIEPH `runCalculation` -> verified D1/D9/D10 -> 15 annex -> client validator, Kyiv DST gap/fold fail closed. Passed in later GitHub N4 RC run, e.g. run 42378107992. | **PASS for actual isolated test** |
| Core + NestJS + Next.js build | PASS in GitHub Actions run 42377858637 (job candidate-unit-build) | **PASS on that tested SHA; current-head must be rechecked** |
| Browser UK/EN + 7 widths Playwright | Workflow defined, fixture is explicitly synthetic UI-only, not JHora oracle; launcher's test .env repaired, D1/D10 selector disambiguated. | **PENDING at writing, no fabricated PASS** |
| Full exact HEAD CI + owner production approval | Not attested for final report commit or explicit user-approved merge/deploy; draft PR unchanged | **FAIL release gate** |

**Important discovery:** current `main` `apps/api/src/logic.ts` already invokes true-sidereal-solar `vimshottariTrueSiderealSolar`, overriding legacy core fixed-year fallback. This RC PRESERVES that existing production-api convention; old research report's statement that whole production still used 365.2425 fixed year is stale for the active NestJS path. We do NOT claim this convention is authenticated to original JHora option code `YearDefinition=0 3` at full subday precision.

## Final release policy

- `tools/n4-rc-release-decision.mjs` intentionally prints `N4_RC_IMPLEMENTED_RELEASE_BLOCKED_PENDING_EXTERNAL_SOURCE_AND_CI`.
- New N4 D60 and AI remain OFF. The 15 additional charts cannot be publicly certified as a whole until 50 authentic external original *same-profile* cases, exact-profile boundary agreement and full green HEAD QA plus owner approval. No unapproved merger or production deploy.
- The one grouped local Windows verification script is `tools/n4-rc-verify.ps1`, fetch to temporary PowerShell using current PR branch and execute with `-ExpectedCommit`; builds/test in detached isolated Git worktree, no Docker and no AWS. It returns non-zero on build/test failure, writes only small source summary JSON locally, reports the release refusal as EXPECTED.
- No secrets, personally identified birth data or credentials are committed in this PR.

## Failure modes owned by explicit gate, not deferred microstages

1. If original JHora50 Lahiri method input unavailable, do not call new 15-card external certificate PASS. The source-matched 20 original D1/D9/D10 physical verification remains valid.
2. If N4 browser/build/core CI red, fix in the **same candidate PR**, do not deploy.
3. Even if CI green, no default original full Lahiri+SunMoon 15-varge independent cert or explicit production owner approval means `mergeOrDeployAuthorized:false`.
4. All global SEO canonical/robots, homepage branding and favicon, Panchanga, GA4, old Reader v6 remain outside this PR.

### CI references
- Initial real 10/10 tests + all builds + Lahiri20 PASS source: https://github.com/OverlorDDD/jyotish-studio/actions/runs/42377858637
- Real native SWIEPH full API integration passed in subsequent run: https://github.com/OverlorDDD/jyotish-studio/actions/runs/42378107992
- Active PR #142: https://github.com/OverlorDDD/jyotish-studio/pull/142
