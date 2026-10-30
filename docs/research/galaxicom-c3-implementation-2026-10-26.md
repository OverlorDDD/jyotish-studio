# GalaxiCom C3 — contextual learning/forum integration (2026-10-26)

## Product decisions and boundaries
C3 provides curated **public** two-way discussion links between GalaxiCom and live Academy/Library/Yoga material, plus one-click entry to topical forums from Tarot and Jyotish tools. No private birth data, calculated charts, saved readings, personal journals, private questions or browser state are copied into forum text, URLs, server payloads or logs. There is no LLM or automatic forum writing.

Only an actual ADMIN can approve/unlink a source-to-topic connection. EXPERT, SUPPORT, PREMIUM and MEMBER cannot confer editorial approval. The forum author's independent verified EXPERT role is reflected only in the existing expert badge; a PREMIUM subscriber remains a normal member in community permissions. All forum posts remain member-generated opinions regardless of approval of their thematic link.

## Data model / safeguards
New additive Prisma model ComContextLink with sourceKind ('ACADEMY'|'YOGA'), sourceSlug (validated public static/published CMS slug), threadId (existing public topic), approvedById, approvedAt. Unique (sourceKind,slug,threadId), transactional admin audit APPROVE_LINK/UNLINK. No birth/reading IDs or personal content. Migration `20261026221500_galaxicom_c3_context` adds only the table + indexes/FKs. Other tables untouched.

Static sources must exist in known published Academy lessons and Yoga practices. Dynamic CMS sources must satisfy EditorialEntry.status === 'PUBLISHED' on **every public read**, not just when the link was created. Draft, reviewed, approved-only, archived or missing sources cannot appear. Hidden, deleted and disabled-category forum topics never display in a source widget or vice versa.

API:
- GET `/api/v1/com/context?kind=ACADEMY|YOGA&slug=public-slug`: published public source + up to 8 admin-approved, currently-visible threads. No member/private data.
- GET `/api/v1/com/context/threads/:id`: reverse public links to published original material, returning public localized titles/route identifiers. Hidden/deleted forum topic => 404.
- POST `/api/v1/com/context/links`: ADMIN-only + signed-in + CSRF/same-origin, DTO {kind,slug,threadId}; validates published source and visible target; duplicate 409; transactional immutable audit.
- DELETE `/api/v1/com/context/links/:id`: ADMIN-only + signed-in + CSRF/same-origin; audited unlink, does not delete the public source or the thread.

## UI
- Static Academy lessons `/{uk|en}/learn/:slug`; published CMS Academy pages on same route; static Yoga `/yoga/:slug` and published CMS Yoga pages: GalaxiCom bridge with linked-topic list, source-grounded title, replies, editorial-association disclaimer and topic-specific forum navigation.
- Admin-only in-page form accepts an existing PUBLIC topic UUID, never creates or approves a topic automatically; SUPPORT is intentionally excluded.
- A linked GalaxiCom thread includes public bilingual reverse links to the published lesson/practice. Links are removed automatically when either target ceases to be public.
- Tarot Studio `/{uk|en}/tarot` and Jyotish calculator `/{uk|en}/astrology/jyotish`: only a generic link to the matching discussion category. The forum consumes only a hard allowlisted `?category=jyotish|tarot|...` query; never sends the private question, card positions, birth time/location or chart to GalaxiCom.
- The Academy quizzes and private Yoga journal stay as they were.

## Implementation
`apps/api/src/com-context.ts`, `com-context-policy.ts`, `apps/api/src/com-policy.ts`, `nest.ts`, `apps/api/prisma/schema.prisma`, migration.
`apps/web/app/components/GalaxiComBridge.tsx`, `GalaxiComBridge.module.css`, `GalaxiComModuleLink.tsx`, `GalaxiCom.tsx` and .module.css, static/CMS Academy, static/CMS Yoga, Tarot and Jyotish routes.
`tools/com-context.test.mjs`, `e2e/galaxicom-c3.spec.mjs`. Adds C3 unit checks to `npm run test:com` (and thus test:all).

## CI / manual acceptance
Run full unit + build, disposable-PostgreSQL migration/integration, pinned Windows JHora, Chromium desktop and mobile. E2E: anonymous published-lesson access; MEMBER/SUPPORT denied editorial links; ADMIN approves and audits; duplicate denied; linked topic appears in Academy UK+EN and reverse link; draft CMS denied, PUBLISHED supported, archived removed; hidden forum topics vanish; unlink audited. Confirm Tarot/Jyotish links contain **only** allowed topic category; verify no user data in URLs or API.

Windows:
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
npm run dev:full
```
Open `http://localhost:3000/uk/learn/vimshottari-life-cycle`, `/uk/yoga/gentle-breath`, `/uk/tarot`, `/uk/astrology/jyotish`. Using two accounts, create a disposable public topic; with an existing ADMIN account, open the Academy article bridge and paste its thread ID from the public topic URL. Confirm appearance in article and back-link in topic. Set the topic HIDDEN and verify it disappears; restore/unlink and inspect audit. Do not run reset commands or erase database volumes.

## Next stages
C4: distributed rate limit, scalable notification fanout, publish moderation and privacy/appeals/retention policies, real user anti-spam, accessible production monitoring, backup/restore before opening the forum widely. PREMIUM pricing/entitlements and expert marketplace remain separate, with no unsupported purchase flow. Full JQA-3 certification, News source licensing and public release gates remain unchanged.
