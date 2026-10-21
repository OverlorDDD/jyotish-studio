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
const chapters=(prefix='A reflection on the relationships among the chart factors points toward a careful interpretation of personal priorities and how those priorities can be managed over time. ')=>CHAPTER_IDS.map(id=>({id,paragraphs:[prefix.repeat(3),prefix.repeat(3)]}));
test('A8.9: sourced calculations and one cross-chapter narrative plan',()=>{
 const g=graph(),claims=buildSupportedClaims(g),p=planConsultation(g,claims,'uk');
 assert.equal(claims.filter(c=>c.kind==='lordship').length,12);
 assert.ok(claims.some(c=>c.id==='D1.dispositor.Mars'));
 assert.ok(claims.every(c=>c.reviewStatus==='calculation_verified'));
 assert.ok(p.themes.length>=3&&p.themes.length<=5);
 assert.match(p.thesis,/Раку/);
 assert.equal(p.chapterClaims.career.includes('D1.house-lord.10'),true);
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
