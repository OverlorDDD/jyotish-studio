# Stage 3 — Free/Premium membership and question-first human tarot (2026-10-18)

## Changes
- **Access role** remains independent: MEMBER (ordinary registered user), EXPERT, SUPPORT, ADMIN.
- **Subscription entitlement**: FREE (all old and new users by default) or PREMIUM only while subscriptionEndsAt > now. Payment integration for subscriptions is intentionally NOT activated. A subscriber never receives admin/expert powers.
- A signed-in user can submit an open question + relevant context and explicit data-storage consent *before* payment. The request is stored as an owner-only private ReadingDraft (not a paid order) with a seven-day expiry timestamp.
- After successful draft save, the client opens the next-step **checkout modal** with clear "payment not configured" disclosure and disabled Pay button. No charges or order assignment occur.
- The form includes less useful and better question examples, topic, optional timeframe, privacy warning and length validation.
- Owners can see their own draft list and delete drafts through a cookie-authenticated API. Drafts do not appear in practitioner order views.
- Admin dashboard gets aggregate counts for free members, effective premium accounts, and not-expired draft leads. Admin overview never exposes draft text.
- Post-payment order processing remains separately guarded on server: only verified payment and correct customer may submit a paid-order brief. The future payment implementation should copy the approved precheckout draft into the actual order ONLY after verified provider webhook.

## Explicitly deferred
- An approved payment provider, pricing, checkout session creation, webhook verification, expert assignment, media delivery and recurring membership billing.
- Consent policy, retention schedule and payout terms must be legally reviewed before public launch.
- Real subscriptions must be granted/renewed/expired only by trusted server-side payment events and database transactions.
- Branding AstraNira remains provisional until naming and domain / trademark validation; do not hard-code a finalist as permanent.

## Security decisions
The draft API requires a signed-in user, same-origin mutations, positive privacy consent, validated topic/question/context lengths, per-process throttling and at most five drafts per account per 24 hours. An order is not created. An expert cannot fetch a draft via any new endpoint. Ownership is checked on list/deletion. A draft's question is sensitive: do not print in logs or analytics. Rate caps and spam protection should be upgraded to distributed checks before public scale.

The expiry timestamp **hides** old drafts from users after seven days; physical deletion must be scheduled. Command: `npm run db:prune-drafts` (DB required), suitable for a future daily server scheduler. Avoid claiming automatic deletion until that scheduler exists.

## Windows diagnostics from user log
PowerShell PSReadLine crash on Ctrl+V is a terminal/rendering issue, not a TypeScript application failure. Restart/maximize Windows Terminal and paste fewer commands at once; consider updating PSReadLine.
Docker Desktop Linux Engine not running was the **actual** blocker: `docker info` failed to connect; then `docker compose up -d db` failed; then Prisma P1001 on localhost:5433; finally Nest failed during Prisma module initialization.
Do not use `docker compose down -v` or delete the persistent jyotish-postgres volume. Restart Docker Desktop and verify Engine running.
Once Docker is available:
```powershell
cd C:\Users\Note\jyotish-studio-git
git status --short
git pull --ff-only origin main
npm install
npm run db:doctor
docker compose up -d db
docker compose ps
npm run db:generate
npm run db:migrate
npm run test:all
npm run test:swagger
npm run build
npm run dev:full
```
Run `npm audit --omit=dev` to inspect the reported 15 vulnerabilities. Do not blindly use `npm audit fix --force`, and do not delete untracked package-lock.json or tracked modified next-env.d.ts without reviewing local changes.
The earlier autoprefixer "align-items:start" warning was also corrected.

## Manual checks
1. Without login, submit to `/uk/experts`: should show an authentication error, retain typed text, no checkout modal or charge.
2. Register a normal user and verify `/api/v1/account/me` returns role MEMBER and subscription.tier FREE.
3. Submit valid draft with consent: private draft persists; checkout modal opens; Pay remains disabled. No expert receives the question.
4. Open /uk/account; verify owner sees and can delete draft. A different user cannot see/delete it. Manually submit malformed and over-limit payloads.
5. Verify no premium privileges with fake client payloads; expiry controls effective tier.
6. Verify /uk/admin only works for existing ADMIN, and statistics contain aggregate drafts without question content.
7. Check existing D1/D9/D10, saved charts, reports, API guards, Swagger and site compilation still pass.
8. Prune expired drafts with `npm run db:prune-drafts` after migration; set up a daily scheduler before production.

## Naming
Proposed modular scheme: [root brand] Tarot / Astro / Yoga / Academy / Experts / Journal. Search-facing SEO titles should also contain descriptive intent keywords independent of brand. Candidate names from preliminary web searches are NOT domain availability guarantees.
