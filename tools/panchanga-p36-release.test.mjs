import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('P3.6 release defaults to diagnostics and never mutates main or AWS automatically',()=>{
 const script=read('tools/panchanga-p36-release.sh');
 for(const required of ['ACTION="${1:-diagnose}"','I_APPROVE_P36_PRODUCTION',
  'P36_TARGET_SHA','P36_ATTESTED_SHA','git merge-base --is-ancestor',
  'P36_PREFLIGHT_PASS','P36_PRODUCTION_RELEASE_VERIFIED',
  'P36_ROLLBACK_CODE_OK','P36_ROLLBACK_APPROVAL',
  'docker exec jyotish-db pg_dump','pg_restore --list',
  'panchanga-p36-smoke.mjs','P25_VERIFY_BRAND=1','SESSION_COOKIE_SECURE',
  'npm run db:migrate','npm run site:check','npm run launch:verify',
  'npm run r32:seo:audit'])
  assert.ok(script.includes(required),required);
 for(const forbidden of ['git reset --hard','git clean -fd','git push --force',
  'npm run db:reset','prisma migrate reset','docker compose down -v',
  'NEWS_TRANSLATION_ENABLED=0','SITE_NOINDEX=1','sudo systemctl stop caddy',
  'curl -X POST','P36_DEPLOY_APPROVAL=yes']){
  assert.ok(!script.includes(forbidden),'Forbidden release operation: '+forbidden);
 }
});
test('P3.6 smoke is read-only, bilingual, verifies 401 and exact range',()=>{
 const content=read('tools/panchanga-p36-smoke.mjs');
 for(const word of ['private','401','no-store','/uk/panchanga',
  '/en/panchanga','panchanga/range','7,30','Swiss',
  'P36_PUBLIC','/robots.txt'])
  assert.ok(content.includes(word),word);
 for(const risk of ['fetch(url, {method:','credentials:','Authorization:','document.cookie',
  'POST','DELETE','PUT','sendBeacon','NEXT_PUBLIC_GA4']){
  assert.ok(!content.includes(risk),'Unexpected private/write control '+risk);
 }
});
test('P3.6 adaptive Swiss edge enumeration is integrated into private hourly windows',()=>{
 const service=read('apps/api/src/panchanga-ingress.ts');
 const controller=read('apps/api/src/personal.ts');
 for(const required of ['longitudeSpeed','edgeDistance','possibleTravel','maxSamples',
  'P36 ingress evidence budget exceeded'])
  assert.ok(service.includes(required),required);
 assert.match(controller,/findVerifiedSignIngresses\(begin,end,/);
 assert.match(controller,/Math\.abs\(t-rounded\)<=1000/);
});
test('P3.6 preserves P3.5 7/30 privacy and sunrise-only honesty',()=>{
 const script=JSON.parse(read('package.json')).scripts;
 for(const file of ['panchanga-p31.test.mjs','panchanga-p32.test.mjs','panchanga-p33.test.mjs',
  'panchanga-p34.test.mjs','panchanga-p35.test.mjs','panchanga-p36-ingress.test.mjs'])
  assert.ok(script['test:panchanga'].includes(file),file);
 assert.match(read('apps/web/lib/panchanga-p35-calendar.ts'),/SUNRISE_SNAPSHOTS_WITH_EXACT_LUNAR/);
 assert.match(read('apps/web/app/components/PanchangaPersonalCalendar.tsx'),/не сприятливість цілої доби/);
 assert.match(read('apps/web/app/components/PanchangaTimeGuidance.tsx'),/Math\.max\(Date\.parse\(timeline\.nextSupported\.startUtc\)/);
});
