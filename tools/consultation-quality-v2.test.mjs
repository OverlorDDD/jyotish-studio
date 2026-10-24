import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {buildChartFactGraph} from '../apps/api/src/consultation-fact-graph.ts';
import {planConsultationQuality,compactQualityBrief,CONSULTATION_QUALITY_VERSION} from '../apps/api/src/consultation-quality-v2.ts';
import {DIRECT_JYOTISH_INSTRUCTION,DIRECT_JYOTISH_VERSION,compactJyotishFacts} from '../apps/api/src/direct-jyotish.ts';
const INPUT={date:'2000-01-01',time:'12:00',timeZone:'UTC',latitude:0,longitude:0};
const grahas=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const degrees=[255,72,345,350,15,220,18,120,300];
function chart(lagnaSign){
 const asc=(lagnaSign-1)*30+5;
 return calculateChart(INPUT,{ayanamsa:23.8,ascendant:asc,
  positions:grahas.map((name,i)=>({name,longitude:degrees[i],speed:1})),
  julianDay:2451545,backend:'synthetic'});
}
const get=(plan,focus)=>plan.themes.find(x=>x.focus===focus);
test('CQv2 Pisces: Jupiter rules BOTH first and tenth; Saturn in Aries is difficult without inventing cancellation',()=>{
 const c=chart(12),q=planConsultationQuality(c,'2026-10-22');
 assert.equal(q.version,CONSULTATION_QUALITY_VERSION);
 assert.equal(q.themes.length,6);
 assert.ok(q.anchorFacts.some(x=>x.includes('SAME planet rules both first and tenth')));
 assert.ok(q.anchorFacts.some(x=>x.includes('Jupiter')));
 const career=get(q,'career'),resources=get(q,'resources');
 assert.ok(career.supporting.concat(career.challenging,career.mixed).some(f=>f.statement.includes('1+10')));
 assert.ok(resources.challenging.some(f=>f.statement.includes('Saturn')&&f.statement.includes('debilitation')));
 const claims=q.themes.flatMap(t=>[...t.supporting,...t.challenging,...t.mixed]).map(f=>f.statement).join(' ');
 assert.doesNotMatch(claims,/confirmed neecha[- ]?bhanga|guaranteed catastrophe|death prediction/i);
 assert.ok(q.themes.every(t=>t.recommendation.length>=35));
});
test('all 12 ascendants produce verified evidence, bounded chart-specific plans',()=>{
 const fingerprints=new Set();
 for(let i=1;i<=12;i++){
  const c=chart(i),g=buildChartFactGraph(c,'2026-10-22');
  const facts=new Set(g.nodes.map(x=>x.id)),p=planConsultationQuality(c,'2026-10-22');
  for(const theme of p.themes)for(const item of [...theme.supporting,...theme.challenging,...theme.mixed]){
   assert.ok(item.weight>0);
   assert.ok(item.evidence.length>0);
   assert.ok(item.evidence.every(id=>facts.has(id)),i+': '+item.id);
  }
  const brief=compactQualityBrief(p);
  assert.ok(brief.length<5200,i);
  assert.ok(brief.includes('CONSULTATION_QUALITY cqv2.0'));
  assert.ok(brief.includes('D1 lagna sign '+i));
  assert.ok(brief.includes('D1 tenth lord'));
  for(const topic of ['identity','relationships','career','resources','inner-life','timing'])
   assert.ok(brief.includes('THEME '+topic),i+': missing '+topic);
  fingerprints.add(brief);
 }
 assert.equal(fingerprints.size,12);
});
test('one direct prompt remains the fixed only-writer contract without eight strict chapters',()=>{
 assert.equal(DIRECT_JYOTISH_VERSION,'direct-v2');
 assert.match(DIRECT_JYOTISH_INSTRUCTION,/SHADOW\/FRICTION/);
 assert.match(DIRECT_JYOTISH_INSTRUCTION,/PLAUSIBLE RISK/);
 assert.match(DIRECT_JYOTISH_INSTRUCTION,/shared ruling planet joining 1st and 10th/);
 assert.match(DIRECT_JYOTISH_INSTRUCTION,/Only return the completed Markdown consultation/);
 assert.doesNotMatch(DIRECT_JYOTISH_INSTRUCTION,/exactly eight|8 required chapters|editor call/i);
});
test('facts and quality planner do not reveal raw birth input',()=>{
 const c=chart(12);
 const serialized=compactJyotishFacts(c,'2026-10-22')+'\n'+compactQualityBrief(planConsultationQuality(c,'2026-10-22'));
 assert.ok(serialized.length<13000);
 assert.ok(!serialized.includes('2000-01-01'));
 assert.ok(!serialized.includes('latitude='));
 assert.ok(!serialized.includes('longitude='));
 assert.ok(!serialized.includes('timeZone='));
});
