/**
 * Matched-input / matched-methods parity — never change expected output to
 * match the implementation. All expected signs are captured independently.
 * Tier 1 = real JHora 8 clipboard export.
 * Tier 2 = PyJHora 4.8.7 reference from another implementation, NOT real JHora.
 *
 * Invariant: 10/10 does NOT claim that actual user natal longitudes, ayanamsa,
 * mean-vs-true nodes or Vimshottari dates match a JHora executable run.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {divisionalLongitude,signIndex} from '../packages/jyotish-core/src/index.ts';
import {d10JHoraFiveEight,readJhoraBenchmark} from './jhora-independent-parity.mjs';
const all=['Lagna','Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const byName=new Map(signs.map((s,i)=>[s,i+1]));
const jhora=readJhoraBenchmark();
const pyjhora=JSON.parse(readFileSync(new URL('../tests/fixtures/pyjhora-pvr-1972-independent.json',import.meta.url)));
const d9=lon=>signIndex(divisionalLongitude(lon,9))+1;
const d10=lon=>signIndex(divisionalLongitude(lon,10))+1;
function evaluateSet(dataset,readLongitude,getExpected,project,scope){
 const entries=all.map(name=>({
  name,expected:getExpected(name),actual:project(readLongitude(name))
 }));
 const wrong=entries.filter(x=>x.expected!==x.actual);
 assert.equal(wrong.length,0,
  scope+' parity failed:\n'+wrong.map(x=>x.name+': expected '+x.expected+' actual '+x.actual).join('\n'));
 assert.equal(entries.length,10,scope+' incomplete input');
 return {matched:entries.length,total:entries.length,ref:dataset};
}
const degJHora=name=>jhora.expected.positions[name].longitude;
const degPy=name=>name==='Lagna'?pyjhora.expected.lagna_longitude:pyjhora.expected.graha_longitudes[name];
const pyExpected=(scope,name)=>{
 const value=pyjhora.expected[scope][name];
 assert.ok(byName.has(value),'Unknown external sign '+name+' '+value);
 return byName.get(value);
};
/** Independently specified textbook count from a sign's category.
 * This reference logic does not call divisonalLongitude and tests all parts. */
const signFromParts=(sid,n,part)=>{
 assert.ok(sid>=0&&sid<12&&part>=0&&part<n);
 if(n===9){
  const movable=(sid%3===0);
  const fixed=(sid%3===1);
  return ((sid+(movable?0:fixed?8:4)+part)%12)+1;
 }
 if(n===10){
  const start=sid%2===0?sid:(sid+8)%12;
  return ((start+part)%12)+1;
 }
 throw Error('unsupported divisional');
};
function outcome(mode){
 return mode==='realJhoraD9'?evaluateSet('real_JHora_8',degJHora,name=>jhora.expected.positions[name].d9,d9,'real JHora D9'):
 mode==='realJhoraD10variant'?evaluateSet('real_JHora_8_D10_5_8',degJHora,name=>jhora.expected.positions[name].d10_5_8,d10JHoraFiveEight,'real JHora D10 5-8'):
 mode==='pyjhoraD9'?evaluateSet('PyJHora_4.8.7',degPy,name=>pyExpected('D9',name),d9,'PyJHora D9'):
 mode==='pyjhoraD10'?evaluateSet('PyJHora_4.8.7',degPy,name=>pyExpected('D10',name),d10,'PyJHora D10 1-9'):null;
}
const scopes=['realJhoraD9','realJhoraD10variant','pyjhoraD9','pyjhoraD10'];
test('two external sources: matched data and matching methods produce exactly 10/10 x4',()=>{
 const groups=scopes.map(outcome);
 assert.deepEqual(groups.map(g=>g.matched),[10,10,10,10]);
 assert.equal(groups.reduce((n,g)=>n+g.matched,0),40);
 console.log('MATCHED_METHOD_EXTERNAL_PARITY '+JSON.stringify(Object.fromEntries(scopes.map((k,i)=>[k,groups[i].matched+'/'+groups[i].total]))));
});
test('reference provenance rejects accidental substitution of own generated fixtures',()=>{
 assert.equal(jhora.independentSource.captureCommit,'f63826b501eabe69c6b08c5365875e1e2f74c24a');
 assert.match(jhora.independentSource.tool,/Jagannatha Hora 8.0/);
 assert.equal(pyjhora.source.commit,'a2d772a437626a9976611e1ec5cf6ff100cd5462');
 assert.equal(pyjhora.source.tier,2);
 assert.match(pyjhora.source.note,/NOT Jagannatha Hora itself/);
 assert.equal(jhora.expected.positions.Rahu.d9,8);
 assert.equal(jhora.expected.positions.Saturn.d10_5_8,6);
});
test('all 12 zodiac signs x all D9 (108) and D10 (120) divisions agree with separately written textbook lookup',()=>{
 let n9=0,n10=0;
 for(let sid=0;sid<12;sid++){
  for(const [n,inc] of [[9,30/9],[10,3]]){
   for(let part=0;part<n;part++){
    const lon=sid*30+part*inc+inc*0.4;
    assert.equal(signIndex(divisionalLongitude(lon,n))+1,
     signFromParts(sid,n,part),`sign ${sid} D${n} part ${part+1}`);
    if(n===9)n9++;else n10++;
   }
  }
 }
 assert.equal(n9,108);assert.equal(n10,120);
});
test('D9 and D10 no off-by-one near every boundary; check below and above independently',()=>{
 let checked=0;
 for(let sid=0;sid<12;sid++){
  for(const n of [9,10]){
   const width=30/n;
   for(let part=1;part<n;part++){
    const center=sid*30+part*width;
    for(const signed of [-1,1]){
     const lon=center+signed*1e-7,expectedPart=part+(signed>0?0:-1);
     assert.equal(signIndex(divisionalLongitude(lon,n))+1,
      signFromParts(sid,n,expectedPart),
      `D${n} boundary sign ${sid} part ${part} delta ${signed}`);
     checked++;
    }
   }
  }
 }
 assert.equal(checked,12*(8+9)*2);
});
test('JHora alternative D10(5-8) is exact on all 12 signs x 10 parts, distinct from active D10(1-9)',()=>{
 let checked=0,different=0;
 for(let sid=0;sid<12;sid++){
  for(let part=0;part<10;part++){
   const lon=sid*30+part*3+1.2;
   const expected=sid%2===0?(sid+part)%12+1:(sid+4-part+120)%12+1;
   const actual=d10JHoraFiveEight(lon);
   assert.equal(actual,expected);
   if(actual!==d10(lon))different++;
   checked++;
  }
 }
 assert.equal(checked,120);
 assert.ok(different>0,'JHora variant MUST differ for some cases: otherwise accidentally forced a method');
});
test('unknown varga method must not be silently switched to JHora 5-8 in production',()=>{
 const m=readFileSync(new URL('../packages/jyotish-core/src/index.ts',import.meta.url),'utf8');
 assert.match(m,/export function divisionalLongitude/);
 assert.match(m,/division===9/);
 assert.doesNotMatch(m,/d10JHoraFiveEight/);
});
