import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MOON_SIGN_GUIDES} from '../apps/web/lib/moon-sign-guides.ts';
import {publicIndexingEnabled,publicSiteOrigin,SEO_PATHS} from '../apps/web/lib/site-indexing.ts';
import {readPublicSign} from '../apps/api/src/horoscope-editorial.ts';
const file=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('12 unique bilingual Moon-sign landing pages have real classical rulers and an actionable distinct topic',()=>{
 assert.equal(MOON_SIGN_GUIDES.length,12);
 assert.equal(new Set(MOON_SIGN_GUIDES.map(g=>g.slug)).size,12);
 for(const g of MOON_SIGN_GUIDES)for(const field of ['uk','en','lordUk','lordEn','themesUk','themesEn','adviceUk','adviceEn'])
  assert.ok(g[field].length>2,g.slug+' lacks '+field);
 assert.equal(MOON_SIGN_GUIDES.find(g=>g.slug==='aries').lordEn,'Mars');
 assert.equal(MOON_SIGN_GUIDES.find(g=>g.slug==='gemini').lordEn,'Mercury');
 assert.equal(MOON_SIGN_GUIDES.find(g=>g.slug==='pisces').lordEn,'Jupiter');
 assert.match(file('apps/web/app/sitemap.ts'),/MOON_SIGN_GUIDES/);
 assert.match(file('apps/web/app/[locale]/horoscope/[sign]/page.tsx'),/BreadcrumbList/);
});

test('search indexing requires an explicit launch opt-in and a clean external HTTPS origin',()=>{
 const oldUrl=process.env.NEXT_PUBLIC_SITE_URL,oldNoIndex=process.env.SITE_NOINDEX;
 try{
  process.env.NEXT_PUBLIC_SITE_URL='https://galaxiora.example';
  delete process.env.SITE_NOINDEX;
  assert.equal(publicIndexingEnabled(),false);
  process.env.SITE_NOINDEX='1';
  assert.equal(publicIndexingEnabled(),false);
  process.env.SITE_NOINDEX='0';
  assert.equal(publicIndexingEnabled(),true);
  for(const invalid of ['http://galaxiora.example','http://localhost:3000','https://localhost','https://galaxiora.example:3000','https://galaxiora.example/path']){
   process.env.NEXT_PUBLIC_SITE_URL=invalid;
   assert.equal(publicSiteOrigin(),null,invalid);
   assert.equal(publicIndexingEnabled(),false,invalid);
  }
 }finally{
  if(oldUrl===undefined)delete process.env.NEXT_PUBLIC_SITE_URL;else process.env.NEXT_PUBLIC_SITE_URL=oldUrl;
  if(oldNoIndex===undefined)delete process.env.SITE_NOINDEX;else process.env.SITE_NOINDEX=oldNoIndex;
 }
});

test('public sign horoscope is relative to natal Moon sign, never assumed from Western Sun sign',()=>{
 const transit={date:'2026-10-28',sampledAtUtc:'2026-10-28T10:00:00Z',method:'Swiss Ephemeris / Lahiri',
  moon:{sign:12,nakshatra:'Revati',pada:1}};
 const publicAries=readPublicSign(1,transit),natalGemini=readPublicSign(3,transit);
 assert.equal(publicAries.referenceSign,1);
 assert.equal(publicAries.house,12); // Pisces is the 12th from Aries.
 assert.equal(natalGemini.referenceSign,3);
 assert.equal(natalGemini.house,10); // Pisces is the 10th from Gemini.
 assert.notEqual(publicAries.headline.uk,natalGemini.headline.uk);
 const ui=file('apps/web/app/components/HoroscopeHub.tsx');
 assert.match(ui,/data-testid="personal-sign-basis"/);
 assert.match(ui,/personal\?\.selected\?\.moonSign/);
 assert.match(ui,/personal\.journey\?\.daily/);
 assert.match(ui,/personal\.journey\?\.horoscope/);
 assert.match(ui,/SIGN_SLUGS/);
});

test('release copy is positive and describes available capabilities rather than unfunded roadmap promises',()=>{
 const home=file('apps/web/app/components/PortalHome.tsx');
 const hub=file('apps/web/app/components/PortalSection.tsx');
 assert.doesNotMatch(home,/Згодом додамо більше інструментів|with more chart tools to come/i);
 assert.doesNotMatch(hub,/транзити й місячний календар — у планах|transits and lunar calendars are planned/i);
 for(const route of ['horoscope','panchanga']){
  const s=file('apps/web/app/[locale]/'+route+'/page.tsx');
  assert.match(s,/generateMetadata/);
  assert.match(s,/indexRobots/);
  assert.match(s,/alternates/);
 }
 assert.ok(SEO_PATHS.includes('panchanga'));
 assert.ok(SEO_PATHS.includes('news'));
 assert.ok(SEO_PATHS.includes('community'));
 assert.match(file('apps/web/app/[locale]/personal/page.tsx'),/index:false/);
});
