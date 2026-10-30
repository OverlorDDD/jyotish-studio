import test from 'node:test';
import assert from 'node:assert/strict';
import {azureNewsMonthlyCharLimit,utcTranslationPeriod,reserveAzureNewsCharacters,NewsTranslationBudgetExceeded}
 from '../apps/api/src/news-translation-budget.ts';
import {enrichPendingNews} from '../apps/api/src/news-editorial.ts';

function mockMeter(){
 const rows=new Map();
 return {rows,newsTranslationUsage:{
  upsert:async ({where,create})=>{
   if(!rows.has(where.period))rows.set(where.period,{...create});
   return rows.get(where.period);
  },
  updateMany:async ({where,data})=>{
   const row=rows.get(where.period);
   if(!row||row.characters>where.characters.lte)return {count:0};
   row.characters+=data.characters.increment;
   return {count:1};
  }
 }};
}

test('F0-safe default, strict operator range and UTC month rollover',()=>{
 assert.equal(azureNewsMonthlyCharLimit({}),100000);
 assert.equal(azureNewsMonthlyCharLimit({NEWS_AZURE_MONTHLY_CHAR_LIMIT:'150000'}),150000);
 assert.throws(()=>azureNewsMonthlyCharLimit({NEWS_AZURE_MONTHLY_CHAR_LIMIT:'2000000'}),/between/);
 assert.throws(()=>azureNewsMonthlyCharLimit({NEWS_AZURE_MONTHLY_CHAR_LIMIT:'abc'}),/integer/);
 assert.equal(utcTranslationPeriod(new Date('2026-10-31T23:59:59Z')),'2026-10');
 assert.equal(utcTranslationPeriod(new Date('2026-11-01T00:00:00Z')),'2026-11');
});

test('Azure usage reservation persists and atomically blocks before threshold',async()=>{
 const db=mockMeter(),now=new Date('2026-10-30T10:10:00Z');
 const env={NEWS_AZURE_MONTHLY_CHAR_LIMIT:'10'};
 await reserveAzureNewsCharacters(db,6,now,env);
 await reserveAzureNewsCharacters(db,4,now,env);
 assert.equal(db.rows.get('2026-10').characters,10);
 await assert.rejects(()=>reserveAzureNewsCharacters(db,1,now,env),NewsTranslationBudgetExceeded);
 await reserveAzureNewsCharacters(db,8,new Date('2026-11-01T00:00:00Z'),env);
 assert.equal(db.rows.get('2026-11').characters,8);
});

test('Azure budget blocks news ingest before API traffic and article mutations',async()=>{
 const keys=['NEWS_TRANSLATION_ENABLED','NEWS_TRANSLATION_PROVIDER','NEWS_TRANSLATION_QUALITY_APPROVED',
  'AZURE_TRANSLATOR_KEY','AZURE_TRANSLATOR_REGION','NEWS_AZURE_MONTHLY_CHAR_LIMIT','NEWS_TRANSLATION_CONTENT_SCOPE'];
 const previous=keys.map(k=>process.env[k]);
 const entries=[{id:'one',title:'Mercury enters Scorpio in 2026',
  titleUk:null,summaryUk:null,feedDescription:null,summary:null,
  summaryKind:'no_context',editorialAttempts:0,language:'en'}];
 let network=0,writes=0;
 const db={
  ...mockMeter(),
  newsArticle:{
   findMany:async()=>entries,
   updateMany:async()=>{writes++;return {count:1}}
  }
 };
 try{
  Object.assign(process.env,{
   NEWS_TRANSLATION_ENABLED:'1',NEWS_TRANSLATION_PROVIDER:'azure',
   NEWS_TRANSLATION_QUALITY_APPROVED:'1',NEWS_TRANSLATION_CONTENT_SCOPE:'full',
   AZURE_TRANSLATOR_KEY:'fake-test-key',AZURE_TRANSLATOR_REGION:'westeurope',
   NEWS_AZURE_MONTHLY_CHAR_LIMIT:'2'
  });
  const out=await enrichPendingNews(db,async()=>{network++;throw Error('should not reach provider')});
  assert.equal(out.reason,'azure_monthly_budget_exhausted');
  assert.equal(network,0);
  assert.equal(writes,0);
 }finally{
  keys.forEach((k,i)=>previous[i]===undefined?delete process.env[k]:process.env[k]=previous[i]);
 }
});

