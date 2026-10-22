import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {buildChartFactGraph} from '../apps/api/src/consultation-fact-graph.ts';
import {buildSupportedClaims,planConsultation,verifyUnifiedConsultation,generateConsultationIntelligence} from '../apps/api/src/consultation-intelligence.ts';
import {CHAPTER_IDS} from '../apps/api/src/consultation-ai.ts';
const input={date:'2000-01-01',time:'12:00',timeZone:'UTC',latitude:0,longitude:0};
const positions=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']
 .map((name,i)=>({name,longitude:[335,72,345,350,255,15,332,120,300][i],speed:1}));
const chart=()=>calculateChart(input,{ayanamsa:23.8,ascendant:100,positions,julianDay:2451545,backend:'synthetic'});
const graph=()=>buildChartFactGraph(chart(),'2026-10-21');
const chapters=(prefix='A reflection on the relationships among the chart factors points toward a careful interpretation of personal priorities and how those priorities can be managed over time. ')=>CHAPTER_IDS.map((id,i)=>({id,paragraphs:[('Chapter '+id+' '+prefix).repeat(3),('Second viewpoint '+id+' '+prefix).repeat(3)]}));
test('A8.9: sourced calculations and one cross-chapter narrative plan',()=>{
 const g=graph(),claims=buildSupportedClaims(g),p=planConsultation(g,claims,'uk');
 assert.equal(claims.filter(c=>c.kind==='lordship').length,12);
 assert.ok(claims.some(c=>c.id==='D1.dispositor.Mars'));
 assert.ok(claims.every(c=>c.reviewStatus==='calculation_verified'));
 assert.ok(p.themes.length>=3&&p.themes.length<=5);
 assert.match(p.thesis,/Раку/);
 assert.equal(p.chapterClaims.career.includes('D1.house-lord.10'),true);
 assert.ok(p.chapterClaims.resources.includes('D1.house-lord.2'));
 assert.ok(p.chapterClaims.resources.includes('D1.house-lord.11'));
 assert.deepEqual(planConsultation(g,claims,'uk'),p);
 assert.notEqual(planConsultation(g,claims,'en').thesis,p.thesis);
});
test('A8.9: rejects partial/misordered, invented lord, false planet house, Russian leakage',()=>{
 const g=graph(),base=chapters();
 assert.equal(verifyUnifiedConsultation(base,g,'en').ok,true);
 assert.ok(verifyUnifiedConsultation(base.slice(0,7),g,'en').errors.includes('incomplete_document'));
 const bad=chapters();bad[0].paragraphs[0]='Sun occupies house 12. '+bad[0].paragraphs[0];
 assert.ok(verifyUnifiedConsultation(bad,g,'en').errors.includes('wrong_house:Sun'));
 const ru=chapters();ru[0].paragraphs[0]='который '+ru[0].paragraphs[0];
 assert.ok(verifyUnifiedConsultation(ru,g,'uk').errors.includes('ru_mixed'));
 const certainty=chapters();certainty[0].paragraphs[0]='This is guaranteed profit. '+certainty[0].paragraphs[0];
 assert.ok(verifyUnifiedConsultation(certainty,g,'en').errors.includes('unfounded_certainty'));
});
test('A8.9: cannot publish a mixed partial cloud result; no provider gives no replacement',async()=>{
 const g=graph();
 const editorial={chapters:CHAPTER_IDS.map(id=>({id,title:id,evidence:[],paragraphs:['Chart facts that shape the reading.','Supporting context of the whole chart.']})),findings:[]};
 const result=await generateConsultationIntelligence(chart(),'uk','2026-10-21',editorial,{order:[]});
 assert.equal(result.result,null);
 assert.equal(result.reason,'no_provider');
 assert.equal(result.plan.fingerprint,g.fingerprint);
});

