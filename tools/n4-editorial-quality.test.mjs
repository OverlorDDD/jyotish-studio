import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {N4_NARRATIVE_VERSION,selectN4NarrativeThemes,compactN4NarrativeBrief,reviewN4Narrative}
 from '../apps/api/src/n4-interpretation-brief.ts';
import {N4_AI_INSTRUCTION,compactN4VargaFacts,n4AiEligible}
 from '../apps/api/src/n4-varga-evidence.ts';
import {generateDirectJyotish} from '../apps/api/src/direct-jyotish.ts';

const names=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const birth={date:'2000-01-01',time:'12:00',timeZone:'Europe/Kyiv',latitude:49.2,longitude:33.4};
function synthetic(seed=0){
 return calculateChart(birth,{
  ayanamsa:23.85,julianDay:2451545,backend:'synthetic_unit_test_only',
  ascendant:(11.3+seed*37)%360,
  positions:names.map((name,i)=>({name,longitude:(9.7+i*37.721+seed*i*7.53)%360,speed:0}))
 });
}
test('N4 editorial picks exactly three genuinely computed chart-specific D1↔D themes',()=>{
 const chart=synthetic(),themes=selectN4NarrativeThemes(chart),again=selectN4NarrativeThemes(chart);
 assert.deepEqual(themes,again);
 assert.equal(themes.length,3);
 assert.equal(new Set(themes.map(t=>t.division)).size,3);
 assert.ok(themes.every(t=>[2,3,4,7,12,16,20,24,27,30,40,45].includes(t.division)));
 for(const t of themes){
  assert.ok(t.d1HouseLord&&t.anchor&&t.question&&t.scene&&t.limit);
  for(const value of [t.house,t.d1LordHouse,t.d1AnchorHouse,t.d1AnchorSign,t.vargaAnchorSign,t.vargaAnchorHouse])
   assert.ok(Number.isInteger(value)&&value>=1&&value<=12);
  const actual=chart.d1.find(p=>p.name===t.anchor);
  assert.equal(t.d1AnchorSign,actual.sign);
  assert.equal(t.d1AnchorHouse,actual.house);
 }
 const brief=compactN4NarrativeBrief(chart);
 assert.ok(brief.includes(N4_NARRATIVE_VERSION));
 for(const t of themes){
  assert.ok(brief.includes('D'+t.division+' '+t.topic));
  assert.ok(brief.includes('D1 H'+t.house+' ruler '+t.d1HouseLord+' is in D1 H'+t.d1LordHouse));
 }
 for(const secret of ['2000-01-01','12:00','49.2','33.4','Europe/Kyiv'])assert.ok(!brief.includes(secret));
 assert.doesNotMatch(brief,/D60|Date of birth|owner_id/);
 assert.ok(brief.length<3000,'bounded extra prompt context');
});
test('N4 text plans change with the chart instead of rotating identical generic scripts',()=>{
 const A=selectN4NarrativeThemes(synthetic(0)),B=selectN4NarrativeThemes(synthetic(9));
 assert.notDeepEqual(A,B,'different calculated natal inputs must change the source facts');
 assert.notEqual(compactN4NarrativeBrief(synthetic(0)),compactN4NarrativeBrief(synthetic(9)));
 assert.match(N4_AI_INSTRUCTION,/two|TWO|2–3/);
 assert.match(N4_AI_INSTRUCTION,/trade-off|friction|possible friction/);
 assert.match(N4_AI_INSTRUCTION,/natural|idiomatic/);
 assert.match(N4_AI_INSTRUCTION,/D1/);
});
test('N4 editorial review blocks ignored evidence and fabricated D60 references',()=>{
 const themes=selectN4NarrativeThemes(synthetic());
 const cited='## Profile\nThe D'+themes[0].division+' pattern can inform how a decision is approached. '+
  'In D'+themes[1].division+' a second symbolic lens illustrates a different response to the same challenge.';
 assert.deepEqual(reviewN4Narrative(cited,themes).codes,[]);
 assert.deepEqual(reviewN4Narrative('## Generic prose without vargas.',themes).codes,['n4_missing_two_evidenced_lenses']);
 assert.ok(reviewN4Narrative(cited+' D60 guarantees results.',themes).codes.includes('n4_unsupported_d60_narrative'));
 assert.ok(!reviewN4Narrative('D24 and D2 are in the corpus.',themes).codes.includes('n4_unsupported_d60_narrative'));
});
test('N4 Reader feature remains default OFF and private metadata never enters the annex',()=>{
 assert.equal(n4AiEligible({N4_VARGA_AI_ENABLED:'1'}),false);
 const chart=synthetic();
 const facts=compactN4VargaFacts(chart),plan=compactN4NarrativeBrief(chart);
 assert.ok(facts.includes('D24'));
 for(const detail of ['2000-01-01','12:00','49.2','33.4','Europe/Kyiv'])
  assert.ok(!facts.includes(detail)&&!plan.includes(detail));
 assert.doesNotMatch(facts,/^D60\s+/m);
});
test('N4 cloud adapter sees only verified facts and rejects missing two D lenses with one bounded retry',async()=>{
 const chart=synthetic(),themes=selectN4NarrativeThemes(chart);
 const saved={enabled:process.env.N4_VARGA_AI_ENABLED,approved:process.env.N4_VARGA_INDEPENDENT_REFERENCE_APPROVED};
 process.env.N4_VARGA_AI_ENABLED='1';process.env.N4_VARGA_INDEPENDENT_REFERENCE_APPROVED='1';
 let calls=0,diagnostics=[];
 const rich=(include)=>{
  const sentences=['## A grounded Vedic consultation',
   'Different ways of approaching responsibility become visible when resources, discipline and family duties must share the same attention. '+
   'The chart presents a symbolic framework for reflecting on choices, not a record of events.',
   'In D1, the ascendant and its ruler describe the starting conditions. The Moon adds a lens for daily rhythm. '+
   'An opportunity is to build a clear agreement; the friction is that good intentions alone do not organize a shared budget.',
   'In D9 a partnership can be understood through repeated decisions rather than promises. '+
   'In D10 career responsibility can show itself when deadlines compete with careful training.',
   include?('D'+themes[0].division+' and D'+themes[1].division+
    ' illustrate a distinct way to make a choice. For example, write down the commitments before agreeing to take on a new role. '):'',
   'A constructive next step is to keep a short weekly review of responsibilities, and to ask for specific feedback before making a new commitment. '+
   'A second practice is to compare two feasible options by their time cost, not by an unsupported prediction.'];
  return Array(3).fill(sentences.join('\n\n')).join('\n\n')+'.';
 };
 try{
  const result=await generateDirectJyotish(chart,'en','2026-11-04',{
   order:['gemini'],keys:{gemini:'unit-test-only'},freeConfirmed:{gemini:true},limit:()=>true,
   onDiagnostic:d=>diagnostics.push(d),
   fetcher:async(_url,init)=>{
    calls++;
    const payload=JSON.parse(init.body);
    const prompt=payload.messages.map(m=>m.content).join('\n');
    assert.ok(prompt.includes('N4 EDITORIAL BRIEF')&&prompt.includes('D1 H'));
    assert.ok(!prompt.includes('2000-01-01T12:00')&&!prompt.includes('49.2'));
    return new Response(JSON.stringify({model:'test-mock',choices:[{finish_reason:'stop',message:{content:rich(calls>1)}}]}),{status:200});
   }
  });
  assert.equal(calls,2,'one corrective retry is bounded');
  assert.ok(diagnostics.some(d=>d.stage==='validation'&&d.reason.includes('n4_missing_two_evidenced_lenses')));
  assert.equal(result.result?.model,'test-mock');
  assert.match(result.result.text,new RegExp('D'+themes[0].division));
 }finally{
  if(saved.enabled===undefined)delete process.env.N4_VARGA_AI_ENABLED;else process.env.N4_VARGA_AI_ENABLED=saved.enabled;
  if(saved.approved===undefined)delete process.env.N4_VARGA_INDEPENDENT_REFERENCE_APPROVED;else process.env.N4_VARGA_INDEPENDENT_REFERENCE_APPROVED=saved.approved;
 }
});
