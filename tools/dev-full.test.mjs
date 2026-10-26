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
 assert.match(source,/occupied\(port\)/);
 assert.match(source,/Next\.js/);
 assert.match(source,/NestJS/);
});
