# A7 Phase 1: Verified practitioners and private service groundwork

## Delivered now
- EXPERT role may submit **consented**, bilingual public profile (name, Ukrainian/English bio and specialties) via `/{locale}/experts`.
- ADMIN (a distinct user) reviews/rejects/suspends applicants in protected review queue. Server reads current DB user role; review uses expected revision for optimistic concurrency and forbids self-approval.
- Public API `GET /api/v1/experts` returns only verified profiles whose accounts still carry EXPERT role; exposes **no email, userId, review history or private client brief**. Public UI openly says bookings are not enabled.
- A7 adds `ExpertProfile` model and additive PostgreSQL migration `20261020150000_expert_verification_a7` without modifying existing chart/Tarot/reading draft rows.
- Customer `GET /api/v1/reading-orders/my-orders` is owner-only and does not disclose provider references, video files or other customers.
- ADMIN queue `GET /api/v1/reading-orders/admin/queue` includes only orders that the DB has flagged with nonnull verified provider payment and provider payment ID, and never displays pre-checkout drafts. Currently no checkout produces such orders.
- Precheckout question drafts still require explicit privacy consent, expire after seven days, and are not shared with practitioners.

## Must not misrepresent as finished
There is **no** production-approved payment provider, signed webhook, price matrix, refund automation, license-cleared video storage, delivery authorization, legal terms, nor paid subscription billing. Their workflow CANNOT honestly be marked completed or activated in this phase. Do not create fake payment success from client, admin buttons or query parameters.

## Required next payment and delivery gate
1. Choose a lawful payment provider and supported seller country. Verify vendor account, fees, settlement and refunds policies.
2. Decide offer catalog and price/currency, taxes, refund policy, cancellation window, expert identity checking and payouts.
3. Build provider adapter on server, create checkout only from owned consented draft, store immutable provider reference and expected amount/currency.
4. Verify webhook raw-body signature, match immutable order/provider/amount/currency and use unique idempotency event IDs in PostgreSQL; only then transition `AWAITING_PAYMENT → PAID`.
5. Secure expert assignment from verified pool with explicit admin action and audit; private briefs released only after verified payment.
6. Store video in access-controlled object storage and serve time-limited authorizations to the owner; implement content retention/deletion and refunds by verified provider events.
7. Add disposable DB integration tests for forged/duplicate/out-of-order webhooks, amount mismatch, role changes, refund races and video permission boundary before production launch.

References: Stripe checkout fulfillment <https://docs.stripe.com/checkout/fulfillment>; OWASP webhook <https://cheatsheetseries.owasp.org/cheatsheets/Webhook_Security_Cheat_Sheet.html>; OWASP third-party payment gateway <https://cheatsheetseries.owasp.org/cheatsheets/Third_Party_Payment_Gateway_Integration_Cheat_Sheet.html>.

## Windows PowerShell: update from Docker
1. Start Docker Desktop; wait for Engine running. Stop prior local site with Ctrl+C.
2. `cd C:\Users\Note\jyotish-studio-git`
3. `docker compose up -d db`
4. `git status --short` then `git pull --ff-only origin main`; `npm install`.
5. Preserve `.env` and secret tokens. `npm run db:generate` then `npm run db:migrate` (additive only).
6. `npm run security:check`; `npm run test:expert:a7`; `npm run test:report`; `npm run test:ai`; `npm run test:all`; `npm run build`.
7. `npm run dev:full`; visit `http://localhost:3000/uk/astrology/jyotish` and `http://localhost:3000/uk/experts`.
8. As ADMIN, open account role management in `/uk/admin` and promote a separate **test** account to EXPERT; log in as the expert and submit bilingual profile; log in as ADMIN to verify; verify public listing and suspension. Do not promote random users or create public medical claims.
9. Recalculate a natal chart; inspect local reading plus optional free AI narrative. Confirm the conclusion discusses **lagna, house rulers, Venus/Moon and professional D10 / dasha connections** rather than weekly goals.
10. Check account history, old Tarot spreads, existing Yoga and Academy and 360px mobile layout. Manual QA is separate from CI and no real checkout is available.

## Dependency budget
No extra npm/LLM packages are needed. This patch consumes no extra paid model requests or third-party services; curated manuals and explicit prompts are checked in as text, not licensed book copies.