test('A8.9 production path derives yoga approvals and publishes complete verified writer',async()=>{
 const editorial={chapters:CHAPTER_IDS.map(id=>({id,title:id,evidence:[],paragraphs:[]})),findings:[]};
 let calls=0;
 const anchors={
 portrait:'The ascendant Moon describes the need for privacy.',
 configuration:'The yogakaraka Mars connects creative initiative with responsible action.',
 tensions:'Mars and Saturn give different rhythms to personal effort.',
 relationships:'Venus describes mutual affection and respect in partnership.',
 career:'Mars connects vocation with the discipline of developing a craft.',
 resources:'Sun and Venus connect resources with learning and social contribution.',
 timing:'The mahadasha highlights patient reflection without forecasting events.',
 conclusion:'The ascendant Moon and Mars bring together inward needs and outward action.'
 };
 const result=await generateConsultationIntelligence(chart(),'en','2026-10-21',editorial,{
  order:['groq'],groqEnabled:true,groqKey:'test-only',limit:()=>true,
  fetcher:async(_url,init)=>{
   calls++;
   const body=JSON.parse(init.body);
   const specs=JSON.parse(body.messages[1].content).chapterSpecs;
   if(calls===1){
    assert.ok(specs.find(c=>c.id==='configuration').verifiedContext.length>3);
    assert.match(body.messages[0].content,/WRITE exactly/);
   }
   const content=specs.map(c=>'[['+c.id+']]\n'+anchors[c.id]+
    ' In the '+c.id+' theme, the verified factors describe a balance between personal initiative and the need to listen carefully to circumstances. You may recognize this in the way enthusiasm grows when the task carries meaning, while external pressure makes thoughtful pacing especially valuable.\n\n'+
    'Another perspective on '+c.id+' is the relationship between inward priorities and shared commitments. Giving each of these a clear place can help translate intention into sustained practice. The strength of this pattern lies in bringing reflection into action without allowing one concern to displace every other part of life.'
   ).join('\n\n');
   return new Response(JSON.stringify({model:'openai/gpt-oss-120b',choices:[{message:{content}}]}));
  }
 });
 assert.equal(calls,8);
 assert.equal(result.result?.chapters.length,8);
 assert.match(result.result.text,/yogakaraka/);
});

test('A8.9 strict mode rejects partial Groq completions and retries Gemini per group',async()=>{
 const editorial={chapters:CHAPTER_IDS.map(id=>({id,title:id,evidence:[],paragraphs:[]})),findings:[]};
 const visited=[];
 const anchors={portrait:'The ascendant Moon illuminates a personal orientation. ',
 configuration:'The yogakaraka Mars carries relevant lordship. ',
 tensions:'Mars and Saturn present two different rhythms. ',
 relationships:'Venus and the seventh lord anchor relationships. ',
 career:'The tenth lord and D10 Dashamsha guide vocation. ',
 resources:'The second and eleventh lords concern resources. ',
 timing:'The Saturn mahadasha provides a timing frame. ',
 conclusion:'The ascendant Moon and Mars summarize this chart. '};
 const valid=(ids)=>ids.map((c,i)=>'[['+c.id+']]\n'+
  anchors[c.id]+'The ascendant Moon and Mars supply an individual reading for '+c.id+' based on verified chart factors. '.repeat(5)+
  '\n\n'+'Venus and Saturn provide a complementary perspective on '+c.id+' in the wider Jyotish interpretation. '.repeat(5)).join('\n\n');
 const result=await generateConsultationIntelligence(chart(),'en','2026-10-21',editorial,{
  order:['groq','gemini'],groqEnabled:true,groqKey:'test-only',
  geminiEnabled:true,geminiKey:'test-only',limit:()=>true,
  fetcher:async(url,init)=>{
   const group=JSON.parse(JSON.parse(init.body).messages[1].content).chapterSpecs;
   visited.push(url.includes('groq')?'groq':'gemini');
   const isGroq=url.includes('groq');
   const content=valid(isGroq?group.slice(0,1):group);
   return new Response(JSON.stringify({model:isGroq?'openai/gpt-oss-120b':'gemini-3.1-flash-lite',
    choices:[{message:{content}}]}),{status:200,headers:{'content-type':'application/json'}});
  }
 });
 assert.ok(visited.includes('gemini'));
 assert.ok(visited.includes('groq'));
 assert.ok(visited.length>=8);
 assert.equal(result.result?.chapters.length,8);
});

test('A8.9 stops after a failed required group instead of exhausting later free calls',async()=>{
 const editorial={chapters:CHAPTER_IDS.map(id=>({id,title:id,evidence:[],paragraphs:[]})),findings:[]};
 let requests=0;
 const r=await generateConsultationIntelligence(chart(),'uk','2026-10-21',editorial,{
  order:['groq'],groqEnabled:true,groqKey:'test-only',limit:()=>true,
  fetcher:async()=>{
   requests++;
   return new Response(JSON.stringify({model:'openai/gpt-oss-120b',
    choices:[{message:{content:'[[portrait]]\\nЗанадто короткий текст.'}}]}),{status:200,
    headers:{'content-type':'application/json'}});
  }
 });
 assert.equal(r.result,null);
 assert.equal(requests,1);
});
