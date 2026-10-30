# GalaxiCom C4 — Quality & Security (26 October 2026)

## Scope, implementation and public-release decision

C4 hardens GalaxiCom while preserving FREE member posting, independent EXPERT verification, opt-in PREMIUM badge and existing ADMIN/SUPPORT moderation. Nothing grants PREMIUM bypasses of moderation, quotas or privacy. This stage does **not** mean public launch is approved without operator acceptance, real traffic testing, a staffed moderation team and jurisdiction-specific legal review.

### A. Shared, atomic anti-abuse quotas
- `ComRateBucket` in PostgreSQL, hashed SHA-256 bucket keys (no raw account ID or IP), atomic `INSERT ... ON CONFLICT DO UPDATE ... RETURNING count`. Works across multiple API replicas sharing the same database; fixed windows based on server time. No bypass via multiple Node instances.
- Nest middleware `/api/v1/com` applies to every authenticated POST/PATCH/PUT/DELETE: 300 total writes/hour and per-scope 12 new threads/hour, 90 replies/hour, 15 reports/hour, 6 appeals/hour, 3 privacy requests/hour. Returns HTTP 429 and `Retry-After`. Existing plain-text/no-HTML and three-link content validation still apply. Invalid/guest session writes are rejected by auth endpoints.
- Limits are for **abuse control**, not an attempt to impose the old 160/8000/5000-character caps again: topic title 2000, body/reply 200000, HTTP request ceiling 2 MiB. Bucket expiration is managed by housekeeping (periodic delete older than 48h; do not delete active buckets). Protect login/registration separately in account security code; C4 does not claim to solve all authentication abuse.

### B. Durable notification fanout
- `ComNotificationFanout` outbox row is created in the **same transaction** as a reply. Up to 500 previously subscribed members retain instant notifications. Independent worker processes all subscriber pages, including audiences above 500, in stable `userId` order.
- Worker leases are conditional and expire after 120 seconds; notifications are idempotent by unique `(userId,postId,kind)`. Skip own replies and follows created after post publication. Missing, hidden or deleted content does not receive new notifications. Up to 5 **consecutive failed retries per page** before FAILED status; successful pages reset the retry counter so topics with thousands of followers do not exhaust retries merely by making progress. Read-only ADMIN `GET /api/v1/com/mod/security` reports pending/failed.
- **Must schedule** `npm run com:fanout` via external cron/Task Scheduler **once per minute** on deployed instance, or run it manually for development. No distributed scheduler is installed automatically. Inspect FAILED rows and requeue manually after fixing cause; do not claim continuous delivery until scheduled. Worker is safe with overlapping runs.
- Existing member notification UI and read state remain unchanged.

### C. Human appeals and audit
- Authenticated author: `POST /api/v1/com/appeals` ({targetType:'THREAD'|'POST',targetId,reason}), within **30 days** of the latest applicable moderation decision, one appeal per action. Only owners of currently hidden/deleted contributions can appeal; other users receive 404.
- Author sees own appeals: `GET /appeals/mine`. Human SUPPORT/ADMIN queue: `GET /mod/appeals`; `PATCH /mod/appeals/:id` with ACCEPTED/REJECTED and mandatory reason, transactional audit. **Original moderator cannot decide their own moderation action**. An appeal cannot override a newer human moderation decision, nor restore material after completed `PUBLIC_REDACTED` privacy removal. ACCEPTED restores a still-eligible hidden contribution without pinning; a hidden parent thread still hides its replies.
- C0 moderation audit and report queue preserved; neither PREMIUM nor EXPERT automatically becomes moderator. Escalations and review staffing remain an operational requirement.

### D. Privacy: export and public redaction workflow
- `GET /api/v1/com/privacy/export?page=N`: authenticated owner only, paged (100 each) report with their forum profile, threads, replies, reports and appeals. No data belonging to a different user, natal charts, Tarot readings or private journals. Browser UI downloads a JSON export.
- `POST /api/v1/com/privacy/requests` opens an ERASE_FORUM request, idempotently returns an existing OPEN/IN_REVIEW request. Only ADMIN can list and review `GET /mod/privacy`, `PATCH /mod/privacy/:id`.
- REVIEW marks IN_REVIEW. PUBLIC_REDACT atomically removes the requester's public threads, reply bodies, public profile, revisions, follows, reaction preferences and notifications; blocks if there are unresolved reports affecting the content and requires resolution first. Writes an immutable staff action. Status **PUBLIC_REDACTED does not claim full account erasure**: moderation/audit evidence, author linkage, remaining database backups and records in other modules require additional GDPR/Ukraine-law review and retention controls. Never auto-delete other members' replies or forensic evidence without a retention decision.
- No email address, raw birth details or user questions included in any forum profile / moderation public response. All private responses use Cache-Control: private,no-store.

