import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {NAKSHATRA_GUIDES,NAKSHATRA_CLASS_MEMBERS,nakshatraBySlug,nakshatraByNumber,nakshatraSpan,
 nakshatraPadas,nakshatraRuler,nakshatraClass,nakshatraGana} from '../apps/web/lib/nakshatra-guides.ts';
import {NAKSHATRAS,DASHA_LORDS} from '../packages/jyotish-core/src/index.ts';
import {NAKSHATRA_SLUGS,nakshatraSlugByName,nakshatraSlugByNumber} from '../apps/web/lib/nakshatra-slugs.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('27 guides follow the calculation core order, names and Vimshottari rulers',()=>{
 assert.equal(NAKSHATRA_GUIDES.length,27);
 const slugs=new Set();
 NAKSHATRA_GUIDES.forEach((guide,index)=>{
  assert.equal(guide.number,index+1);
  assert.equal(guide.name.en,NAKSHATRAS[index]);
  assert.equal(guide.slug,NAKSHATRAS[index].toLowerCase().replace(/ /g,'-'));
  assert.ok(!slugs.has(guide.slug));slugs.add(guide.slug);
  assert.equal(nakshatraRuler(guide,'en'),DASHA_LORDS[index%9]);
  for(const field of ['name','deity','symbol','essence','moon'])
   for(const locale of ['uk','en'])assert.ok(guide[field][locale].trim().length>2,guide.slug+'.'+field+'.'+locale);
  for(const locale of ['uk','en']){
   assert.ok(guide.essence[locale].split(/\s+/).length>=35,guide.slug+' essence too thin');
   assert.ok(guide.moon[locale].split(/\s+/).length>=30,guide.slug+' moon too thin');
   assert.ok(nakshatraGana(guide,locale)&&nakshatraClass(guide,locale).label);
  }
  assert.doesNotMatch(guide.moon.en+guide.essence.en,/\b(guarantee[sd]?|you will|will (bring|make|give|become|succeed))\b/i,guide.slug+' promises an outcome');
 });
 assert.equal(nakshatraBySlug('rohini').number,4);assert.equal(nakshatraBySlug('Rohini'),null);
 assert.equal(nakshatraByNumber(27).slug,'revati');assert.equal(nakshatraByNumber(28),null);
 for(const gana of ['deva','manushya','rakshasa'])
  assert.equal(NAKSHATRA_GUIDES.filter(g=>g.gana===gana).length,9,gana);
});

test('spans and padas are exact 13°20′ / 3°20′ arithmetic',()=>{
 assert.equal(nakshatraSpan(nakshatraBySlug('ashwini'),'en'),'0°00′ Aries – 13°20′ Aries');
 assert.equal(nakshatraSpan(nakshatraBySlug('krittika'),'en'),'26°40′ Aries – 10°00′ Taurus');
 assert.equal(nakshatraSpan(nakshatraBySlug('ashlesha'),'en'),'16°40′ Cancer – 30°00′ Cancer');
 assert.equal(nakshatraSpan(nakshatraBySlug('revati'),'uk'),'16°40′ Риби – 30°00′ Риби');
 assert.deepEqual(nakshatraPadas(nakshatraBySlug('ashwini'),'en').map(p=>p.navamsa),['Aries','Taurus','Gemini','Cancer']);
 assert.deepEqual(nakshatraPadas(nakshatraBySlug('pushya'),'en').map(p=>p.navamsa),['Leo','Virgo','Libra','Scorpio']);
 assert.deepEqual(nakshatraPadas(nakshatraBySlug('krittika'),'en').map(p=>p.from),
  ['26°40′ Aries','0°00′ Taurus','3°20′ Taurus','6°40′ Taurus']);
 // Navamsa sign of every pada equals floor(longitude / 3°20′) mod 12.
 for(const guide of NAKSHATRA_GUIDES)nakshatraPadas(guide,'en').forEach((p,i)=>
  assert.equal(p.navamsa,['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'][((guide.number-1)*4+i)%12]));
});