test('Without human quality sign-off no Azure reservation is created',async()=>{
 const keys=['NEWS_TRANSLATION_ENABLED','NEWS_TRANSLATION_PROVIDER','NEWS_TRANSLATION_QUALITY_APPROVED'];
 const previous=keys.map(k=>process.env[k]),db=mockMeter();
 try{
  Object.assign(process.env,{NEWS_TRANSLATION_ENABLED:'1',NEWS_TRANSLATION_PROVIDER:'azure',
   NEWS_TRANSLATION_QUALITY_APPROVED:'0'});
  const out=await enrichPendingNews(db,async()=>{throw Error('network request not allowed')});
  assert.equal(out.reason,'translation_quality_not_approved');
  assert.equal(db.rows.size,0);
 }finally{keys.forEach((k,i)=>previous[i]===undefined?delete process.env[k]:process.env[k]=previous[i]);}
});

test('Approved Azure batch reserves the actual headline length, then stores its Ukrainian translation',async()=>{
 const keys=['NEWS_TRANSLATION_ENABLED','NEWS_TRANSLATION_PROVIDER','NEWS_TRANSLATION_QUALITY_APPROVED',
  'AZURE_TRANSLATOR_KEY','AZURE_TRANSLATOR_REGION','NEWS_AZURE_MONTHLY_CHAR_LIMIT','NEWS_TRANSLATION_CONTENT_SCOPE'];
 const previous=keys.map(k=>process.env[k]);
 const headline='Mercury enters Scorpio in 2026';
 const row={id:'azure-one',title:headline,titleUk:null,summaryUk:null,
  feedDescription:null,summary:null,summaryKind:'no_context',editorialAttempts:0,language:'en'};
 const meter=mockMeter(),writes=[];
 const db={...meter,newsArticle:{
  findMany:async()=>[row],
  updateMany:async args=>{writes.push(args);return {count:1}}
 }};
 let calls=0;
 const fetcher=async (url,options)=>{
  calls++;
  assert.equal(url,'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=uk');
  assert.equal(options.headers['Ocp-Apim-Subscription-Key'],'fake-test-key');
  assert.equal(JSON.parse(options.body)[0].text,headline);
  return new Response(JSON.stringify([{translations:[{to:'uk',text:'Меркурій увійшов у Скорпіон у 2026 році'}]}]),{status:200});
 };
 try{
  Object.assign(process.env,{NEWS_TRANSLATION_ENABLED:'1',NEWS_TRANSLATION_PROVIDER:'azure',
   NEWS_TRANSLATION_QUALITY_APPROVED:'1',NEWS_TRANSLATION_CONTENT_SCOPE:'full',AZURE_TRANSLATOR_KEY:'fake-test-key',
   AZURE_TRANSLATOR_REGION:'westeurope',NEWS_AZURE_MONTHLY_CHAR_LIMIT:'1000'});
  const out=await enrichPendingNews(db,fetcher);
  assert.equal(out.processed,1);
  assert.equal(out.engine,'azure_nmt_only');
  assert.equal(calls,1);
  assert.equal(writes.length,1);
  assert.match(writes[0].data.titleUk,/Скорпіон/);
  assert.equal(meter.rows.get(utcTranslationPeriod()).characters,headline.length);
 }finally{
  keys.forEach((k,i)=>previous[i]===undefined?delete process.env[k]:process.env[k]=previous[i]);
 }
});
