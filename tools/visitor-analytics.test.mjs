import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {eligiblePublicHtmlSection,publicAggregateSectionForPath} from '../apps/web/lib/visitor-analytics-policy.ts';
import {countVisitorAggregate,toolMetric,validSection,viewReferralMetric,VISITOR_METRICS} from '../apps/api/src/visitor-aggregate.ts';
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const normal={
 accept:'text/html,application/xhtml+xml',agent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/156.0.0.0 Safari/537.36',
 purpose:null,routerPrefetch:null,rsc:null,fetchDest:'document'
};
test('Human-looking document requests classify only allowlisted coarse public sections',()=>{
 for(const [url,section] of [
  ['/','home'],['/uk','home'],['/en/astrology/jyotish','jyotish'],
  ['/uk/news','news'],['/en/news/vedic-moon-calendar-a1b2c3d4','news'],
  ['/en/learn/vedic-moon','learn'],['/en/pedia','learn'],
  ['/uk/pedia/vimshottari-dasha','learn'],['/en/pedia/topic/nakshatras','learn'],
  ['/en/panchanga','panchanga'],['/uk/panchanga/new-delhi','panchanga'],
  ['/en/astrology/divisional-charts','astrology'],['/uk/about-me','about'],
  ['/en/tarot/cards/moon','tarot_cards']
 ])assert.equal(eligiblePublicHtmlSection(url,normal),section,url);
 for(const path of ['/en/','/en/admin','/uk/account','/uk/personal','/api/v1/health',
  '/en/news/secret-article','/en/news/a1b2c3d4','/en/panchanga/some%2Fprivate',
  '/en/panchanga/private/secret','/en/pedia/private/secret',
  '/en/community/topic/private','/uk/astrology/jyotish?birth=private'])
  assert.equal(eligiblePublicHtmlSection(path,normal),null,path);
});
test('Bots, prefetch, RSC, non-HTML requests and redirects never enter estimated HTML counters',()=>{
 for(const agent of ['Googlebot/2.1','bingbot','Twitterbot','HeadlessChrome/156','curl/8.2.0',
  'python-requests/2.31','Google-InspectionTool','Lighthouse','SemrushBot','Playwright'])
  assert.equal(eligiblePublicHtmlSection('/en/panchanga',{...normal,agent}),null,agent);
 for(const patch of [{accept:'application/json'},{purpose:'prefetch'},{routerPrefetch:'1'},
  {rsc:'1'},{fetchDest:'image'},{agent:null}])
  assert.equal(eligiblePublicHtmlSection('/en/panchanga',{...normal,...patch}),null,JSON.stringify(patch));
});
test('Atomic bucket upsert receives ONLY day + section + metric + increment, no identifiers',async()=>{
 const mutations=[];
 const prisma={visitorAggregate:{upsert:async x=>{mutations.push(x);return x;}}};
 await countVisitorAggregate(prisma,'public_html_request','home');
 await countVisitorAggregate(prisma,'jyotish_chart_completed','jyotish');
 assert.equal(mutations.length,2);
 assert.deepEqual(Object.keys(mutations[0]).sort(),['create','update','where']);
 assert.deepEqual(Object.keys(mutations[0].create).sort(),['count','day','metric','section']);
 assert.equal(mutations[0].create.count,1);
 assert.deepEqual(mutations[0].update,{count:{increment:1}});
 assert.equal(mutations[0].create.day.toISOString().slice(11),'00:00:00.000Z');
 assert.equal(JSON.stringify(mutations).match(/ip|cookie|fingerprint|client_id|url|referrer/gi),null);
 assert.equal(validSection('private'),false);
 await assert.rejects(countVisitorAggregate(prisma,'public_html_request','private'));
});
test('Tool metrics are emitted only for completed 2xx HTTP requests, not for failures',()=>{
 assert.equal(toolMetric('POST','/api/v1/charts/calculate'),'jyotish_chart_completed');
 assert.equal(toolMetric('POST','/api/v1/tarot/readings'),'tarot_spread_completed');
 assert.equal(toolMetric('GET','/api/v1/panchanga/day'),'panchanga_calculation_completed');
 for(const [method,path] of [['GET','/api/v1/charts/calculate'],['POST','/api/v1/charts/secret'],
  ['GET','/api/v1/admin/overview'],['POST','/api/v1/panchanga/day']])
  assert.equal(toolMetric(method,path),null);
 const api=source('apps/api/src/main.ts');
 assert.match(api,/res\.statusCode>=200&&res\.statusCode<300/);
 assert.match(api,/res\.on\('finish'/);
});
test('Telemetry endpoint is loopback and secret protected, admin aggregate is gated',()=>{
 const api=source('apps/api/src/visitor-analytics.ts');
 const admin=source('apps/api/src/admin.ts');
 const middleware=source('apps/web/middleware.ts');
 assert.match(api,/loopbackAddress\(req\.socket\.remoteAddress\)/);
 assert.match(api,/timingSafeEqual/);
 assert.match(middleware,/event\.waitUntil\(fetch/);
 assert.match(middleware,/eligiblePublicHtmlSection/);
 assert.doesNotMatch(middleware,/JSON\.stringify\(\{(?:ip|cookie|session)/);
 assert.match(admin,/@Get\('traffic\/visitor-analytics'\)[\s\S]{0,150}await this\.requireAdmin\(req\)/);
});
test('GA4 and business-tool names only, never natal or private payload',()=>{
 const code=source('apps/web/app/components/GrowthConsent.tsx');
 const chart=source('apps/web/app/astrology/jyotish/page.tsx');
 const panchanga=source('apps/web/app/components/PanchangaHub.tsx');
 const tarot=source('apps/web/app/components/TarotStudio.tsx');
 assert.match(code,/__galaxioraLastPageView===routeKey/);
 assert.match(code,/pathname==='\/'\?'\/en':pathname/);
 assert.match(code,/send_page_view:false/);
 assert.match(code,/galaxiora_debug_ping/);
 assert.ok(code.includes('window.gtag=function gtag('));
 assert.ok(code.includes('dataLayer?.push(arguments)'));
 assert.ok(!code.includes('dataLayer?.push(args)'));
 assert.match(code,/tagStatus\('request_observed'\)/);
 assert.doesNotMatch(code,/role="dialog"|position:'fixed'/);
 const preferences=source('apps/web/app/components/AnalyticsPreferences.tsx');
 assert.match(preferences,/data-testid="analytics-consent-state"/);
 assert.match(chart,/reportGrowthEvent\('jyotish_chart_completed'\)/);
 assert.match(panchanga,/reportGrowthEvent\('panchanga_calculation_completed'\)/);
 assert.match(tarot,/reportGrowthEvent\('tarot_spread_completed'\)/);
 assert.doesNotMatch(code,/window\.gtag\?\.\('event',detail\.name,detail\)/);
});

test('production release guard: Next.js-generated next-env.d.ts is safely recognized, other edits blocked',()=>{
 const script=source('tools/ga4-visitor-aws-release.sh');
 assert.match(script,/git diff --cached --quiet/);
 assert.match(script,/changed" == "apps\/web\/next-env\.d\.ts"/);
 assert.match(script,/git restore --source=HEAD --worktree -- apps\/web\/next-env\.d\.ts/);
 assert.match(script,/next-env\.d\.ts\.generated-before-deploy/);
 const section=script.match(/if \[\[ "\$DIRTY_NEXT_ENV" == 1 \]\]; then\n node - <<'NODE'\n([\s\S]*?)\nNODE\nfi/);
 assert.ok(section,'Native guard source must be executable from AWS deploy');
 const dir=mkdtempSync(join(tmpdir(),'galaxiora-aws-next-env-'));
 const target=join(dir,'apps/web/next-env.d.ts');
 mkdirSync(join(dir,'apps/web'),{recursive:true});
 const prefix='/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n';
 const check=content=>{
  writeFileSync(target,content);
  return spawnSync(process.execPath,['-'],{cwd:dir,input:section[1],encoding:'utf8'});
 };
 try{
  assert.equal(check(prefix+'// This file is maintained by Next.js.\n').status,0,'tracked baseline');
  assert.equal(check(prefix+'import "./.next/types/routes.d.ts";\n\n// NOTE: This file should not be edited\n// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.\n').status,0,'Next.js build output');
  assert.notEqual(check(prefix+'import "some-external-package";\n').status,0,'unexpected arbitrary import');
  assert.notEqual(check(prefix+'const unexpected = true;\n').status,0,'unexpected code change');
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('Privacy-first browser and HTML counters share a strict public page route allowlist',()=>{
 for(const [path,section] of [
  ['/en/about-me','about'],['/uk/panchanga/delhi','panchanga'],
  ['/en/news/moon-forecast-a1b2c3d4','news'],['/en/pedia/vimshottari-dasha','learn'],
  ['/uk/pedia/topic/nakshatras','learn'],['/en/astrology/divisional-charts','astrology'],
  ['/en/astrology/moon-sign-vs-sun-sign','astrology'],
  ['/uk/nakshatra/ashwini','astrology'],['/en/horoscope/compatibility/aries-taurus','horoscope'],
  ['/en/horoscope/vedic/aries','horoscope'],['/en/tarot/cards/the-fool','tarot_cards']
 ]){
  assert.equal(publicAggregateSectionForPath(path),section,path);
  assert.equal(eligiblePublicHtmlSection(path,normal),section,path);
 }
 for(const path of ['/en/panchanga/secret/private','/en/panchanga/delhi%2Fsecret',
  '/en/admin','/en/personal','/en/account','/en/privacy','/en/terms',
  '/api/v1/charts/calculate','/en/pedia/user/private','/uk/news/no-public-id',
  '/en/community/topic/private','/en/astrology/jyotish?birth=PRIVATE']){
  assert.equal(publicAggregateSectionForPath(path),null,path);
 }
});

test('Browser page renders count without GA consent, cookies, personal data or client identifiers',async()=>{
 const code=source('apps/web/app/components/FirstPartyPageViews.tsx');
 const layout=source('apps/web/app/layout.tsx');
 const policy=source('apps/web/lib/visitor-analytics-policy.ts');
 assert.match(layout,/<FirstPartyPageViews\/>/);
 assert.match(code,/usePathname\(\)/);
 assert.match(code,/previous\.current===pathname/);
 assert.match(code,/publicAggregateSectionForPath\(pathname\)/);
 assert.match(code,/fetch\('\/api\/v1\/traffic\/page-view'/);
 assert.match(code,/credentials:'omit'/);
 assert.match(code,/referrerPolicy:'no-referrer'/);
 assert.match(code,/keepalive:true/);
 assert.match(code,/body:JSON\.stringify\(\{section,channel,locale\}\)/);
 assert.match(code,/classifyReferralBucket\(document\.referrer,window\.location\.search\)/);
 assert.match(code,/:'internal'/);
 assert.doesNotMatch(code,/window\.gtag|window\.localStorage|sessionStorage\.|document\.cookie|\bclientId\b/);
 assert.match(policy,/if\(!safe\)return null/);
 // GA4 remains consent gated independently of the first-party aggregate.
 const ga=source('apps/web/app/components/GrowthConsent.tsx');
 assert.match(ga,/choice!=='accepted'/);
});

test('API accepts anonymous counts only from same-origin fetch with a fixed three-field schema',()=>{
 const api=source('apps/api/src/visitor-analytics.ts');
 const nest=source('apps/api/src/nest.ts');
 assert.match(nest,/PublicPageViewController/);
 assert.match(api,/@Controller\('api\/v1\/traffic'\)/);
 assert.match(api,/@Post\('page-view'\)/);
 assert.match(api,/origin==='https:\/\/galaxiora\.com'/);
 assert.match(api,/fetchSite!=='same-origin'/);
 assert.match(api,/fetchDest!=='empty'/);
 assert.match(api,/fields\.length!==3/);
 assert.match(api,/fields\.includes\('locale'\)/);
 assert.match(api,/validSection\(section\)/);
 assert.match(api,/validReferralBucket\(channel\)/);
 assert.match(api,/locale!=='en'&&locale!=='uk'/);
 assert.match(api,/countVisitorAggregate\(this\.prisma,'rendered_page_view',section\)/);
 assert.match(api,/viewReferralMetric\(channel\)/);
 assert.doesNotMatch(api,/this\.prisma\.visitorIdentity|createVisitorIdentity|logVisitorIp/);
});

test('New browser-view, source and language metrics store ONLY coarse daily aggregates',async()=>{
 const writes=[];
 const db={visitorAggregate:{upsert:async x=>{writes.push(x);return x;}}};
 for(const metric of ['rendered_page_view',viewReferralMetric('google'),'rendered_locale_en']){
  assert.ok(VISITOR_METRICS.includes(metric),metric);
  await countVisitorAggregate(db,metric,'jyotish');
 }
 assert.equal(writes.length,3);
 for(const x of writes){
  assert.deepEqual(Object.keys(x.create).sort(),['count','day','metric','section']);
  assert.equal(x.create.count,1);
  assert.equal(x.create.section,'jyotish');
  assert.equal(JSON.stringify(x).match(/ip_address|cookie|fingerprint|referrer|birthDate|userId|rawUrl/gi),null);
 }
 const admin=source('apps/api/src/admin.ts');
 const panel=source('apps/web/app/components/AdminAnalyticsPanel.tsx');
 const privacy=source('apps/web/app/[locale]/privacy/page.tsx');
 assert.match(admin,/byRenderedSection,byRenderedSource:renderedSources,byRenderedLocale/);
 assert.match(admin,/renderedDaily:Array\.from/);
 assert.match(panel,/rendered_page_view/);
 assert.match(panel,/Перегляди сторінок/);
 assert.match(panel,/byRenderedLocale/);
 assert.match(panel,/Never add them/);
 assert.match(privacy,/Анонімна статистика роботи сайту/);
});
