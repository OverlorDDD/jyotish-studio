import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHODASHAVARGA,SHODASHAVARGA_DIVISIONS} from '../apps/web/lib/shodashavarga-content.ts';
import {safeAiSearchSource,safeGrowthPath} from '../apps/web/lib/growth-metrics.ts';
import {aggregateCaddyLog,ipv4InCidr,classifyCaddyAccess} from './g4-bot-visit-audit.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const divisions=[1,2,3,4,7,9,10,12,16,20,24,27,30,40,45,60];
test('G4 full sixteen chart inventory is accurate, unique and bilingual',()=>{
 assert.deepEqual([...SHODASHAVARGA_DIVISIONS],divisions);
 assert.deepEqual(SHODASHAVARGA.map(x=>x.division),divisions);
 for(const item of SHODASHAVARGA){
  assert.ok(item.name&&item.theme.en&&item.theme.uk&&item.detail.en.length>95&&item.detail.uk.length>70);
  assert.ok(item.question.en&&item.question.uk);
  assert.equal(item.status,item.division===60?'provisional_d60':'internally_verified_n4');
 }
});
test('G4 public hub has two localized static canonicals, server-readable evidence and no invented stars',()=>{
 const page=read('apps/web/app/[locale]/astrology/divisional-charts/page.tsx');
 const sitemap=read('apps/web/lib/site-indexing.ts');
 const guide=read('apps/web/app/components/SearchGuides.tsx');
 const natal=read('apps/web/app/[locale]/astrology/jyotish/page.tsx');
 const academy=read('apps/web/app/components/AcademyHub.tsx');
 const method=read('apps/web/app/[locale]/methodology/page.tsx');
 assert.match(sitemap,/'astrology\/divisional-charts'/);
 assert.match(page,/generateStaticParams\(\)/);
 assert.match(page,/robots:indexRobots\(\)/);
 assert.match(page,/canonical:p/);
 assert.match(page,/x-default/);
 assert.match(page,/SHODASHAVARGA\.map/);
 assert.match(page,/id=\{'d'\+v\.division\}/);
 assert.match(page,/numberOfItems:16/);
 assert.doesNotMatch(page,/aggregateRating|reviewCount|datePublished/);
 assert.match(page,/\.replace\(\/<\/g/);
 assert.ok((page.match(/<h1(?:\s|>)/g)||[]).length===1);
 for(const source of [guide,natal,academy,method])assert.ok(source.includes('astrology/divisional-charts'));
 assert.match(method,/D60.*попередн/);
 assert.match(method,/D60.*provisional/);
});
test('G4 referral measurements are allowlisted, consent-gated and PII-free',()=>{
 const consent=read('apps/web/app/components/GrowthConsent.tsx');
 assert.equal(safeGrowthPath('/en/astrology/divisional-charts'),'/en/astrology/divisional-charts');
 assert.equal(safeGrowthPath('/uk/astrology/divisional-charts'),'/uk/astrology/divisional-charts');
 assert.equal(safeGrowthPath('/en/personal'),null);
 assert.equal(safeAiSearchSource('?utm_source=chatgpt.com&utm_campaign=secret',''),'chatgpt');
 assert.equal(safeAiSearchSource('?utm_source=unknown','https://www.perplexity.ai/search/a?private=y'),null);
 assert.equal(safeAiSearchSource('','https://www.perplexity.ai/search/a'),null);
 assert.equal(safeAiSearchSource('','https://perplexity.ai/search/a'),'perplexity');
 assert.equal(safeAiSearchSource('','https://claude.ai/chat/private'),'claude');
 assert.equal(safeAiSearchSource('','https://copilot.microsoft.com/chats/x'),'copilot');
 assert.equal(safeAiSearchSource('','http://claude.ai/chat/private'),null);
 assert.equal(safeAiSearchSource('','https://fakechatgpt.com/'),null);
 assert.ok(consent.indexOf("choice!=='accepted'")<consent.indexOf("safeAiSearchSource(window.location.search"));
 assert.match(consent,/ai_search_landing/);
 assert.match(consent,/ai_source:aiSource/);
 assert.doesNotMatch(consent,/ai_source:window\.location/);
});
test('G4 crawler log audit never treats a spoofable agent string as IP-verified',()=>{
 assert.equal(ipv4InCidr('104.210.140.130','104.210.140.128/28'),true);
 assert.equal(ipv4InCidr('104.210.140.99','104.210.140.128/28'),false);
 assert.equal(ipv4InCidr('someip','104.210.140.128/28'),false);
 const make=(ip,uri,status=200)=>JSON.stringify({status,request:{uri,remote_ip:ip,headers:{'User-Agent':['OAI-SearchBot/1.0']}}});
 const fake=classifyCaddyAccess(JSON.parse(make('203.0.113.15','/en/astrology/divisional-charts')),['104.210.140.128/28']);
 assert.equal(fake.verified,false);
 const s=aggregateCaddyLog([make('104.210.140.130','/en/astrology/divisional-charts'),
  make('203.0.113.15','/en/personal'),make('203.0.113.15','/en/astrology/divisional-charts',429)],
  ['104.210.140.128/28']);
 assert.equal(s.verifiedOpenAISearchbot,1);
 assert.equal(s.public2xx,1);
 assert.equal(s.privateRequests,1);
 assert.equal(s.blocked403or429,1);
 assert.ok(!JSON.stringify(s).includes('104.210.140'));
});
