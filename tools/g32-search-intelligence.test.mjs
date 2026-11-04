import test from 'node:test';
import assert from 'node:assert/strict';
import {parseGscCsv,safeGscPage,summarizeGscRows,runSearchIntelligence} from './g32-search-intelligence.mjs';
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
