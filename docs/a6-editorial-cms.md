# A6 — Editorial CMS: Yoga and Academy

## What is implemented
- Separate bilingual UK/EN editorial workspace at /uk/editorial and /en/editorial. ADMIN also sees it inside the existing dashboard.
- Create Academy articles by topic (jyotish, tarot, practice) with bilingual titles, summaries, full paragraphs and a required 3-choice quiz.
- Create Yoga mobility or meditation guides with bilingual instructions and mandatory safety notices. Intentionally no custom breathing timers: the safe 4-4-4-4 breathing engine remains code-owned.
- Full editorial flow: DRAFT -> IN_REVIEW -> APPROVED -> PUBLISHED -> ARCHIVED; return from IN_REVIEW or APPROVED to DRAFT by rejection, reopen ARCHIVED to DRAFT.
- SUPPORT and ADMIN can create, edit and submit. ADMIN alone approves, publishes, archives, reopens. A single ADMIN may approve own work: dual-control is deferred, not falsely claimed.
- Each change increments revision and writes an immutable history snapshot; stale expectedRevision requests fail (409).
- Public GET /api/v1/content?kind=ACADEMY|YOGA and /api/v1/content/{kind}/{slug} return only PUBLISHED, no audit/staff info. Public catalog cards and on-demand server-rendered bilingual detail pages update without a Git redeploy.
- New pages have language-specific metadata and are added to sitemap only through the existing stable HTTPS SEO gate.
- The original seven Academy lessons and four Yoga practices remain untouched, with protected slugs.
- No checkout, payment, AI request, CMS uploads, user health data or user quiz result persistence.

## Architecture
- Pure domain: apps/api/src/editorial-policy.ts — validation, topic/slug rules and workflow permissions.
- Application: apps/api/src/editorial-application.ts — use-case dispatch through an editorial port.
- Adapter: apps/api/src/editorial-prisma.ts — optimistic concurrency writes (revision compare-and-swap) and immutable audit records in transactions.
- HTTP: apps/api/src/editorial.ts — fresh DB role checks, cookie authentication and CSRF same-origin checks for all writes.
- PostgreSQL: EditorialEntry + EditorialVersion, additive migration 20261020110000_editorial_a6.
- Public read: apps/web/lib/editorial-public.ts; public components render text normally with React (never unsafe raw HTML).
- Editor: apps/web/app/components/EditorialWorkspace.tsx.

## Windows: update and start from Docker Desktop
1. Start Docker Desktop and wait for Engine running. Stop the old npm run dev:full console with Ctrl+C.
2. PowerShell: cd C:\Users\Note\jyotish-studio-git
3. docker compose up -d db
4. docker compose ps (PostgreSQL normally mapped to host port 5433).
5. git status --short; git pull --ff-only origin main; npm install
6. Preserve your existing .env / AUTH_SECRET / DATABASE_URL. Never replace them with examples blindly.
7. npm run db:generate
8. npm run db:migrate (additive migration, not migrate reset)
9. npm run security:check
10. npm run test:editorial:a6; npm run test:all; npm run test:swagger; npm run build
11. npm run dev:full
12. Visit http://localhost:3000/uk/editorial. Sign in using the existing ADMIN account from the site header. SUPPORT can use same URL for drafts only.

## Manual acceptance
1. Create a new bilingual Academy article. Use a unique ASCII slug (e.g. why-stars-matter), meaningful 20+ character summaries, 150+ character bodies, quiz question, three choices in each language and answer explanation. Save DRAFT.
2. Verify new material does not appear at /uk/learn, /en/learn or direct URLs before publication.
3. Submit draft for review. As ADMIN, approve and explicitly publish. As SUPPORT, try approve/publish and expect permission denial.
4. Verify a new card appears in both Academy catalogs, open both locales, check quiz explanation and lang switch retaining slug.
5. Open Revision history; verify create/submit/approve/publish entries with dates; editing published items should be forbidden.
6. Archive publication; confirm it vanishes from public API/catalog and direct page returns 404. Reopen draft; history preserved.
7. Repeat using a YOGA meditation or mobility guide with separated steps and safety notices, no timer. Verify existing box breathing still works.
8. Open /uk/admin as ADMIN and check other reports; check that MEMBER cannot open editorial API or publish.
9. Check 360px mobile width, console errors, Jyotish D1/D9/D10 and private Tarot history.
10. Do not run integration suite against personal Docker database; isolated disposable PostgreSQL is already verified in CI.

## Architecture and security references
- Prisma optimistic concurrency with a revision field and conditional updates: https://www.prisma.io/docs/orm/prisma-client/queries/transactions
- Next.js 15 dynamic routes: https://nextjs.org/docs/15/app/api-reference/file-conventions/route-segment-config
- OWASP XSS prevention, safe text output: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html

## Deferred
CMS editing of existing A5 seeded lessons, import/export, rich text, image upload, independent two-person approval enforcement, advanced scheduling, analytics, public News/Community moderation and production sign-off. Permanent domain, restore drill, commercial licensing and privacy audit remain separate release gates.
