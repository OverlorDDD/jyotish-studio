import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TAROT_GUIDES} from '../apps/web/lib/tarot-guides.ts';
import {SEO_PATHS} from '../apps/web/lib/site-indexing.ts';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const fixture=JSON.parse(read('docs/research/nasa-eclipses-2027-fixture.json'));
const eclipsePage=read('apps/web/app/[locale]/eclipses/2027/page.tsx');

test('R3.3 authority guides are carefully edited, distinct and bi-localized',()=>{
 assert.equal(TAROT_GUIDES.length,8,'first release is 8 curated guides, not mass-produced 78 pages');
 const allSlugs=TAROT_GUIDES.map(g=>g.slug);
 assert.equal(new Set(allSlugs).size,TAROT_GUIDES.length);
 assert.equal(new Set(TAROT_GUIDES.map(g=>g.artId)).size,TAROT_GUIDES.length);
 for(const guide of TAROT_GUIDES){
  assert.match(guide.artId,/^major-[a-z]+$/);
  for(const loc of ['uk','en']){
   for(const field of ['title','summary','symbolism','upright','reversed','inSpread','reflection']){
    const text=guide[field][loc].trim();
    assert.ok(text,guide.slug+' '+loc+' '+field+' missing');
    assert.ok(field==='title'||text.length>=60,guide.slug+' '+loc+' '+field+' is too thin');
   }
   const all=guide.symbolism[loc]+guide.upright[loc]+guide.reversed[loc]+guide.inSpread[loc];
   assert.ok(all.length>500,guide.slug+' '+loc+' insufficient editorial substance');
   assert.notEqual(guide.upright[loc],guide.reversed[loc],guide.slug+' reversal must add value');
  }
 }
});

test('R3.3 eclipse calendar exactly matches validated NASA 2027 five-event dates and types',()=>{
 assert.equal(fixture.events.length,5);
 assert.match(fixture.source,/NASA/);
 const dates=fixture.events.map(x=>x.utc.slice(0,10));
 assert.deepEqual(dates,['2027-02-06','2027-02-20','2027-07-18','2027-08-02','2027-08-17']);
 const siteDates=[...eclipsePage.matchAll(/date:'(2027-\d\d-\d\d)'/g)].map(x=>x[1]);
 assert.deepEqual(siteDates,dates);
 assert.equal((eclipsePage.match(/kind:'solar-/g)||[]).length,2);
 assert.equal((eclipsePage.match(/kind:'lunar-/g)||[]).length,3);
 assert.match(eclipsePage,/NASA Goddard Space Flight Center/);
 assert.match(eclipsePage,/not establish whether an eclipse is visible/);
 assert.doesNotMatch(eclipsePage,/'@type':'Event'/,'natural eclipses are not ticketed/attendable events');
});

test('R3.3 only canonical curated routes are indexed; no account or preview URLs added',()=>{
 assert.ok(SEO_PATHS.includes('tarot/cards'));
 assert.ok(SEO_PATHS.includes('eclipses/2027'));
 const sitemap=read('apps/web/app/sitemap.ts');
 assert.match(sitemap,/TAROT_GUIDES/);
 assert.match(sitemap,/tarot\/cards\//);
 assert.match(sitemap,/publicIndexingEnabled\(\)/);
 const deck=read('apps/api/src/tarot-deck.ts');
 for(const guide of TAROT_GUIDES){
  assert.ok(deck.includes("'"+guide.artId.slice(6)+"'"),guide.slug+' must match real Major Arcana');
 }
 const detail=read('apps/web/app/[locale]/tarot/cards/[slug]/page.tsx');
 assert.match(detail,/dynamicParams=false/);
 assert.match(detail,/generateStaticParams/);
 assert.match(detail,/articleStructuredData/);
 assert.match(detail,/BreadcrumbList/);
 assert.match(detail,/indexRobots\(\)/);
 assert.match(detail,/tarotGuideBySlug/);
 for(const p of ['apps/web/app/[locale]/tarot/cards/page.tsx','apps/web/app/[locale]/eclipses/2027/page.tsx']){
  const html=read(p);
  assert.match(html,/generateMetadata/);
  assert.match(html,/BreadcrumbList/);
  assert.match(html,/indexRobots\(\)/);
  assert.match(html,/languages:/);
 }
 const portal=read('apps/web/app/components/PortalSection.tsx');
 const panchanga=read('apps/web/app/[locale]/panchanga/page.tsx');
 assert.match(portal,/tarot\/cards/);
 assert.match(panchanga,/eclipses\/2027/);
});
