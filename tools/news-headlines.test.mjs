import test from 'node:test';
import assert from 'node:assert/strict';
import {newsTranslationScope,newsScopeApproved,translateNewsText} from '../apps/api/src/news-translation.ts';
import {enrichPendingNews} from '../apps/api/src/news-editorial.ts';

function envSet(next,fn){
 const prev=Object.fromEntries(Object.keys(next).map(k=>[k,process.env[k]]));
 Object.entries(next).forEach(([k,v])=>v===null?delete process.env[k]:process.env[k]=String(v));
 return Promise.resolve().then(fn).finally(()=>{
  Object.entries(prev).forEach(([k,v])=>v===undefined?delete process.env[k]:process.env[k]=v);
 });
}
test('headlines are the safe default; general summary signoff cannot authorize headlines',()=>{
 assert.equal(newsTranslationScope({}), 'headlines');
 assert.equal(newsTranslationScope({NEWS_TRANSLATION_CONTENT_SCOPE:'full'}),'full');
 assert.throws(()=>newsTranslationScope({NEWS_TRANSLATION_CONTENT_SCOPE:'all'}),/CONTENT_SCOPE/);
 assert.equal(newsScopeApproved({NEWS_TRANSLATION_QUALITY_APPROVED:'1'}),false);
 assert.equal(newsScopeApproved({NEWS_TRANSLATION_HEADLINES_APPROVED:'1'}),true);
 assert.equal(newsScopeApproved({NEWS_TRANSLATION_CONTENT_SCOPE:'full',NEWS_TRANSLATION_HEADLINES_APPROVED:'1'}),false);
});

test('source-grounded terminology repairs fix reported Azure failures without changing brands',async()=>{
 const env={NEWS_TRANSLATION_PROVIDER:'azure',AZURE_TRANSLATOR_KEY:'fake-ci-key',
  AZURE_TRANSLATOR_REGION:'eastus'};
 const examples=[
  ['Three Tarot spreads for daily reflection','Три розвороти Таро для щоденних роздумів',/Три розклади Таро/],
  ['Mercury entered Scorpio in 2026','Mercury увійшов у Скорпіон у 2026 році',/Меркурій увійшов/],
  ['A yoga instructor explains gentle morning breathing exercises','Інструктор йога пояснює ніжні ранкові дихальні вправи',/Інструктор із йоги пояснює м’які/]
 ];
 for(const [source,rough,expected] of examples){
  const fake=async()=>new Response(JSON.stringify([{translations:[{to:'uk',text:rough}]}]),{status:200});
  const translated=await translateNewsText(source,fake,env);
  assert.match(translated,expected);
 }
 const brand=await translateNewsText('Mercury Records announces a new album',
  async()=>new Response(JSON.stringify([{translations:[{to:'uk',text:'Mercury Records оголошує новий альбом'}]}])),env);
 assert.match(brand,/^Mercury Records/);
});

test('explicit headline approval publishes only title, charges title characters, never touches teaser',async()=>{
 await envSet({
  NEWS_TRANSLATION_ENABLED:'1',NEWS_TRANSLATION_CONTENT_SCOPE:'headlines',
  NEWS_TRANSLATION_HEADLINES_APPROVED:'1',NEWS_TRANSLATION_QUALITY_APPROVED:'0',
  NEWS_TRANSLATION_PROVIDER:'azure',AZURE_TRANSLATOR_KEY:'fake-ci-key',
  AZURE_TRANSLATOR_REGION:'eastus',NEWS_AZURE_MONTHLY_CHAR_LIMIT:'1000'
 },async()=>{
  const title='Mercury entered Scorpio in 2026';
  const row={id:'a',title,titleUk:null,summaryUk:null,
   feedDescription:'The original source explains the astrological transit and its position in zodiac signs.',
   summary:null,summaryKind:'needs_editorial',editorialAttempts:0,language:'en'};
  let totalCalls=0;const writes=[],meter={characters:0};
  const db={
   newsArticle:{findMany:async x=>{assert.ok(x.where.AND[1].OR.every(v=>Object.hasOwn(v,'titleUk')));return [row]},
    updateMany:async x=>{writes.push(x);return {count:1}}},
   newsTranslationUsage:{
    upsert:async()=>({}),
    updateMany:async x=>{meter.characters+=x.data.characters.increment;return {count:1}}
   }
  };
  const fake=async (url,opt)=>{
   totalCalls++;
   assert.match(url,/cognitive\.microsofttranslator\.com/);
   assert.equal(JSON.parse(opt.body)[0].text,title);
   return new Response(JSON.stringify([{translations:[{to:'uk',text:'Mercury увійшов у Скорпіон у 2026 році'}]}]),{status:200});
  };
  const out=await enrichPendingNews(db,fake);
  assert.equal(out.scope,'headlines');
  assert.equal(out.processed,1);
  assert.equal(totalCalls,1);
  assert.equal(meter.characters,title.length);
  assert.equal(writes.length,1);
  assert.equal(writes[0].data.titleUk,'Меркурій увійшов у Скорпіон у 2026 році');
  assert.equal(writes[0].data.summaryUk,undefined);
  assert.equal(writes[0].data.summaryKind,undefined);
 });
});
test('headline approval disabled means zero network, zero DB and zero budget',async()=>{
 await envSet({
  NEWS_TRANSLATION_ENABLED:'1',NEWS_TRANSLATION_CONTENT_SCOPE:'headlines',
  NEWS_TRANSLATION_HEADLINES_APPROVED:'0',NEWS_TRANSLATION_QUALITY_APPROVED:'1'
 },async()=>{
  const no=async()=>{throw Error('Forbidden operation');};
  const result=await enrichPendingNews({newsArticle:{findMany:no},newsTranslationUsage:{upsert:no}},no);
  assert.equal(result.reason,'translation_quality_not_approved');
  assert.equal(result.scope,'headlines');
 });
});
