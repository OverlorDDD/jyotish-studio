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

test('G3.4 analytics workflow publishes required postmerge check when G3.5 release code changes',()=>{
 const workflow=readFileSync(new URL('../.github/workflows/g34-first-party-analytics.yml',import.meta.url),'utf8');
 for(const path of ['tools/g35-aws-release.sh','tools/g35-release-contract.test.mjs']){
  assert.equal(workflow.split("'"+path+"'").length-1,2,'workflow should include in both PR and main filters: '+path);
 }
 assert.match(workflow,/name: G3\.4 First-Party Analytics Privacy and UX/);
 assert.match(workflow,/analytics-contract:/);
});

test('G3.5 release gating is isolated from unfinished N4/JHora, without bypassing release safety',()=>{
 const start=script.indexOf('check_ci(){');
 const end=script.indexOf('check_changes(){');
 assert.ok(start>=0 && end>start);
 const ci=script.slice(start,end);
 const requiredMatch=ci.match(/required=\(([^]*?)\)/);
 assert.ok(requiredMatch,'exact-SHA required check list missing');
 const required=requiredMatch[1];
 for(const name of [
  'Chromium accessibility, SEO and user smoke',
  'PostgreSQL authorization and concurrency','test','main-source-of-truth',
  'analytics-contract','social-auth-security'
 ])assert.ok(required.includes("'"+name+"'"),name);
 assert.doesNotMatch(required,/JHora|Windows/,'unreleased N4 fixture must not gate independent OAuth');
 assert.match(ci,/commits\/\{sha\}\/check-runs/,'exact target commit check required');
 assert.match(ci,/get\('conclusion'\)!='success'/,'required jobs must pass');
 const changes=script.slice(script.indexOf('check_changes(){'),script.indexOf('check_pending_migrations(){'));
 assert.match(changes,/git diff --name-only "\$live" "\$TARGET"/);
 assert.match(changes,/\*\) die "Unreviewed production diff path:/);
 assert.doesNotMatch(changes,/feat\/n4-shodashavarga|jhora-windows-fixtures/);
});
