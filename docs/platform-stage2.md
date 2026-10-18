# Platform accounts, admin operations, paid-first reading architecture (Stage 2, 2026-10-18)

## Global identity
Shared existing cookie auth is now accessible through the public EN/UK navigation and `/{locale}/account`. Jyotish keeps its original account/history component. Server returns database role in account login/register/me. Supported roles: MEMBER (default), EXPERT, SUPPORT, ADMIN.

Never set ADMIN based on email matching in browser, user registration payload, or public requests.

## Initial admin setup (Windows PowerShell)
After pulling the merged commit and making a **database backup**:

```powershell
cd C:\Users\Note\jyotish-studio-git
git pull --ff-only origin main
npm install
docker compose up -d db
npm run db:generate
npm run db:migrate
npm run test:all
npm run test:swagger
npm run build
npm run dev:full
```

Register with your intended private admin email using the public site. The role remains MEMBER. In a **separate PowerShell** in this repo root:

```powershell
$env:ADMIN_EMAIL = "your-registered-email@example.com"
$env:CONFIRM_ADMIN_PROMOTION = "YES"
node --env-file=.env tools/grant-admin.mjs
Remove-Item Env:ADMIN_EMAIL
Remove-Item Env:CONFIRM_ADMIN_PROMOTION
```

The address shown is only a placeholder; do not copy it. This explicit script only updates an existing user after both environment controls are set. Sign out/in to refresh the role in the browser.

### Admin pages & protection
- `/en/admin` or `/uk/admin`: fetches `GET /api/v1/admin/overview`.
- Admin API checks the **signed session cookie and DB role** on every request, so typing the dashboard URL does not grant access.
- `GET /api/v1/admin/orders` returns recent private order records only to admin (not linked publicly; handle confidentially).
- Dashboard aggregates users, saved charts, reading order statuses, provider/model AI calls and **provider-reported** input/output/total tokens from the last 30 days.
- Not all providers report token usage or USD costs: null cost is shown as unknown; request-coverage count is displayed. We do not fabricate estimates.
- No birth data, prompts, password hashes, or private briefs are included in aggregate responses.

### Usage instrumentation
AI adapter calls its optional `onUsage` callback once per outbound request on success, HTTP error, and transport error. Retries count as separate requests. Only provider/model/outcome/optional provider-reported token counts and cost are recorded; raw prompts, birth details, API keys and response text are never stored in telemetry.
If the provider does not return usage, token fields remain NULL.
In-process replay/cached reports make no outbound calls and therefore do not generate an AI usage record.
Failed DB telemetry writes must not prevent a reading, and are logged without contents.

### Paid video reading order policy
1. Public page explains benefit, trust/privacy, examples of a good question and full sequence.
2. Expert and offer selection and **approved payment checkout** (NOT active in this stage).
3. Only trusted signed, validated webhook from an approved provider sets `ReadingOrder.status=PAID`, `paymentVerifiedAt` and `providerPaymentId` in a server transaction (NOT implemented yet).
4. Customer's browser may submit `POST /api/v1/reading-orders/:id/brief` only with signed login session, matching order ownership, status PAID, non-null payment confirmation fields, empty prior brief and valid context. All checked **atomically in SQL** via Prisma `updateMany`. Payment is not accepted by request body, URL flags or client-generated values.
5. Later stages: expert assignment, in-progress updates, encrypted delivery video, completion, refund/cancellation, user and admin timelines, disputes and audited status transitions.

No checkout, payment provider, expert onboarding or video upload is live. **Public brief form is deliberately not shown until payment integration can prove eligibility**, avoiding false intake. Existing development-only `ReadingIntake` remains unused as a reference for a future paid brief form.

### Next requirements
- Verify proposed brand with official trademark registry and registrar; **current AstraNira is provisional**. Keep brand in `apps/web/lib/brand.ts` until a definitive decision.
- Choose eligible payment provider for Ukraine-to-international tarot services and consult counsel about compliance, refunds, taxes, payouts, jurisdiction and privacy.
- Add verified webhook, orders/customer histories, expert role workflow, role-grant auditing, notification delivery and protected media storage. Avoid using unverified webhook payloads or frontend payment redirect as a payment proof.
- Cost forecasting can add trusted per-model price schedules and provider reconciliation once billing is selected; unknown usage must remain unknown.

## Manual smoke and permission checks
1. `/en` and `/uk` show account entry; login/register/logout; chart account in `/en/astrology/jyotish` still works.
2. Guest admin API: 401; MEMBER admin API: 403; existing ADMIN: 200 after explicit promotion. No way to set role in register.
3. Invalid guest/other customer order brief: 401/403. PAID without `paymentVerifiedAt`: 403. Verified payment and matching owner only: one successful post, second post 403.
4. Monitor admin AI dashboard when local fallback only and when an OpenRouter response has token usage: request count and coverage, no fake token/cost values.
5. Confirm no order question form or payment CTA that can submit while checkout is inactive.
6. Verify `npm run test:all`, `npm run test:swagger`, `npm run build` and health. Run a full browser mobile + database smoke test on Windows before public use.

## Naming candidates
These remain unconfirmed, preliminary search candidates: Sukhiva, SukhaNova, SukhaStar, SiddhiSky, SomaAura, LumaVeda, LokaLight, TaraBloom, VedaMira, StarAnanda. Existing public uses discovered: TaraVeda, JyotiVerse, Kosmira, Omnara, VedaNest. No domain/TM availability is guaranteed by web-index absence.

Sanskrit etymology reference: https://www.sanskritdictionary.com/sukha/263933/1 and https://www.sanskritdictionary.com/siddhi/262940/1 .
