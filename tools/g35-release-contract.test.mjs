import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const script=readFileSync(new URL('./g35-aws-release.sh',import.meta.url),'utf8');
test('G3.5 production release has valid Bash syntax, pinned SHA and explicit approval',()=>{
 const res=spawnSync('bash',['-n'],{input:script,encoding:'utf8'});
 assert.equal(res.status,0,res.stderr);
 for(const marker of ['APPROVED_BASE=af5583920c0d3556d43eeb58be61d4ae0be8bcb4',
  'G35_DEPLOY_APPROVAL','G35_PREFLIGHT_PASS','G35_PRODUCTION_RELEASE_VERIFIED',
  'G35_SOCIAL_PROVIDER_STATUS_PASS','G35_DB_MIGRATION_GATE_PASS',
  'EXACT_SHA_CI_PASS','G35_ADMIN_AUTH_GATE_PASS'])
  assert.ok(script.includes(marker),marker);
});
test('Refuse unreviewed code and exact main race; do not edit or reset .env',()=>{
 for(const marker of ['git merge-base --is-ancestor "$live" "$TARGET"',
  'git diff --name-only "$live" "$TARGET"',
  "git fetch --no-tags origin refs/heads/main",
  'social-auth-security','analytics-contract',
  'apps/api/src/social-auth.ts','apps/api/prisma/schema.prisma',
  '20261105170000_optional_oidc_identities/migration.sql',
  'apps/web/app/components/AdminAnalyticsPanel.tsx',
  'tools/g34-aws-release.sh'])
  assert.ok(script.includes(marker),marker);
 for(const unsafe of [
  /\bgit\s+reset\s+--hard\b/,/\bgit\s+clean\b/,/\bgit\s+stash\b/,
  /\bdocker\s+(?:run|exec|compose|inspect)\b/,
  /sed\s+-i\s+.*\.env/,
  /curl\s+.*\|\s*bash/
 ])assert.doesNotMatch(script,unsafe);
});
test('Mandatory custom-format PostgreSQL dump BEFORE additive schema change',()=>{
 const dump=script.indexOf("G35_DB_BACKUP_PASS");
 const mig=script.indexOf('npm run db:migrate');
 assert.ok(dump>0 && mig>dump);
 assert.ok(script.includes("PGPASSWORD:decodeURIComponent(parsed.password)"));
 assert.ok(script.includes("'pg_dump'"));
 assert.ok(script.includes("fs.openSync(target,'wx',0o600)"));
 assert.ok(script.includes("pending.some(x=>x!=='20261105170000_optional_oidc_identities')"));
 assert.ok(script.includes("npm run db:generate"));
 assert.ok(script.includes("G35_ROLLBACK_APPROVAL"));
 assert.ok(script.includes("rollback_to_backup"));
 assert.ok(script.includes("sudo systemctl restart galaxiora-api"));
 assert.ok(script.includes("sudo systemctl restart galaxiora-web"));
 assert.ok(script.includes("G35_APPROVED_GALAXY_6_PASS"));
});
