import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('release merges both R4.3 SEO scripts and every Panchanga version',()=>{
 const scripts=JSON.parse(read('package.json')).scripts;
 for(const name of ['panchanga-core.test.mjs','panchanga-v2-location.test.mjs',
  'panchanga-p22.test.mjs','panchanga-p23.test.mjs','panchanga-p24.test.mjs','panchanga-p25-copy.test.mjs'])
  assert.ok(scripts['test:panchanga'].includes(name),name);
 assert.match(scripts['test:r43:seo'],/r43-indexnow/);
 assert.match(scripts['test:r43:visitors'],/r43-first-visitors/);
 assert.match(scripts['p25:smoke'],/panchanga-p25-smoke/);
 assert.match(read('apps/web/lib/site-indexing.ts'),/moon-sign-vs-sun-sign/);
 assert.match(read('apps/web/app/components/SearchGuides.tsx'),/moon-sign-vs-sun-sign/);
});
test('release is pinned, backed up, preserves data and never force-resets',()=>{
 const sh=read('tools/panchanga-p25-release.sh');
 for(const text of ['P25_TARGET_SHA','P25_DEPLOY_CONFIRM','galaxiora-db-backup.service',
  'previous.sha','npm run db:migrate','P25_VERIFY_BRAND=1',
  'P25_PRODUCTION_RELEASE_VERIFIED','git merge-base --is-ancestor'])
  assert.ok(sh.includes(text),text);
 for(const bad of ['git reset --hard','git push --force','npm run db:reset',
  'NEWS_TRANSLATION_ENABLED=0','SITE_NOINDEX=1'])
  assert.ok(!sh.includes(bad),bad);
});
test('public smoke checks exact five limbs, languages, SEO and icon without mutation',()=>{
 const s=read('tools/panchanga-p25-smoke.mjs');
 for(const x of ['sunriseAngas','moon-sign-vs-sun-sign','P25_VERIFY_BRAND',
  '/icon.svg','observanceDayCertifiedByTradition'])
  assert.ok(s.includes(x),x);
});
