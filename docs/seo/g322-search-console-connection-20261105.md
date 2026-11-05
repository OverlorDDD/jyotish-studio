# Galaxiora G3.2.2 — Search Console Intelligence + polished organic guidance
**Date:** 2026-11-05 | **Scope:** GitHub PR, not production deployment | **Audience:** EN first + UK
**Exact baseline:** main `16b26b5234ecdd070a5cbfa2b94515341ab55d5e`, G3.2 already deployed by the owner.

## Diagnosis and rationale
- G3.2's original `query,page` data request cannot represent total Google Search exposure. Google's Search Analytics API returns top rows and hides/anonymizes some queries; adding query rows yields false site totals. Distinct page-only and date-only calls are required.
- The original GitHub workflow emitted a JSON artifact but no executive summary, leaving the owner unable to diagnose blocks without downloading machine output.
- Only a repository secret `GSC_SERVICE_ACCOUNT_JSON` can grant unattended GitHub Actions read access. The owner's existing Windsor.ai Search Console OAuth connection is confirmed for `sc-domain:galaxiora.com`, **but that token cannot be silently transferred to GitHub**. Credentials and permissions require explicit owner action.
- The G3.2 organic-intent cards had default left alignment and poor responsive composition. Their content must be centered, accessible and consistent with the approved cosmic aesthetic.
- First-party Windsor.ai observation on 2026-11-05 for GSC Nov 1–3 (daily rows): Nov 1: 12 impressions, 0 clicks; Nov 2: 11 impressions, 1 click; Nov 3: 14 impressions, 0 clicks. Total 37 impressions, 1 click. Very small sample; not proof of meaningful new traffic, independent visits, or a reliable overall CTR. Do not hardcode this snapshot into live reports.

## Workstreams / dependencies
| ID | Deliverable | Dependency | Failure mode and resolution |
| --- | --- | --- | --- |
| UX | Centered, mobile-first guidance shared across Jyotish, Panchanga, Tarot | Existing `OrganicIntentBridge` and global portal CSS | Local CSS module avoids collisions; max width, 320px checks, accessible focus/contrast/reduced motion |
| DATA | Three independent GSC views: property totals grouped by date, public pages by page, partial query samples grouped by query/page | Search Console Search Analytics API, domain property | Never sum query rows; mark unseen as unknown; 10 finalized Pacific-calendar days ending four days back |
| AUTH | Dedicated Google service account restricted to read-only scope and registered as a Search Console property user | Owner access to Google Cloud, Search Console and GitHub repository Settings | `sites.list` checks exact `sc-domain:galaxiora.com`, fail-closed if unauthorized; no keys in code/logs |
| CI | Scheduled read-only health, aggregate GSC, content, and Markdown scorecard | GitHub Actions schedule, secret | Missing secret emits UNKNOWN, invalid/denied secret marks failed; no PR secret exposure; JSON artifacts retained 14 days |
| QA | Unit, OAuth-stub, privacy, mobile visual and existing SEO/Jyotish/Panchanga regression | CI/Playwright | Tests on both viewports; no weakening of existing protected browser suites |
| RELEASE | Separate safe AWS build and smoke after owner-approved merge | Current production SHA and CI green | No direct deploy/DB migration; preserve original galaxy #6, GA4, search indexing, untracked server files |

