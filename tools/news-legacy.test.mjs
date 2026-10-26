import test from 'node:test';
import assert from 'node:assert/strict';
import {enrichPendingNews} from '../apps/api/src/news-editorial.ts';
const rows=[
 {id:'older',title:'Tarot and the symbolism of the Major Arcana',titleUk:null,
  feedDescription:null,summary:null,summaryKind:'needs_editorial',language:'en',editorialAttempts:0},
 {id:'context',title:'Vedic astrology and the Moon in natal charts',titleUk:null,
  feedDescription:'The guide explains lunar placements in Vedic natal charts and how traditional interpretation varies with the house position.',
  summary:null,summaryKind:'needs_editorial',language:'en',editorialAttempts:1}
];
test('legacy records receive translations oldest-first and no fabricated teaser without source facts',async()=>{
 const saved=[process.env.GROQ_API_KEY,process.env.GEMINI_API_KEY,process.env.OPENROUTER_API_KEY,process.env.NEWS_EDITORIAL_AI_ENABLED];
 process.env.GROQ_API_KEY='dummy-ci';delete process.env.GEMINI_API_KEY;delete process.env.OPENROUTER_API_KEY;
 process.env.NEWS_EDITORIAL_AI_ENABLED='1';
 const writes=[];let select;
 const db={newsArticle:{
  findMany:async args=>{select=args;return rows;},
  updateMany:async args=>{writes.push(args);return {count:1};}
 }};
 const mock=async()=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify([
  {id:'older',titleUk:'Таро та символіка Старших арканів',summaryUk:'Вигаданий факт',summaryEn:'Invented text'},
  {id:'context',titleUk:'Ведична астрологія та Місяць у натальній карті',
   summaryUk:'У посібнику розглянуто положення Місяця та традиційне трактування його дому в натальній карті.',
   summaryEn:'An overview of lunar placements and traditional house interpretations in Vedic natal charts.'}
 ])}}]}),{status:200});
 try{
  const out=await enrichPendingNews(db,mock);
  assert.equal(out.processed,2);
  assert.equal(select.orderBy[0].discoveredAt,'asc');
  assert.equal(writes[0].data.titleUk,'Таро та символіка Старших арканів');
  assert.equal(writes[0].data.summaryKind,'no_context');
  assert.equal(writes[0].data.summaryUk,undefined);
  assert.equal(writes[1].data.summaryKind,'ai_editorial');
  assert.match(writes[1].data.summaryUk,/Місяця/);
  assert.equal(writes[0].data.editorialNextAttemptAt,null);
 }finally{
  for(const [key,value] of ['GROQ_API_KEY','GEMINI_API_KEY','OPENROUTER_API_KEY','NEWS_EDITORIAL_AI_ENABLED'].map((k,i)=>[k,saved[i]])){
   if(value===undefined)delete process.env[key];else process.env[key]=value;
  }
 }
});
test('editorial queue does not retry the same failed legacy record immediately',async()=>{
 const old=process.env.GROQ_API_KEY;process.env.GROQ_API_KEY='dummy-ci';
 const writes=[];
 try{
  const db={newsArticle:{findMany:async()=>[rows[0]],updateMany:async x=>{writes.push(x);return {count:1};}}};
  const result=await enrichPendingNews(db,async()=>new Response('{"choices":[]}',{status:200}));
  assert.equal(result.failed,1);
  assert.equal(writes[0].data.editorialAttempts,1);
  assert.ok(writes[0].data.editorialNextAttemptAt.getTime()>Date.now());
 }finally{if(old===undefined)delete process.env.GROQ_API_KEY;else process.env.GROQ_API_KEY=old;}
});
test('archive repair command is available without a running database when asking for help',async()=>{
 const {spawnSync}=await import('node:child_process');
 const x=spawnSync(process.execPath,['--experimental-strip-types','tools/news-repair.mjs','--help'],{encoding:'utf8'});
 assert.equal(x.status,0,x.stderr);
 assert.match(x.stdout,/news:repair/);
});
