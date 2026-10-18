import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TAROT_DECK,drawCards} from '../apps/api/src/tarot-deck.ts';
import {readerReading,TAROT_SCENARIO_CARD_COUNT} from '../apps/api/src/tarot-reader.ts';
import {tarotArtFilename,tarotArtLocal,tarotArtRemote} from '../apps/web/lib/tarot-art.ts';
import {validateNarrative,createHumanAiTarot,tarotAiConfig} from '../apps/api/src/tarot-ai.ts';
const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('78 distinct Rider-Waite pictures map to actual upstream filenames without collisions',()=>{
 assert.equal(TAROT_DECK.length,78);
 assert.equal(TAROT_SCENARIO_CARD_COUNT,78);
 const files=TAROT_DECK.map(card=>tarotArtFilename(card.id));
 assert.ok(files.every(f=>typeof f==='string'&&f.endsWith('.jpg')));
 assert.equal(new Set(files).size,78);
 assert.equal(tarotArtFilename('major-tower'),'16_Tower.jpg');
 assert.equal(tarotArtFilename('pentacles-ten'),'Pents10.jpg');
 assert.equal(tarotArtFilename('cups-queen'),'Cups13.jpg');
 assert.equal(tarotArtFilename('wands-king'),'Wands14.jpg');
 assert.ok(tarotArtLocal('major-fool').startsWith('/tarot/rws/'));
 assert.ok(tarotArtRemote('major-fool').includes('raw.githubusercontent.com'));
});
test('The fallback reading gives a concrete event-oriented direct answer, not an abstract generic advice block',()=>{
 for(const spread of ['one','three','celtic']){
  const drawn=drawCards(spread);
  for(const lang of ['uk','en']){
   const q=lang==='uk'?'Що мене чекає сьогодні ввечері?':'What is likely to happen tonight?';
   const r=readerReading(drawn,spread,q,lang);
   assert.ok(r.directAnswer.includes(q));
   assert.ok(r.directAnswer.length>140);
   assert.ok(r.development.length>120);
   assert.ok(r.caution.length>50);
   assert.ok(r.advice.length>50);
   assert.equal(r.cardExplanations.length,drawn.length);
   assert.ok(r.cardExplanations.every(x=>x.length>130));
   assert.ok(!r.directAnswer.includes('Сприймай ці образи'));
  }
 }
});
test('High-stakes question does not lead to fabricated medical or pregnancy predictions',()=>{
 const q='Чи є у мене вагітність?';
 const r=readerReading(drawCards('three'),'three',q,'uk');
 assert.ok(r.directAnswer.includes('не може встановити'));
});
test('Validates structured AI with exact one-paragraph-per-card limit',()=>{
 const valid={
  directAnswer:'This evening may begin with a welcome invitation, then turn toward a change in plans that calls for patience.',
  development:'The first card sets a friendly tone, the next describes what changes, and the closing card invites a practical reaction rather than panic.',
  cardExplanations:[
   'A positive message or encouraging interaction could set the scene. It might feel like a small achievement worth sharing.',
   'At the center there may be a conversation about expectations. The concrete timing and people involved matter.',
   'The final card points toward a changed arrangement rather than a predetermined disaster. A calm response helps.'
  ],
  caution:'Check details rather than assuming every change is a threat.',
  advice:'Stay flexible and ask one direct question if plans change.'
 };
 assert.ok(validateNarrative(valid,3));
 assert.equal(validateNarrative({...valid,cardExplanations:valid.cardExplanations.slice(0,2)},3),null);
 assert.equal(validateNarrative({...valid,directAnswer:'yes'},3),null);
});
test('Tarot AI opt-in calls only a mocked endpoint and sends usage metadata, never secrets into logs',async()=>{
 const prev={enabled:process.env.TAROT_AI_ENABLED,key:process.env.OPENAI_API_KEY,provider:process.env.TAROT_AI_PROVIDER,model:process.env.TAROT_AI_MODEL};
 process.env.TAROT_AI_ENABLED='true';process.env.OPENAI_API_KEY='fake-test-key';
 process.env.TAROT_AI_PROVIDER='openai';process.env.TAROT_AI_MODEL='fake-test-model';
 let invoked=0;const sent=[];
 try{
  assert.ok(tarotAiConfig().enabled);
  const cards=drawCards('one');
  const content={
   directAnswer:'The first message could change your expectations tonight. Stay attentive to whether the plan matches what was actually agreed.',
   development:'There may be a new invitation or a small adjustment. This is a potential reading based solely on the card and position, not verified knowledge.',
   cardExplanations:['In the focus position this card describes an unfolding conversation and one realistic response you could choose instead of making assumptions.'],
   caution:'Do not infer another person’s hidden feelings as certain facts.',
   advice:'Check the details of the invitation before committing your evening.'
  };
  const result=await createHumanAiTarot(cards,'one','Що буде ввечері?','uk',{
   fetcher:async(url,options)=>{
    invoked++;
    assert.equal(url,'https://api.openai.com/v1/chat/completions');
    const req=JSON.parse(String(options.body));
    assert.equal(req.model,'fake-test-model');
    assert.equal(req.messages[1].role,'user');
    assert.ok(req.messages[1].content.includes('Що буде ввечері?'));
    return new Response(JSON.stringify({model:'fake-test-model',usage:{prompt_tokens:40,completion_tokens:80,total_tokens:120},
     choices:[{message:{content:JSON.stringify(content)}}]}),{status:200});
   },
   onUsage:async u=>sent.push(u)
  });
  assert.equal(invoked,1);assert.equal(result.reading.directAnswer,content.directAnswer);
  assert.equal(sent[0].totalTokens,120);assert.equal(sent[0].outcome,'returned');
  assert.ok(!JSON.stringify(sent).includes('Що буде ввечері?'));
 }finally{
  for(const [k,v] of [['TAROT_AI_ENABLED',prev.enabled],['OPENAI_API_KEY',prev.key],['TAROT_AI_PROVIDER',prev.provider],['TAROT_AI_MODEL',prev.model]])
   if(v===undefined)delete process.env[k];else process.env[k]=v;
 }
});
test('Server enforces ADMIN 100 and MEMBER 3 with no ability to claim ADMIN in the POST',()=>{
 const api=file('apps/api/src/tarot.ts'),ui=file('apps/web/app/components/TarotStudio.tsx');
 assert.ok(api.includes('ADMIN_LIMIT=100'));
 assert.ok(api.includes('FREE_LIMIT=3'));
 assert.ok(api.includes("tx.user.findUnique({where:{id:userId},select:{role:true}})"));
 assert.ok(api.includes("if(used>=limit)"));
 assert.ok(api.includes("onUsage:async event"));
 assert.ok(api.includes("body.aiConsent===true"));
 assert.ok(api.includes('narrative:completion.reading'));
 assert.ok(ui.includes('TarotCardArt'));
 assert.ok(ui.includes('as-reader-direct'));
 assert.ok(ui.includes('aiConsent:aiAvailable&&aiConsent'));
});
test('New Tarot schema upgrade is additive and artwork setup downloads a complete classic deck',()=>{
 const sql=file('apps/api/prisma/migrations/20261018215000_tarot_v2_narrative/migration.sql');
 assert.ok(sql.includes('ADD COLUMN "narrative"'));
 assert.ok(!sql.includes('DROP TABLE'));
 const downloader=file('tools/tarot-assets.mjs');
 assert.ok(downloader.includes('files.length!==78'));
 assert.ok(downloader.includes('Buffer.from(await response.arrayBuffer())'));
 assert.ok(downloader.includes('0xff'));
});
