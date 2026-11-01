import test from 'node:test';
import assert from 'node:assert/strict';
import {headlineNmtPlan,headlineNmtBudgetCharacters,sourceNumbers,
 unwrapAzureHeadline,correctKnownHindiIdiom} from '../apps/api/src/news-headline-nmt-plan.ts';
import {translateLocalizedHeadline} from '../apps/api/src/news-translation.ts';
const mixed='Kal Ka Rashifal 26 अक्टूबर: कल इन 5 राशियों के दिन रहेंगे रोमांचक';
const pure='ज्योतिष शरद पूर्णिमा: क्या आपकी कुंडली का ग्रह भाव बदल देता है चंद्रमा का पूरा फल';
const env={NEWS_TRANSLATION_PROVIDER:'azure',AZURE_TRANSLATOR_KEY:'test-not-secret',AZURE_TRANSLATOR_REGION:'eastus'};

test('Mixed script plan retains real Hindi clause, replaces known Roman Hindi phrase and protects numeric facts',()=>{
 const units=headlineNmtPlan(mixed,'uk');
 assert.equal(units.length,2);
 assert.equal(units[0].from,'en');
 assert.equal(units[1].from,'hi');
 assert.match(units[0].text,/Horoscope for tomorrow/);
 assert.doesNotMatch(units[0].text,/<span class="notranslate">39<\/span>/);
 assert.equal(headlineNmtPlan('Today\'s horoscope 26 अक्टूबर','uk')[0].text.includes('<span class="notranslate">39</span>'),false);
 assert.match(units[0].text,/<span class="notranslate">26<\/span>/);
 assert.match(units[1].text,/<span class="notranslate">5<\/span>/);
 assert.equal(units[0].textType,'html');
 assert.equal(units[1].textType,'html');
 assert.equal(headlineNmtBudgetCharacters(mixed,'uk'),units.reduce((n,x)=>n+x.text.length,0));
 assert.ok(headlineNmtBudgetCharacters(mixed,'uk')>mixed.length);
 assert.deepEqual(sourceNumbers('26 अक्टूबर ५ राशियों'),['26','5']);
 assert.equal(headlineNmtPlan(pure,'uk')[0].from,'hi');
});

test('Both locales recover mixed Hindi/Latin title and preserve every source number using Azure HTML spans',async()=>{
 const calls=[];
 const fetcher=async(url,opt)=>{
  const query=new URL(url).searchParams;
  const lang=query.get('to'),from=query.get('from');
  const body=JSON.parse(opt.body)[0].text;
  calls.push({lang,from,body,textType:query.get('textType')});
  const isHi=from==='hi';
  const output=isHi?
   (lang==='uk'?'<div>жовтня: завтра ці <span class="notranslate">5</span> знаків матимуть захопливий день</div>':
    '<div>October: tomorrow these <span class="notranslate">5</span> signs will have an exciting day</div>'):
   (lang==='uk'?'<div>Гороскоп на завтра <span class="notranslate">26</span></div>':
    '<div>Tomorrow horoscope <span class="notranslate">26</span></div>');
  return new Response(JSON.stringify([{translations:[{to:lang,text:output}]}]),{status:200});
 };
 const uk=await translateLocalizedHeadline(mixed,'uk',fetcher,env);
 const en=await translateLocalizedHeadline(mixed,'en',fetcher,env);
 assert.deepEqual(sourceNumbers(uk),['26','5']);
 assert.deepEqual(sourceNumbers(en),['26','5']);
 assert.doesNotMatch(uk,/[\u0900-\u097F]|Kal Ka Rashifal/);
 assert.doesNotMatch(en,/[\u0400-\u052F]|[\u0900-\u097F]|Kal Ka Rashifal/);
 assert.ok(calls.length===4);
 assert.ok(calls.every(x=>x.textType==='html'));
 assert.ok(calls.some(x=>x.from==='hi')&&calls.some(x=>x.from==='en'));
});

test('Missing or fabricated digits fail closed; do not bypass protection to look green',async()=>{
 const fake=async(url)=>{
  const locale=new URL(url).searchParams.get('to');
  return new Response(JSON.stringify([{translations:[{to:locale,text:
   locale==='uk'?'Астрологічний день для цих знаків':'Horoscope for the signs'}]}]),{status:200});
 };
 await assert.rejects(()=>translateLocalizedHeadline(mixed,'uk',fake,env),/numeric facts/);
 await assert.rejects(()=>translateLocalizedHeadline(mixed,'en',fake,env),/numeric facts/);
});
test('Malformed or hostile Azure markup is rejected',()=>{
 assert.equal(unwrapAzureHeadline('<div>26 <span class="notranslate">5</span></div>'),'26 5');
 assert.throws(()=>unwrapAzureHeadline('<script>alert("x")</script>'),/unexpected HTML/);
 assert.throws(()=>unwrapAzureHeadline('<img src=x onerror=x>'),/unexpected HTML/);
});
test('Only verified literal Hindi idiom is clarified, unrelated source is unchanged',()=>{
 const bad='the full fruit of the moon';
 assert.match(correctKnownHindiIdiom(pure,bad,'en'),/full influence of the Moon/);
 assert.equal(correctKnownHindiIdiom('A fruit market opened',bad,'en'),bad);
 assert.equal(correctKnownHindiIdiom(pure,'повний плід місяця','uk'),'повний вплив Місяця');
});
test('Untranslated Devanagari never passes even when API returns HTTP 200',async()=>{
 const fake=async(url)=>new Response(JSON.stringify([{translations:[{
  to:new URL(url).searchParams.get('to'),text:'Your horoscope कल इन 5 राशियों'
 }]}]),{status:200});
 await assert.rejects(()=>translateLocalizedHeadline(mixed,'en',fake,env),/Devanagari|numeric facts/);
});
