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
 const targets=[...hub.matchAll(/path:'([^']+)'(?:,hash:'([^']+)')?/g)].map(m=>({path:m[1],hash:m[2]||''}));
 assert.ok(targets.length>=12);
 assert.equal(new Set(targets.map(t=>t.path+'#'+t.hash)).size,targets.length);
 // The nakshatra hub is published through sitemap.ts next to its 27 guides rather than SEO_PATHS.
 const sitemap=read('apps/web/app/sitemap.ts');
 for(const {path} of targets)assert.ok(seo.includes("'"+path+"'")||(path==='nakshatra'&&sitemap.includes("'nakshatra',")),path);
 assert.ok(targets.some(t=>t.path==='panchanga'&&t.hash==='cities'));
 assert.match(read('apps/web/app/components/PanchangaCityIndex.tsx'),/id="cities"/);
 assert.equal((hub.match(/uk:'/g)||[]).length,(hub.match(/en:'/g)||[]).length);
 assert.doesNotMatch(hub,/'use client'/);
});
