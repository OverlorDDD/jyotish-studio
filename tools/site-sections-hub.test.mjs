import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('brand sections hub sits after the calculator and before the reading guide',()=>{
 for(const file of ['apps/web/app/page.tsx','apps/web/app/[locale]/astrology/jyotish/page.tsx']){
  const src=read(file),calc=src.indexOf('<JyotishCalculator'),hub=src.indexOf('<SiteSectionsHub'),guide=src.indexOf('<JyotishSearchGuide');
  assert.ok(calc>=0&&hub>calc&&guide>hub,file);
 }
});

test('hub links only to canonical sitemap paths and is bilingual',()=>{
 const hub=read('apps/web/app/components/SiteSectionsHub.tsx');
 const seo=read('apps/web/lib/site-indexing.ts').match(/SEO_PATHS=\[([^\]]+)\]/)[1];
 const paths=[...hub.matchAll(/path:'([^']+)'/g)].map(m=>m[1]);
 assert.ok(paths.length>=10);
 assert.equal(new Set(paths).size,paths.length);
 for(const path of paths)assert.ok(seo.includes("'"+path+"'"),path);
 assert.equal((hub.match(/uk:'/g)||[]).length,(hub.match(/en:'/g)||[]).length);
 assert.doesNotMatch(hub,/'use client'/);
});
