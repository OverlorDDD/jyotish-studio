import test from 'node:test';
import assert from 'node:assert/strict';
import {headlineScriptSegments,headlineEditorialWarnings,hasDevanagari,isLocalizedNewsTitle,publicTitleForLocale} from '../apps/api/src/news-localization.ts';
import {translateLocalizedHeadline} from '../apps/api/src/news-translation.ts';
import {enrichPendingNews} from '../apps/api/src/news-editorial.ts';
const source='Kal Ka Rashifal 26 अक्टूबर: कल इन 5 राशियों के दिन रहेंगे रोमांचक';

test('mixed English/Hindi headline is never considered localized in either feed',()=>{
 assert.equal(hasDevanagari(source),true);
 const segments=headlineScriptSegments(source);
 assert.ok(segments.length>=2);
 assert.equal(segments.join(' ').includes('अक्टूबर'),true);
 assert.equal(isLocalizedNewsTitle('Астрологія Шарад Пурніма: कल इन 5 राशियों','uk'),false);
 assert.equal(isLocalizedNewsTitle('Kal Ka Rashifal 26 жовтня 2026 року','uk'),false);
 assert.equal(publicTitleForLocale({title:source,titleUk:source},'en'),null);
 assert.equal(publicTitleForLocale({title:source,titleUk:source},'uk'),null);
 assert.equal(publicTitleForLocale({title:'Yoga breathing for beginners'},'en'),'Yoga breathing for beginners');
});
test('Azure automatically identifies mixed script portions for both target languages',async()=>{
 const env={NEWS_TRANSLATION_PROVIDER:'azure',AZURE_TRANSLATOR_KEY:'not-real',AZURE_TRANSLATOR_REGION:'eastus'};
 const calls=[];
 const fake=async (url,options)=>{
  const target=new URL(url).searchParams.get('to');
  assert.equal(new URL(url).searchParams.has('from'),false);
  const body=JSON.parse(options.body)[0].text;
  calls.push({target,body});
  const isHindi=hasDevanagari(body);
  const text=target==='uk'?(isHindi?'жовтня: п’ять знаків матимуть захопливий день':'Гороскоп на завтра, 26'):
   (isHindi?'October: five zodiac signs will have an exciting day':'Tomorrow horoscope for 26');
  return new Response(JSON.stringify([{detectedLanguage:{language:isHindi?'hi':'en',score:0.9},
   translations:[{to:target,text}]}]),{status:200});
 };
 const original='Kal Ka Rashifal 26 अक्टूबर: कल इन 5 राशियों के दिन रहेंगे रोमांचक';
 // This sample has both numeric 26 and 5; retain all numeric facts in each target.
 const localized=async(target)=>{
  let n=0;
  const preserving=async (url,options)=>{
   const lang=new URL(url).searchParams.get('to');
   const input=JSON.parse(options.body)[0].text;
   const hindi=hasDevanagari(input);
   const output=lang==='uk'?hindi?'жовтня: 5 знаків матимуть захопливий день':'Гороскоп на завтра 26':
    hindi?'October: 5 signs will have an exciting day':'Tomorrow horoscope 26';
   n++;
   return new Response(JSON.stringify([{translations:[{to:lang,text:output}]}]),{status:200});
  };
  const title=await translateLocalizedHeadline(original,target,preserving,env);
  assert.equal(hasDevanagari(title),false);
  assert.match(title,target==='uk'?/знаків/:/signs/);
  assert.match(title,/26/);assert.match(title,/5/);
  assert.ok(n>=2);
 };
 await localized('uk');
 await localized('en');
});
test('publication guard rejects partial Devanagari even when Azure says successful',async()=>{
 const env={NEWS_TRANSLATION_PROVIDER:'azure',AZURE_TRANSLATOR_KEY:'not-real',AZURE_TRANSLATOR_REGION:'eastus'};
 await assert.rejects(
  ()=>translateLocalizedHeadline('कल राशिफल','en',
   async()=>new Response(JSON.stringify([{translations:[{to:'en',text:'Horoscope कल'}]}])),env),
  /Untranslated script/);
});
test('mixed-language old title is reprocessed and does not overwrite existing source',async()=>{
 const keys=['NEWS_TRANSLATION_ENABLED','NEWS_TRANSLATION_CONTENT_SCOPE','NEWS_TRANSLATION_HEADLINES_APPROVED',
 'NEWS_TRANSLATION_PROVIDER','AZURE_TRANSLATOR_KEY','AZURE_TRANSLATOR_REGION'];
 const prev=keys.map(k=>process.env[k]);
 const record={id:'hindi-1',title:'कल राशिफल',titleUk:'Гороскоп कल',
  titleEn:null,language:'hi',feedDescription:null,summary:null,summaryUk:null,
  summaryKind:'no_context',editorialAttempts:1};
 const updates=[];
 const db={newsArticle:{findMany:async()=>[record],updateMany:async x=>{updates.push(x);return {count:1}}},
  newsTranslationUsage:{upsert:async()=>({}),updateMany:async()=>({count:1})}};
 try{
  Object.assign(process.env,{NEWS_TRANSLATION_ENABLED:'1',NEWS_TRANSLATION_CONTENT_SCOPE:'headlines',
   NEWS_TRANSLATION_HEADLINES_APPROVED:'1',NEWS_TRANSLATION_PROVIDER:'azure',
   AZURE_TRANSLATOR_KEY:'not-real',AZURE_TRANSLATOR_REGION:'eastus'});
  const fake=async (url,opts)=>{
   const lang=new URL(url).searchParams.get('to');
   return new Response(JSON.stringify([{translations:[{to:lang,
    text:lang==='uk'?'Гороскоп на завтра':'Tomorrow horoscope'}]}]),{status:200});
  };
  const out=await enrichPendingNews(db,fake);
  assert.equal(out.processed,1);
  assert.equal(updates.length,1);
  assert.equal(updates[0].data.titleUk,'Гороскоп на завтра');
  assert.equal(updates[0].data.titleEn,'Tomorrow horoscope');
  assert.equal(updates[0].data.summaryUk,undefined);
  assert.equal(updates[0].data.title,undefined);
 }finally{keys.forEach((k,i)=>prev[i]===undefined?delete process.env[k]:process.env[k]=prev[i]);}
});


