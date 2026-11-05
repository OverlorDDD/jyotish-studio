import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyReferralBucket,eligiblePublicHtmlSection} from '../apps/web/lib/visitor-analytics-policy.ts';
import {VISITOR_METRICS,referralMetric,validReferralBucket,countVisitorAggregate} from '../apps/api/src/visitor-aggregate.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Referrer source classification returns only approved categories, never URLs',()=>{
 for(const [ref,query,result] of [
  ['https://www.google.com/search?q=private','', 'google'],
  ['https://www.google.co.uk/search?q=private','', 'google'],
  ['https://www.bing.com/search','', 'other_search'],
  ['https://www.reddit.com/r/astro','', 'social'],
  ['https://t.me/galaxiora','', 'social'],
  ['https://example.org/private?birth=123','', 'other_referral'],
  ['https://galaxiora.com/en/news','', 'unknown'],
  [null,'?utm_source=telegram&utm_medium=social&utm_campaign=astro_basics','social'],
  [null,'?utm_source=partner&utm_medium=social&utm_campaign=astro_basics','partner_tag'],
  [null,'?utm_source=evil&utm_medium=private&birthDate=SECRET','unknown'],
  [null,'?birthDate=SECRET','unknown'],
  [null,'','unknown']
 ]){
  const value=classifyReferralBucket(ref,query);
  assert.equal(value,result,JSON.stringify([ref,query]));
  assert.ok(validReferralBucket(value));
  assert.ok(VISITOR_METRICS.includes(referralMetric(value)));
  assert.ok(!value.includes('birth')&&!value.includes('http')&&!value.includes('SECRET'));
 }
 assert.equal(validReferralBucket('https://malicious.example'),false);
 assert.equal(validReferralBucket('ref_google'),false);
});

test('Public HTML eligibility excludes bot, private, prefetch and client-side navigations',()=>{
 const headers={accept:'text/html',agent:'Mozilla/5.0 Chrome/156 Safari/537.36',
  fetchDest:'document',purpose:null,routerPrefetch:null,rsc:null};
 assert.equal(eligiblePublicHtmlSection('/en/astrology/jyotish',headers),'jyotish');
 for(const patch of [{agent:'Googlebot/2.1'},{rsc:'1'},{purpose:'prefetch'},{fetchDest:'image'}])
  assert.equal(eligiblePublicHtmlSection('/en/astrology/jyotish',{...headers,...patch}),null);
 assert.equal(eligiblePublicHtmlSection('/en/account',headers),null);
});

test('Source counts store only UTC date, safe section, fixed metric and integer',async()=>{
 const writes=[];
 const prisma={visitorAggregate:{upsert:async args=>writes.push(args)}};
 await countVisitorAggregate(prisma,referralMetric('google'),'jyotish');
 assert.equal(writes.length,1);
 assert.deepEqual(Object.keys(writes[0].create).sort(),['count','day','metric','section']);
 assert.equal(writes[0].create.metric,'ref_google');
 assert.equal(writes[0].create.section,'jyotish');
 assert.equal(JSON.stringify(writes).match(/referer|source_url|birth|ip_address|cookie|fingerprint/i),null);
 await assert.rejects(countVisitorAggregate(prisma,'ref_other_site','jyotish'));
});

test('No duplicated analytics UI, admin-only read with 7/30 and historical source caveat',()=>{
 const admin=read('apps/api/src/admin.ts'),ui=read('apps/web/app/components/AdminDashboard.tsx');
 const panel=read('apps/web/app/components/AdminAnalyticsPanel.tsx');
 const css=read('apps/web/app/components/AdminAnalyticsPanel.module.css');
 const middle=read('apps/web/middleware.ts');
 const controller=read('apps/api/src/visitor-analytics.ts');
 assert.match(admin,/@Get\('traffic\/visitor-analytics'\)[\s\S]{0,180}await this\.requireAdmin\(req\)/);
 assert.match(admin,/days!==7&&days!==30/);
 assert.match(admin,/unattributedHistoricCount/);
 assert.match(admin,/daily:Array\.from/);
 assert.match(ui,/AdminAnalyticsPanel/);
 assert.doesNotMatch(ui,/data-testid="ga4-active30"/);
 assert.equal((panel.match(/data-testid="ga4-active30"/g)||[]).length,1);
 assert.match(panel,/visitors\?\.days===days|visitors\?\.totals/);
 assert.match(panel,/not unique|not people|не унікальн/i);
 assert.match(css,/max-width:1100px/);
 assert.match(css,/@media\(max-width:480px\)/);
 assert.match(middle,/classifyReferralBucket/);
 assert.match(controller,/validReferralBucket\(referral\)/);
 assert.match(controller,/referralMetric\(referral\)/);
 assert.doesNotMatch(middle,/request\.headers\.get\('cookie'\)/);
});
