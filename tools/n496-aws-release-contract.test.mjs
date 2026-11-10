import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const src=readFileSync(new URL('./n496-aws-release.sh',import.meta.url),'utf8');

test('N496 deploy only merged main, preserves divergent production and tests public five-theme Reader',()=>{
 assert.match(src,/^set -Eeuo pipefail/m);
 assert.match(src,/^BRANCH=main$/m);
 assert.match(src,/RELEASE_ANCESTOR=6b3fe1b694739f7f1fc945adefc430b394766550/);
 assert.match(src,/git merge-base --is-ancestor "\$RELEASE_ANCESTOR" "\$TARGET"/);
 assert.match(src,/git update-ref "\$backupRef" "\$OLD"/);
 assert.match(src,/git rev-parse "\$backupRef"/);
 assert.match(src,/N496_PRODUCTION_ROLLBACK_REF_SAVED/);
 assert.match(src,/git -c advice\.detachedHead=false switch --detach "\$TARGET"\nCHANGED=1/);
 assert.match(src,/switch --detach "\$OLD"/);
 assert.match(src,/Dirty tracked production files/);
 assert.match(src,/N496_AWS_PREFLIGHT_PASS/);
 assert.match(src,/N496_PRODUCTION_RELEASE_VERIFIED/);
 assert.match(src,/N496_PUBLIC_REPORT_BINDING_VERIFIED/);
 assert.match(src,/meaningful\?\.portrait\?\.version!=="n496-human-portrait-1\.0\.0"/);
 assert.match(src,/portrait\?\.areas\?\.length!==5/);
 assert.match(src,/tools\/n496-human-portrait\.test\.mjs/);
 assert.match(src,/apps\/api\/src\/reader-human-n495\.ts/);
 assert.match(src,/apps\/api\/src\/reader-portrait-n496\.ts/);
 assert.doesNotMatch(src,/(?:git\s+reset\s+--hard|git\s+clean\s+-f|git\s+checkout\s+-f|docker\s+)/);
 assert.ok(src.indexOf('git update-ref "$backupRef" "$OLD"')<src.indexOf('switch --detach "$TARGET"'));
});
