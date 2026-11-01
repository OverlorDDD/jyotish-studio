import test from 'node:test';
import assert from 'node:assert/strict';
import {headlineNeedsWork,headlineDebtState,headlineDebtSummary} from '../apps/api/src/news-headline-backlog.ts';
import {enrichPendingNews} from '../apps/api/src/news-editorial.ts';
import {sourceRetryStateFromHistory} from '../apps/api/src/news-source-health.ts';
const now=new Date('2026-11-01T12:00:00Z');
const original='How to read a natal chart';
const validUk='Як читати натальну карту';
function scopedEnv(values,fn){
 const prior=Object.fromEntries(Object.keys(values).map(k=>[k,process.env[k]]));
 Object.assign(process.env,values);
 return Promise.resolve().then(fn).finally(()=>{for(const [k,v] of Object.entries(prior)){
  if(v===undefined)delete process.env[k];else process.env[k]=v;
 }});
}
const env={NEWS_TRANSLATION_ENABLED:'1',NEWS_TRANSLATION_CONTENT_SCOPE:'headlines',
 NEWS_TRANSLATION_HEADLINES_APPROVED:'1',NEWS_TRANSLATION_QUALITY_APPROVED:'0',
 NEWS_TRANSLATION_PROVIDER:'azure',NEWS_AZURE_MONTHLY_CHAR_LIMIT:'10000',
 AZURE_TRANSLATOR_KEY:'test-key',AZURE_TRANSLATOR_REGION:'eastus'};
test('Safe native English with ready Ukrainian is complete even if titleEn is NULL',()=>{
 const ready={title:original,titleUk:validUk,titleEn:null,editorialAttempts:6,
  editorialNextAttemptAt:new Date('2026-11-02')};
 assert.equal(headlineNeedsWork(ready),false);
 assert.equal(headlineDebtState(ready,now).state,'ready');
 assert.deepEqual(headlineDebtSummary([ready],now),{
  sampled:1,ready:1,missingUk:0,missingEn:0,eligible:0,cooldown:0,manualReview:0
 });
});
test('True missing Hindi/UK titles are classified as eligible, retry-waiting or quarantined',()=>{
 const source='कल राशिफल';
 const rows=[
  {title:source,titleUk:null,titleEn:null,editorialAttempts:0,editorialNextAttemptAt:null},
  {title:source,titleUk:null,titleEn:null,editorialAttempts:1,editorialNextAttemptAt:new Date('2026-11-01T15:00:00Z')},
  {title:source,titleUk:null,titleEn:null,editorialAttempts:6,editorialNextAttemptAt:new Date('2026-11-01T11:00:00Z')}
 ];
 assert.deepEqual(rows.map(r=>headlineDebtState(r,now).state),['eligible','cooldown','manual_review']);
 const totals=headlineDebtSummary(rows,now);
 assert.equal(totals.missingUk,3);assert.equal(totals.missingEn,3);
 assert.equal(totals.eligible,1);assert.equal(totals.cooldown,1);assert.equal(totals.manualReview,1);
});
test('No extra Azure calls, retry attempts or PostgreSQL usage for native English + already localized Ukrainian',async()=>{
 await scopedEnv(env,async()=>{
  const row={id:'ready',title:original,titleUk:validUk,titleEn:null,editorialAttempts:5,
   editorialNextAttemptAt:null,language:'en',summaryKind:'no_context',summaryUk:null,
   summary:null,feedDescription:null};
  const db={newsArticle:{findMany:async()=>[row],updateMany:async()=>{throw Error('Must not write completed record')}},
   newsTranslationUsage:{upsert:async()=>{throw Error('Must not reserve')},updateMany:async()=>{throw Error('Must not reserve')}}};
  const fake=async()=>{throw Error('No translation should be sent')};
  const result=await enrichPendingNews(db,fake);
  assert.equal(result.processed,0);
  assert.equal(result.reason,'queue_empty_headlines');
 });
});
test('A missing Ukrainian title is translated once; native English original is not unnecessarily duplicated',async()=>{
 await scopedEnv(env,async()=>{
  const row={id:'uk-pending',title:original,titleUk:null,titleEn:null,editorialAttempts:0,
   editorialNextAttemptAt:null,language:'en',summaryKind:'no_context',summaryUk:null,
   summary:null,feedDescription:null};
  const writes=[],meter={amount:0};
  const db={newsArticle:{findMany:async()=>[row],updateMany:async x=>{writes.push(x);return {count:1}}},
   newsTranslationUsage:{upsert:async()=>({}),updateMany:async x=>{meter.amount+=x.data.characters.increment;return {count:1}}}};
  let calls=0;
  const fake=async (url,opt)=>{
   calls++;
   assert.equal(new URL(url).searchParams.get('to'),'uk');
   return new Response(JSON.stringify([{translations:[{to:'uk',text:'Як читати натальну карту'}]}]),{status:200});
  };
  const result=await enrichPendingNews(db,fake);
  assert.equal(result.processed,1);assert.equal(calls,1);
  assert.equal(meter.amount,original.length);
  assert.equal(writes.length,1);
  assert.equal(writes[0].data.titleUk,validUk);
  assert.equal(writes[0].data.titleEn,undefined);
 });
});

test('External source cooldown is restored from newest persisted audit after API restart',()=>{
 const history=[
  {sourceKey:'gdelt-vedic-jyotish',status:'error',failure:'Error: HTTP 429',createdAt:'2026-11-01T11:30:00Z'},
  {sourceKey:'elephant-journal',status:'error',failure:'Error: HTTP 500',createdAt:'2026-11-01T11:40:00Z'},
  {sourceKey:'biddy-tarot',status:'cooldown',failure:'Retry after 2026-11-01T12:30:00.000Z',createdAt:'2026-11-01T11:50:00Z'},
  {sourceKey:'astro-podcast',status:'ok',failure:null,createdAt:'2026-11-01T11:52:00Z'},
  {sourceKey:'elephant-journal',status:'ok',failure:null,createdAt:'2026-11-01T10:00:00Z'},
 ];
 const r=sourceRetryStateFromHistory(history,Date.parse('2026-11-01T12:00:00Z'));
 assert.equal(r.gdeltRetryUntil,Date.parse('2026-11-01T12:30:00Z'));
 assert.equal(r.retryUntil.get('elephant-journal'),Date.parse('2026-11-01T12:25:00Z'));
 assert.equal(r.retryUntil.get('biddy-tarot'),Date.parse('2026-11-01T12:30:00Z'));
 assert.equal(r.retryUntil.has('astro-podcast'),false);
 assert.equal(sourceRetryStateFromHistory(history,Date.parse('2026-11-01T14:00:00Z')).retryUntil.size,0);
});
