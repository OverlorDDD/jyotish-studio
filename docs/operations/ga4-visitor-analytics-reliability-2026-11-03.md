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
