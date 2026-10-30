# Galaxiora public signup safety release — 30 October 2026

## Changes
- Existing sign-ins and existing User rows are left untouched.
- New /api/v1/account/register no longer creates a User or session; it verifies a **single-use Cloudflare Turnstile token on the server**, stores an expiring code digest and password hash in PendingRegistration, sends the code via Resend and returns verificationRequired.
- /api/v1/account/register/verify enforces five DB-persisted attempts and 15-minute expiry, consumes the challenge atomically in a Prisma transaction, creates the real User and only then issues the secure session cookie.
- Resending is limited to once per email per two minutes; the existing global and per-email in-process auth request budgets remain as additional constraints.
- If Turnstile/Resend/site operator configuration is absent, public signup **fails closed**. An old account can still sign in. No test bypass for production.
- The UI is bilingual, uses an explicit Turnstile widget and a six-digit email verification step. The site footer exposes privacy/terms pages.

## Services the owner must configure first

1. **Cloudflare Turnstile**: create widget for hostname galaxiora.com, select Managed challenge, note public sitekey + private secret. They are different values. Cloudflare works even without its orange-cloud reverse proxy. Never publish the secret.
2. **Resend**: create an account and verify the sender domain/subdomain you own with the provided DNS records in Cloudflare. Use an actual verified sender address (e.g. only after verifying its domain), create API key with Send email permission. Never use a test-only Resend sender for real visitor emails.
3. **Public contact**: select an actual site operator name and a monitored public support email; verify the drafted privacy and terms copy before turning on search indexing.

Required server root .env:
```dotenv
PUBLIC_REGISTRATION_ENABLED=1
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<public sitekey>
TURNSTILE_SECRET_KEY=<private Turnstile secret>
RESEND_API_KEY=<private Resend key>
RESEND_FROM_EMAIL=<verified-sender@example.com>
NEXT_PUBLIC_SITE_CONTACT_EMAIL=<monitored-support-email>
NEXT_PUBLIC_OPERATOR_NAME=<accurate-operator-display-name>
```
Preserve all existing .env entries. Set mode to 0 until all setup is complete. Production API must be restarted after env changes; **Next.js must be rebuilt** after any NEXT_PUBLIC_* variable changes.

## Safe release order
1. Keep IP block and SITE_NOINDEX=1 until inspection and email delivery work.
2. Validate branch and clean/stash only expected generated tracked files (never discard secrets); take the existing production DB backup and off-host backup.
3. `npm ci --no-audit --no-fund`; `npm run db:generate`; `npm run test:access`; `npm run test:news`; `npm run test:r2-r3`; `npm run db:migrate`; `npm run build`.
4. Restart the Nest API first and verify /api/health HTTP 200; then Next and /uk HTTP 200.
5. Test: existing ADMIN login; new signup with real browser from allowed IP; no session/User created after email request; invalid code rejected; valid code creates MEMBER with no elevation; login and logout; 2-minute resend limit. Also test missing/expired Turnstile token and missing email-service key fail closed.
6. Create daily `npm run auth:prune` timer under ubuntu; confirm expired staging rows deleted without User deletion. Do not create real User test accounts for health checks; use one designated disposable address if necessary.
7. Run `npm run r2:audit`, `npm run r3:seo:check`, `npm run site:check`, `npm run launch:verify`, `npm run news:quality`, `npm run news:quality:headlines` (if explicitly approved) and external HTTPS checks.
8. Open public access in Caddy **only after** protections and legal contact pass; keep DNS/HTTPS/Site Noinex until smoke from unaffiliated network, then change SITE_NOINDEX=0 and rebuild Next for indexing. Back up Caddyfile before touching it, validate/reload Caddy. Do not expose 3000, 4000 or Postgres ports publicly.

## Caveats
- No changes have been made on EC2 by GitHub edits alone. Manual DNS + Resend + Cloudflare configuration remains necessary and their uptime must be verified with real users.
- Signup verification email is for new accounts only; it is **not yet password recovery** and does not retroactively verify old accounts.
- Turnstile reduces bot abuse but is not a guarantee; monitor API and Resend quotas. Changing a site's locale or opening it publicly does not grant security certification.
- News still has localized title/teaser editorial debt. Do not label strict NEWS_QUALITY as CONTENT_READY if it reports BLOCKED.