## 1. Google Cloud / Search Console — owner action required
This action cannot be performed through the GitHub source connector and **must not** be faked as complete.
1. Open [Google Cloud Console](https://console.cloud.google.com/apis/library/searchconsole.googleapis.com) in the Google Cloud project where you want a dedicated GSC reader. Enable **Google Search Console API** (distinct from the Indexing API).
2. Under **IAM & Admin → Service Accounts**, create/choose a dedicated account e.g. `galaxiora-gsc-reader` (do not use an Editor or Owner cloud role). In Keys, create a JSON key only if required by this implementation; store it locally and securely.
3. Copy only its **service-account email** and in [Search Console](https://search.google.com/search-console) choose **Domain property `sc-domain:galaxiora.com` → Settings → Users and permissions → Add user**, grant **Restricted** or the minimum available reading rights. Do **not** grant delegated Owner just to read Search Analytics.
4. In GitHub [Actions secrets](https://github.com/OverlorDDD/jyotish-studio/settings/secrets/actions), choose **New repository secret**, name it exactly `GSC_SERVICE_ACCOUNT_JSON`, paste the *entire JSON key* as the value. **Never paste it into ChatGPT, commit history, files, workflow logs, or screenshots.** If the GitHub repository is public, take extra care not to expose credentials in pull-request workflows; GSC queries run only on schedule/manual `main`.
5. After merge to `main`, [G3.2 Organic Engine](https://github.com/OverlorDDD/jyotish-studio/actions/workflows/g32-organic-engine.yml) → **Run workflow** (choose `main`). Open the `read-only-reports` job summary. It should show `verified_read_only`, a finalized date range and (when Google reports daily rows) separate property totals. An artifact `g32-organic-safe-reports` includes `health.json`, `search.json`, `content.json`.
6. If the result is `GSC_SECRET_MISSING`: verify exact secret name and event. `GSC_PROPERTY_ACCESS_MISSING`: wrong domain/property/email/permissions. `GSC_OAUTH_HTTP_*`: bad, disabled or revoked JSON key, or Google API not enabled. `GSC_SEARCH_ANALYTICS_HTTP_403`: property permissions/API not ready. Never retry by granting broader-than-needed owner rights.
7. Rotate the JSON key if ever exposed; replace the GitHub secret and revoke the old key in Google Cloud. GitHub won't reveal the secret back to the assistant.

Existing GA4 service-account credentials or the Windsor.ai OAuth grant do not automatically authorize this separate GitHub workflow. No Google Cloud billing upgrade or paid service is requested.

## 2. Intelligence semantics / business decisions
- **Site totals:** one grouped-by-`date` final GSC request, Pacific dates; these counts do not depend on query disclosure.
- **Tool performance:** separate `page` request; only approved public canonical URLs and curated reference guides are attributed to Jyotish, Panchanga or Tarot.
- **Search-intent sample:** separate `query,page` request, used for general classification only. Raw queries are never written to artifacts, GitHub logs or content; top-N 5,000 rows is partial.
- **Unknown vs zero:** no property permissions, missing secret and no returned rows all have explicit states. A page with no row is not claimed to have exactly zero impressions.
- **Heuristic decisions:** under 50 observed impressions per approved tool = `insufficient_sample_keep_current_page`; counts do not prove statistical significance or a causally effective copy change.
- **Exports:** only aggregate metrics, coarse approved topics, no birth data, IP, geocoordinates, user question, GA4 personal params or GSC raw query. No IndexNow/URL inspection submissions or automated page creation.

## 3. QA & release acceptance
- Run `npm run test:g32:organic` and `node --experimental-strip-types --test tools/g32-report-summary.test.mjs`.
- Require PR CI, current production Chromium desktop/mobile, canonical main integration and full test builds on the **same SHA**.
- Visual: all three guidance panels centered; links reachable; mobile 320px, EN/UK, no horizontal overflow; keyboard focus and readable colors.
- GSC unit: exact `sc-domain`, scope `webmasters.readonly`, read access check, three read-only grouped requests and finalized Pacific dates; negative tests for missing/denied access and raw data leakage.
- After merge: owner sets GitHub secret and runs read-only workflow. This is the **only external-credential dependency** to close GSC automation. Do not claim live GSC_API success until the artifact shows verified_read_only with actual Google API data.
- AWS deployment is independent, guarded by current main SHA and user approval. Existing production code stays live until separate release.
- Successful technical reports do not equal independent customers. Verify traffic with first-party GSC impressions/clicks, distinct GA4 funnel events, and manual inspection of indexing.

## 4. Next growth decision after a sample
Check the source/date/country/page cohort and first independent click. If pages aren't indexed, fix actual URL Inspection findings. If impressions remain tiny, invest in original citeable tool comparisons and relevant distribution. If impressions reach a useful sample but CTR is low, review rank/search intent and snippets without inventing search volume. Review EN first, UK second, with no broad automatic content publishing.

## Sources
- [Google Search Analytics API](https://developers.google.com/webmaster-tools/v1/searchanalytics/query)
- [Search Console prerequisites](https://developers.google.com/webmaster-tools/v1/prereqs)
- [Search Console users & permissions](https://support.google.com/webmasters/answer/7687615)
- [GitHub Actions repository secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)
- Internal [G3.2 baseline](./g32-organic-engine-20261104.md).