### E. Recovery, monitoring and performance
- `npm run com:backup -- --output <external-secret-folder>/galaxiora.dump` uses `pg_dump` in custom format, checks archive with `pg_restore --list` and sets restrictive file permissions. Database password is passed via environment, not the command line. Contains the **entire** database; keep encrypted, access-restricted, never commit it. Verify backups regularly. No backup is actually taken in GitHub CI.
- Optional **destructive disposable-only** drill: `GALAXICOM_DRILL_CONFIRM=YES_DISPOSABLE_DATABASE` and `GALAXICOM_DRILL_DATABASE_URL` provided as an environment variable for a **separate** PostgreSQL test DB (never command-line credentials). Source and target database equality is blocked. Never run against production or personal DB.
- `npm run com:load` runs read-only 100 requests with concurrency 5 (configurable), two public forum endpoints, reports HTTP failures and p95. Not a substitute for representative production-sized traffic. Proposed staging gate: p95 <=2s at this probe intensity, no 5xx, zero exposed private content.
- C4 admin health endpoint and CI unit, PostgreSQL, browser regressions cover new flows. Operator monitors repeated 429, failed outbox, aged OPEN appeals/privacy, slow queries, backup age, review queue size.


### CI isolation after C4 expansion
- The desktop+mobile E2E suite uses one API process and many disposable registrations/logins. This can consume the unrelated **sitewide** 60/hour authentication test budget. CI now uses `GALAXIORA_E2E_TEST_AUTH=1` to raise **only that test process's auth budget** to 600 when `CI=true` **and** the PostgreSQL connection points to local `galaxiora_a1_test`. Production and local development stay at 60. The override is rejected for any other DB or host; dedicated policy unit tests guard this. Forum-specific quotas stay unchanged in CI and production.
- Sitewide authentication's single-process global bucket is not a substitute for a distributed per-IP/per-identity production defense; a real public launch still needs gateway anti-bot controls and account abuse modeling. This fixture adjustment does not approve public launch.

## Proposed published community rules (UA/EN editorial/legal review required)
- Be respectful, even when discussing disagreeing astrological traditions.
- Never publish other people's birth details, full charts, health concerns, addresses, contacts, account passwords, or private readings without explicit informed consent.
- No hate, harassment, spam, unsolicited commercial promotion, impersonating verified experts or deceptive guarantees of predictions.
- Report abuse using forum Report button; moderators document actions; affected authors can appeal within 30 days.
- Content authored by community members is their personal contribution, not official Galaxiora teaching or professional medical/legal/financial advice.
- Moderator/account reports may be retained for a defined period to investigate abuse, but a formal retention/backup deletion policy must be approved before broad public launch.

## Checklist for owner after fetching GitHub
1. `git status --short`, `git fetch origin`, `git switch fix/jqa3-windows-and-llm-recovery`, `git pull --ff-only`. If local modifications exist, save them before switching.
2. `docker compose up -d db`; `npm install`; `npm run db:generate`; `npm run db:migrate`. **Never reset** the database or use `docker compose down -v`.
3. `npm run test:com`; `npm run build`; `npm run dev:full`. Open `http://localhost:3000/uk/community`.
4. Register disposable A and B; A posts a topic, B replies. Run `npm run com:fanout`, verify one notification for A, no duplicate after rerun. Turn on worker schedule in production.
5. As SUPPORT/ADMIN hide B's reply; B opens Safety, appeals with a reason; a *different* SUPPORT/ADMIN handles it and verifies restored reply on ACCEPTED, with audit.
6. A downloads only A's own forum JSON. A requests removal; ADMIN reviews and PUBLIC_REDACTs after resolving pending reports, verifies A's public threads disappeared; test only on disposable accounts. Undo requires creating content again: redaction is not a reversible hide action.
7. Run `npm run com:load` against localhost with dev site available. Use manual operator backup only on a safely configured development DB.
8. Try the UI and buttons at mobile width, UA/EN. Verify PREMIUM cannot bypass quotas or edit another member's content.

## Unresolved public-launch gates
Human moderator staffing & appeal service windows, incident contacts, approved local privacy/retention and backup-erasure policy, real staging load testing, auth/login distributed abuse protection across whole site, retention housekeeping schedules, staging backup restore drill, production job scheduler and monitoring dashboards. Full JQA-3 numerical certification and GalaxiNews content licensing remain separate.
