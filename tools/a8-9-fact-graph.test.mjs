import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {buildChartFactGraph,requireGraphFacts} from '../apps/api/src/consultation-fact-graph.ts';

const input={date:'2000-01-01',time:'12:00',timeZone:'UTC',latitude:0,longitude:0};
const positions=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']
 .map((name,i)=>({name,longitude:[335,72,345,350,255,15,332,120,300][i],speed:1}));
const make=()=>calculateChart(input,{ayanamsa:23.8,ascendant:100,positions,julianDay:2451545,backend:'synthetic'});

test('A8.9 fact graph: graph integrity, D1 lord/dispositor/aspect and D9/D10',()=>{
 const graph=buildChartFactGraph(make(),'2026-10-21');
 assert.equal(graph.version,'a8.9-facts-v1');
 assert.equal(graph.nodes.length,new Set(graph.nodes.map(n=>n.id)).size);
 const [lagna,ten,mars,dispositor,aspect]=requireGraphFacts(graph,[
  'D1.ascendant','D1.house-lord.10','D1.Mars','D1.dispositor.Mars','D1.aspect.Mars.4']);
 assert.equal(lagna.value.sign,4);
 assert.equal(ten.value.ruler,'Mars');
 assert.equal(mars.value.house,9);
 assert.equal(dispositor.value.dispositor,'Jupiter');
 assert.equal(aspect.value.targetHouse,12);
 assert.ok(graph.nodes.some(n=>n.id==='D9.Venus'));
 assert.ok(graph.nodes.some(n=>n.id==='D10.Mars'));
 assert.ok(!JSON.stringify(graph).includes('2000-01-01'));
 assert.ok(!JSON.stringify(graph).includes('latitude'));
 assert.deepEqual(buildChartFactGraph(make(),'2026-10-21'),graph);
});
test('A8.9 fact graph: refuses nonexistent facts, invalid dates, inconsistent input',()=>{
 const chart=make(),graph=buildChartFactGraph(chart,'2026-10-21');
 assert.throws(()=>requireGraphFacts(graph,['D1.yoga.nonexistent']),/Unsupported chart fact/);
 assert.throws(()=>buildChartFactGraph(chart,'2026-02-30'),/Invalid asOf/);
 chart.d9[0].house=11;
 assert.throws(()=>buildChartFactGraph(chart,'2026-10-21'),/D9 inconsistent/);
});
test('A8.9 fact graph: positions alter fingerprint without touching writer',()=>{
 const a=make(),b=make();
 b.d1.find(p=>p.name==='Mars').degreesInSign+=1;
 assert.throws(()=>buildChartFactGraph(b,'2026-10-21'),/degree mismatch/);
 assert.equal(buildChartFactGraph(a,'2026-10-21').nodes.filter(n=>n.kind==='house-lord').length,12);
});
