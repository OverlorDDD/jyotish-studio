# P388 / P4.10 — AWS Docker-free PostgreSQL release fix

**Bug:** previous P388 preflight called `docker inspect jyotish-db` and used `docker exec` for `pg_dump` / `pg_restore`. On the EC2 shell, Docker API permission was denied. That does **not** prove PostgreSQL is down; the already-running API reports HTTP 200. Do not solve this by adding `ubuntu` to the Docker group, altering Docker socket permissions, stopping PostgreSQL or removing the required DB backup.

**Fix:** pinned P388 release now uses the existing private `DATABASE_URL` (the same one as the production NestJS/Prisma API), `psql`, `pg_dump` and `pg_restore` over PostgreSQL's native protocol. Zero Docker commands are executed during preflight, backup or deployment. Database password is decoded from `DATABASE_URL` into private `PGPASSWORD` child **environment only**, never placed in command arguments, URLs printed to stdout, GitHub or shell history.

**Critical:** The database might still be *hosted* in a container. This fix removes the **need for access to Docker**; it does not migrate PostgreSQL to another host or change any container. If PostgreSQL is unreachable from EC2 via the existing `DATABASE_URL`, **STOP** and diagnose its host/port, do not change production DB credentials and do not deploy without a valid backup.

## Operational gates

- Existing `.env` and API/Web/Caddy active, `SITE_NOINDEX=0`, HTTPS domain and secure cookie policy maintained.
- The release branch has been merged with a true merge commit, contains all P388/P4.10 code and the **native-helper fix**, and green GitHub **push** workflows on the exact new merged SHA; no bypass of independent Swiss QA, brand or SEO checks.
- Existing checkout is clean for *tracked* files, verified ancestor of candidate; untracked logo overlay, package-lock and other assets must not be overwritten by target checkout. Never `git reset --hard`, `git clean` or delete them.
- Native PostgreSQL client from Ubuntu, compatible with database server; `psql SELECT 1` and `pg_dump --schema-only` verify reachability and version **before** code switch.
- The private release archive is created at `~/.galaxiora-p388/backup-*/production-before.dump` (mode 0600), custom format, with `pg_restore --list` proving readability and application tables. The exact archive *must* be complete before switching code; independent CI restores a disposable database as part of acceptance.
- No Docker API group permission, socket chmod, arbitrary container stop/start, database reset, live .env rewrite or Redis/news/indexing/brand changes.

## One SSH Bash block after exact merged-SHA CI is GREEN

Inside existing `ubuntu@...` SSH session (this is **Bash on EC2**, not PowerShell):

```bash
set -euo pipefail
cd /opt/galaxiora/app
# Native PostgreSQL client. Ubuntu 24.04 uses postgresql-client-16.
if ! command -v psql >/dev/null || ! command -v pg_dump >/dev/null || ! command -v pg_restore >/dev/null; then
  sudo apt-get update
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql-client-16
fi
git fetch --no-tags origin refs/heads/release/panchanga-p36-production-acceptance-20261102
TARGET_SHA=$(git rev-parse --verify 'FETCH_HEAD^{commit}')
echo "REVIEWED_RELEASE_SHA=$TARGET_SHA"
# Before continuing, verify manually that this exact SHA has all required green checks.
git cat-file -e "$TARGET_SHA:tools/panchanga-p388-db-direct.mjs"
git show "$TARGET_SHA:tools/panchanga-p388-release.sh" > /tmp/galaxiora-p388-release.sh
test -s /tmp/galaxiora-p388-release.sh
bash -n /tmp/galaxiora-p388-release.sh
export P388_TARGET_SHA="$TARGET_SHA"
bash /tmp/galaxiora-p388-release.sh preflight
# deploy only after independently green preflight and explicit operator approval
export P388_CI_ATTESTED_SHA="$P388_TARGET_SHA"
export P388_APPROVAL=I_APPROVE_P388_PRODUCTION
bash /tmp/galaxiora-p388-release.sh deploy
```

The script independently queries GitHub Actions by SHA and fails closed when CI isn't green. The pinned preflight proves DB connectivity through the existing private `.env`, then deployment writes a native custom-format backup before any code switch. Do not pass the old P4.10 SHA `43a6f8e...` after this fix merges: **the new merged SHA will differ**.

## Success and rollback

Success marker: `P388_PRODUCTION_RELEASE_VERIFIED sha=<exact merged SHA>`. Check `https://galaxiora.com/uk/panchanga`, `https://galaxiora.com/en/panchanga`, Galaxy #6 favicon, News, Login, GA4, and 320/390 px phone displays. Exact Choghadiya/Hora start times, no 53% ring, tomorrow + 7 days + .ics, private guest isolation.

If preflight fails: **no deploy was attempted**. Show only the safe `P388_STOP` / `P388_NATIVE_PG_STOP` message; do not paste private connection strings. If database client is older than the DB server, install the matching newer client rather than downgrading the database. If direct PostgreSQL connectivity fails, inspect the already-running API's connection configuration **without printing the password**; do not use Docker or force deployment.

If deployment later fails, the existing guarded P388 release script automatically attempts a **code-only rollback**, without attempting a destructive database restore. For a manual rollback after investigating the failure, use:

```bash
export P388_ROLLBACK_APPROVAL=I_APPROVE_P388_ROLLBACK
bash /tmp/galaxiora-p388-release.sh rollback
```

**Not done by the assistant:** direct SSH, AWS mutation and live deployment are not accessible from a GitHub connection. Code must merge, same-SHA CI must pass, and the operator runs the above block in the current SSH shell.
