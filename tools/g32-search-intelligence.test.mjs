import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {parseGscCsv,safeGscPage,summarizeGscRows,runSearchIntelligence,
 finalizedGscWindow,summarizeConnectedGsc,fetchGscRows} from './g32-search-intelligence.mjs';
test('CSV handles quoted strings and search console exports with a BOM',()=>{
 const rows=parseGscCsv('\uFEFFQuery,Clicks,Impressions,CTR,Position\n"panchang, today",1,55,1.8%,9\n"ved ic ""bad""",0,4,0%,33\n');
 assert.equal(rows.length,2);
 assert.equal(rows[0].keys[0],'panchang, today');
 assert.equal(rows[0].impressions,55);
 assert.throws(()=>parseGscCsv('Query,Clicks\nx,1'));
});
test('never reports private/referral query or foreign-site pages',()=>{
 for(const p of ['https://other.test/en/tarot','https://galaxiora.com/en/account',
  'https://galaxiora.com/en/tarot?email=abc','http://galaxiora.com/en/tarot']){
  assert.equal(safeGscPage(p),null);
 }
 assert.equal(safeGscPage('https://galaxiora.com/en/pedia/what-is-tithi-lunar-day'),
  'pedia/what-is-tithi-lunar-day');
 const r=summarizeGscRows([
  {keys:['panchang today','https://galaxiora.com/en/panchanga'],clicks:2,impressions:70},
  {keys:['tarot','https://galaxiora.com/en/account'],clicks:0,impressions:50},
  {keys:['my personal name and password','https://other.test/'],clicks:0,impressions:400}
 ]);
 assert.equal(r.rowsClassified,1);
 assert.ok(!JSON.stringify(r).includes('password'));
 const p=r.opportunities.find(x=>x.id==='panchanga');
 assert.equal(p.impressions,70);
 assert.equal(p.decision,'review_existing_page_and_internal_link_quality');
});
test('low-volume or missing data never generates false keyword demand or pages',async()=>{
 const z=summarizeGscRows([{keys:['vedic birth chart','https://galaxiora.com/en/astrology/jyotish'],
  impressions:2,clicks:0}]);
 assert.equal(z.opportunities.find(x=>x.id==='jyotish').decision,'insufficient_sample_keep_current_page');
 assert.equal(z.doNotPublishAutomatically,true);
 const unknown=await runSearchIntelligence({args:['--json'],env:{}});
 assert.equal(unknown.opportunities.every(x=>x.impressions===null),true);
 assert.equal(unknown.dataCoverage,'unavailable_or_no_reported_rows');
 assert.ok(unknown.blocker);
});