test('known wrong month case and literal lunar phrases fail closed in both locale feeds',async()=>{
 const badUk='Гороскоп завтрашнього дня 26 Жовтень: захопливий день для 5 знаків';
 const badMoonUk='Астрологія Шарад Пурніма: повний плід місяця';
 const badMoonEn='Astrology Sharad Purnima: the full fruit of the moon';
 assert.ok(headlineEditorialWarnings(badUk,'uk').length);
 assert.ok(headlineEditorialWarnings(badMoonUk,'uk').length);
 assert.ok(headlineEditorialWarnings(badMoonEn,'en').length);
 assert.equal(isLocalizedNewsTitle(badUk,'uk'),false);
 assert.equal(isLocalizedNewsTitle(badMoonUk,'uk'),false);
 assert.equal(isLocalizedNewsTitle(badMoonEn,'en'),false);
 assert.equal(publicTitleForLocale({title:'कल राशिफल',titleUk:badUk},'uk'),null);
 assert.equal(publicTitleForLocale({title:'कल राशिफल',titleEn:badMoonEn},'en'),null);
 assert.equal(isLocalizedNewsTitle('Гороскоп на 26 жовтня: 5 знаків','uk'),true);
 assert.equal(isLocalizedNewsTitle('October 26 horoscope: five zodiac signs','en'),true);
 const env={NEWS_TRANSLATION_PROVIDER:'azure',AZURE_TRANSLATOR_KEY:'not-real',AZURE_TRANSLATOR_REGION:'eastus'};
 await assert.rejects(
   ()=>translateLocalizedHeadline('Horoscope for October 26, 2026','uk',
     async()=>new Response(JSON.stringify([{translations:[{
       to:'uk',text:'Гороскоп 26 Жовтень 2026'
     }]}]),{status:200}),env),
   /Incomplete uk localization/
 );
});
