import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const script=readFileSync(new URL('./g33-aws-release.sh',import.meta.url),'utf8');
const plan=readFileSync(new URL('../docs/seo/g33-first-real-visitors-20261105.md',import.meta.url),'utf8');
test('release script is syntactically valid Bash',()=>{
 const r=spawnSync('bash',['-n'],{input:script,encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);
});
test('release uses pinned main SHA, exact checks, narrow changes, and safe backup/rollback',()=>{
 for(const required of [
  'git merge-base --is-ancestor "$live" "$TARGET"',
  'git diff --cached --quiet',
  'git ls-files --others --exclude-standard -z',
  'untracked.tar','next-build.tar','rollback_to_backup',
  'G322_DEPLOY_APPROVAL','G322_PRODUCTION_RELEASE_VERIFIED',
  'EXACT_SHA_CI_PASS','apps/web/next-env.d.ts',
  'G322_PREFLIGHT_PASS','G322_APPROVED_GALAXY_6_PASS'
 ])assert.ok(script.includes(required),`Missing: ${required}`);
 for(const unsafe of [/\bgit\s+reset\s+--hard\b/,/\bgit\s+clean\b/,/\bgit\s+stash\b/,/\bdocker\s+(?:exec|compose|run|inspect)\b/,/\bdb:migrate\b/])
  assert.equal(unsafe.test(script),false,`Unsafe command: ${unsafe}`);
});
test('experiment is consent-limited, not published, and has approved campaign fields',()=>{
 for(const x of ['draft_not_sent','astro_basics','utm_source=telegram','utm_medium=social',
  'public_tool_completed','consent','No scraping, spam','without a real participating partner'])
  assert.ok(plan.includes(x)||readFileSync(new URL('../docs/seo/g33-first-real-visitors-tracker-20261105.csv',import.meta.url),'utf8').includes(x),x);
});
