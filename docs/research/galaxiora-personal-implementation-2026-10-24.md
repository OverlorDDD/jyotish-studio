# Galaxiora Personal — implementation and acceptance (2026-10-24)

## Product boundary

Galaxiora Personal is the authenticated personal workspace at `/{uk|en}/personal`. It aggregates saved birth charts, the documented Galaxiora Vimshottari cycle, actual Swiss Ephemeris transit observations, a 7/30-day calendar, previous Tarot readings, completed breathing practices, private journal entries and voluntary questions to a Tarot reader. It does **not** imply that paid consultations are booked or that external news/horoscope products have already launched.

**Future-ready panels:** *GalaxiHoroscope* and *My News* appear with honest coming-after-launch status. News-interest topics are stored by deliberate user selection; they are NEVER inferred from private journals. Do not ingest proprietary article text or third-party daily horoscope prose before checking rights, license, RSS terms, source attribution and refresh policy. The next full news module should aggregate source-linked editorial material and use these opt-in topic preferences.

## Implementation map

| Module | Files | Invariants |
|---|---|---|
| Personal profile | `schema.prisma`, additive `20261024170000_personal_profile_practices` migration, `apps/api/src/personal.ts` | One-to-one user, selected primary chart is owned by the current session, chart foreign key set-null on delete, never copy/rewrite saved natal data |
| Profile API | `GET/PATCH /api/v1/personal/profile`, `PUT /api/v1/personal/primary-chart` | Authenticated, owner-scope, CSRF cross-site protection, IANA zone validation, FREE/PREMIUM independent from staff role |
| Overview | `GET /api/v1/personal/overview` | Minimal derived response, no journal text copied into astrology/AI prompts, no-store, only selected full chart JSON loaded |
| Daily positions | `apps/api/src/personal-transits.ts`, `GET /transits` | Existing Swiss Ephemeris / Lahiri sidereal; geocentric bodies, Moon nakshatra and whole-sign house from birth Lagna/Moon. **ONE local-noon observation**, not a claimed exact ingress timestamp |
| Calendar | `GET /calendar?days=7|30&from=YYYY-MM-DD` | Local IANA date sequence respects DST; bounded 7 or 30 days; Lunar position is evaluated separately at local noon; valid natal Vimshottari Mahadasha/Antardasha starts displayed in user's current IANA day |
| Practice history | `PersonalPracticeSession`, `GET/POST/DELETE /api/v1/personal/practices`, `YogaBreathSession.tsx` | Only explicit saved **completed** sessions, no auto writes when stopped or interrupted; client UUID event for idempotent retries; delete owner-scope |
| Journal | `PersonalJournal.tsx`, `account.ts` | Existing private notes remain; PATCH with owner scope, legacy GET/POST/DELETE retained, paged older entries and secure full JSON export, browser text only and no AI transfer |
| Tarot | Existing Tarot history read; link to studio | Never auto draw or spend 3-draw UTC quota, private questions remain SAVED_PRIVATE |
| UI | `apps/web/app/[locale]/personal/page.tsx`, `PersonalDashboard.tsx`, `globals.css`, `PortalShell.tsx`, `GlobalAccount.tsx` | Shared Galaxiora header, responsive dark/gold design, natural UA + EN, noindex for personal pages, local date/sample provenance printed |
| Regression | `tools/personal-core.test.mjs`, `e2e/personal.spec.mjs`, A9.9 updated Jyotish browser tests | Ownership with two sessions, saved chart + local time, database migrations, export and status, Chart/Tarot/Yoga/Jyotish unchanged |

## Astronomical/epistemic constraints

- Galaxiora's original JQA-3 product scope is accepted for D1/D9/D10 **sign** parity (600/600) and Dasha lord sequence, NOT same-mode exact JHora longitude/time parity. Personal must not label `precisionCertified: true`.
- The calendar displays 12:00 *local-time sampled positions* and documented Galaxiora dasha transitions. It does NOT claim the Moon entered a sign at noon, a guaranteed life outcome, or JHora-exact Vimshottari dates.
- New exact ingress events and sophisticated predictive transit interpretations require separate, independently pinned astronomical benchmark tests; absent that evidence, do not fabricate them.
- Fail closed for transit position if the chart lacks saved internal verification; allow Tarot, practice, journal and profile to remain available.

## Security and operational checks

1. `GET /personal/*` requires session. A missing/invalid session must not render user data.
2. `PUT primary-chart` checks `Chart.ownerId === cookieUser` **within transaction**.
3. Journal PATCH/DELETE/export/pagination and practice GET/POST/DELETE scope `userId` on the server. Unauthorized and other-user object IDs are denied.
4. All profile writes pass same-origin cookie + Fetch Metadata checks, input DTO validation and bounded size/range checks.
5. Private API responses are `Cache-Control: private, no-store`. Non-personal ephemeris samples may be cached; individual facts/notes and account data must not be cached globally or sent to third parties.
6. New Prisma migration creates tables with FKs and indexes without altering previous personal charts, journal entries or readings.
7. Compare production route timings in a real browser separately from cold Next.js development server boot.
8. Keep donation URL disabled until owner provides a legitimate payment link. No payment or consultation flow was activated.

## Verification commands (Windows PowerShell)

```powershell
cd C:\Users\Note\jyotish-studio-git
git status --short
git fetch origin
git switch fix/jqa3-windows-and-llm-recovery
git pull --ff-only origin fix/jqa3-windows-and-llm-recovery
npm install
py -m pip install pyswisseph
docker compose up -d db
npm run db:generate
npm run db:migrate
npm run test:personal
npm run test:all
npm run build
npm run test:e2e
npm run dev:full
```

If `git status --short` lists unrelated local edits, preserve them instead of overwriting. Never delete `.env` or Docker volumes as part of normal update. Run `test:e2e` with an available test API, migrated PostgreSQL and web server (or let GitHub Actions orchestrate them). Manually verify `/uk/personal` and `/en/personal` with a new and an existing account.

## After Personal

- Final browser/visual acceptance of Personal; public launch hardening (domain, security, moderation, WCAG, performance/SEO).
- **After public launch**, add GalaxiHoroscope as a separate verified personalized product; external public sources are inputs requiring attribution/licensing checks, not drop-in copies of other sites' forecasts.
- **After public launch**, build the personal news feed from indexed/reviewed external articles filtered by opt-in interests; use the editorial verification workflow. Marketplace/store remains later, pending valid payment/legal infrastructure.

## Technical references

- Next.js 15 server-side privacy: https://nextjs.org/docs/15/app/guides/data-security
- Next.js caching: https://nextjs.org/docs/15/app/guides/caching
- Prisma v6 transactions: https://www.prisma.io/docs/orm/v6/prisma-client/queries/transactions
- Swiss Ephemeris (UTC astronomy): https://www.astro.com/swisseph-download/doc/swephprg.2.10.htm
- OWASP API1:2023 BOLA: https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/
- Playwright testing: https://playwright.dev/docs/best-practices
