import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {translationEndpoint,normalizeTranslatedNews,translateNewsText,
 checkNewsTranslator,preserveSourceNumbers} from '../apps/api/src/news-translation.ts';
import {extractSourceTeaser,generateNewsMicrocopy} from '../apps/api/src/news-editorial.ts';
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('backend-only endpoint rejects external and credentialed URL overrides (SSRF prevention)',()=>{
 assert.equal(translationEndpoint({NEWS_TRANSLATION_URL:'http://127.0.0.1:5100'}),'http://127.0.0.1:5100');
 for(const bad of ['https://api.groq.com','http://169.254.169.254','http://user:pass@localhost:5000',
  'http://evil.example','http://127.0.0.1:5100/secret','file:///etc/passwd']){
  assert.throws(()=>translationEndpoint({NEWS_TRANSLATION_URL:bad}),/Translator must|invalid/);
 }
});

test('translator validates the EN to UK model and never leaks private credentials',async()=>{
 const good=async url=>new Response(JSON.stringify([{code:'en',targets:['uk','de']},{code:'uk',targets:['en']}]),{status:200});
 const bad=async url=>new Response(JSON.stringify([{code:'en',targets:['fr']}]),{status:200});
 assert.equal((await checkNewsTranslator(good)).available,true);
 assert.equal((await checkNewsTranslator(bad)).available,false);
});

test('strict local machine translation keeps astronomical dates and never accepts English or HTML as Ukrainian',async()=>{
 const success=async(url,opts)=>{
  assert.equal(url,'http://127.0.0.1:5100/translate');
  const body=JSON.parse(opts.body);
  assert.deepEqual({source:body.source,target:body.target,format:body.format},{source:'en',target:'uk',format:'text'});
  return new Response(JSON.stringify({translatedText:'Меркурій у Рибах у 2026 році.'}),{status:200});
 };
 assert.match(await translateNewsText('Mercury enters Pisces in 2026.',success),/2026/);
 assert.equal(normalizeTranslatedNews('Джйотиш і навамша'), 'Джйотіш і Навамша');
 assert.equal(preserveSourceNumbers('2026 and 4', '2026 та 4'),true);
 assert.equal(preserveSourceNumbers('2026 and 4', '2025 та 4'),false);
 await assert.rejects(()=>translateNewsText('2026',async()=>new Response(JSON.stringify({translatedText:'2025'}))),/Invalid (?:machine|local)/);
 await assert.rejects(()=>translateNewsText('Astrology',async()=>new Response(JSON.stringify({translatedText:'Astrology'}))),/Invalid (?:machine|local)/);
 await assert.rejects(()=>translateNewsText('Astrology',async()=>new Response(JSON.stringify({translatedText:'<b>Астрологія</b>'}))),/Invalid (?:machine|local)/);
});

test('news editorial never calls generative APIs regardless of available keys',async()=>{
 const old=[process.env.GROQ_API_KEY,process.env.GEMINI_API_KEY,process.env.OPENROUTER_API_KEY,process.env.NEWS_EDITORIAL_AI_ENABLED];
 process.env.GROQ_API_KEY='fake-ci';process.env.GEMINI_API_KEY='fake-ci';
 process.env.OPENROUTER_API_KEY='fake-ci';process.env.NEWS_EDITORIAL_AI_ENABLED='1';
 let calls=0;
 const mock=async url=>{
  calls++;assert.equal(url,'http://127.0.0.1:5100/translate');
  return new Response(JSON.stringify({translatedText:'Новини про Таро'}),{status:200});
 };
 try{
  const out=await generateNewsMicrocopy([{id:'1',title:'Tarot news',titleUk:null,summaryUk:null,feedDescription:null,
   summary:null,summaryKind:'needs_editorial',language:'en'}],mock);
  assert.equal(out.length,1);assert.equal(out[0].summaryUk,'');assert.equal(calls,1);
 }finally{
  for(const [i,k] of ['GROQ_API_KEY','GEMINI_API_KEY','OPENROUTER_API_KEY','NEWS_EDITORIAL_AI_ENABLED'].entries()){
   if(old[i]===undefined)delete process.env[k];else process.env[k]=old[i];
  }
 }
 for(const path of ['apps/api/src/news-editorial.ts','apps/api/src/news-translation.ts']){
  assert.doesNotMatch(source(path),/generativelanguage\.googleapis\.com|api\.groq\.com|openrouter\.ai\/api/);
 }
});

