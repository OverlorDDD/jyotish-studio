# P388 AWS: generated Next.js metadata and Swiss preflight hotfix

## Actual production failure sequence (2026-11-03)
1. AWS P388 first failed during `npm run test:p410`: system `python3` lacked `swisseph`.
2. Operator installed an isolated Python venv `/home/ubuntu/.galaxiora-python/bin/python` with `pyswisseph==2.10.3.2` and confirmed both official compressed Swiss ephemeris files are present.
3. The failed release had already built the previous Next.js application during rollback. That build rewrote **tracked** `apps/web/next-env.d.ts`, leaving this file modified.
4. Next P388 preflight failed closed with `P388_LOCAL_MODIFICATIONS`. This is valid protection against arbitrary production modifications, but the deployment process must itself handle Next-managed rewrites safely.

## Hotfix
- On preflight: fetch and verify the exact pinned target commit, extract the pinned guard into `~/.galaxiora-p388`, recognize only the tracked Next.js metadata file with known Next header and generated route type references, preserve its exact bytes in a private mode-0600 backup, restore the **current HEAD version of that file alone**. Never run `git reset --hard`, `git clean`, or a blanket `git restore .`.
- On post-build and rollback: apply the same guarded reconciliation, because both Next builds can rewrite the file.
- Before touching code or making a new DB backup: verify the selected `PYTHON_BIN` points to Swiss `2.10.03`, official `sepl_18.se1` and `semo_18.se1` exist, and compute a real Swiss sunrise via the same `tools/panchanga-sunrise.py` code that caused the production failure.
- Keep all previous release gates: exact green GitHub push SHA, clean tracked source, fast-forward ancestry, release branding, live HTTPS secrets, native PostgreSQL connection, private DB dump, rollback, and complete site/SEO smoke. No Docker access or changing production database.

## Operator steps (one block, **after merge and exact green CI**)

Log into the same EC2 Ubuntu shell, not a Windows PowerShell prompt. These commands preserve the existing venv, brand assets, credentials and backups.

```bash
cd /opt/galaxiora/app
git fetch --no-tags origin refs/heads/release/panchanga-p36-production-acceptance-20261102
TARGET_SHA=$(git rev-parse --verify 'FETCH_HEAD^{commit}')
echo "RELEASE_SHA=$TARGET_SHA"
git show "$TARGET_SHA:tools/panchanga-p388-release.sh" > /tmp/galaxiora-p388-release.sh
bash -n /tmp/galaxiora-p388-release.sh
PYTHON_BIN=/home/ubuntu/.galaxiora-python/bin/python P388_TARGET_SHA="$TARGET_SHA" bash /tmp/galaxiora-p388-release.sh preflight
PYTHON_BIN=/home/ubuntu/.galaxiora-python/bin/python P388_TARGET_SHA="$TARGET_SHA" P388_CI_ATTESTED_SHA="$TARGET_SHA" P388_APPROVAL=I_APPROVE_P388_PRODUCTION bash /tmp/galaxiora-p388-release.sh deploy
```

The script independently requires all mandatory green CI statuses on `TARGET_SHA`; preflight fails closed if target moved or any dependency still fails. If a generated Next.js-only file is touched, it will be archived privately before restore; other tracked edits must be manually reconciled.

## Success
Look for `P388_NEXT_ENV_RECONCILED` (only if Next rewrote it), `P388_SWISS_SUNRISE_READY`, `P410_REAL_OPPORTUNITIES_PASS`, `P388_BACKUP_TOC_PASS`, and finally `P388_PRODUCTION_RELEASE_VERIFIED sha=<exact target>`. Verify `https://galaxiora.com/uk/panchanga` and `https://galaxiora.com/en/panchanga`, generated time windows, mobile UI, local timezone, news, auth, robots and approved spiral #6.

These CI tests are not a substitute for an **actual AWS live smoke**. Assistant GitHub connection cannot execute remote SSH commands; successful public deployment can only be claimed after operator stdout confirms the final success marker.
