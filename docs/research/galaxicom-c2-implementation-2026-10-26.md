# GalaxiCom C2 — Community Features, forum editing, quick deletion (26 October 2026)

## Scope and contracts
Owner requested: remove former short topic/post limits, fix narrow edit box (provided screenshot), quick delete for ADMIN/SUPPORT, complete C2 Community Features and publish to GitHub.

### Writing and editor
- Title: up to 2,000 UTF-16 code units; body and reply: up to 200,000 each. These are deliberately generous safety ceilings, not 160/8,000/5,000 UI limits. No HTTP server can safely accept literally infinite payloads: Nest JSON parser remains capped at 2 MiB. Plain text is preserved, rendered as text, with no raw HTML. Rate limits against account spam remain separate.
- ComThread.title becomes PostgreSQL TEXT (non-destructive ALTER). Body/post are already TEXT.
- Thread and reply editors are full-width blocks **outside the narrow flex action toolbar**, contain large resizable textareas, and permit changing topic title and body. Long uninterrupted strings wrap rather than force horizontal overflow. Responsive desktop/mobile.
- Edit window remains 30 minutes in C2; history of previous content is transactionally stored in ComThreadRevision / ComPostRevision. Revisions are visible only to author or active SUPPORT/ADMIN, never in public profiles.
- Exact recently repeated reply is rejected by server, and form suggests similar existing topics before a new topic is submitted.

### Moderator quick delete
- DELETE /api/v1/com/mod/threads/:id requires fresh logged-in SUPPORT/ADMIN role, same-origin, UI confirmation; one-click from topic or topic list. The action atomically sets status=DELETED, locked=true, pinned=false and appends ComModerationAction DELETE audit.
- This is recoverable soft deletion, not hard erasure: source posts, revision records, complaints and audit are preserved. Public thread/posts/activity/search/feed no longer show it. No destructive database reset.
- Ordinary HIDDEN moderation and thread locking/pinning remain; ADMIN-only pin remains enforced.

### C2 additions
- Idempotent helpful reactions: PUT/DELETE /api/v1/com/posts/:id/helpful; unique (userId,postId), public counts, current viewer’s choice. A PREMIUM subscription never grants additional votes or moderation.
- Thread follows: PUT/DELETE /threads/:id/follow and GET /threads/:id/activity; creating author automatically follows the new thread. Unique (userId,threadId).
- In-app notifications for new replies to followed threads; never notify own reply author, create within transaction, mark one/read-all; notify only accessible published threads and visible posts. No external push, email or LLM. **MVP cap 500 followers per reply**; durable background fanout required for large real communities.
- Public pseudonymous profile GET /profiles/:id and /{locale}/community/member/:id: only display name, opt-in active PREMIUM badge, independently verified EXPERT role and PUBLISHED contributions; never email, account subscription expiry, natal chart, readings or private journal.
- Revision history endpoints GET /threads/:id/revisions and /posts/:id/revisions with authorization by author/real staff. Status and private user data are not leaked.
- GET /duplicates?title=... gives nonblocking hints; no AI semantic matching.
- Full UA/EN labels and mobile-safe actions.

### Files
- API: apps/api/src/com.ts, com-social.ts, com-policy.ts (existing pure rules).
- Prisma: apps/api/prisma/schema.prisma and migrations/20261026213000_galaxicom_c2/migration.sql.
- UI: apps/web/app/components/GalaxiCom.tsx + .module.css, GalaxiComMember.tsx; member route.
- E2E: e2e/galaxicom-c2.spec.mjs; prior galaxicom.spec.mjs must also pass.

### Review gates
1. Run db:generate and additive db:migrate against **a disposable or backed-up database**; no `prisma migrate reset`.
2. npm run test:com; npm run test:all; npm run build; full CI PostgreSQL, Windows JHora and Chromium desktop/mobile.
3. Manual: register/member A creates 10k+ characters, edits topic in full-width box; revision retained and visible only to owner/staff. Another member B cannot edit A’s topic, follows, replies, helpful-votes once, unfollows; A receives one new-reply notice and reads it; no notice on B’s own reply.
4. B public profile contains only pseudonym and public posts. PREMIUM opt-in badge unchanged; paid subscription does NOT grant STAFF rights.
5. Moderator quickly deletes a disposable test topic in two clicks (Delete + Confirm); guest receives 404 for that topic, replies and social activity; audit action exists. Verify News/Personal unaffected.
6. Test 360px and desktop widths for no horizontal scrolling and editor textarea at least 260px high.
7. Open public posting to strangers only after staffing, appeals/retention/erasure procedures, durable distributed rate limiting, queue-based notification fanout, spam and backup drills in C4.

### Windows launch
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
Open `http://localhost:3000/uk/community`, register/login normally, and test with two disposable accounts. No real payment, no manual DB edit required for normal forum flows. For mod tests, use an already-authorized SUPPORT/ADMIN account.
