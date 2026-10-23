import test from 'node:test';
import assert from 'node:assert/strict';
import {divisionalLongitude,signIndex} from '../packages/jyotish-core/src/index.ts';
import {d10JHoraFiveEight,readJhoraBenchmark,runJhoraIndependentBenchmark} from './jhora-independent-parity.mjs';

const sign=lon=>signIndex(lon)+1;
const mod=(a,b=12)=>((a%b)+b)%b;
// Independent textbook definitions; do not call the production varga formula
// on both sides of an assertion.
function navamsaByModality(s,part){
 // s=0 Aries … 11 Pisces: movable, fixed, dual by s%3.
 const start=s%3===0?s:s%3===1?s+8:s+4;
 return mod(start+part)+1;
}
function dasamsaNineForward(s,part){
 return mod((s%2===0?s:s+8)+part)+1;
}
function dasamsaFiveEight(s,part){
 return mod((s%2===0?s:s+4)+(s%2===0?part:-part))+1;
}
test('one REAL independent JHora 8.0 export matches D1 10/10 D9 10/10 D10 10/10 using its true nodes and documented D10 variant',()=>{
 const x=runJhoraIndependentBenchmark(),m=x.matched.counts;
 assert.deepEqual([m.d1SignMatches,m.d9GalaxioraSignMatches,m.d10GalaxioraVsJHora5_8SignMatches],[10,10,10]);
 assert.deepEqual([m.d9IndependentSourceRuleMatches,m.d10IndependentFiveEightRuleMatches],[10,10]);
 assert.equal(x.matched.rows.length,10);
 assert.equal(x.matched.rows.filter(r=>r.d1Observed===r.d1Reference&&r.d9Observed===r.d9Reference&&r.d10GalaxioraOneNine===r.d10JhoraFiveEight).length,10);
});
test('regression control cannot hide differences between Galaxiora and JHora configuration',()=>{
 const x=runJhoraIndependentBenchmark();
 assert.deepEqual([x.baseline.counts.d9GalaxioraSignMatches,x.baseline.counts.d10GalaxioraVsJHora5_8SignMatches],[8,7]);
 assert.deepEqual(x.baseline.rows.filter(r=>r.d9Observed!==r.d9Reference).map(r=>r.name),['Rahu','Ketu']);
 assert.deepEqual(x.baseline.rows.filter(r=>r.d10GalaxioraOneNine!==r.d10JhoraFiveEight).map(r=>r.name),['Sun','Moon','Saturn']);
 assert.ok(x.restrictions.some(x=>x.includes('not 1-arcsecond')));
});
test('wide independent D9 map: 12 signs x 9 divisions x 5 interior samples (540/540)',()=>{
 let checked=0;
 for(let s=0;s<12;s++)for(let part=0;part<9;part++){
  const expected=navamsaByModality(s,part);
  for(const inside of [0.000001,0.1,0.37,0.75,0.999999]){
   const lon=s*30+(part+inside)*30/9;
   assert.equal(sign(divisionalLongitude(lon,9)),expected,`D9 s=${s} p=${part} at ${lon}`);
   checked++;
  }
 }
 assert.equal(checked,540);
});
test('wide independent D10 1-9 map: 12 signs x 10 divisions x 5 interior samples (600/600)',()=>{
 let checked=0;
 for(let s=0;s<12;s++)for(let part=0;part<10;part++){
  const expected=dasamsaNineForward(s,part);
  for(const inside of [0.000001,0.1,0.37,0.75,0.999999]){
   const lon=s*30+(part+inside)*3;
   assert.equal(sign(divisionalLongitude(lon,10)),expected,`Galaxiora D10 s=${s} p=${part}`);
   checked++;
  }
 }
 assert.equal(checked,600);
});
test('wide independent JHora D10 5-8 map: 12 signs x 10 divisions x 5 interior samples (600/600)',()=>{
 let checked=0;
 for(let s=0;s<12;s++)for(let part=0;part<10;part++){
  const expected=dasamsaFiveEight(s,part);
  for(const inside of [0.000001,0.1,0.37,0.75,0.999999]){
   const lon=s*30+(part+inside)*3;
   assert.equal(d10JHoraFiveEight(lon),expected,`JHora D10 s=${s} p=${part}`);
   checked++;
  }
 }
 assert.equal(checked,600);
});
test('boundary edges 0/30/360 and nearest inside each subdivision remain deterministic',()=>{
 for(let s=0;s<12;s++){
  for(const p of [0,1,8,9]){
   const n=p===9?10:9;
   const part=Math.min(p,n-1);
   const start=s*30+part*30/n;
   const near=start+0.0000003;
   const expected=n===9?navamsaByModality(s,part):dasamsaNineForward(s,part);
   assert.equal(sign(divisionalLongitude(near,n)),expected);
  }
 }
 assert.equal(sign(divisionalLongitude(0,9)),1);
 assert.equal(sign(divisionalLongitude(360,9)),1);
 assert.equal(sign(divisionalLongitude(0,10)),1);
 assert.equal(sign(divisionalLongitude(360,10)),1);
});
test('independent export may not be inferred to match production ayanamsa, nodes or calendar convention',()=>{
 const f=readJhoraBenchmark();
 assert.equal(Object.keys(f.expected.positions).length,10);
 assert.match(f.independentSource.ayanamsaProfile,/True Lahiri/);
 assert.match(f.independentSource.d10Profile,/5-8/);
 assert.equal(f.comparisonProfile.galaxiora.nodes,'Mean Rahu/Ketu');
 assert.equal(f.comparisonProfile.galaxiora.dashaYearDays,365.2425);
});
