import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {safeGrowthEvent,safeGrowthPath} from '../apps/web/lib/growth-metrics.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('R4.2 accepts only normalized public URL paths, without private query data',()=>{
 for(const [path,expected] of [
  ['/uk','/uk'],['/en/panchanga','/en/panchanga'],
  ['/uk/astrology/jyotish','/uk/astrology/jyotish'],
  ['/uk/tarot/cards/moon','/uk/tarot/cards'],['/en/learn/nakshatras','/en/learn'],
  ['/en/yoga/gentle-breath','/en/yoga'],['/en/horoscope/aries','/en/horoscope'],
  ['/uk/eclipses/2027','/uk/eclipses/2027']
 ])assert.equal(safeGrowthPath(path),expected,path);
 for(const path of [
  '/uk/account','/en/personal','/uk/admin','/uk/astrology/jyotish?birthDate=2000',
  '/en/community/topic/secret','/uk/community/member/someone',
  '/uk/news/article/story-with-id','/api/v1/charts/calculate',
  '/uk/horoscope?city=Kyiv','/uk/learn/foo%3Femail%3Dtest',
  '/en/tarot?question=private'
 ])assert.equal(safeGrowthPath(path),null,path);
 assert.equal(safeGrowthEvent('article_to_tool_click'),true);
 assert.equal(safeGrowthEvent('public_resource_share'),true);
 assert.equal(safeGrowthEvent('birth_data_submitted'),false);
});
test('R4.2 GA4 is opt-in only and disabled without public measurement configuration',()=>{
 const code=read('apps/web/app/components/GrowthConsent.tsx');
 assert.match(code,/NEXT_PUBLIC_GA4_MEASUREMENT_ID/);
 assert.match(code,/if\(!enabled\|\|!loaded\)return null/);
 assert.match(code,/choice!=='accepted'/);
 assert.match(code,/analytics_storage:'granted'/);
 assert.match(code,/ad_storage:'denied'/);
 assert.match(code,/ad_user_data:'denied'/);
 assert.match(code,/ad_personalization:'denied'/);
 assert.match(code,/send_page_view:false/);
 assert.match(code,/navigator|localStorage/);
 assert.doesNotMatch(code,/sessionStorage|document.cookie|birthDate|birthTime|latitude|longitude|email|tarotQuestion|user_id/i);
});
test('R4.2 has bilingual choice, withdrawal and truthful privacy notice',()=>{
 const layout=read('apps/web/app/layout.tsx');
 const component=read('apps/web/app/components/GrowthConsent.tsx');
 const privacy=read('apps/web/app/[locale]/privacy/page.tsx');
 assert.match(layout,/GrowthConsent/);
 for(const key of ['Відхилити','Reject','Дозволити аналітику','Allow analytics','Відкликати згоду','Withdraw consent'])
  assert.ok(component.includes(key),key);
 assert.ok(privacy.includes('Google Analytics 4'));
 assert.ok(privacy.includes('Google may process'));
 assert.ok(privacy.includes('Google може обробляти'));
});
