# GalaxiCom C0–C1 — architecture, privacy, moderation, PREMIUM roadmap
**26 October 2026.** Initial forum implementation on the Galaxiora working branch. Owner explicitly approved implementation of C0–C1. This file is the canonical implementation/acceptance contract; earlier GalaxiCom research remains a competitor/reference resource.

## Product contract
- One community tied to Galaxiora account cookies. Public read; logged-in free MEMBER can create topics and replies, edit their own contributions within 30 minutes and report content. No new payment flows or separate forum accounts.
- Seven seed categories: jyotish, tarot, practices, vedic, experiences, experts, help. Category naming localizes UK/EN. No fake posts or activity are seeded.
- Frontend routes: `/{uk|en}/community` and `/{uk|en}/community/topic/:uuid` (original shared PortalShell). Root navigation/home now identifies forum as live code. SEO remains **noindex** until actual moderation/legal launch review.
- Backend: `GET /api/v1/com/categories`, `GET /threads`, `GET /threads/:id`, `GET /threads/:id/posts`, `GET/PATCH /me`, `POST /threads`, `PATCH /threads/:id`, `POST /threads/:id/posts`, `PATCH /posts/:id`, `POST /reports`, `GET /mod/reports`, `PATCH /mod/threads/:id`, `PATCH /mod/posts/:id`, `PATCH /mod/reports/:id`.
- All mutating endpoints verify same-origin and a fresh DB user session. SUPPORT and ADMIN can hide and lock, ADMIN alone may pin. No subscriber or verified EXPERT may moderate merely for having a badge. Every moderator decision is written transactionally to `ComModerationAction`. Reports never auto-delete a post.
- Public contributor projection includes only explicitly chosen pseudonym (else stable generic display), verified EXPERT flag and **opted-in, active** PREMIUM badge. No email, password, subscription expiration, natal chart, Tarot history or Personal journal enters the public forum API.
- DB relations and publication state are enforced server-side. Hidden threads return 404 to anonymous and members, including replies. Locked threads reject new replies. All posts are plain text rendered through React; HTML/JS is refused, at most 3 links.
- Pagination: 20 per page, max page 40; search bounded to 80 characters; independent topic filters/active/latest/unanswered. Thread author may edit only own published unlocked topic, and post authors only their own published unlocked replies, for 30 minutes.
- API throttling: 12 threads, 90 replies, 15 reports per user per hour on a single Nest process. This is NOT cross-instance safe. Before multi-instance public deployment use Postgres/Redis-backed rate limits, account-age moderation queues and real abuse testing.
- Migration `20261026192000_galaxicom_c0_c1` only ADDS ComCategory, ComProfile, ComThread, ComPost, ComReport and ComModerationAction. No existing Galaxiora users, News or charts are rewritten. Seven categories are seeded; no posts or fake accounts.

## Moderation policy & community rules (working draft to publish in UK/EN)
1. Discuss spiritual practice and personal interpretation respectfully, including disagreements. No targeted harassment, hate, threats or manipulation.
2. No publishing anyone else's personal details. Birth dates/times/places, account details, addresses, health information and private readings require explicit consent; warn even if they belong to the author. Reporting is visible only to moderators.
3. No unsolicited ads for paid readings, recruitment schemes, disguised affiliate links, spam or misleading claims to be a verified practitioner.
4. Do not replace medical, legal or financial professionals with categorical forum predictions. Posts are user contributions, not officially vetted Galaxiora astrology or news.
5. Moderators can hide/lock with an auditable reason. Formal appeals, retention/erase/export and region-specific legal notice are C4 public-launch blockers.

## PREMIUM: account tier is NOT a forum permission role
- Current existing `SubscriptionTier` already supports FREE/PREMIUM, but no billing flow is enabled. FREE members can create and reply. Public EXPERT qualification and moderator permissions remain independent.
- C1 includes an **optional PREMIUM profile flair**, enabled only by a subscriber who has an ACTIVE entitlement and explicitly chooses to display it. Expiration immediately removes the badge without modifying profile consent. Server rejects requests to enable for FREE/expired users.
- PREMIUM backlog proposals (not shipped): profile theme and additional flair choice, extended draft storage, higher attachment quotas AFTER upload security review, curated subscriber-only discussions (content must remain lawful, moderated and accessible), subscriber live Q&A with verified experts after staffing. Avoid paid-only basic topic creation, guaranteed expert answers or paid moderation override.
- Final paid product/pricing/provider cannot be implemented until the owner has a lawful payment mechanism, verified checkout/webhook and written product entitlements. Admin manually changing a database tier is NOT a purchase.

## QA acceptance gates
1. `npm run db:generate` + `npm run db:migrate` on an isolated PostgreSQL test database; migrations never delete existing data; review generated SQL and constraints.
2. `npm run test:com`, `npm run test:all`, `npm run build`, `npm run test:swagger`, disposable PostgreSQL CI and desktop/mobile Chromium `e2e/galaxicom.spec.mjs`.
3. Guest sees public categories but POST topic returns 401. After register, member posts a valid topic/reply. Second member cannot edit first's thread; invalid HTML, cross-origin and bad IDs are refused.
4. Member B reports topic. SUPPORT views the queue, cannot pin, can hide/restore/lock, and writes an audit row. Hidden content is not publicly accessible; locked content rejects replies. No email or raw private chart data in public payloads.
5. PREMIUM user has no extra posting/moderation powers; opt-in badge can be activated only while entitlement is active. Verify expired premium returns no public badge.
6. Check `/uk/community`, `/en/community`, topic deep links, mobile 360px, keyboard focus, empty-state wording, pagination and two real sessions.
7. Public opening requires moderation staffing and rules approval, privacy/retention/appeals documentation, shared rate limits, load measurements, backup restore drill and final visual/manual acceptance (C4).

## Local Windows quick start
```powershell
cd C:\Users\Note\jyotish-studio-git
git status --short
git fetch origin
git switch fix/jqa3-windows-and-llm-recovery
git pull --ff-only origin fix/jqa3-windows-and-llm-recovery
docker compose up -d db
npm install
npm run db:generate
npm run db:migrate
npm run test:com
npm run test:all
npm run build
npm run dev:full
```
Open http://localhost:3000/uk/community. Login or register using existing account UI; create a real topic. Use a second account and an existing ADMIN account to test moderation. Do not expose personal birth details. Never run `docker compose down -v` or reset an existing database.

## External official manuals
NestJS validation: https://docs.nestjs.com/application/validation
Prisma 6 referential actions: https://www.prisma.io/docs/orm/v6/prisma-schema/data-model/relations/referential-actions
OWASP XSS: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
OWASP access controls: https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/
Competitor notes: docs/research/galaxicom-forum-architecture-2026-10-26.md
