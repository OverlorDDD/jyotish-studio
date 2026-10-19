import test from 'node:test';
import assert from 'node:assert/strict';
import {TarotUseCases} from '../apps/api/src/tarot-application.ts';
import {TarotDomainError,limitFor,aiLimitFor,utcDayBounds,normalizeTarotQuestion} from '../apps/api/src/tarot-domain.ts';
import {drawCards} from '../apps/api/src/tarot-deck.ts';

const day=new Date('2026-10-19T15:40:00Z');
function setup({aiEnabled=false,aiFails=false,role='MEMBER',used=0,usedAi=0}={}){
 let draws=0,aiCalls=0,usageCalls=0,saved=0;
 const rows=[];
 const repo={
  async reserve(input){
   if(used>=limitFor(role))throw new TarotDomainError('daily_limit','Daily tarot limit reached');
   const row={id:'reading-'+(++draws),createdAt:day};
   const drawn=input.drawCards();
   rows.push({...row,spread:input.spread,question:input.question,cards:drawn,
    narrative:null,narrativeLang:null,narrativeModel:null});
   used++;
   return {row,drawn,limit:limitFor(role),remaining:limitFor(role)-used,role};
  },
  async history(){return {role,used,readings:rows};},
  async successfulAiCount(){return usedAi;},
  async saveNarrative(id,language,model,reading){
   saved++;const row=rows.find(r=>r.id===id);row.narrative=reading;
   row.narrativeLang=language;row.narrativeModel=model;usedAi++;
  },
  async recordAiUsage(){usageCalls++;}
 };
 const ai={
  enabled:()=>aiEnabled,allowAttempt:()=>true,
  async generate({onUsage,cards}){
   aiCalls++;
   if(aiFails)throw Error('offline');
   await onUsage({provider:'openai',model:'mock',outcome:'returned',totalTokens:8});
   const paragraphs={directAnswer:'A direct answer',development:'Some potential development',
    cardExplanations:cards.map(()=>'A card'),caution:'Caution',advice:'Advice'};
   return {reading:paragraphs,model:'mock'};
  }
 };
 return {app:new TarotUseCases(repo,ai,()=>day),
  state:()=>({draws,aiCalls,usageCalls,saved,rows})};
}
test('A2 pure policy: UTC boundaries, roles and trimmed questions',()=>{
 const {start,end}=utcDayBounds(day);
 assert.equal(start.toISOString(),'2026-10-19T00:00:00.000Z');
 assert.equal(end.toISOString(),'2026-10-20T00:00:00.000Z');
 assert.equal(limitFor('ADMIN'),100);assert.equal(limitFor('MEMBER'),3);
 assert.equal(aiLimitFor('ADMIN'),10);assert.equal(aiLimitFor('SUPPORT'),2);
 assert.equal(normalizeTarotQuestion('   hi  '),'hi');
 assert.equal(normalizeTarotQuestion(' '),null);
 assert.throws(()=>normalizeTarotQuestion('q'.repeat(601)),e=>e.code==='question_too_long');
});
test('A2 API shapes: 1/3/10 cards, private history, consistent quotas and reader prose',async()=>{
 for(const [spread,count] of [['one',1],['three',3],['celtic',10]]){
  const {app}=setup();
  const draw=await app.draw({userId:'member',spread,question:' What about tonight? ',aiConsent:false});
  assert.equal(draw.cards.length,count);
  assert.equal(draw.question,'What about tonight?');
  assert.equal(draw.limit,3);assert.equal(draw.remaining,2);
  assert.equal(draw.aiReading,null);
  assert.equal(draw.reader.uk.cardExplanations.length,count);
  assert.ok(draw.reader.uk.directAnswer.includes('What about tonight?'));
  const history=await app.history('member');
  assert.equal(history.readings.length,1);
  assert.equal(history.readings[0].cards.length,count);
  assert.equal(history.readings[0].aiReading,null);
  assert.equal(history.reset,'UTC midnight');
  assert.equal(app.deck().total,78);
 }
});
test('A2 no AI without opt-in or when provider disabled',async()=>{
 const disabled=setup();
 await disabled.app.draw({userId:'u',spread:'one',aiConsent:true});
 assert.equal(disabled.state().aiCalls,0);
 const noConsent=setup({aiEnabled:true});
 await noConsent.app.draw({userId:'u',spread:'one',aiConsent:false});
 assert.equal(noConsent.state().aiCalls,0);
});
test('A2 AI success saves narrative and usage without raw question in log',async()=>{
 const {app,state}=setup({aiEnabled:true});
 const draw=await app.draw({userId:'u',spread:'one',question:'Will things be calmer?',aiConsent:true});
 assert.equal(state().aiCalls,1);assert.equal(state().usageCalls,1);
 assert.equal(state().saved,1);assert.equal(draw.aiReading.model,'mock');
 assert.equal((await app.history('u')).readings[0].aiReading.model,'mock');
});
test('A2 AI failure keeps saved offline Tarot reading',async()=>{
 const {app,state}=setup({aiEnabled:true,aiFails:true});
 const draw=await app.draw({userId:'u',spread:'one',aiConsent:true});
 assert.equal(state().draws,1);assert.equal(draw.aiReading,null);
 assert.equal(state().saved,0);
 assert.ok(draw.reader.uk.directAnswer.length>100);
});
test('A2 ADMIN and MEMBER policy is not client-controlled',async()=>{
 const normal=setup({used:3});
 await assert.rejects(normal.app.draw({userId:'u',spread:'one'}),e=>e.code==='daily_limit');
 const admin=setup({role:'ADMIN',used:3,aiEnabled:true,usedAi:10});
 const reading=await admin.app.draw({userId:'u',spread:'one',aiConsent:true});
 assert.equal(reading.limit,100);assert.equal(reading.remaining,96);
 assert.equal(admin.state().aiCalls,0,'10 successful admin AI calls cap reached');
 await assert.rejects(admin.app.draw({userId:'u',spread:'unknown'}),e=>e.code==='invalid_spread');
});
