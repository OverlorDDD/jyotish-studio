# Galaxiora A4 — beta-readiness engineering and release blockers

Status: A4 engineering changes tested in PR #14 on 2026-10-19. CI run 39255336058 passed 10/10 browser tests plus full unit/build/PostgreSQL checks. Production acceptance remains pending. Passing a local or CI test is **not** a claim that privacy, security, commercial licensing, backup recovery, WCAG conformance or production readiness are certified.

## Shipped implementation
1. Preview-safe indexing: `NEXT_PUBLIC_SITE_URL` must be a root HTTPS origin and `SITE_NOINDEX` must not equal 1. Without both, `robots.txt` disallows crawling and `sitemap.xml` contains no URLs. The root `/` remains HTTP 200 but noindex; localized UK/EN routes have canonical/alternates.
2. Only published home, astrology, Tarot and Jyotish routes enter the sitemap. Placeholder Yoga/Academy/News/Community and private Account/Admin screens carry noindex.
3. Locale inferred from canonical URL and sent via server-controlled middleware request header; root SSR emits `<html lang="uk">` for Ukrainian and `en` otherwise. The header overrides any malicious client header.
4. Keyboard skip-to-content, main landmark, named navigation, visible focus styles, motion reduction and constrained mobile navigation.
5. Browser-based Chromium CI tests at desktop/mobile: metadata, index policy, layout overflow, skip link, account registration, offline Tarot drawing, history after reload and logout, against **disposable** PostgreSQL. No real customer data.
6. NestJS API sends a random request correlation ID and protective headers; optional structured `HTTP_ACCESS_LOG=1` excludes URL paths, emails, bodies, cookies and birth details. Next sends a restrictive Permissions-Policy.
7. `tools/backup-db.ps1` creates a PostgreSQL custom-format backup from Docker without modifying the user's database. `backups/` and `*.dump` are ignored by Git. No automatic restore is run.

## Production release gates — outstanding until explicitly verified
| Gate | Pass criterion | Current |
|---|---|---|
| Stable HTTPS origin | Domain ownership, DNS, HTTPS, canonical/hreflang, robots/sitemap checked **on deployed origin** | NOT VERIFIED |
| Real backup and restore drill | Encrypted offsite backup, documented RPO/RTO, restore to **separate DB**, schema/content integrity, retention/deletion | NOT VERIFIED |
| Personal data | Published privacy policy with purposes, lawful basis, retention, erasure/export, processors, AI opt-in and country-specific review | NOT VERIFIED |
| Security | Session revocation on logout and compromise, production proxy trust, CSRF threat modeling, shared-store rate limits/AI budgets, vulnerability audit, secret rotation | PARTIAL — A1 only |
| License provenance | Swiss Ephemeris commercial/AGPL route; RWS images source/territory usage; fonts, content and privacy notices cleared | NOT VERIFIED |
| Accessibility | Automated keyboard/viewport smoke **plus** manual WCAG 2.2 AA audit incl. screen reader and contrast | PARTIAL |
| Performance | Real HTTPS mobile Core Web Vitals, image network costs, cold-start and 95th-percentile load testing | NOT MEASURED |
| Monitoring | HTTPS uptime, DB health, error alerting, alert ownership, anonymized logs and retention, incident rollback | PARTIAL |
| Paid services | Payment signature, idempotency, refund policy and protected expert video delivery | NOT IMPLEMENTED — intentionally disabled |

## Safe local backup (Windows PowerShell)
1. Run Docker Desktop, ensure `docker compose ps` shows `jyotish-db`.
2. Run `powershell -ExecutionPolicy Bypass -File tools/backup-db.ps1` from repo root. This creates an untracked custom-format dump under `backups/` without stopping or wiping PostgreSQL.
3. Copy the dump to secure, encrypted **off-device storage**. Anyone with the dump can read account emails, birth details and questions; never upload it publicly or commit it.
4. Before release, perform a restore drill **only into a fresh disposable Postgres instance** and compare row counts/records under controlled access. Do not use `pg_restore --clean` on the primary DB.
5. No successful restore is claimed here; automation has no access to the user's real Docker installation.

## Launch SEO setup (not needed for local development)
- Keep `SITE_NOINDEX=1` for temporary ngrok demos and all previews.
- When a permanent domain is truly owned and ready: set `NEXT_PUBLIC_SITE_URL=https://actual-owned-domain` and `SITE_NOINDEX=0`, build/redeploy, verify `https://actual-owned-domain/robots.txt` and `/sitemap.xml`.
- Never point canonical tags at localhost or a guessed domain.
- Enable `SESSION_COOKIE_SECURE=1` for actual HTTPS visitors. API provider keys and `AUTH_SECRET` stay server-only.
- Root `/` is intentionally noindex and uses the English portal; indexable English URL is `/en`.

## Windows local regression after A4/A5 combined update
```powershell
cd C:\Users\Note\jyotish-studio-git
git status --short
git pull --ff-only origin main
npm install
docker compose up -d db
npm run db:generate
npm run db:migrate
npm run security:check
npm run test:all
npm run test:swagger
npm run build
npm run dev:full
```
GitHub handles Chromium browser E2E. Running locally is optional and needs a live Next/Nest + disposable DB; NEVER set `GALAXIORA_INTEGRATION_TEST=1` on the normal `jyotish` DB.

## References
- Next 15 Metadata and languages: https://nextjs.org/docs/15/app/api-reference/functions/generate-metadata
- Next robots/sitemap: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots and https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
- Playwright CI: https://playwright.dev/docs/ci
- WCAG 2.2 AA: https://www.w3.org/TR/WCAG22/
- Swiss licensing: https://www.astro.com/swisseph/sweph_e.htm
- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/
