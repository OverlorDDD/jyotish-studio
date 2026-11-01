import test from 'node:test';
import assert from 'node:assert/strict';
import {translateLocalizedTeaser,teaserNmtCharacterCost,validNewsTeaser,
 excerptSource,teaserNeedsWork,sourceTeaserForLocale,teaserLocaleReady} from '../apps/api/src/news-teaser-nmt.ts';
import {enrichPendingNews} from '../apps/api/src/news-editorial.ts';
const en='This source explains three Tarot spreads for thoughtful reflection, daily journaling and careful questions about personal decisions.';
const hi='कल इन 5 राशियों के दिन रहेंगे रोमांचक: ग्रहों की स्थिति और जीवन के छोटे निर्णयों पर विचार करने के तरीके बताए गए हैं।';
const env={NEWS_TRANSLATION_PROVIDER:'azure',AZURE_TRANSLATOR_KEY:'fake-not-secret',AZURE_TRANSLATOR_REGION:'eastus'};
const preserve=(url,opts)=>{
 const lang=new URL(url).searchParams.get('to');
 const body=JSON.parse(opts.body)[0].text;
 const digits=(body.match(/(?<![#\w])\d+/g)||[]);
 const payload=lang==='uk'?'Джерело пояснює, як інтерпретувати астрологічні події та практичні способи роздумів':
  'The source explains how to interpret astrological events and practical ways to reflect';
 const out=payload+(digits.length?' '+digits.join(' '):'');
 return new Response(JSON.stringify([{translations:[{to:lang,text:out}]}]),{status:200});
};
function scoped(values,fn){
 const before=Object.fromEntries(Object.keys(values).map(x=>[x,process.env[x]]));
 Object.assign(process.env,values);
 return Promise.resolve().then(fn).finally(()=>{for(const [key,value] of Object.entries(before)){
  if(value===undefined)delete process.env[key];else process.env[key]=value;
 }});
}
function dbOf(rows){
 const writes=[],meter={spent:0};
 return {writes,meter,
  newsArticle:{findMany:async()=>rows,updateMany:async x=>{writes.push(x);return {count:1}}},
  newsTranslationUsage:{upsert:async()=>({}),updateMany:async x=>{meter.spent+=x.data.characters.increment;return {count:1}}}};
}
const config={NEWS_TRANSLATION_ENABLED:'1',NEWS_TRANSLATION_CONTENT_SCOPE:'full',NEWS_TRANSLATION_QUALITY_APPROVED:'1',
 NEWS_TRANSLATION_PROVIDER:'azure',AZURE_TRANSLATOR_KEY:env.AZURE_TRANSLATOR_KEY,
 AZURE_TRANSLATOR_REGION:'eastus',NEWS_AZURE_MONTHLY_CHAR_LIMIT:'100000'};
const row=(title,description,lang)=>({id:'r1',title,titleUk:'Джерело повідомляє про астрологічні події',
 titleEn:null,feedDescription:description,summary:null,summaryUk:null,summaryEn:null,
 summaryKind:'needs_editorial',language:lang,editorialAttempts:0});
test('Source-only excerpts are bounded; no publisher facts => no invented content',()=>{
 const a=row('Tarot news',null,'en');
 assert.equal(excerptSource(a),'');
 assert.equal(teaserNeedsWork(a),false);
 assert.equal(teaserLocaleReady(a,'uk'),false);
 const long='The publisher describes the position of Mercury and Venus in the zodiac. '.repeat(10);
 assert.ok(excerptSource(row('headline',long,'en')).length<=280);
 assert.equal(sourceTeaserForLocale(en,'en','en'),en);
 assert.equal(sourceTeaserForLocale(en,'hi','en'),null);
 assert.equal(sourceTeaserForLocale(hi,'hi','en'),null);
});
test('Azure UK/EN teaser NMT with Hindi is language-safe and reserves planned character count',async()=>{
 const spy=[];
 const fetcher=async(url,opts)=>{
  spy.push({url,body:JSON.parse(opts.body)[0].text});
  const to=new URL(url).searchParams.get('to');
  const original=JSON.parse(opts.body)[0].text;
  assert.ok(url.startsWith('https://api.cognitive.microsofttranslator.com/translate?'));
  assert.ok(original.length<=500);
  return new Response(JSON.stringify([{translations:[{to,text:to==='uk'?
    'Цей матеріал розповідає про зміни для 5 знаків зодіаку та дає практичні поради читачам':
    'This article describes changes for 5 zodiac signs and gives practical advice to readers'}]}]),{status:200});
 };
 const uk=await translateLocalizedTeaser(hi,'uk',fetcher,env);
 const eng=await translateLocalizedTeaser(hi,'en',fetcher,env);
 assert.ok(validNewsTeaser(uk,'uk'));assert.ok(validNewsTeaser(eng,'en'));
 assert.equal(spy.length,2);
 assert.equal(teaserNmtCharacterCost(hi,'uk'),spy[0].body.length);
 assert.equal(teaserNmtCharacterCost(hi,'en'),spy[1].body.length);
});
test('Never accept missing numbers, Devanagari, HTML or wrong-script teasers',async()=>{
 for(const text of ['Це опис новини без числа','कल इन 5 राशियों','<script>alert(5)</script>']){
  const fake=async url=>new Response(JSON.stringify([{translations:[{
   to:new URL(url).searchParams.get('to'),text}]}]),{status:200});
  await assert.rejects(()=>translateLocalizedTeaser(hi,'uk',fake,env));
 }
 assert.equal(validNewsTeaser('Headline हर चीज़ गलत है','en'),false);
 assert.equal(validNewsTeaser('Описове речення тільки латиницею','en'),false);
});
test('Full bilingual workflow saves grounded UK+EN while keeping publisher text and URLs untouched',async()=>{
 await scoped(config,async()=>{
  const a=row('Kal Ka Rashifal',hi,'hi');
  const db=dbOf([a]);
  const out=await enrichPendingNews(db,async(url,opts)=>{
   const to=new URL(url).searchParams.get('to');
   const source=JSON.parse(opts.body)[0].text;
   const num=source.includes('5')?' 5':'';
   const isTitle=source.length<45;
   const text=to==='uk'?(isTitle?'Гороскоп на завтра':'Це короткий опис від індійського джерела для читачів')+num:
    (isTitle?'Horoscope for tomorrow':'This is a short description provided by the original Indian publisher for readers')+num;
   return new Response(JSON.stringify([{translations:[{to,text}]}]),{status:200});
  });
  assert.equal(out.attempted,1);assert.equal(out.processed,1);
  assert.equal(db.writes.length,1);
  const changes=db.writes[0].data;
  assert.ok(validNewsTeaser(changes.summaryUk,'uk'));
  assert.ok(validNewsTeaser(changes.summaryEn,'en'));
  assert.equal(changes.title,undefined);assert.equal(changes.url,undefined);
  assert.ok(db.meter.spent>=teaserNmtCharacterCost(hi,'uk')+teaserNmtCharacterCost(hi,'en'));
 });
});
test('Native EN publisher excerpt is reused without charged translation; UK only requires Azure',async()=>{
 await scoped(config,async()=>{
  const a=row('Tarot and yoga insights',en,'en');a.titleUk='Поради щодо Таро та йоги';
  const db=dbOf([a]);let calls=[];
  const out=await enrichPendingNews(db,async(url,opts)=>{
   calls.push(url);
   return new Response(JSON.stringify([{translations:[{to:'uk',text:
    'Джерело пояснює три розклади Таро для щоденних роздумів та уважного прийняття рішень'}]}]),{status:200});
  });
  assert.equal(out.processed,1);assert.equal(calls.length,1);
  assert.ok(calls[0].includes('to=uk'));
  assert.equal(db.meter.spent,teaserNmtCharacterCost(excerptSource(a),'uk'));
  assert.equal(db.writes[0].data.summaryEn,undefined,'original English source is used by UI without a redundant translated field');
 });
});
test('No publisher context: translate missing titles, but never generate a teaser',async()=>{
 await scoped(config,async()=>{
  const a=row('Moon reading in 2026',null,'en');a.titleUk=null;
  const db=dbOf([a]);
  const out=await enrichPendingNews(db,async url=>
   new Response(JSON.stringify([{translations:[{to:new URL(url).searchParams.get('to'),
    text:'Місяць у гороскопі у 2026 році'}]}]),{status:200}));
  assert.equal(out.processed,1);
  assert.equal(db.writes[0].data.summaryUk,undefined);
  assert.equal(db.writes[0].data.summaryEn,undefined);
 });
});
test('Unapproved full-scope gate blocks before network, writes or metering',async()=>{
 await scoped({...config,NEWS_TRANSLATION_QUALITY_APPROVED:'0'},async()=>{
  let count=0;
  const db={newsArticle:{findMany:async()=>{count++;return[]}},newsTranslationUsage:{upsert:async()=>{count++}}};
  const out=await enrichPendingNews(db,async()=>{count++;throw Error('Forbidden')});
  assert.equal(out.reason,'translation_quality_not_approved');assert.equal(count,0);
 });
});

test('Shared PostgreSQL lease prevents concurrent full-mode Azure billing and DB writes',async()=>{
 await scoped(config,async()=>{
  const stored=dbOf([row('Tarot introduction',en,'en')]);
  const calls=[];
  const db={...stored,newsIngestionLease:{
   upsert:async()=>({}),
   updateMany:async args=>{calls.push(args);return {count:0}}
  }};
  const result=await enrichPendingNews(db,async()=>{throw Error('Should not call Azure')});
  assert.equal(result.reason,'translation_lease_held');
  assert.equal(stored.writes.length,0);assert.equal(stored.meter.spent,0);
  assert.equal(calls.length,1);
 });
});
