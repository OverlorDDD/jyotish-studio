# Galaxiora local startup recovery (2026-10-26)

The Windows log establishes Docker Linux Engine is unreachable, followed by PostgreSQL P1001 at localhost:5433, NestJS failure and Next.js proxy ECONNREFUSED to 127.0.0.1:4000. This caused the GalaxiNews fetch error; it was NOT a missing RSS source.

## Safe Windows restart
1. Open **Docker Desktop** and wait for the Linux Engine to report "running"; GitHub changes cannot start Docker on a remote Windows PC.
2. Stop any half-started website processes (Ctrl+C).
3. Run PowerShell: \`cd C:\Users\Note\jyotish-studio-git\`
4. \`git pull --ff-only origin fix/jqa3-windows-and-llm-recovery\`
5. \`docker info\` must succeed; otherwise resolve Docker Desktop / WSL first.
6. \`npm run dev:full\` now starts the existing DB safely and waits for healthy \`jyotish-db\`, generates Prisma Client, applies pending migrations, **then** launches Next.js and NestJS. The \`jyotish-postgres\` Docker volume is preserved.
7. Verify \`http://localhost:3000/api/health\` returns "ok" and database "connected". Verify \`http://localhost:3000/api/v1/news/feed\` returns a JSON items array. Open \`http://localhost:3000/uk/news\`.

**Never run** \`docker compose down -v\`, \`prisma migrate reset\`, or \`npm audit fix --force\` as general troubleshooting. They can destroy data or force breaking upgrades.

## Other issues in the log
- NewsWorld CSS \`align-items:end\` corrected to \`flex-end\`.
- The public "Sources checked approximately every 15 minutes" and Ukrainian variant are removed from hero/sidebar/loading messages; backend cadence remains unchanged.
- The isolated \`Unexpected end of JSON input\` on /uk was seen while Next.js was compiling after backend failure. The logs are not sufficient to prove its own root cause. Check CI SSR/Chromium tests; if it persists only in dev, stop servers and investigate Next's generated build cache before touching personal data.
- npm reports 15 vulnerabilities without names or fix details. Read-only CI \`npm audit\` diagnostics now list affected packages and remediation candidates. Do not blindly perform breaking changes.
- npm install-scripts warnings merit specific review, not blanket approval. Prisma Client generation itself passed.
- Next automatically modified \`apps/web/next-env.d.ts\`; inspect before restoring any tracked file.

Tests: \`npm run test:bootstrap\` and \`npm run test:news\`. CI containers cannot verify that Docker Desktop is actually running on the user's Windows PC.
