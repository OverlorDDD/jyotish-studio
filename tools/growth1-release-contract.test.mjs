import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const source=readFileSync(new URL('./growth1-aws-release.sh',import.meta.url),'utf8');
test('standalone deploy uses reviewed GitHub branch and production ancestry',()=>{
 assert.match(source,/readonly BRANCH=release\/growth1-preserve-live-ga4-20261104/);
 assert.match(source,/readonly EXPECTED_LIVE_SHA=21e8b3d5ffb69d82467738ed70d31f6ad2c15e70/);
 assert.match(source,/readonly PINNED_SHA="\$\{1:-\}"/);
 assert.match(source,/\[\[ "\$TARGET_SHA" == "\$PINNED_SHA" \]\]/);
 assert.match(source,/git merge-base --is-ancestor "\$OLD_SHA" "\$TARGET_SHA"/);
 assert.doesNotMatch(source,/RELEASE_BLOB=|909c416735611e78b20a8d28ec1e09173ed72fa7/);
 assert.doesNotMatch(source,/readonly BRANCH=fix\/ga4-production|readonly BRANCH=fix\/ga4-reliable/);
 assert.doesNotMatch(source,/swap\(|replace_once\(/);
});
test('deploy retains analytics, indexability and SEO verification',()=>{
 assert.match(source,/SITE_NOINDEX!=="0"/);
 assert.match(source,/NEXT_PUBLIC_SITE_URL!=="https:\/\/galaxiora\.com"/);
 assert.match(source,/G-SZDVCT8TF4/);
 for(const step of [
 'npm run test:visitor-analytics',
 'npm run test:admin:realtime',
 'npm run test:brand-favicon',
 'npm run test:growth1:seo',
 'npm run test:r32:seo',
 'npm run test:r43:seo',
 'npm run test:r43:visitors',
 'npm run build',
 'npm run db:migrate'
 ]) assert.ok(source.includes(step),'missing deployment gate: '+step);
 assert.match(source,/APPROVED_GALAXY_6_BUILD_VERIFIED/);
 assert.match(source,/GROWTH1_RELEASE_COMPLETED/);
});
test('preflight rejects missing SHA before accessing live production',()=>{
 const file=new URL('./growth1-aws-release.sh',import.meta.url).pathname;
 const cmd=spawnSync('bash',['-n',file],{encoding:'utf8'});
 assert.equal(cmd.status,0,cmd.stderr);
 const result=spawnSync('bash',[file],{encoding:'utf8'});
 assert.equal(result.status,2);
 assert.match(result.stderr,/supply reviewed 40-character release SHA/);
 assert.doesNotMatch(result.stdout,/git fetch|Production commit|Verified DB backup/);
});
test('generated Next file and untracked artifacts are backed up rather than globally deleted',()=>{
 assert.match(source,/next-env\.d\.ts\.generated-before-deploy/);
 assert.match(source,/untracked-files\.tar/);
 assert.match(source,/git restore --source=HEAD --worktree -- apps\/web\/next-env\.d\.ts/);
 assert.match(source,/git switch --detach "\$TARGET_SHA"/);
 assert.doesNotMatch(source,/^\s*(?:git\s+reset\s+--hard|git\s+clean\s+-|git\s+stash\s+push)/m);
});