test('source-only summaries are bounded, and pre-existing translations are not regenerated',async()=>{
 const row={id:'s',title:'Tarot beginner guide',titleUk:'Довідник Таро',
  summaryUk:'Вже затверджений анонс.',summaryKind:'ai_editorial',
  feedDescription:'Explains three ways to interpret Tarot cards using a careful sequence of questions and practical notes.',
  summary:null,language:'en'};
 const text=extractSourceTeaser(row);
 assert.ok(text.length>=45&&text.length<=280);
 let calls=0;
 const output=await generateNewsMicrocopy([row],async()=>{calls++;throw Error('should never be called')});
 assert.equal(calls,0);
 assert.equal(output[0].titleUk,row.titleUk);
 assert.equal(output[0].summaryUk,row.summaryUk);
 const noFacts={...row,summaryUk:null,feedDescription:null,summaryKind:'no_context'};
 assert.equal(extractSourceTeaser(noFacts),'');
});

test('translator named volumes are repaired before LibreTranslate starts as UID 1032',()=>{
 const compose=source('docker-compose.yml');
 const init=compose.slice(compose.indexOf('  translator-volume-init:'),compose.indexOf('  translator:',compose.indexOf('  translator-volume-init:')));
 const translator=compose.slice(compose.indexOf('  translator:'),compose.indexOf('\nvolumes:',compose.indexOf('  translator:')));
 assert.match(init,/user:\s*["']0:0["']/);
 assert.match(init,/chown -R 1032:1032/);
 assert.match(init,/galaxiora-argos-models:/);
 assert.match(init,/galaxiora-argos-cache:/);
 assert.match(init,/restart:\s*["']no["']/);
 assert.match(translator,/translator-volume-init:\s*\n\s*condition: service_completed_successfully/);
 assert.match(translator,/127\.0\.0\.1:5100:5000/);
 assert.doesNotMatch(translator,/user:\s*["']0:0["']/,
  'The permanently running translator must not be root');
 assert.match(compose,/jyotish-postgres:\/var\/lib\/postgresql\/data/,
  'Existing Postgres volume must remain untouched');
});

test('Azure Translator NMT is an explicit fixed endpoint with no key leak and no generative fallback',async()=>{
 const {selectedNewsTranslationProvider,translationQualityWarnings}=await import('../apps/api/src/news-translation.ts');
 assert.equal(selectedNewsTranslationProvider({NEWS_TRANSLATION_PROVIDER:'azure'}),'azure');
 assert.throws(()=>selectedNewsTranslationProvider({NEWS_TRANSLATION_PROVIDER:'unknown'}),/Unsupported/);
 assert.ok(translationQualityWarnings('Тато-розклади Таро').length>0);
 assert.ok(translationQualityWarnings('Ведикська астрологія').length>0);
 const env={NEWS_TRANSLATION_PROVIDER:'azure',AZURE_TRANSLATOR_KEY:'test-key-not-real',AZURE_TRANSLATOR_REGION:'westeurope'};
 let requests=0;
 const mock=async(url,options)=>{
  requests++;
  assert.equal(url,'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=uk');
  assert.equal(options.headers['Ocp-Apim-Subscription-Key'],env.AZURE_TRANSLATOR_KEY);
  assert.equal(options.headers['Ocp-Apim-Subscription-Region'],env.AZURE_TRANSLATOR_REGION);
  assert.deepEqual(JSON.parse(options.body),[{text:'Tarot reading in 2026'}]);
  return new Response(JSON.stringify([{translations:[{text:'Розклад Таро у 2026 році',to:'uk'}]}]),{status:200});
 };
 const translation=await translateNewsText('Tarot reading in 2026',mock,env);
 assert.equal(translation,'Розклад Таро у 2026 році');
 assert.equal(requests,1);
 await assert.rejects(()=>translateNewsText('Tarot',mock,{NEWS_TRANSLATION_PROVIDER:'azure'}),/AZURE_TRANSLATOR_KEY/);
});
