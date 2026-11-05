import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {safeGrowthCampaign,safeGrowthEvent,safeGrowthPath} from '../apps/web/lib/growth-metrics.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('R4.2 accepts only normalized public URL paths, without private query data',()=>{
 for(const [path,expected] of [
  ['/','/en'],['/uk','/uk'],['/en/panchanga','/en/panchanga'],
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
 assert.match(code,/return null/);
 assert.match(code,/galaxiora:analytics-choice/);
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
 const preferences=read('apps/web/app/components/AnalyticsPreferences.tsx');
 const privacy=read('apps/web/app/[locale]/privacy/page.tsx');
 assert.match(layout,/GrowthConsent/);
 assert.match(privacy,/AnalyticsPreferences/);
 assert.doesNotMatch(component,/role="dialog"|position:'fixed'|Analytics settings|Налаштування аналітики/);
 for(const key of ['Залишити вимкненою','Keep analytics off','Дозволити аналітику','Allow analytics','Відкликати згоду','Withdraw consent'])
  assert.ok(preferences.includes(key),key);
 assert.match(preferences,/galaxiora:analytics-choice/);
 assert.match(preferences,/choice==='accepted'&&value==='rejected'/);
 assert.ok(privacy.includes('Google Analytics 4'));
 assert.ok(privacy.includes('Google may process'));
 assert.ok(privacy.includes('Google може обробляти'));
});

test('R4.2 real Tarot and Panchanga tool events do not include PII',()=>{
 const tarot=read('apps/web/app/components/TarotStudio.tsx');
 const panchanga=read('apps/web/app/components/PanchangaHub.tsx');
 assert.match(tarot,/reportGrowthEvent\('tarot_spread_started'\)/);
 assert.match(tarot,/reportGrowthEvent\('tarot_spread_completed'\)/);
 assert.match(panchanga,/reportGrowthEvent\('panchanga_calculation_completed'\)/);
 const code=read('apps/web/app/components/GrowthConsent.tsx');
 assert.match(code,/safeGrowthPath\(window\.location\.pathname\)/);
 assert.match(code,/page_location:safeLocation/);
 assert.match(code,/source\.origin/);
 assert.match(code,/window\.addEventListener\('galaxiora:growth'/);
});

test('R4.2 campaign tags cannot smuggle personal inputs to GA4',()=>{
 assert.deepEqual(safeGrowthCampaign('?utm_source=telegram&utm_medium=social&utm_campaign=tarot_cards'),
  {campaign_source:'telegram',campaign_medium:'social',campaign_name:'tarot_cards'});
 assert.deepEqual(safeGrowthCampaign('?utm_source=youtube&utm_medium=social&utm_campaign=astro_basics'),
  {campaign_source:'youtube',campaign_medium:'social',campaign_name:'astro_basics'});
 for(const query of [
  '?utm_source=telegram&utm_medium=social&utm_campaign=my_private_email',
  '?utm_source=telegram&utm_medium=email&utm_campaign=launch',
  '?utm_source=private_user&utm_medium=social&utm_campaign=launch',
  '?utm_source=telegram&utm_medium=social&utm_campaign=launch_birth_date_2000',
  '?utm_source=telegram&utm_medium=social&utm_campaign=',
 ])assert.equal(safeGrowthCampaign(query),null,query);
 const loader=read('apps/web/app/components/GrowthConsent.tsx');
 assert.match(loader,/safeGrowthCampaign\(window\.location\.search\)/);
});


test('R4 diagnostics: GA4 consent default is queued before js/config, no tag before opt-in',()=>{
 const code=read('apps/web/app/components/GrowthConsent.tsx');
 const start=code.indexOf('function startAnalytics(');
 const stop=code.indexOf('function stopAnalytics(');
 const init=code.slice(start,stop);
 const consent=init.indexOf("window.gtag('consent','default'");
 const update=init.indexOf("window.gtag('consent','update'");
 const js=init.indexOf("window.gtag('js'");
 const config=init.indexOf("window.gtag('config'");
 assert.ok(consent>0&&update>consent&&js>update&&config>js,'consent order is critical');
 assert.ok(init.indexOf("if(typeof window==='undefined'||!enabled||window.__galaxioraAnalyticsReady)return;")>=0);
 assert.match(init,/tagStatus\('loading'\)/);
 assert.match(init,/tagStatus\('loaded'\)/);
 assert.match(init,/tagStatus\('blocked'\)/);
 const preferences=read('apps/web/app/components/AnalyticsPreferences.tsx');
 assert.match(preferences,/data-testid="analytics-consent-state"/);
 assert.match(preferences,/window\.location\.reload\(\)/);
 assert.doesNotMatch(code,/localStorage\.setItem/);
 const home=read('apps/web/app/components/PortalHome.tsx');
 assert.match(home,/Астрологія, Таро та Панчанга/);
 assert.match(home,/Astrology, Tarot & Panchanga/);
});

test('R4 read-only external audit includes Google discovery and additional root checks',()=>{
 const code=read('tools/r4-search-discovery-audit.mjs');
 for(const keyword of ['WEBSITE_SCHEMA','INDEXABLE','CANONICAL','NAVIGABLE_IA','SITEMAP','BRAND_ASSET','H1_TOPIC','SERVER_TIMING'])
  assert.ok(code.includes(keyword),keyword);
 assert.match(code,/galaxiora.com/);
 assert.match(code,/redirect:'manual'/);
 assert.doesNotMatch(code,/method:\s*['"](POST|PUT|PATCH|DELETE)/);
});
