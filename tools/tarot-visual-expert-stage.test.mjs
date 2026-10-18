import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TAROT_DECK} from '../apps/api/src/tarot-deck.ts';
import {tarotForecast} from '../apps/api/src/tarot-forecast.ts';
import {generateTarotNarrative} from '../apps/api/src/tarot-ai.ts';
import {tarotCardArt} from '../apps/web/lib/tarot-art.ts';
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('78 Rider-Waite-Smith card pictures map to distinct 1909 public-domain scans',()=>{
 assert.equal(TAROT_DECK.length,78);
 const urls=TAROT_DECK.map(c=>tarotCardArt(c.id));
 assert.equal(new Set(urls).size,78);
 assert.ok(urls.every(url=>url?.startsWith('https://petaloverflow.github.io/tarot-api/cards/')));
 assert.match(tarotCardArt('major-fool'),/ar00\.jpg$/);
 assert.match(tarotCardArt('major-tower'),/ar16\.jpg$/);
 assert.match(tarotCardArt('cups-king'),/cu14\.jpg$/);
 assert.match(tarotCardArt('pentacles-ten'),/pe10\.jpg$/);
 assert.equal(tarotCardArt('unsupported-id'),null);
});
test('Sample evening forecast combines six of wands, ten of pentacles and reversed Tower',()=>{
 const cards=[
  {id:'wands-six',position:0,reversed:false},
  {id:'pentacles-ten',position:1,reversed:false},
  {id:'major-tower',position:2,reversed:true}
 ];
 const x=tarotForecast(cards,'three','Що мене чекає сьогодні ввечері?');
 for(const key of ['похвалу','сімейну','Перевернута Вежа','конфлікту'])
  assert.ok(x.answer.uk.includes(key),'missing '+key);
 assert.ok(x.answer.en.includes('tonight'));
 assert.ok(x.connections.uk.includes('Шістка Жезлів'));
 assert.ok(!x.answer.uk.includes('запиши'));
 assert.ok(!x.answer.uk.includes('поставити собі точніші запитання'));
});
test('AI provider is strictly free, consent-gated on API, metered, and never sends identity',async()=>{
 const oldKey=process.env.OPENROUTER_API_KEY,oldSwitch=process.env.TAROT_AI_ENABLED;
 process.env.OPENROUTER_API_KEY='testing-key-not-real';
 process.env.TAROT_AI_ENABLED='1';
 const requests=[],usage=[];
 try{
  const reading=[{id:'major-tower',position:0,reversed:true}];
  const fetcher=async(_url,opts)=>{
   requests.push(JSON.parse(opts.body));
   return {ok:true,json:async()=>({
    model:'free-test-model',
    usage:{prompt_tokens:92,completion_tokens:221,total_tokens:313},
    choices:[{message:{content:'A symbolic reading grounded in the reversed Tower. '.repeat(13)} }]
   })};
  };
  const r=await generateTarotNarrative(reading,'one','Що буде ввечері?','uk',event=>{usage.push(event)},fetcher);
  assert.equal(r.reason,'success');
  assert.equal(requests[0].model,'openrouter/free');
  assert.ok(requests[0].messages[0].content.includes('досвідчена українська'));
  assert.ok(requests[0].messages[1].content.includes('Вежа'));
  assert.ok(!requests[0].messages[1].content.includes('email'));
  assert.equal(usage[0].totalTokens,313);
  assert.equal(usage[0].provider,'openrouter');
  const code=source('apps/api/src/tarot.ts');
  assert.ok(code.includes("body.consent!==true"));
  assert.ok(code.includes("where:{id,userId}"));
  assert.ok(code.includes("aiTextUk"));
  assert.ok(code.includes("operation:'tarot_interpretation'"));
 }finally{
  if(oldKey===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=oldKey;
  if(oldSwitch===undefined)delete process.env.TAROT_AI_ENABLED;else process.env.TAROT_AI_ENABLED=oldSwitch;
 }
});
test('Human expert catalog: real EXPERT role, hidden by default, no fake bookings',()=>{
 const api=source('apps/api/src/expert-catalog.ts');
 const schema=source('apps/api/prisma/schema.prisma');
 const ui=source('apps/web/app/components/ExpertCatalog.tsx');
 const admin=source('apps/web/app/components/ExpertManagement.tsx');
 assert.ok(api.includes("user?.role!=='EXPERT'"));
 assert.ok(api.includes("user?.role!=='ADMIN'"));
 assert.ok(api.includes("isPublished:false"));
 assert.ok(api.includes("where:{isPublished:true,user:{role:'EXPERT'}}"));
 assert.ok(api.includes("checkoutAvailable:false"));
 assert.ok(schema.includes('model ExpertProfile'));
 assert.ok(schema.includes('model ExpertOffering'));
 assert.ok(ui.includes('No profiles are published yet'));
 assert.ok(admin.includes('/api/v1/admin/experts'));
 assert.ok(!api.includes('paymentVerifiedAt:new Date()'));
});
test('Additive migration, original artwork and optional LLM UI',()=>{
 const migration=source('apps/api/prisma/migrations/20261018190000_tarot_ai_expert_catalog/migration.sql');
 assert.ok(migration.includes('CREATE TABLE "ExpertProfile"'));
 assert.ok(migration.includes('CREATE TABLE "ExpertOffering"'));
 assert.ok(migration.includes('ADD COLUMN "aiTextUk"'));
 assert.ok(!migration.includes('DROP TABLE'));
 const ui=source('apps/web/app/components/TarotStudio.tsx');
 assert.ok(ui.includes('<IllustratedTarotCard'));
 assert.ok(ui.includes('onError={()=>setImageSource(n=>n+1)}'));
 assert.ok(ui.includes('if(aiConsent)void interpretWithAi(r)'));
 assert.ok(ui.includes('reading.aiText?.[locale]'));
});
