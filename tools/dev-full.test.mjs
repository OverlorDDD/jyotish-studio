import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
test('bootstrap exposes safe instructions and never requires Docker for --help',()=>{
 const x=spawnSync(process.execPath,['tools/dev-full.mjs','--help'],{encoding:'utf8'});
 assert.equal(x.status,0);
 assert.match(x.stdout,/PostgreSQL/);
});
test('default fullstack bootstrap must provision before running either web/API service',()=>{
 const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
 assert.match(pkg.scripts['dev:full'],/^node tools\/dev-full\.mjs && npx concurrently/);
 const code=readFileSync(new URL('./dev-full.mjs',import.meta.url),'utf8');
 assert.match(code,/compose','up','-d','db/);
 assert.match(code,/Health.Status/);
 assert.doesNotMatch(code,/down','-v/);
});
test('public GalaxiNews never exposes operational scan cadence or webpack CSS warning',()=>{
 const web=readFileSync(new URL('../apps/web/app/components/NewsWorld.tsx',import.meta.url),'utf8');
 const style=readFileSync(new URL('../apps/web/app/components/NewsWorld.module.css',import.meta.url),'utf8');
 assert.doesNotMatch(web,/Перевірка джерел приблизно кожні 15 хвилин|Sources checked approximately every 15 minutes|t\.update/);
 assert.doesNotMatch(style,/align-items:end;/);
});

test('local bootstrap detects stale Next and Nest listeners before showing updated site',()=>{
 const source=readFileSync(new URL('./dev-full.mjs',import.meta.url),'utf8');
 assert.match(source,/Get-NetTCPConnection/);
 assert.match(source,/refreshDevNextCache/);
 assert.match(source,/occupied\(port\)/);
 assert.match(source,/Next\.js/);
 assert.match(source,/NestJS/);
});

test('API build always regenerates Prisma Client with licensed-news fields before TypeScript',()=>{
 const root=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
 const api=JSON.parse(readFileSync(new URL('../apps/api/package.json',import.meta.url),'utf8'));
 const schema=readFileSync(new URL('../apps/api/prisma/schema.prisma',import.meta.url),'utf8');
 assert.match(root.scripts.build,/npm run build -w @jyotish\/api/);
 assert.match(api.scripts.prebuild,/node --env-file-if-exists=\.\.\/\.\.\/\.env/);
 assert.match(api.scripts.prebuild,/prisma\/build\/index\.js generate --schema=prisma\/schema\.prisma/);
 assert.match(api.scripts.build,/^tsc -p tsconfig\.json$/);
 const newsArticle=schema.slice(schema.indexOf('model NewsArticle {'),schema.indexOf('model NewsReaction {'));
 for(const field of ['imageLicense','imageLicenseUrl','imagePageUrl','imageLookupAt']){
  assert.ok(newsArticle.split('\n').some(line=>line.trim().startsWith(field+' ')),
   'NewsArticle Prisma field missing: '+field);
 }
});

test('public site preflight keeps account isolation gates and reports which request timed out',()=>{
 const source=readFileSync(new URL('./site-preflight.mjs',import.meta.url),'utf8');
 assert.match(source,/const timeoutMs=15000/);
 assert.match(source,/checkRequest\('\/api\/health','NestJS\/Prisma health'\)/);
 assert.match(source,/checkRequest\('\/api\/v1\/account\/charts','Private history denial'\)/);
 assert.match(source,/privateHistory\.status!==401/);
 assert.match(source,/doc\.status!==404/);
});
test('news UI smoke check never waits for offscreen lazy licensed photos',()=>{
 const source=readFileSync(new URL('./news-browser-check.mjs',import.meta.url),'utf8');
 assert.match(source,/data-image-role="fallback"/);
 assert.match(source,/checking all first-party artwork/);
 assert.match(source,/failure screenshot:/);
});
