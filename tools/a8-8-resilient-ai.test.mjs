import test from 'node:test';
import assert from 'node:assert/strict';
import {generateResilientFreeConsultation} from '../apps/api/src/resilient-consultation.ts';
const ids=['portrait','configuration','tensions','relationships','career','resources','timing','conclusion'];
const chart={ascendant:{sign:4,signName:'Cancer'},d1:[],dasha:[],input:{date:'2000-01-01',time:'12:00',latitude:0,longitude:0,timeZone:'UTC'}};
const specs=ids.map(id=>({id,title:id,focus:'Use two verified symbolic chart factors',facts:['Confirmed ruler role for '+id,'Counterweight for '+id],draft:[
 'The first calculated factor deserves a careful interpretation in this area of life.',
 'The second independent indicator gives a contrasting and responsible reading.'
]}));
const p1='For a Cancer ascendant, the confirmed Jyotish evidence offers a detailed traditional interpretation of personal growth. The specific house ruler brings this subject into focus, while a second indicator offers an important and distinct counterweight. This reading therefore concerns the actual interaction of natal roles, rather than a vague forecast.';
const p2='In everyday life this pattern can be approached through the demands of responsibility, the rhythm of learning and the practical consequences of commitments. The confirmed indicator provides a possible theme for reflection, not a fabricated personal biography or a guaranteed event. The interpretation is grounded in the supplied chart facts and respects each life domain.';
function makeAnswer(chapters,model='openai/gpt-oss-120b'){
 const anchor={
  portrait:'The ascendant lord Moon is a relevant individual chart indicator. ',
  configuration:'The yogakaraka Mars and its functional house lordship are confirmed. ',
  tensions:'The Mars and Saturn interaction supplies a specific and constrained contrast. ',
  relationships:'Venus and the seventh lord Saturn are genuine D1 and D9 anchors. ',
  career:'The tenth-house lord Mars and Dashamsha D10 connect vocation with practice. ',
  resources:'The second-house lord Sun and eleventh-house lord Venus frame financial resources. ',
  timing:'Saturn mahadasha and Moon antardasha define the active period. ',
  conclusion:'The ascendant Moon and Mars lordship synthesize these distinct meanings. '
 };
 const content=chapters.map(c=>'[['+c.id+']]\n'+(anchor[c.id]||'')+p1+'\n\n'+p2).join('\n\n');
 return new Response(JSON.stringify({model,choices:[{message:{content}}]}),{status:200,headers:{'content-type':'application/json'}});
}
test('A8.8 full eight-chapter report uses two independent bounded Groq requests and correct low-reasoning parameters',async()=>{
 const calls=[];
 const result=await generateResilientFreeConsultation(chart,'en',{
  order:['groq'],groqEnabled:true,groqKey:'fake_free_groq',
  chapterSpecs:specs,reportMode:true,limit:()=>true,
  fetcher:async(url,init)=>{
   const body=JSON.parse(init.body);
   calls.push({url,body});
   assert.equal(body.messages[1].content.includes('2000-01-01'),false);
   assert.equal(body.reasoning_effort,'low');
   assert.equal(body.include_reasoning,false);
   assert.ok(body.max_tokens<=1600);
   assert.equal(body.messages[0].content.includes('exactly eight chapters'),false);
   const passed=JSON.parse(body.messages[1].content).chapterSpecs;
   assert.equal(passed.length,4);
   return makeAnswer(passed);
  }
 });
 assert.equal(calls.length,2);
 assert.equal(result.result?.chapters?.length,8);
 assert.deepEqual(result.result.chapters.map(c=>c.id),ids);
 assert.equal(result.result?.provider,'groq');
 assert.equal(result.result?.model,'openai/gpt-oss-120b');
});
test('A8.8 keeps accepted first four chapters when second Groq attempt times out',async()=>{
 let calls=0;
 const signal=new AbortController();
 const result=await generateResilientFreeConsultation(chart,'en',{
  order:['groq'],groqEnabled:true,groqKey:'free_key',chapterSpecs:specs,
  limit:()=>true,signal:signal.signal,reportMode:true,
  fetcher:async(_url,init)=>{
   calls++;
   if(calls===1)return makeAnswer(JSON.parse(init.body.messages[1].content).chapterSpecs);
   signal.abort();
   throw new DOMException('Aborted','AbortError');
  }
 });
 assert.equal(calls,2);
 assert.equal(result.result?.chapters?.length,4);
 assert.equal(result.result?.provider,'groq');
});
test('A8.8 respects free budget and never throws away a prior valid set of chapters',async()=>{
 let used=0;
 const result=await generateResilientFreeConsultation(chart,'en',{
  order:['groq'],groqEnabled:true,groqKey:'free_key',
  chapterSpecs:specs,reportMode:true,limit:()=>++used<=1,
  fetcher:async(_url,init)=>makeAnswer(JSON.parse(init.body.messages[1].content).chapterSpecs)
 });
 assert.equal(used,2);
 assert.equal(result.result?.chapters?.length,4);
});
test('A8.8 first failed Groq chunk falls through to verified free Gemini, pins provider for second chunk',async()=>{
 const seen=[];
 const result=await generateResilientFreeConsultation(chart,'en',{
  order:['groq','gemini'],groqEnabled:true,groqKey:'free_groq',
  geminiEnabled:true,geminiKey:'free_gemini',limit:()=>true,
  chapterSpecs:specs,reportMode:true,
  fetcher:async(url,init)=>{
   seen.push(url);
   if(url.includes('groq.com'))return new Response('{}',{status:503});
   return makeAnswer(JSON.parse(init.body.messages[1].content).chapterSpecs,'gemini-3.1-flash-lite');
  }
 });
 assert.equal(seen.length,3);
 assert.equal(seen.filter(x=>x.includes('groq.com')).length,1);
 assert.equal(result.result?.provider,'gemini');
 assert.equal(result.result?.chapters?.length,8);
 assert.ok(seen.every(x=>!x.includes('api.openai.com')));
});