test('Google finalized-date reporting uses Pacific time, not local server time',()=>{
 const w=finalizedGscWindow(new Date('2026-11-05T11:30:00Z'));
 assert.equal(w.endDate,'2026-11-01');
 assert.equal(w.startDate,'2026-10-23');
 assert.equal(w.dataState,'final');
 assert.equal(w.dayBoundary,'America/Los_Angeles');
});
test('verified GSC totals never sum incomplete query rows into site traffic',()=>{
 const report=summarizeConnectedGsc({
  period:'2026-10-23..2026-11-01',
  dailyRows:[
   {keys:['2026-10-30'],clicks:1,impressions:12,position:4},
   {keys:['2026-11-01'],clicks:0,impressions:25,position:30}
  ],
  pageRows:[
   {keys:['https://galaxiora.com/en/panchanga'],clicks:1,impressions:31,position:9},
   {keys:['https://galaxiora.com/en/astrology/jyotish'],clicks:0,impressions:4,position:18},
   {keys:['https://galaxiora.com/en/account'],clicks:0,impressions:2,position:1}
  ],
  queryRows:[
   {keys:['super secret personal keyword','https://galaxiora.com/en/panchanga'],clicks:0,impressions:2},
   {keys:['vedic panchang','https://galaxiora.com/en/panchanga'],clicks:1,impressions:5}
  ]
 });
 assert.equal(report.propertyTotals.impressions,37);
 assert.equal(report.propertyTotals.clicks,1);
 assert.equal(report.propertyTotals.position,Number(((4*12+30*25)/37).toFixed(2)));
 assert.equal(report.opportunities.find(o=>o.id==='panchanga').impressions,31);
 assert.equal(report.opportunities.find(o=>o.id==='panchanga').decision,'insufficient_sample_keep_current_page');
 assert.equal(report.opportunities.find(o=>o.id==='tarot').impressions,null);
 assert.equal(report.observations.publicPageRowsClassified,2);
 assert.equal(report.observations.queryDataIsPartial,true);
 assert.ok(!JSON.stringify(report).includes('super secret'));
});
test('service-account OAuth checks exact GSC property and requests three distinct read-only aggregates',async()=>{
 const {privateKey}=generateKeyPairSync('rsa',{modulusLength:2048});
 const key=JSON.stringify({type:'service_account',
  client_email:'readonly@test-project.iam.gserviceaccount.com',
  private_key:privateKey.export({type:'pkcs8',format:'pem'}),
  token_uri:'https://oauth2.googleapis.com/token'});
 const seen=[];
 const fetcher=async(url,options)=>{
  const body=options.body?Object.fromEntries(new URLSearchParams(options.body)):{};
  seen.push({url,method:options.method,body:options.body&&url.includes('/searchAnalytics/query')?
   JSON.parse(options.body):null,scope:body.assertion?'signed_jwt':null});
  if(url.endsWith('/token'))return {ok:true,json:async()=>({access_token:'TOKEN_PRIVATE'})};
  if(url.endsWith('/sites'))return {ok:true,json:async()=>({siteEntry:[{siteUrl:'sc-domain:galaxiora.com',permissionLevel:'siteRestrictedUser'}]})};
  if(url.includes('searchAnalytics/query')){
   const dims=JSON.parse(options.body).dimensions;
   if(dims[0]==='date')return {ok:true,json:async()=>({rows:[{keys:['2026-11-01'],clicks:1,impressions:12}]})};
   if(dims[0]==='page')return {ok:true,json:async()=>({rows:[{keys:['https://galaxiora.com/en/panchanga'],clicks:1,impressions:10}]})};
   return {ok:true,json:async()=>({rows:[]})};
  }
  throw Error('Unexpected target');
 };
 const found=await fetchGscRows(key,{fetcher,now:new Date('2026-11-05T11:30:00Z')});
 assert.deepEqual(seen.map(x=>x.method),['POST','GET','POST','POST','POST']);
 assert.deepEqual(seen.slice(2).map(x=>x.body.dimensions),[['date'],['page'],['query','page']]);
 assert.ok(seen.slice(2).every(x=>x.body.dataState==='final'&&x.body.rowLimit===5000));
 assert.ok(seen.slice(2).every(x=>x.url.includes('sc-domain%3Agalaxiora.com')));
 assert.equal(found.period,'2026-10-23..2026-11-01');
 assert.equal(found.dailyRows.length,1);
 // The report is safe even when a transport has seen a privileged OAuth token.
 assert.ok(!JSON.stringify(summarizeConnectedGsc(found)).includes('TOKEN_PRIVATE'));
});
test('wrong property permission fails closed and does not request search data',async()=>{
 const {privateKey}=generateKeyPairSync('rsa',{modulusLength:2048});
 const key=JSON.stringify({type:'service_account',
  client_email:'readonly@test-project.iam.gserviceaccount.com',
  private_key:privateKey.export({type:'pkcs8',format:'pem'}),
  token_uri:'https://oauth2.googleapis.com/token'});
 let calledAnalytics=false;
 const f=async(url)=>{
  if(url.endsWith('/token'))return {ok:true,json:async()=>({access_token:'token'})};
  if(url.endsWith('/sites'))return {ok:true,json:async()=>({siteEntry:[]})};
  calledAnalytics=true;throw Error('must not call');
 };
 await assert.rejects(fetchGscRows(key,{fetcher:f}),/GSC_PROPERTY_ACCESS_MISSING/);
 assert.equal(calledAnalytics,false);
});
