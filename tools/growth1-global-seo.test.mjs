import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const layout=read('apps/web/app/layout.tsx');
const home=read('apps/web/app/components/PortalHome.tsx');
const about=read('apps/web/app/[locale]/about/page.tsx');
const panchanga=read('apps/web/app/[locale]/panchanga/page.tsx');
const jyotish=read('apps/web/app/[locale]/astrology/jyotish/page.tsx');

test('GROWTH-1 maintains truthful official brand entities; no hijacking generic galaxia',()=>{
 assert.match(layout,/'@type':'WebSite'/);
 assert.match(layout,/'@type':'Organization'/);
 assert.equal((layout.match(/alternateName:\['galaxiora\.com','Галаксіора'\]/g)||[]).length,2);
 assert.match(layout,/name:BRAND\.name/);
 assert.match(about,/Галаксіора/);
 assert.match(about,/Галаксиора/);
 assert.match(about,/galaxiora\.com/);
 for(const src of [layout,home,about,panchanga,jyotish]){
  assert.doesNotMatch(src,/\bgalaxia\b/i,'ambiguous galaxia is not an alias');
  assert.doesNotMatch(src,/meta.*keywords|keyword[\s_-]*stuffing/i,'no hidden keyword stuffing');
 }
 assert.doesNotMatch(layout,/sameAs:/,'never invent official social profiles');
});

test('GROWTH-1 homepage exposes exactly three direct bilingual tool actions',()=>{
 const hero=home.slice(home.indexOf('<div className="as-hero-copy">'),home.indexOf('<div className="as-celestial'));
 assert.match(hero,/aria-label=\{locale==='uk'\?'Основні інструменти':'Start with a free tool'\}/);
 for(const path of ["portalPath(locale,'astrology/jyotish')","portalPath(locale,'panchanga')","portalPath(locale,'tarot')"])
  assert.ok(hero.includes(path),path);
 assert.equal((hero.match(/<Link className="as-button /g)||[]).length,3);
 assert.doesNotMatch(hero,/href="#explore"/,'primary hero must not hide actual tools beneath scroll');
 assert.match(home,/Free Vedic Birth Chart/);
 assert.match(home,/Panchang Today/);
 assert.match(home,/Free Tarot Reading/);
 assert.match(home,/Натальна карта Джйотіш/);
 assert.match(home,/Панчанга сьогодні/);
 assert.match(home,/Безкоштовний розклад Таро/);
});

test('GROWTH-1 high-demand phrases are supported by existing genuine tool content',()=>{
 assert.match(panchanga,/Panchang Today by City — Tithi & Nakshatra/);
 assert.match(panchanga,/Панчанга сьогодні — Тітхі та Накшатра/);
 assert.match(panchanga,/'x-default':'\/en\/'\+path/);
 assert.match(jyotish,/free Vedic birth chart \(Kundli\)/);
 assert.match(jyotish,/'x-default':'\/en\/astrology\/jyotish'/);
 assert.match(jyotish,/indexRobots\(\)/);
 assert.match(panchanga,/indexRobots\(\)/);
 const siteIndex=read('apps/web/lib/site-indexing.ts');
 assert.match(siteIndex,/SITE_NOINDEX==='0'/);
 assert.match(siteIndex,/publicSiteOrigin\(\)!==null/);
 assert.doesNotMatch(read('apps/web/app/robots.ts'),/Allow:\s*\/account/);
});

test('GROWTH-1 keyword evidence is transparent about market and lacks invented new-brand volume',()=>{
 const csv=read('docs/seo/growth1-international-demand-evidence-20261103.csv');
 const rows=csv.trim().split(/\r?\n/);
 assert.ok(rows.length>=16);
 assert.ok(rows[0].includes('source_url'));
 assert.match(csv,/horoscope,1500000,2026-09/);
 assert.match(csv,/kundli,450000,2026-09/);
 assert.match(csv,/today tithi,301000,2026-09/);
 assert.match(csv,/Galaxiora,,2026-11-03/);
 assert.match(csv,/galaxia,,2026-11-03/);
 assert.match(csv,/do-not-target/);
});
