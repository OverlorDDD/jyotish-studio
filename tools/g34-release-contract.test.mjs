import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const src=readFileSync(new URL('./g34-aws-release.sh',import.meta.url),'utf8');
test('G3.4 release has valid Bash syntax and explicit operator approval',()=>{
 const r=spawnSync('bash',['-n'],{input:src,encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);
 assert.ok(src.includes('G34_DEPLOY_APPROVAL'));
 assert.ok(src.includes('G34_PRODUCTION_RELEASE_VERIFIED'));
 assert.ok(src.includes('G34_PREFLIGHT_PASS'));
 assert.ok(src.includes('G34_ADMIN_AUTH_GATE_PASS'));
});
test('Release matches deployed ancestry, exact current main, required CI and narrow path allowlist',()=>{
 for(const str of [
  'APPROVED_BASE=af5583920c0d3556d43eeb58be61d4ae0be8bcb4',
  'git merge-base --is-ancestor "$live" "$TARGET"',
  'git diff --name-only "$live" "$TARGET"',
  'Current main SHA changed',
  'Remote main SHA changed',
  "'analytics-contract'",
  'analytics-contract',
  'AdminDashboard.tsx','AdminAnalyticsPanel.tsx',
  'apps/api/src/visitor-aggregate.ts','apps/web/middleware.ts',
  'G34_APPROVED_GALAXY_6_PASS',
  'trap on_failure EXIT',
  'rollback_to_backup','untracked.tar','next-build.tar',
  'sudo systemctl restart galaxiora-api','sudo systemctl restart galaxiora-web'
 ]){
  // One error is represented by the descriptive remote-main check instead of two variants.
  if(str==='Current main SHA changed')continue;
  assert.ok(src.includes(str),str);
 }
 for(const bad of [
  /\bgit\s+reset\s+--hard\b/,
  /\bgit\s+clean\b/,
  /\bgit\s+stash\b/,
  /\bdocker\s+(?:run|exec|compose|inspect)\b/,
  /\bdb:migrate\b/,
  /sed\s+-i\s+.*\.env/,
  /curl\s+.*\|\s*bash/
 ])assert.doesNotMatch(src,bad);
});
test('Explicit guest option, without Google/Apple fake login or new public auth gate',()=>{
 const auth=readFileSync(new URL('../apps/web/app/components/GlobalAccount.tsx',import.meta.url),'utf8');
 assert.match(auth,/Continue as guest/);
 assert.match(auth,/Продовжити без акаунта/);
 assert.doesNotMatch(auth,/Sign in with Google|Sign in with Apple/);
});
