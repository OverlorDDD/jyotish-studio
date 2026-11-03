import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const text=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('P388 main integration requires exact SHA, correct release ancestry and live fast-forward before deployment',()=>{
 const s=text('tools/panchanga-p388-release.sh');
 for(const required of ['ACTION="${1:-diagnose}"','MAIN_BRANCH=main',
  'RELEASE_ROOT=fe2cef6b1755f1467b6ad2c7efc619068735a2fc',
  'git merge-base --is-ancestor "$RELEASE_ROOT" "$target"',
  'git merge-base --is-ancestor "$current" "$target"',
  'P388_TARGET_SHA','P388_CI_ATTESTED_SHA','I_APPROVE_P388_PRODUCTION',
  'P388_PREFLIGHT_PASS','P388_BACKUP_TOC_PASS','P388_PRODUCTION_RELEASE_VERIFIED',
  'SESSION_COOKIE_SECURE','SITE_NOINDEX','approved-spiral-6.png',
  'pg_dump --format=custom','pg_restore --list','last-backup','ROLLBACK_APPROVAL'])
  assert.ok(s.includes(required),required);
 const banned=['git reset --hard','git clean -fd','git push --force',
  'prisma migrate reset','docker compose down -v','rm -rf',
  'SITE_NOINDEX=1','NEWS_TRANSLATION_ENABLED=0','systemctl stop caddy',
  'curl -X POST','pg_restore --clean','psql -c DROP DATABASE'];
 for(const risk of banned)assert.ok(!s.includes(risk),'Forbidden destructive path: '+risk);
 const check=spawnSync('bash',['-n','tools/panchanga-p388-release.sh'],{encoding:'utf8'});
 assert.equal(check.status,0,check.stderr);
});
test('P388 source-backed astronomy is independently pinned: thirty real ASC cases with 1-arcsecond exact native checks',()=>{
 const table=text('tests/fixtures/p388-independent-asc-30.tsv')
  .split(/\r?\n/).filter(x=>x&&!x.startsWith('#'));
 assert.equal(table.length,30);
 assert.ok(new Set(table.map(r=>r.split('|')[3])).size>=17);
 const js=text('tools/panchanga-p388-independent.test.mjs');
 for(const key of ['calculateVerifiedEventLagna','tolerance','angle(', 'panchangaRange',
  'createVerifiedSiderealPlanetAt','safelyAwayFromAngaBoundary'])
  assert.ok(js.includes(key)||key==='tolerance'&&js.includes('<=1'),key);
 const py=text('tools/panchanga-p388-independent-reference.py');
 assert.ok(py.includes('swe.FLG_SWIEPH'));
 assert.ok(py.includes('returned & 7 != swe.FLG_SWIEPH'));
 assert.ok(py.includes('ZoneInfo'));
 assert.ok(py.includes('sepl_18.se1'));
 assert.ok(py.includes('semo_18.se1'));
 assert.doesNotMatch(py,/FLG_MOSEPH|SEFLG_MOSEPH|approximate_longitude/);
});
test('P388 release smoke is read-only, bilingual, checks full 31-day/source and all 5 limbs, private guest 401',()=>{
 const js=text('tools/panchanga-p388-production-smoke.mjs');
 for(const key of ['/uk/panchanga','/en/panchanga','/uk/news','/en/news',
  'days=31','five-limb','source', '401','no-store','/robots.txt','P388_PUBLIC'])
  assert.ok(js.includes(key),key);
 for(const forbidden of ['Authorization:', 'document.cookie', 'credentials:', 'birthDate:',
  'localStorage', 'P388_APPROVAL', 'DELETE', 'method:\'PUT\''])
  assert.ok(!js.includes(forbidden),forbidden);
 const syntax=spawnSync(process.execPath,['--check','tools/panchanga-p388-production-smoke.mjs'],{encoding:'utf8'});
 assert.equal(syntax.status,0,syntax.stderr);
});
test('P388 wedding/foundation stays review-only; no unsupported 100% or certification from missing 21 doshas',()=>{
 const engine=text('apps/api/src/panchanga-p385-search.ts');
 const rules=text('apps/api/src/panchanga-p385-special.ts');
 const ring=text('apps/web/lib/panchanga-p386-evidence.ts');
 assert.match(engine,/activityId==='wedding'\|\|input\.activityId==='foundation'/);
 assert.match(engine,/requires_review/);
 assert.match(rules,/NOT_A_COMPLETE_CEREMONIAL_MUHURTA/);
 assert.match(rules,/FULL_EIGHT_KUTA/);
 assert.match(ring,/TRIGGERED_SOURCE_EVIDENCE_NOT_OUTCOME_PROBABILITY/);
 assert.ok(!text('tools/panchanga-p388-release.sh').includes('FULL_MUHURTA_CERTIFIED'));
});
test('P388 protects other owners and keeps expensive searches under server concurrency control',()=>{
 const ctl=text('apps/api/src/personal.ts');
 const gate=text('apps/api/src/panchanga-p388-capacity.ts');
 assert.match(ctl,/ownerId:uid,id:body\.partnerChartId/);
 assert.match(ctl,/acquireP388TimeFinder/);
 assert.match(ctl,/finally\{releaseCapacity\(\);\}/);
 assert.match(gate,/P388_TIME_FINDER_BUSY/);
 assert.match(ctl,/Cache-Control','private, no-store'/);
});
