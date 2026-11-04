# Galaxiora · SEO-1 + GROWTH-3.0 — Unified Engineering Release
**2026-11-04 · GitHub release candidate · NOT deployed**

## Goal and authority
One guarded engineering change covers public crawlability, UK/EN metadata, synthetic mobile performance and privacy-safe funnel measurement. Start from refreshed canonical main (initial audited SHA e800de1bdab824bf30868867e0f81bb013c026e0), guided by AGENTS.md, PROJECT_STATUS.md, docs/operations/START_HERE_NEXT_CHAT_20261104.md and docs/seo/g3-0-g3-1-execution-audit-20261104.md. Production HEAD is UNKNOWN until directly inspected on EC2. CI green does not prove AWS deployed.

## What exists already; what this PR adds
- G3.0 already records consent-based public_tool_viewed / public_tool_started / public_tool_completed / public_tool_failed / public_tool_auth_required for Jyotish, Panchanga and Tarot. No new tracking provider or private-event payloads.
- This PR adds coarse GalaxiPedia coverage to the GA4 public-path allowlist. Pages like /en/pedia/what-is-tithi-lunar-day and /uk/pedia/topic/panchanga become /en/pedia and /uk/pedia, while the localized glossary remains an approved public route. Article-to-tool clicks from Pedia are tracked without leaking document slug, URL query, user text or natal details.
- The consent notice now accurately explains the start/completion events. Existing GA4 opt-in is unchanged.
- A new read-only live audit validates GET/200, canonical, hreflang, HTML language, noindex, robots private-route exclusions and listed sitemap canonicals. Optional --require-pedia tests Pedia articles and visible breadcrumb navigation ONLY after the Pedia PRs land. An actual Google indexed-status check still requires Search Console URL Inspection.
- New fixture tests cover no-write, unsafe origin, noindex, broken canonical/hreflang, missing breadcrumb and successful two-language site.
- Browser performance baseline now samples UK/EN tool landings at desktop, 360px and 390px viewports; Pedia route samples are opt-in via SEO1_G30_REQUIRE_PEDIA=1. These are lab measurements, NOT CrUX or proof of INP.
- New unified GitHub Actions workflow runs focused privacy/SEO tests and production build, and supports a separately triggered public read-only audit. Existing G3 browser CI captures timings after the privacy E2E tests.

## Explicit GalaxiPedia and release blockers
1. Pedia is NOT integrated into canonical main. The active PR stack is #111 → #112, with #114 and #117 both depending on #112 as sibling PRs. #117 is not merged to main. Their head branches diverge from main; DO NOT bulk merge, change PR base without rechecking ancestry, or overwrite recent GA4, spiral #6, Panchanga and astronomy logic. Review/merge/rebase in dependency order and re-run CI. This unified PR does not secretly absorb this divergent stack.
2. The owner saw Pedia live, but live production SHA is not independently verified and may be ahead of main. Never check out main blindly on EC2. Preserve dirty tracked next-env.d.ts and untracked approved brand overlays; do not reset --hard or git clean.
3. Tarot still requires account sign-in; G3 measures auth_required but does not bypass auth. An anonymous tarot trial needs separate anti-abuse and permission design.
4. GSC indexing, GA4 DebugView receipt and real-user Core Web Vitals cannot be marked PASS by a code test or sitemap response.

## CI acceptance commands
Run from repository root on an appropriate Node 22+ environment with dependencies/DB prepared:
    npm run test:seo1:g3
    npm run test:g3:funnel
    npm run test:visitor-analytics
    npm run test:r42:growth
    npm run test:seo:direct-intent
    npm run test:growth1:seo
    npm run test:r32:seo
    npm run build

Existing browser test must confirm no GA4 before opt-in, coarse public tool events only and no passive Panchanga completion. A green CI requires an actual test report; don't infer it from the presence of the workflow file.

## Production gate — stop if SHA or file integrity is unknown
First inspect EC2 without modification, e.g. from Windows PowerShell:

    $key = "$env:USERPROFILE\.ssh\galaxiora-aws-key.pem"
    ssh -i "$key" ubuntu@13.50.218.38 'cd /opt/galaxiora/app && git rev-parse HEAD && git status --short && systemctl is-active galaxiora-web galaxiora-api caddy'

Compare server HEAD, GitHub main and required feature ancestry. Unexpected SHA, dirty working tree, missing Pedia or brand-v6 assets = STOP. Engineering then prepares approved pinned-SHA deploy with backup, rollback and existing smoke gates; NO automatic AWS deploy in this PR.

After successful deployment:
- npm run site:check; npm run launch:verify; npm run r32:seo:audit, verify approved logo #6, auth, Jyotish accuracy and Panchanga.
- npm run seo1:g3:live (or node tools/seo1-g30-live-audit.mjs --json). Once #111/#112/#117 are approved and truly live, include --require-pedia.
- For GSC, URL Inspection on /en, /uk, both Jyotish and Panchanga landings, plus two Pedia articles: record indexed/not-indexed reason, Google-selected canonical and last crawl. Do not repeatedly resubmit unchanged pages.
- GA4 DebugView after manual consent using synthetic inputs: viewed → started → completed for all 3 tools. Confirm data parameters only tool/locale and no birth date/time, lat/long, account ID, private URL or Tarot question. Guest Tarot 401 is auth_required, not completed; default Panchanga autoload is not completed. Declining consent must send no GA4 events.
- Run synthetic browser timing script and check documentWidth <= viewportWidth at 360px, plus real mobile interactions. Real-user thresholds are LCP <=2.5s, INP <=200ms and CLS <=0.1 at p75, from GSC/CrUX/PSI, not from this lab run.
- Store deployed SHA and acceptance evidence in PROJECT_STATUS.md only AFTER verification.

## Status / decision gate
| Requirement | Current |
| --- | --- |
| Unified SEO1+G3 code and tests | Prepared in PR; CI pending |
| GalaxiPedia dependent PRs + breadcrumbs | Separate PRs #111/#112/#117; NOT integrated |
| AWS deployment, true SHA and rollback | UNKNOWN / BLOCKED |
| Live canonical/hreflang/sitemap/robots | Read-only audit added; requires post-release run |
| Google index state | UNKNOWN (Search Console URL Inspection) |
| GA4 true tool completion receipts | UNKNOWN (DebugView after deployed SHA) |
| Real-user Core Web Vitals | UNKNOWN (GSC/CrUX) |
| Independent acquired visitors and completions | Not claimed; owner tests excluded |

After these gates, proceed to G3.2 free-first acquisition, not premature paid ads or volume claims. Weekly owner report: where independent visitors came from, what they completed, and the single next experiment. Missing data = unknown, not zero.
