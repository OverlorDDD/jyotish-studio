import test from 'node:test';
import assert from 'node:assert/strict';
import {enrichPendingNews} from '../apps/api/src/news-editorial.ts';
const rows=[
 {id:'older',title:'Tarot and the symbolism of the Major Arcana',titleUk:null,summaryUk:null,
  feedDescription:null,summary:null,summaryKind:'needs_editorial',language:'en',editorialAttempts:0},
 {id:'context',title:'Vedic astrology and the Moon in natal charts',titleUk:null,summaryUk:null,
  feedDescription:'The guide explains lunar placements in Vedic natal charts and how traditional interpretation varies with the house position.',
  summary:null,summaryKind:'needs_editorial',language:'en',editorialAttempts:1}
];
const mock=async(url,opts)=>{
 if(String(url).endsWith('/languages'))return new Response(JSON.stringify([{code:'en',targets:['uk']}]),{status:200});
 assert.ok(String(url).endsWith('/translate'));
 assert.equal(opts.method,'POST');
 const payload=JSON.parse(opts.body);
 assert.equal(payload.source,'en');assert.equal(payload.target,'uk');
 const output=payload.q.startsWith('Tarot')?'Таро та символіка старших арканів':
  payload.q.startsWith('Vedic')?'Ведична астрологія та Місяць у натальних картах':
  'Посібник пояснює положення Місяця в натальних картах Джйотіш і традиційне трактування його положення.';
 return new Response(JSON.stringify({translatedText:output}),{status:200});
};
test('legacy news translated oldest-first without a generated teaser for title-only records',async()=>{
 const old=process.env.NEWS_TRANSLATION_ENABLED,approved=process.env.NEWS_TRANSLATION_QUALITY_APPROVED;
 delete process.env.NEWS_TRANSLATION_ENABLED;
 process.env.NEWS_TRANSLATION_QUALITY_APPROVED='1';
 let select;const writes=[];
 const db={newsArticle:{findMany:async args=>{select=args;return rows;},
  updateMany:async args=>{writes.push(args);return {count:1};}}};
 try{
  const out=await enrichPendingNews(db,mock);
  assert.equal(out.processed,2);
  assert.equal(out.engine,'local_nmt_only');
  assert.equal(select.orderBy[0].discoveredAt,'asc');
  assert.match(writes[0].data.titleUk,/Таро/);
  assert.equal(writes[0].data.summaryKind,'no_context');
  assert.equal(writes[0].data.summaryUk,undefined);
  assert.equal(writes[1].data.summaryKind,'machine_translated_excerpt');
  assert.match(writes[1].data.summaryUk,/Місяця/);
  assert.equal(writes[0].data.editorialNextAttemptAt,null);
 }finally{
  if(old===undefined)delete process.env.NEWS_TRANSLATION_ENABLED;else process.env.NEWS_TRANSLATION_ENABLED=old;
  if(approved===undefined)delete process.env.NEWS_TRANSLATION_QUALITY_APPROVED;else process.env.NEWS_TRANSLATION_QUALITY_APPROVED=approved;
 }
});
test('unapproved translation is blocked before any database writes or network requests',async()=>{
 const previous=process.env.NEWS_TRANSLATION_QUALITY_APPROVED;
 delete process.env.NEWS_TRANSLATION_QUALITY_APPROVED;
 let calls=0;
 try{
  const db={newsArticle:{findMany:async()=>{calls++;return rows;},
    updateMany:async()=>{calls++;return {count:1};}}};
  const result=await enrichPendingNews(db,async()=>{calls++;throw Error('must not run')});
  assert.equal(result.reason,'translation_quality_not_approved');
  assert.equal(calls,0);
 }finally{
  if(previous===undefined)delete process.env.NEWS_TRANSLATION_QUALITY_APPROVED;
  else process.env.NEWS_TRANSLATION_QUALITY_APPROVED=previous;
 }
});
test('local NMT outage never burns retry budget and never calls a cloud fallback',async()=>{
 const previous=process.env.NEWS_TRANSLATION_QUALITY_APPROVED;
 process.env.NEWS_TRANSLATION_QUALITY_APPROVED='1';
 const writes=[];const calls=[];
 const db={newsArticle:{findMany:async()=>[rows[0]],updateMany:async arg=>{writes.push(arg);return {count:1};}}};
 const fail=async url=>{calls.push(String(url));throw Error('offline');};
 const out=await enrichPendingNews(db,fail);
 assert.equal(out.reason,'local_translator_unavailable');
 assert.equal(writes.length,0,'Do not mark articles failed while translator is offline');
 assert.ok(calls.every(u=>u.startsWith('http://127.0.0.1:5100/')));
 if(previous===undefined)delete process.env.NEWS_TRANSLATION_QUALITY_APPROVED;
 else process.env.NEWS_TRANSLATION_QUALITY_APPROVED=previous;
});
test('news archive help is available without a database or translator',async()=>{
 const {spawnSync}=await import('node:child_process');
 const result=spawnSync(process.execPath,['--experimental-strip-types','tools/news-repair.mjs','--help'],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 assert.match(result.stdout,/news:repair/);
 assert.doesNotMatch(result.stdout,/editorial provider/);
});