test('activity classes are identical to the Panchanga engine',()=>{
 const engine=read('apps/web/lib/panchanga-p37-classical.ts');
 const block=engine.slice(engine.indexOf('const STAR_CLASSES'),engine.indexOf('};',engine.indexOf('const STAR_CLASSES')));
 for(const [name,members] of Object.entries(NAKSHATRA_CLASS_MEMBERS))
  assert.ok(block.replace(/\s/g,'').includes(name+':['+members.join(',')+']'),name);
 assert.deepEqual(Object.values(NAKSHATRA_CLASS_MEMBERS).flat().sort((a,b)=>a-b),Array.from({length:27},(_,i)=>i+1));
});

test('route contract: live Moon only from the verified API, canonical/hreflang, sitemap and links',()=>{
 const page=read('apps/web/app/[locale]/nakshatra/[slug]/page.tsx'),hub=read('apps/web/app/[locale]/nakshatra/page.tsx');
 for(const src of [page,hub]){
  assert.match(src,/export const dynamic='force-dynamic'/);
  assert.match(src,/robots:indexRobots\(\)/);
  assert.match(src,/'x-default':'\/en\/'\+path/);
  assert.doesNotMatch(src,/'use client'/);
 }
 assert.match(page,/notFound\(\)/);
 const moon=read('apps/web/lib/nakshatra-moon.ts');
 assert.match(moon,/\/api\/v1\/panchanga\/day\?/);assert.match(moon,/\/api\/v1\/panchanga\/range\?/);
 assert.doesNotMatch(moon,/Math\.(round|floor)\([^)]*27\.3/); // no mean-motion estimates
 assert.match(read('apps/web/app/sitemap.ts'),/'nakshatra',\.\.\.NAKSHATRA_GUIDES\.map\(item=>'nakshatra\/'\+item\.slug\)/);
 assert.match(read('apps/web/app/[locale]/panchanga/[city]/page.tsx'),/prefix\+'nakshatra\/'\+star\.slug/);
});

test('nakshatra pages are reachable: footer, Panchanga strip, live day card, calculator and home hub',()=>{
 assert.deepEqual([...NAKSHATRA_SLUGS],NAKSHATRA_GUIDES.map(g=>g.slug));
 NAKSHATRAS.forEach((name,i)=>{assert.equal(nakshatraSlugByName(name),NAKSHATRA_SLUGS[i]);assert.equal(nakshatraSlugByNumber(i+1),NAKSHATRA_SLUGS[i]);});
 assert.equal(nakshatraSlugByName('Nope'),null);assert.equal(nakshatraSlugByNumber(0),null);assert.equal(nakshatraSlugByNumber('4'),null);
 const shell=read('apps/web/app/components/PortalShell.tsx');
 assert.match(shell,/'\/'\+locale\+'\/nakshatra'/);assert.match(shell,/panchanga#cities/);
 const strip=read('apps/web/app/components/PanchangaQuickLinks.tsx');
 assert.match(strip,/prefix\+'nakshatra'/);assert.match(strip,/href="#cities"/);
 assert.match(read('apps/web/app/[locale]/panchanga/page.tsx'),/<PanchangaQuickLinks locale=[^>]+>\s*<PanchangaHub/);
 assert.match(read('apps/web/app/components/PanchangaLiveDay.tsx'),/panchanga-nakshatra-guide/);
 const calc=read('apps/web/app/astrology/jyotish/page.tsx');
 assert.equal((calc.match(/nakshatraGuideLink\(/g)||[]).length,2);assert.match(calc,/target="_blank" rel="noopener"/);
 // The heavy guide texts must not be pulled into client bundles.
 for(const file of ['apps/web/app/components/PanchangaLiveDay.tsx','apps/web/app/astrology/jyotish/page.tsx'])
  assert.doesNotMatch(read(file),/nakshatra-guides/);
});
