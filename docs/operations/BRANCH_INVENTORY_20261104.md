# Galaxiora GitHub branch audit and consolidation · 2026-11-04

**Snapshot source:** GitHub branches API, open PRs API, compare-commits. Full machine-readable list: [branch-inventory-20261104.csv](branch-inventory-20261104.csv).

At first inspection: **115 branches and 64 open PRs**; after creating the consolidation integration branch, **116 branches**. This list is a snapshot, not a count of active releases.

## Root cause

`main` = `b0f3f16b8652`, containing 15 newer galaxy round-v4 commits absent from the owner-verified live GROWTH-1 code lineage.
Last owner-verified live release line = `release/growth1-preserve-live-ga4-20261104` = `529fa198946d`; by user report the GROWTH-1 UI was deployed, but **actual current EC2 SHA has not been fetched in this audit**.
G3.0/G3.1 = `feat/g3-0-g3-1-funnel-competitive-intelligence-20261104` = `b258c500156f`; independent source/CI tests previously passed, but GA4 production acceptance is pending.
GROWTH-2 research branch has two useful docs, copied into consolidation.
GalaxiPedia draft PR #111 is stacked on GROWTH-1; draft #112 adds SEO content on #111. Neither was merged or deployed in this audit.

The difference `release/growth1... -> main` consists of **15 main-unique commits touching 13 files** concentrated around icons/build scripts; `main -> release/growth1...` has **1921 release-line commits**. The large count is the history gap, not a tally of proven production bugs or new features.

## No-force, no-loss policy

1. **Preserve Git commit ancestry for both lines** through an explicit two-parent integration commit (parent 1 = current `main`, parent 2 = canonical release+G3 commit). Its tree is taken from user-confirmed production lineage, plus safe SEO metadata, GROWTH-2 research, agent instructions and this audit. The older `main` v4 logo files remain reachable through their SHA; they are NOT indiscriminately copied over approved production galaxy spiral #6. An explicit visual design decision is needed before activating v4 branding.
2. Review the integration PR against `main`, require CI green, and merge into `main` without force. Update status in `PROJECT_STATUS.md`.
3. **Do not delete any of the 116 branches now.** The inventory explicitly marks unverified historical refs; list length does not imply safe deletion. First prune old PRs where their head commit is actually an ancestor of the new `main` or whose diff has been independently proven equivalent; use `closed: superseded by ...` with explanatory comment, never erase code history.
4. Only after main converges, retarget draft #111 to `main` if its ancestry matches; keep #112 stacked on #111. G3.0 currently needs EC2 release acceptance; don't call it live because main contains code.
5. Finish separate reviews for **unique non-merged branches** below; neither auto-merge nor remove them simply because they lack a current PR.

## Specifically VERIFIED unique branches

Comparisons against G3.0 source line:

| Branch | Status | Unique commits on branch | Action |
| --- | --- | ---: | --- |
| `feat/jyotish-interpretation-v3-evidence-synthesis` | diverged | 26 | Code review/plan a targeted port if useful; no automatic merge |
| `feat/jyotish-reading-v3-glossary` | diverged | 8 | Verify against current Reader v6 and glossary; targeted port only |
| `feat/panchanga-p388-independent-qa-release-20261103` | diverged | 22 | Inspect QA/test fixes against current certified Panchanga |
| `feat/galaxipedia-unified-20261104` | diverged | 45 | Draft PR #111; preserve pending tests/acceptance |
| `feat/galaxipedia-seo-topical-clusters-20261104` | diverged | 62 | Draft PR #112; must follow PR #111 |

Checks also showed `fix/p390-favorability-and-two-ux-controls-20261103`, `feat/panchanga-daily-opportunities-20261103`, `fix/p389-activity-specific-panchanga-ux-20261103`, `release/panchanga-p388-independent-qa-20261103` and `fix/p388-native-postgres-deploy-20261103` **already lie in the G3.0 ancestor chain**, so their commits are not missing from that baseline. This verifies those names specifically, not every old branch.

## Open PR triage

| Group | PR IDs | Status/owner action |
| --- | --- | --- |
| Last owner-verified deployed GROWTH-1 | #109 (plus predecessors #107 / #106) | Include history through main integration, later close superseded if GitHub ancestry confirms |
| GROWTH-2 research | #108 | Useful two docs copied into canonical working tree; close only with explicit evidence |
| G3.0/G3.1 | #110 | Code included in integration; real GA4 delivery still must be QA'd on EC2 |
| GalaxiPedia | #111 | **DRAFT**, do not merge during branch cleanup |
| GalaxiPedia SEO articles | #112 | **DRAFT**, stacked on #111; keep separate |
| Panchanga and earlier history | #97 and below | Mostly historical chains, but must verify ancestry before closing; do not treat open state as active deployment |

## Standard future workflow

- GitHub default `main` = code integration source of truth (after approved PR).
- One feature per branch from `origin/main`; PR to `main`, tests and review; no daisy-chained PR bases except explicitly short-lived draft stacks.
- Explicit release candidate SHA -> backup and CI -> owner EC2 guarded deployment -> `site:check`, `launch:verify`, SEO audit, live GA4 DebugView when relevant -> update `PROJECT_STATUS.md`.
- Do not assume a branch was deployed just because user reports a UI looks different or GitHub has a green check.
- Keep `AGENTS.md` and `PROJECT_STATUS.md` fresh; new chats must check them first. Add changed files to PR; no local untracked file can be inferred from GitHub.
- **SEO routing:** Search result for Tarot should point to localized `/tarot` landing; for birth chart to localized `/astrology/jyotish`; sitemap/canonical/metadata/internal links. Search engines choose final results, do not force-redirect guessed query.

## Explicit limits of this audit

No write access to owner's local Windows git worktree or live SSH process in this context. Thus "all local changes pushed" is unprovable. This audit only establishes that its own changes are pushed to GitHub; the EC2 operator should check dirty/untracked files. The entire 116 branch ancestry has NOT been mathematically verified one by one. No branch deletion, automatic production deployment, advertising spend or guest auth bypass authorized here.
