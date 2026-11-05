# Galaxiora G3.4 — First-party analytics and optional sign-in readiness
**2026-11-05 · implementation PR · no production deployment or external outreach**

## Existing functionality confirmed in main
- Admin `/uk/admin` and `/en/admin` already showed overview, anonymous 7-day `VisitorAggregate` counts, GA4 Data API active users and GA4 7-day sessions. It duplicated 30-minute GA4 active users once inside the main metric grid and again below.
- The existing server counter is one UTC day × safe section × metric, with no unique IDs, IP addresses, cookies, raw referrers, query strings or birth details. It **counts eligible HTML requests**, not deduplicated people, sessions or proven human visits; API successes can include automatic Panchanga.
- Current registration is verified email/password with Turnstile. Public Jyotish, Panchanga and Tarot already work for guests. No existing Google or Apple account provider. Existing user table has mandatory passwordHash and unique email.

## Implemented now
1. **Single centered analytics panel:** one 7/30-day selector; one row with four fundamentally different server metrics (HTML requests and three operation categories); daily trend; popular public sections; coarse referral groups; a compact separate GA4 strip with seven-day sessions and 30-minute active users exactly once. Accounts/subscriptions/orders/AI remain operational statistics below, never added to visitor measurements.
2. **Same database table:** additional enum-like metric strings `ref_google`, `ref_other_search`, `ref_social`, `ref_partner_tag`, `ref_other_referral`, `ref_unknown` stored in the existing `VisitorAggregate` (`day, section, metric, count`). No Prisma schema migration or new table. A source bucket is counted only for an eligible public HTML request and cannot inflate the base request total.
3. **Privacy boundaries:** at request time, inspect source domain and a tiny allowlist of declared UTMs, reduce to a fixed category **before sending it to the API**. No raw referrer or URL stored or sent. No client cookie, identity fingerprint, device ID, login requirement, advertising or Google ping without consent. Referer may be omitted; UTM may be spoofed; these are **approximate categories, not verified origin**.
4. **Historical honesty:** source tracking starts with this release. Pre-existing request counts have no source classification and appear as `Before source tracking`; never silently relabel old traffic as direct. Unknown is a separate category for newly classified hits with no usable Referer/UTM.
5. **7/30-day private endpoint:** existing `/api/v1/admin/traffic/visitor-analytics?days=7|30` remains ADMIN-only and no-store. Raw data never leaves the operational database except as sums per date, section and fixed channel. Reject unsupported windows.
6. **Guest-first sign-in:** the existing account modal explicitly offers `Continue as guest`. No new auth gate and no broken Google/Apple button.

## What was deliberately NOT implemented
**Google OAuth and Apple Sign-In are not live**: production OAuth requires the domain's own provider credentials and a safe provider-subject/account-linking model. Do not infer identity from unverified email or silently merge an existing password account. Avoid a UI button until a full server-side flow, credential provisioning, provider-subject unique constraint, conflict/linking UX, anti-CSRF state/nonce, HTTPS-only callback, account recovery, Apple relay-email considerations and tests exist.

### Recommended next auth milestone (separate review)
- **Google first:** server-side OIDC authorization-code flow with state, nonce, PKCE; verified issuer, audience, signature, expiry and stable `sub`; authorized redirect URI configured in Google Cloud; a dedicated unique provider identity separate from User.email and no automatic linking by email. Scope only `openid email profile`. Maintain guest mode.
- **Apple later:** requires Apple Developer account, Services ID associated with a primary App ID, domain/return URL registration and server token validation, plus relay-email-safe account handling. More operational overhead; only justify based on actual users.
- No consent bypass or client-side trust of an unsigned ID token.
- Sources: https://developers.google.com/identity/openid-connect/openid-connect and https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web

## Deployment requirements
- Review and green CI, current production ancestry, no overlap with concurrent Natal N4 changes or untracked AWS assets.
- No Docker production deployment, no database migration. Restart API (new aggregate metric) and Next.js (new middleware, admin UI and guest modal) only from a verified release.
- Production smoke: ensure `VisitorAggregate` query permission ADMIN-only; `?days=7` and `?days=30` return dense UTC daily buckets and no PII; an allowed tagged public document gives exactly one base request plus one source bucket; bot/private/cached cases do not get counted; existing GA4 and GSC remain separate; verify mobile 320px and desktop.
- Baseline data cannot be backfilled; empty source chart before deployment is **not** evidence of zero search visitors.

## Operator-controlled AWS release script
- `tools/g34-aws-release.sh preflight TARGET_SHA` validates the current production git ancestor, exact `main` SHA, strict reviewed path allowlist (quiet-consent PR #125 and this PR only), local tracked/untracked collision risk, `.env` settings, CI, services and public health. An unrelated Natal N4 main commit **blocks** this release instead of silently deploying it.
- With explicit `G34_DEPLOY_APPROVAL=I_APPROVE_G34_PRODUCTION`, the script archives the existing `.next` build, untracked inventory, environment backup and previous SHA; updates both NestJS and Next.js without Docker or migrations; checks approved galaxy #6 artwork, guest pages and anonymous denial of ADMIN analytics; automatically attempts a code-only rollback on failures.
- The package test `tools/g34-release-contract.test.mjs` and `G3.4 First-Party Analytics Privacy and UX` workflow validate these safety properties. Do **not** run until the exact merged `main` SHA has all required checks marked success.
- Exact source data still starts only **after** release, and the first chart may show no source evidence; no synthetic historic traffic.
