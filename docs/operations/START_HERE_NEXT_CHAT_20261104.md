# Galaxiora — START HERE: canonical GitHub / production / SEO handoff
**Audit: 2026-11-04.** Read this file and [PROJECT_STATUS.md](../../PROJECT_STATUS.md) before any new coding, SEO or deployment task.

## Single source of truth
- Repo: `OverlorDDD/jyotish-studio`; **GitHub default integration branch = `main`**. Checked main SHA: `f4fa9bdf0becc2e0b66d57b89198341f8c9ec72b`. Recheck before starting new work.
- **PR #113** consolidated the former live GROWTH-1 branch and G3.0/G3.1 into `main`. GROWTH-2 documents also have identical Git blobs in `main`; redundant **PR #108 closed after proof**, not deleted. The prior G3 PR #110 is included through the integration commit; it need not be re-merged.
- Branch count at audit = **118**, most retained for historical recoverability, **not 118 active release tasks**. Open PR count changed from 14 to **13** after closing #108. Do not delete branches, force-push, or bulk-merge unreviewed work.
- **GitHub code ≠ AWS production**. Owner verified GROWTH-1 with `GROWTH1_VERIFICATION_COMPLETE`. No current EC2 `git rev-parse HEAD` was fetched during this audit; G3.0 delivery to GA4 production is **not verified**. Never claim a CI-green PR was deployed.

## Priority queue
| Item | GitHub | Release / next action |
| --- | --- | --- |
| GROWTH-1 | In `main` | Owner verified live |
| GROWTH-2 | Research files in `main` | No campaign spend/publication |
| G3.0 analytics | Instrumented & tested in `main` | Check actual EC2 SHA, QA real GA4 DebugView, consent/private-data gates |
| G3.1 competitor audit | In `main` | Completed research, no AWS changes |
| G3.2 | Planned | First external visitors after funnel acceptance |
| GalaxiPedia | draft PR #111 to `main` | Separate approval, then CI/deploy |
| GalaxiPedia SEO | draft PR #112 to #111 branch | Depends on #111 |
| SEO-2 /astrology redirect | draft PR #114 to #112 branch | Depends on #111 and #112; NOT in main |
| Other old PRs | Historical or unique divergent commits | Review individually; never bulk-close/merge |

## Direct SEO intent -> canonical destination
| Intent | English | Ukrainian |
| --- | --- | --- |
| Tarot | `https://galaxiora.com/en/tarot` | `https://galaxiora.com/uk/tarot` |
| Birth chart / Kundli / натальна карта | `https://galaxiora.com/en/astrology/jyotish` | `https://galaxiora.com/uk/astrology/jyotish` |
| Panchanga | `https://galaxiora.com/en/panchanga` | `https://galaxiora.com/uk/panchanga` |
| Brand | `https://galaxiora.com/en` | `https://galaxiora.com/uk` |

**Already in main:** unique Tarot and birth-chart UK/EN metadata; direct calculator/Tarot content; canonical/hreflang; sitemap paths and `tools/seo-direct-intent.test.mjs`. Search engines decide what page ranks; the site cannot reliably read original Google search keywords. No automatic Google-referrer keyword redirection, thin doorway sites, or keyword stuffing. Tarot's draw still requires account sign-in: avoid promises of anonymous readings.

## Non-destructive workflow for EVERY new chat
1. Read `PROJECT_STATUS.md`, `AGENTS.md`, this handoff. Refresh `origin/main`; inspect `git status --short` and GitHub PR head/base. Start new work **from current main** with short-lived PR **to main**; the GalaxiPedia stack is a documented exception.
2. Check feature source and CI. Required relevant gates: `npm run test:g3:funnel`, `npm run test:visitor-analytics`, `npm run test:seo:direct-intent`, `npm run test:growth1:seo`, `npm run test:r32:seo`, `npm run build`. Astronomy/Panchanga regressions for related code.
3. Before AWS deployment check actual `/opt/galaxiora/app` SHA, `git status --short`, generated `next-env.d.ts` and untracked icon artifacts. Never use `git reset --hard`, `git clean` or blind branch checkout. Safeguarded pinned SHA + backup + rollback + verified branding (galaxy #6).
4. Verify real GA4 DebugView events and absence of private birth/question/location data; server HTML request counters ≠ unique visitors.
5. Only after successful production checks update `PROJECT_STATUS.md` with exact deployed SHA and acceptance.
6. Do not claim all local Windows changes are pushed without checking user local working tree; GitHub cannot see them.

### Read-only Windows PowerShell diagnostics
```powershell
git fetch origin main
git status --short
git rev-parse HEAD
git rev-parse origin/main
git branch -vv
$key="$env:USERPROFILE\.ssh\galaxiora-aws-key.pem"
ssh -i "$key" ubuntu@13.50.218.38 'cd /opt/galaxiora/app && git rev-parse HEAD && git status --short && systemctl is-active galaxiora-web galaxiora-api caddy'
```

**Next actionable work:** real production G3.0 acceptance, then user-acquisition G3.2. GalaxiPedia drafts can proceed independently after review.
