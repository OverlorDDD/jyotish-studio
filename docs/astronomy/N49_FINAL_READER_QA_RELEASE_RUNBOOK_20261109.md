# N4.9 — Final interpretive QA, visual release gate and AWS runbook
2026-11-09 · Galaxiora · **no Docker** · current site baseline `0d0cda1471b7c242f50fc1902d4faf843ed80ce1`.

## Exact intended scope
- Retain astronomical Swiss/Lahiri/JHora mathematical input and 16-tab visualization untouched.
- The new Reader integrates verified D1 lord/Moon, professional D1+D9+D10, relationship D1+D9/Venus, and additional distinct Dn resource and counterpoint; its closing considers all 15 D1-linked internally verified vargas.
- Rendering is a readable sequential five-chapter story in UK/EN, not five two-column dashboards; proof and original-book source scope can be expanded per thread.
- Approximate birth-time control warns about sensitivity of fine divisions and suppresses D60 individual-sign assertions; D60 houses/lagna remain ineligible for personal interpretation.
- **Separate source scopes:** direct original-natal rule, OCR-reviewed text, modern Dn extrapolation, mathematical rule and human-created educational prose. These are not equivalent certainty levels.
- Scope exclusions: full Vimsopaka/Shadbala, degree-specific combustion/aspects/yoga prioritization, comprehensive 50-original-JHora independent natal verification, personal-future fact claims, external expert approval. This release must not be described as the certification of these excluded domains.

## 1. Human/technical editorial QA
Source check with:
- *Brihat Jataka* X.1 Sanskrit and two independent English presentations: https://www.siva.sh/brihat-jataka/10/1 and https://www.wisdomlib.org/hinduism/book/brihat-jataka-by-varahamihira-sanskrit-english/d/doc1501718.html .
- Historical 1905 version anchored in `apps/api/src/reader-classical-n44.ts`. The "unoccupied 10th → navamsa dispositor" decision is a **commentary-dependent conditional reading**, not a universal word-for-word equivalence of all editions.
- *Brihat Parashara Hora Shastra* 7.6–10 https://www.siva.sh/brihat-parashara-hora-shastra/7/6-10 , which requires further strength/context checks before predicting auspicious or inauspicious results.

Reproducible automatic reader evidence gate: `node --experimental-strip-types --test tools/n49-release-expert-qa.test.mjs`.
This executes **12 invented birth records x 2 languages** through real native Swiss Ephemeris, verifies D1→15 Dn signs/houses, references, per-thread factual proof, paragraph endings and privacy. It creates `qa-artifacts/n49-12-swiss-readings-uk-en.md` for manual sampling and `qa-artifacts/n49-fact-review-summary.json` to review the per-case matrix.

This is neither a human astrologer's approval nor an independent astronomical comparison: `runCalculation` and Varga assertions use the same production calculation implementation. Review the complete 24-case sample artifact and obtain a separately qualified human reading if seeking classical practice certification.

## 2. Screenshot/visual browser gate
In PR CI, `.github/workflows/n43-reader-ai.yml` starts the real loopback preview API and a built Next.js client; Playwright tests `e2e/n49-real-reader.spec.mjs` exercise actual native Swiss HTTP to deterministic Reader. No report mocks are used in this scenario.
- UA/EN, desktop + mobile Chromium; verify 5 interlinked sections, 15 detailed themes and the D60 caveat.
- Exact D9/D10 evidence expandable and no automatic cloud AI.
- Test seven viewport widths (320, 360, 390, 430, 768, 1024, 1440 pixels), no horizontal spill or inaccessible labels.
- Reduced-motion Hero, 16-chart N4 explorer, save toolbar and SEO via `natal-landing-seo.spec.mjs`. Existing mock-based D60 and 16-tab suites are also retained as regression tests, not independent astronomy checks.
- QA screenshots (320,430,1440 in both languages and device projects) live in GitHub Actions artifact `n49-browser-screenshots-ua-en`. Fixed header is suppressed only inside tall review screenshots, not in the real browser layout. **Human eyeball review remains distinct from screenshot generation.**

## 3. CI release criteria
On the exact N49 PR head:
- Linux N4.4 Reader gates, N4.9 12-case real-Swiss artifacts, full Core/API/Web build, native Swiss HTTP, D60 maths and hash contracts: all green.
- Windows PowerShell launcher and real native Swiss Reader preview: green.
- Chromium real N49 plus previous landing/D60/N4 browser suites: green.
- Growth privacy/SEO workflow: green.
- `bash -n tools/n49-aws-release.sh` and `tools/n49-aws-release-contract.test.mjs`: green.
Any red or pending check => no AWS deployment. If owner changes branch, get new full SHA and repeat; previous green SHA is no longer enough.

## 4. Safe AWS preflight and release
- Operator SSH identity: `$env:USERPROFILE\.ssh\galaxiora-aws-key.pem`; host `ubuntu@13.50.218.38`; repo `/opt/galaxiora/app`.
- Operator takes exact 40-char **green** commit SHA from PR #144. Never use floating `main` or an unverified branch name as the release target.
- Fetch the release script from `https://raw.githubusercontent.com/OverlorDDD/jyotish-studio/<GREEN_SHA>/tools/n49-aws-release.sh`, run `bash -n`, then `bash ... --preflight <GREEN_SHA>` and `bash ... --deploy <GREEN_SHA>` over one SSH session.
- Script validates branch origin and ancestor, refuses dirty tracked worktree except the known generated `apps/web/next-env.d.ts`, confirms currently running services, records previous SHA and private `.env` backup with owner-only permissions.
- Target checkout, npm install without rewriting lockfile, Prisma **generate only** (no schema migration), 12-case Swiss checks, API+Next build, service restarts, health checks, public UA/EN, and runtime edition check.
- On post-checkout failure, attempt return to previous SHA, rebuild and restart; a rollback marker is NOT enough without separately verifying the live site. **No Docker, no `git reset --hard`, no `git clean`, no destructive database commands.**
- Required terminal release marker: `N49_PRODUCTION_RELEASE_VERIFIED` and a SHA identical to exact green GitHub commit. Verify UI with actual new chart on both locales and browser hard reload.
- **If failed:** preserve log and stop. Do not force push, overwrite tracked production edits or guess a fix to the running process.

## 5. Release handoff
New code is in `feat/n49-evidence-linked-unified-natal-20261109` / GitHub Draft PR #144 based on current N4.8. Existing main/release hierarchy remains untouched; direct EC2 deployment does not merge PR. GitHub PR state and production state must be reported separately and not confused.

Finally, allow user to approve personal editorial quality based on private reading; do not ask for exact birth records publicly if the already computed evidence export suffices.
