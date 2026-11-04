# GA4 Reliability + Anonymous Visitor Analytics (2026-11-03)

## Measurement boundaries

- **Server aggregate**: PostgreSQL UTC day + section + metric counters only. No request URL, IP, cookie, UA, device token, referrer, session ID, birth coordinates, question or client ID is retained in analytics tables. The HTTP middleware excludes known bots, Next prefetch, RSC, private routes and non-HTML requests; UA spoofing, internal caching and eventual 404 mean **not unique visitors, verified humans or true 200-only page views**. Anonymous API tool success counts include automatic calculations. The server counter requires an already configured shared `AUTH_SECRET` (at least 24 characters) and the internal API loopback transport. No extra third-party service.
- **GA4**: Basic Consent Mode v2, no Google script before acceptance, `ad_storage`, `ad_user_data`, and `ad_personalization` always denied. Default consent is queued before config; `send_page_view:false` and one explicit sanitized page_view per public route. Google can still block or delay results. The 7-day sessions in Data API core report are distinct from last-30-minute active users.
- **Advanced Consent Mode**: not enabled. Under denied consent it can emit cookieless pings to Google; deploy only after region-specific legal/DPA assessment.
- **Browser diagnostics**: script loaded is not proof of delivery. Observed /g/collect is proof of an attempted network request, **not** of Google accepting it. A true acceptance check requires the actual GA4 property via Realtime or DebugView.

## Safe verification on live production

1. On EC2 ensure `NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-SZDVCT8TF4` at **build** time, `GA4_PROPERTY_ID` is the numeric GA4 property ID, and the Data API service account has access to the SAME property. Verify `AUTH_SECRET` is shared by web/API. Never expose private key or token in logs.
2. Run `npm run db:migrate && npm run build && npm run r42:ga:doctor` before web/API restart. Backup DB first. A changed migration only creates `VisitorAggregate`. Preserve the existing `SITE_NOINDEX`, translations, artwork, JQA-3 assets and Panchanga.
3. Open a fresh browser profile with ad-blocker disabled: `https://galaxiora.com/en?ga4_debug=1`. Before consent, no `googletagmanager.com/gtag/js` or `google-analytics.com/g/collect` should appear. Choose **Allow analytics**. DevTools Network: filter `collect`, verify `tid=G-SZDVCT8TF4` and `en=page_view` plus `en=galaxiora_debug_ping`; no raw URL query or personal information in `dl`. Reload, navigate public pages, check one `page_view` per navigation.
4. GA4 > Admin > Data display > DebugView: locate `galaxiora_debug_ping` and `page_view`. Check GA4 Realtime, which may update with a delay. **These cannot be certified by GitHub CI alone**.
5. Request public `/en/panchanga` with ordinary browser Accept:text/html; admin Visitor Analytics should show aggregate counts regardless of GA4 consent (may update after async write). Confirm bot/private route tests and `/api/v1/admin/traffic/visitor-analytics` permission gate.
6. Validate `npm run site:check`, `npm run launch:verify`, `npm run test:visitor-analytics`, `npm run test:panchanga`, brand and SEO checks after deploy. Confirm service status `systemctl is-active galaxiora-api galaxiora-web caddy`.

## Safe deployment decision

- Build and migrate only after CI passes; do not merge or deploy if source is behind the current EC2 worktree.
- A GitHub commit is not an AWS deployment. No external production credential is stored in this repository.
- Roll back web/API to the previously verified commit if tests fail. The additive counter table can remain safely unused.

## Guarded AWS release command (after CI green)
Run from SSH on the Galaxiora EC2 host:

```bash
curl -fsSL https://raw.githubusercontent.com/OverlorDDD/jyotish-studio/fix/ga4-reliable-anonymous-visitor-analytics-20261103/tools/ga4-visitor-aws-release.sh | bash
```

This refuses changes to **tracked** production files, but archives and retains non-conflicting untracked assets (including older logo scripts, existing package-lock.json and unusual console artifact filenames). It also recognizes the audited main-only galaxy-logo divergence without accepting unrelated commit changes. The database is backed up via the local PostgreSQL client or the verified local PostgreSQL Docker container. Invalid GA4 Measurement ID, missing database backup, mismatched history or failed health checks all block the rollout. Rollback restores the prior application commit and restarts both systemd services; the additive database table is retained. The user should review the script and ensure AWS privileges, database backup capacity and available disk/memory before running it. The script **does not** fabricate real DebugView acceptance.

### 2026-11-03 production worktree incident and fix

The first AWS run safely refused untracked files: `apps/web/brand-assets/galaxiora-circle-64.png`, `package-lock.json`, `tools/galaxiora-round-overlay.mjs`, and `o journalctl -u galaxiora-web -n 20 --no-pager`. None of these paths is tracked in the new analytics release. The guarded rollout now uses a tar archive with NUL-safe filenames and leaves the originals untouched; `npm install` updates the untracked lockfile as necessary after archiving it. `git clean`, force reset and destructive stash operations are intentionally prohibited.

`main` has 15 later commits containing only older round-logo files/edits not on the P410-based release lineage. The rollout tolerates precisely this audited set, retains a previous commit SHA for rollback, and regenerates byte-verified approved spiral #6 icons from the pinned asset. If AWS has any other branch-only changes, it fails closed.

## 2026-11-03 production lineage correction

AWS production was directly verified as `d2c77781781e65ee0b8af04e05bce62e9d61baea` (P410 merge). The full **file tree** of this production SHA is byte-for-byte identical to the source P410 base `d56ecf7cdb559f1ae91464cd068bcf6cfa9a4551`; although histories diverged, there were **zero** file differences. All 23 analytics feature-file changes were therefore ported without conflicts onto a **new commit descending directly from d2c7778**, on branch `fix/ga4-production-d2c777-20261103`. The release script now requires `git merge-base --is-ancestor CURRENT_HEAD TARGET` and never consults `main`. It will not force a checkout over unrelated newer commits. Production's original P410 merge commit and all current unrelated features are preserved by ancestry.

## 2026-11-03 confirmed production issue: Google gtag commands ignored

Real browser diagnosis (user DevTools): consent `accepted`, tag `loaded`, `page_view` and `galaxiora_debug_ping` queued, **but no `/g/collect` network requests**. Connected Windsor.ai GA4 property `561822944` returned no reporting rows for 2026-11-01 through 2026-11-03. This is a stronger and independent confirmation than the admin Realtime widget, although cached GA4 reporting can lag.

Root implementation defect: `window.gtag=(...args)=>dataLayer.push(args)` pushed normal arrays, but Google's documented gtag integration queues the native `arguments` object. Their library processes the latter as commands. The mocked E2E transport erroneously accepted only arrays, thereby certifying a behavior incompatible with the documented real integration. Fixed by using `function gtag(..._args) { dataLayer.push(arguments); }` and making the shim reject arrays. The strict E2E must produce two simulated collector attempts with safe URLs and must fail against the old implementation.

**This does not independently verify real Google delivery.** After rollout repeat consenting debug visit; verify actual `g/collect` network requests and connected GA4 reporting / DebugView. If still missing, inspect client-side request blocking, actual Measurement ID, stream status and network environment. Do not send a fake GA4 Measurement Protocol event or report one as a human visit.
