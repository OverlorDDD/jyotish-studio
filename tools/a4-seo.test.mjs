import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {publicSiteOrigin,publicIndexingEnabled,SEO_PATHS,indexRobots} from '../apps/web/lib/site-indexing.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const previous={site:process.env.NEXT_PUBLIC_SITE_URL,noindex:process.env.SITE_NOINDEX};
test('A4 index gate requires configured HTTPS hostname and no preview noindex',()=>{
 try{
  delete process.env.NEXT_PUBLIC_SITE_URL;delete process.env.SITE_NOINDEX;
  assert.equal(publicSiteOrigin(),null);assert.equal(publicIndexingEnabled(),false);
  for(const url of ['http://localhost:3000','http://example.org','https://127.0.0.1','https://example.org/path','https://user:pass@example.org']){
   process.env.NEXT_PUBLIC_SITE_URL=url;
   assert.equal(publicIndexingEnabled(),false,url);
  }
  process.env.NEXT_PUBLIC_SITE_URL='https://galaxiora.example';
  assert.equal(publicIndexingEnabled(),true);
  assert.equal(indexRobots().index,true);assert.equal(indexRobots(false).index,false);
  process.env.SITE_NOINDEX='1';assert.equal(publicIndexingEnabled(),false);
 }finally{
  for(const [key,value] of [['NEXT_PUBLIC_SITE_URL',previous.site],['SITE_NOINDEX',previous.noindex]]){
   if(value===undefined)delete process.env[key];else process.env[key]=value;
  }
 }
});
test('A4 sitemap enumerates published tools but no future content or private views',()=>{
 assert.deepEqual([...SEO_PATHS],['','astrology','tarot','astrology/jyotish','yoga','learn']);
 for(const p of SEO_PATHS)assert.ok(!/account|admin|news|community/.test(p));
 const source=read('apps/web/app/[locale]/[section]/page.tsx');
 assert.ok(source.includes('indexRobots(INDEXED_SECTIONS.some('));
 assert.ok(read('apps/web/app/sitemap.ts').includes('publicIndexingEnabled()'));
 assert.ok(read('apps/web/app/robots.ts').includes('disallow'));
});
test('A4 accessible navigation, locale and non-indexable private screens remain explicit',()=>{
 const root=read('apps/web/app/layout.tsx'),shell=read('apps/web/app/components/PortalShell.tsx');
 const mw=read('apps/web/middleware.ts');
 assert.ok(root.includes('lang={locale}'));
 assert.ok(mw.includes('x-galaxiora-locale'));
 assert.ok(shell.includes('as-skip-link'));
 assert.ok(shell.includes('id="main-content"'));
 for(const p of ['account','admin'])
  assert.ok(read('apps/web/app/[locale]/'+p+'/page.tsx').includes('index:false'));
});
