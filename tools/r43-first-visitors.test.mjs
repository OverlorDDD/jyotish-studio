import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SEO_PATHS} from '../apps/web/lib/site-indexing.ts';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const slug='astrology/moon-sign-vs-sun-sign';
const page=read('apps/web/app/[locale]/astrology/moon-sign-vs-sun-sign/page.tsx');

test('R4.3 article is a real EN/UK route in canonical sitemap, not a thin keyword doorway',()=>{
 assert.equal(SEO_PATHS.filter(x=>x===slug).length,1);
 assert.match(read('apps/web/app/sitemap.ts'),/SEO_PATHS/);
 assert.match(page,/generateStaticParams/);
 assert.match(page,/BRAND.locales/);
 assert.match(page,/indexRobots\(\)/);
 assert.match(page,/alternates:\{canonical:url,languages:/);
 assert.match(page,/'x-default':'\/en\/'\+SLUG/);
 assert.match(page,/articleStructuredData/);
 assert.match(page,/BreadcrumbList/);
 assert.match(page,/ShareTools/);
 assert.match(page,/OpenGraph|openGraph:/);
 assert.match(page,/data-testid="r43-moon-sun-sign-guide"/);
 assert.doesNotMatch(page,/meta\s+keywords|keyword\s+stuffing|document\.write|noindex|hidden text/i);
});
test('R4.3 distinct, substantive bilingual guide avoids duplicate Academy content',()=>{
 for(const phrase of [
  'Vedic Moon Sign vs Western Sun Sign',
  'Ведичний знак Місяця і західний знак Сонця',
  'The Sun and Moon are not interchangeable',
  'Сонце і Місяць — різні показники',
  'illustration, not a real birth chart',
  'Спрощений приклад — не реальна натальна карта',
  'tropical','sidereal','Lahiri','Чандра Раші','ayin'
 ].filter(x=>x!=='ayin')){
  assert.ok(page.includes(phrase),'missing content: '+phrase);
 }
 assert.ok(page.length>10000,'article should have meaningful bilingual content');
 assert.match(page,/12° Aries/);
 assert.match(page,/12° Овна/);
 assert.match(page,/how to compare your own chart correctly/i);
 assert.match(page,/Як правильно зіставити свої карти/);
 assert.match(page,/астрологічної традиції/);
 assert.match(page,/scientifically validated prediction/);
 assert.match(page,/learn\/sidereal-and-tropical/,'contextual link to existing Academy content');
 assert.match(page,/astrology\/jyotish/,'link to actual free calculation tool');
 assert.doesNotMatch(page,/'@type':'Person'|sameAs:/,'no invented person or social profiles');
});
test('R4.3 guide is internally linked from the existing real calculator, not orphaned',()=>{
 const guides=read('apps/web/app/components/SearchGuides.tsx');
 assert.match(guides,/astrology\/moon-sign-vs-sun-sign/);
 assert.match(guides,/subject==='jyotish'/);
 assert.match(guides,/Why your Vedic Moon sign differs/);
});
test('R4.3 outbound community campaign is opt-in, discloses affiliation and contains no PII',()=>{
 const kit=read('docs/seo/r43-english-first-audience-launch-kit.md');
 assert.match(kit,/no posts sent/);
 assert.match(kit,/I work on Galaxiora/);
 assert.match(kit,/utm_campaign=r43_moon_vs_sun/);
 assert.match(kit,/Do not publish until/);
 assert.match(kit,/no automatic bulk messaging/);
 assert.doesNotMatch(kit,/utm_(?:source|medium|campaign)=[^\s]+(?:email|birthDate|latitude|token)=/);
});
