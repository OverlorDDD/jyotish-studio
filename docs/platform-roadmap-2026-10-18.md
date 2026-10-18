# Galaxiora — delivery map (18 October 2026)

| Stage | Deliverable | Status |
|---|---|---|
| 0 | Existing Jyotish core, Swiss ephemeris, D1/D9/D10, interpretation rules | Implemented; Swiss license clearance before commercial release |
| 1 | International EN/UK portal, modular categories, CSS art | Implemented; Galaxiora chosen; domain/trademark not yet formally cleared |
| 2 | Shared registration and accounts; default MEMBER + FREE/PREMIUM entitlement | Implemented; premium billing not connected |
| 3 | Admin metrics and usage-based AI token accounting | Implemented; verify external provider cost data and add budget caps later |
| 4 | Admin user directory, role assignment, audit, first-owner setup | Implemented in this PR; manual local first-owner bootstrap still required |
| 5 | Tarot Studio: 78 cards, upright/reversed, one/three/Celtic Cross, three free readings UTC/day, private history | Implemented in this PR; paid LLM interpretation, visual assets, guest mode not implemented |
| 6 | Human reader showcase, personalized question draft before checkout, owner-only drafts | Implemented; actual payment / order conversion pending |
| 7 | Video marketplace end-to-end: payment, verified webhook, expert assignments, protected delivery | Partial database/API skeleton; no real checkout, payment or video storage |
| 8 | Western astrology, lunar/Panchang calendars, transits, compatibility | Planned |
| 9 | Yoga, meditation, journal, articles and CMS | Planned |
| 10 | Mobile app, 3+ additional languages, courses and subscriptions | Planned |
| 11 | Permanent hosting, analytics/SEO, branded domain, legal and accessibility launch review | Planned |

## Administrator setup
The repository cannot change a role inside the user's local PostgreSQL on its own. **Do not claim ADMIN was granted remotely.**

1. Start Docker Desktop Engine, then `docker compose up -d db`; do not run `docker compose down -v`.
2. `npm run db:generate` and `npm run db:migrate` against the correct localhost:5433 database.
3. `npm run admin:setup` from an interactive PowerShell window. This lists existing local registered accounts; select the right one and type the precise `PROMOTE <email>` confirmation. Only works when no administrator exists. Existing admin should use `/uk/admin` to grant further roles.
4. Log out/in at `/uk`, open `/uk/admin`, then use Users and permissions. Role changes are verified server-side and logged; admin cannot change self or remove the last admin.
5. `MEMBER` is the normal site role. `PREMIUM` is independent billing entitlement; role editor cannot create paid subscriptions.

## Role and account policy
- MEMBER: natal charts, private prepayment questions, 3 free Tarot draws per UTC day.
- EXPERT: reserved for verified practitioners; paid-order workspace and private delivered videos are a later milestone.
- SUPPORT: reserved for customer assistance, not admin grant permissions.
- ADMIN: platform overview and role management. Changing roles requires valid signed cookie, same-origin PATCH, second DB admin check, atomic transaction and audit row.
- Anonymous visitors can view marketing pages and Tarot descriptions, but readings require sign-in for server-enforced free quotas.
- No arbitrary user may set their own role or paid subscription with a client request.

## Tarot MVP behavior
Server uses Node crypto randomInt for a 78-card shuffled draw. Card positions and reversal are stored and can be revisited privately. One-, three-, and Celtic Cross ten-card layouts with bilingual local meaning hints.
The interpretations are symbolic educational content, **not factual predictions**. 3 server-enforced daily requests per authenticated account (UTC midnight reset). Database row locking serializes parallel draw requests. No paid AI network request occurs for Tarot.

## Paid human expert workflow
Private question-before-checkout drafts remain available only to their owners with positive consent. They are not an order; other users and experts cannot read them. The modal is honest that payment is not configured.
Do not convert a draft to a paid order until a properly authenticated payment-provider webhook verifies settlement and conditions. Future work: expert profiles, price/terms, order reconciliation, admin workflow, video upload/access, notifications, refunds, background retention/cleanup and contractor payouts.

## SEO and naming
Brand Galaxiora is centralized in `apps/web/lib/brand.ts` ; domain and trademark verification remains required. The product naming hierarchy will be e.g. [Brand] Tarot / Astro / Yoga / Academy / Experts / Journal. Search titles need descriptive words; no promise that a proposed name has a free .com or trademark clearance.

## Regression checklist
- `npm run test:all`, `npm run test:swagger`, `npm run build`, `npm run db:migrate` (requires running local DB).
- Anonymous `GET /api/v1/admin/users` -> 401; MEMBER -> 403. PATCH role as member -> 403. ADMIN can assign EXPERT/SUPPORT/ADMIN/MEMBER to others, but not self.
- Verify role-change audit list. User list must omit password hashes, reading questions and raw chart data.
- Sign in to `/uk/tarot`: choose one, three or ten cards; press draw; flip each; check orientations; use history.
- Fourth reading that UTC day -> 429 even in parallel or after browser refresh. Anonymous draw -> 401.
- Confirm `/uk/account` still has private tarot question drafts and free/premium status; Jyotish D1/D9/D10 and detailed reports unchanged.
- `/uk/experts` accepts only consented private drafts, then shows an **unavailable** payment button. No charge or expert delivery yet.
- Ensure Docker Postgres volume retained on machine; local DB inaccessible will still prevent backend startup.
