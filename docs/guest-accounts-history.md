# Stage 8 — One website: public tools and private accounts

## Product behavior

Any visitor can calculate D1, D9 and D10, inspect planetary periods, and generate full AI or deterministic interpretations without registration. Guest requests do not create database records. Account registration is optional; a signed-in user may explicitly save a chart plus its reading, view history, reopen and delete their own entries.

## Security model

- Passwords are salted and scrypt-hashed. The session is in an HMAC-SHA256 signed seven-day HttpOnly cookie. Use a unique local AUTH_SECRET of at least 32 characters.
- Account mutations reject an Origin that does not match the site. Saved record queries always require a valid session and filter by ownerId.
- Previously stored guest charts are not deleted by migration; they retain ownerId NULL and are not accessible by the public API.
- A saved report is compiled server-side from the recalculated chart. Optional AI prose already shown to the user is kept as a saved snapshot. Free cloud inference receives derived chart facts, never raw dates/coordinates.
- Process-local throttles and SameSite cookies are baseline defenses; later production hardening still needs distributed rate limits, account recovery, optional email confirmation, proper data retention and hosting security.

## Windows setup (run from the CURRENT repo only)

Always use C:\Users\Note\jyotish-studio-git (NOT jyotish-studio-fixed-root). Stop the prior server and ngrok, then:

1. cd C:\Users\Note\jyotish-studio-git
2. git pull --ff-only origin main
3. node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
4. notepad .env — add AUTH_SECRET= followed by that 64-character random value. Keep OPENROUTER_API_KEY, AI_MODE=free, DATABASE_URL, etc. unchanged. Old PUBLIC_DEMO and DEMO_ACCESS values are ignored.
5. Start Docker Desktop; docker compose up -d --wait db
6. Back up any irreplaceable DB data before migrating.
7. npm run db:generate
8. npm run db:migrate
9. npm run test:access
10. npm run test:all
11. npm run test:swagger
12. npm run build
13. npm run start:full
14. In another PowerShell: npm run test:full; npm run site:check

Do not share the AUTH_SECRET, credentials or the root .env file in chat or GitHub.

## Manual testing checklist

- Open the site as a guest: no Basic login prompt. Calculate a fictional chart and create the full report.
- Guest history request should return 401. No guest chart is written to PostgreSQL.
- Register with valid email and 12+ character password; verify signed-in account state and ability to save.
- Check duplicate email, invalid email and password shorter than 12 characters all fail.
- Save an AI reading, refresh the site, sign out and sign back in, then reopen the saved record with its chart and report.
- Delete a record and confirm it disappears from history.
- Register another user in a separate browser and verify another account's charts and ID cannot be read, modified or deleted.
- Edit the form without recalculating: Save must use the LAST CALCULATED chart, not uncalculated form changes.
- Disable the cloud AI temporarily with AI_MODE=local and restart: guest reading still works. Restore AI_MODE=free afterward.
- Test on a phone through the real ngrok HTTPS URL. Restarting the PC requires Docker Desktop, npm run start:full and ngrok to be started again.

## Concepts

Prisma migration adds a User table plus Chart.ownerId and savedReport fields. Generate updates generated TypeScript types; migrate applies additive SQL changes. A session cookie lets the server recognize a logged-in user without putting a password into client requests. A guest result is stateless: calculations are performed, returned to the browser and not persisted in PostgreSQL. Only an explicit Save action writes user-owned history.