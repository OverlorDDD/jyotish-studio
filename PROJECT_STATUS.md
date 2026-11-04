# GALAXIORA — REPOSITORY SOURCE OF TRUTH

**Updated:** 2026-11-04. **Read this file before starting ANY new coding chat, GitHub PR, or AWS deployment.**

## Canonical branch policy

- **`main` is the ONLY canonical integration branch** once the 2026-11-04 consolidation pull request has been merged and required CI is green.
- Development branches must start at the current `origin/main`, not at `fix/jqa3-*`, `release/panchanga-*`, `fix/ga4-*` or the numbered GROWTH/Panchanga feature chains.
- Push every change to a short-lived `feat/*`, `fix/*` or `docs/*` branch, open a PR targeting **`main`**, require CI, then merge and archive/close old PR. Avoid PRs that target another stale feature branch.
- **Production is not inferred from GitHub.** Always query `/opt/galaxiora/app` via authorized AWS owner access, verify `git rev-parse HEAD`, `git status --short`, and actual service/SEO health before any release. The owner last confirmed live GROWTH-1, but GitHub cannot independently prove the current EC2 HEAD.
- The consolidation intentionally uses the **last user-verified GROWTH-1 runtime tree plus G3.0 instrumentation** as the code foundation. It preserves the divergent `main` logo-v4 commits in Git ancestry but does **NOT silently activate** the alternative logo on the website: the production-approved galaxy spiral #6 must not change as a side effect of branch cleanup.
- **`main` is a code baseline, not proof that all features are deployed.** Deployed commit and runtime checks must be recorded separately after each release.

## Features and release state

| Workstream | GitHub | Production status / hand-off |
| --- | --- | --- |
| Galaxiora basic portal, Jyotish, Tarot, Panchanga, accounts, GalaxiNews, community | historical release lineage kept in Git | Existing live website as checked by owner |
| GROWTH-1 international brand SEO & first-screen tool CTAs | preserved in canonical integration | **Owner confirmed live:** `GROWTH1_VERIFICATION_COMPLETE` |
| GROWTH-2 acquisition research and video/SEO ideas | the two source reports included in canonical integration | Docs only; no ads/posts auto-published |
| GROWTH-3 G3.0 tool funnel and G3.1 competitor research | formerly PR #110, carried into consolidated integration | CI-tested; **needs AWS release + real GA4 DebugView confirmation** before calling live |
| GalaxiPedia unified Academy | **draft PR #111** | Code is separate; do NOT claim deployed |
| GalaxiPedia 14 bilingual SEO guides | **draft PR #112** stacked on #111 | Code is separate; do NOT claim deployed |
| G3.2 independent audience experiments, G3.3 UX, G3.4 paid campaigns | planned | Not published/launched; paid ads require explicit owner budget approval |
| Additional historic Panchanga/LLM branches | **historical references / review queue** | Do not bulk-merge without independent review |

## Direct search-intent landing rules (critical SEO requirement)

Google search queries are generally not available to the website on referral. **Never guess the query or perform a search-engine-referrer redirect** to determine the destination. Instead:

| User intent | EN canonical landing | UK canonical landing |
| --- | --- | --- |
| Tarot, tarot reading, 1-/3-card spread | `https://galaxiora.com/en/tarot` | `https://galaxiora.com/uk/tarot` |
| Vedic birth chart, Kundli, Jyotish, натальна карта | `https://galaxiora.com/en/astrology/jyotish` | `https://galaxiora.com/uk/astrology/jyotish` |
| Panchang today, Tithi, auspicious daily actions | `https://galaxiora.com/en/panchanga` | `https://galaxiora.com/uk/panchanga` |
| Brand-only Galaxiora / Галаксіора | `https://galaxiora.com/en` | `https://galaxiora.com/uk` |

Ensure each canonical URL is indexable, in the sitemap, offers bilingual `hreflang` (and suitable `x-default`), with unique intent-specific title/description, genuine H1/content, links from home and other relevant pages. Do not create duplicate thin pages or keyword-stuffed redirects. Search engines choose actual result URLs; no ranking/indexing guarantee.

**Truthfulness:** The current Tarot draw requires an account for readings; do not advertise anonymous guest access until a separately approved security-aware release exists. A free member benefit can truthfully be described as free.

## Engineering invariants

- Preserve approved design/branding, UA/EN metadata, certified astronomy, timezone and Swiss Ephemeris integrity, existing GA4 consent semantics, anonymous server counters, and API auth / moderation.
- Do not send natal birth inputs, precise coordinates, question texts, private URLs, user IDs, or error messages into GA4/marketing logs. Do not turn request counts into "unique visitors."
- Do not deploy by `git reset --hard`, `git clean`, or blindly checking out a divergent branch. The AWS host has historically had generated tracked `next-env.d.ts` and untracked icon/overlay artifacts; inspect, archive and protect them.
- Use `npm run test:g3:funnel`, `npm run test:visitor-analytics`, `npm run test:r42:growth`, `npm run test:growth1:seo`, `npm run test:r32:seo`, `npm run test:seo:direct-intent` and production build as relevant CI gates; run astronomy/Panchanga regressions for cross-cutting work.
- Use GSC for impressions/clicks; GA4 for consented visits and explicit completion events; don't equate observed hits with independent clients.
- Update this document's status, dates, PR references and AWS SHA after each successful release; do not infer deployment from PR merges.

## PR cleanup policy

- Preserve every branch and old PR **until verifying ancestry or cherry-pick equivalence**, so unique historical work remains recoverable.
- The old 100+ branch count reflects historical feature-chain architecture, NOT 100 active releases. Distinguish **history included** vs **not yet merged**, not open/closed labels alone.
- The only currently prioritized feature queues after reconciliation are: G3.0 production acceptance, GalaxiPedia draft #111, GP-SEO draft #112, then G3.2 user acquisition.
- Do not merge the draft GalaxiPedia PRs just to make the GitHub branch list shorter. Retarget them to `main` only when their dependency graph is preserved and CI validates the new base.

**Previous canonical chaos:** On 2026-11-04 GitHub reported 115 remote branches and 64 open PRs, while default `main` was at `b0f3f16` (separate galaxy v4 build lineage); GROWTH-1 live and G3.0/3.1 were on a separate `release/growth1...` lineage. Canonical integration is the explicit remedy, not a force-push.

Related docs: `docs/operations/BRANCH_INVENTORY_20261104.md`, `docs/seo/g3-0-g3-1-execution-audit-20261104.md`.
