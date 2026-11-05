import test from 'node:test';
import assert from 'node:assert/strict';
import {SHODASHAVARGA,VARGA_PROFILE,vargaSign,vargaPart,
 vargaBoundaryDistanceArcseconds,calculateAllVargas,calculateVargaFromLongitudes,
 compareSampledVargaStability,type VargaNumber} from './vargas.ts';
import {divisionalLongitude} from './index.ts';
const mod=(x:number,n:number)=>((x%n)+n)%n;
const NAMES=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const points=(seed:number)=>NAMES.map((name,i)=>({name,longitude:mod((seed+1)*17.3711+i*37.20977+i*i*.0137,360),speed:i%4===0?-.1:.1}));
test('Exactly 16 canonical Shodashavarga and versioned D60 profile',()=>{
 assert.deepEqual(SHODASHAVARGA,[1,2,3,4,7,9,10,12,16,20,24,27,30,40,45,60]);
 assert.match(VARGA_PROFILE,/jhora-style-d60/);
 assert.throws(()=>vargaSign(20,8 as VargaNumber),/Unsupported/);
 for(const v of [NaN,Infinity,-Infinity])assert.throws(()=>vargaSign(v,9),/finite/);
});
test('Legacy D9 and D10 parity across 20,000 positions',()=>{
 for(const d of [9,10] as const)for(let i=0;i<10000;i++){
  const lon=mod(i*.03731743+.0001347,360);
  assert.equal(vargaSign(lon,d),Math.floor(mod(divisionalLongitude(lon,d),360)/30));
 }
});
test('Hora D2 odd/even signs, first/second halves',()=>{
 for(const [lon,expected] of [[8,4],[22,3],[38,3],[52,4],[0,4],[15,3],[30,3],[45,4]])
  assert.equal(vargaSign(lon,2),expected);
});
test('Trimshamsha D30 unequal boundaries both parities',()=>{
 const odd=[{a:0,b:5,s:0},{a:5,b:10,s:10},{a:10,b:18,s:8},{a:18,b:25,s:2},{a:25,b:30,s:6}];
 const even=[{a:0,b:5,s:1},{a:5,b:12,s:5},{a:12,b:20,s:11},{a:20,b:25,s:9},{a:25,b:30,s:7}];
 for(const [base,table] of [[0,odd],[30,even]] as const)
  for(let i=0;i<table.length;i++){
   assert.equal(vargaSign(base+table[i].a,30),table[i].s);
   assert.equal(vargaSign(base+(table[i].a+table[i].b)/2,30),table[i].s);
   assert.equal(vargaSign(base+table[i].b-1e-7,30),table[i].s);
   assert.equal(vargaPart(base+table[i].a,30),i);
  }
});
test('Six published synthetic D60 sign examples pin JHora-style sign count',()=>{
 for(const [lon,s] of [[346.4685,7],[256.8657,5],[306.4655,10],
   [226.1275,3],[272.0133,1],[71.4557,0]])assert.equal(vargaSign(lon,60),s);
});
test('All uniform starting-sign conventions',()=>{
 const cases:[VargaNumber,number,number][]=[
  [3,0,0],[3,10,4],[3,20,8],[4,0,0],[4,8,3],[4,16,6],[4,24,9],
  [7,0,0],[7,30,7],[12,30,1],[12,32.5,2],
  [16,0,0],[16,30,4],[16,60,8],[20,0,0],[20,30,8],[20,60,4],
  [24,0,4],[24,30,3],[27,0,0],[27,30,3],[27,60,6],[27,90,9],
  [40,0,0],[40,30,6],[45,0,0],[45,30,4],[45,60,8]
 ];
 for(const [d,lon,s] of cases)assert.equal(vargaSign(lon,d),s,`D${d} at ${lon} degrees`);
});
test('D24 forward even-sign profile and D27 positional cycle',()=>{
 assert.equal(vargaSign(0,24),4);assert.equal(vargaSign(30,24),3);
 assert.equal(vargaSign(31.25,24),4);assert.equal(vargaSign(33.75,24),6);
 assert.equal(vargaSign(11,27),9);assert.equal(vargaSign(41,27),0);
 assert.equal(vargaSign(60,27),6);assert.equal(vargaSign(90,27),9);
});
test('Sector boundaries from both sides and 360-degree normalization',()=>{
 for(const d of SHODASHAVARGA.filter(x=>x!==30)){
  for(let s=0;s<12;s++)for(let p=1;p<d;p++){
   const longitude=s*30+p*30/d;
   assert.ok(vargaSign(longitude-1e-7,d)>=0);
   assert.ok(vargaSign(longitude,d)>=0);
   assert.ok(vargaBoundaryDistanceArcseconds(longitude,d)<.01);
  }
 }
 for(const d of SHODASHAVARGA)for(let i=0;i<150;i++){
  const lon=(i*3007+17)/997;
  assert.equal(vargaSign(lon,d),vargaSign(lon+360,d));
  assert.equal(vargaSign(lon,d),vargaSign(lon-720,d));
 }
});
test('50 synthetic cases yield 8000 internally consistent placements; NOT external certification',()=>{
 let count=0;
 for(let i=0;i<50;i++){
  const charts=calculateAllVargas(mod(i*6.928141+.19243,360),points(i));
  assert.equal(charts.length,16);
  for(const chart of charts){
   assert.equal(chart.certification,'internal_rules_only_external_reference_pending');
   assert.equal(chart.planets.length,9);assert.equal(chart.lagna.house,1);
   for(const p of [chart.lagna,...chart.planets]){
    assert.ok(p.vargaSign>=1&&p.vargaSign<=12);
    assert.equal(p.house,mod(p.vargaSign-chart.lagna.vargaSign,12)+1);
    assert.equal(p.vargaSign,vargaSign(p.birthLongitude,chart.division)+1);
    assert.ok(Number.isFinite(p.boundaryDistanceArcseconds));count++;
   }
  }
 }
 assert.equal(count,8000);
});
test('Input validation, deterministic output, immutable derived charts',()=>{
 assert.throws(()=>calculateVargaFromLongitudes(9,20,points(1).slice(1)),/nine/);
 assert.throws(()=>calculateVargaFromLongitudes(9,20,[...points(1).slice(0,8),points(1)[0]]),/duplicate/);
 assert.throws(()=>calculateVargaFromLongitudes(9,NaN,points(1)),/finite/);
 const a=calculateAllVargas(11.2,points(1)),b=calculateAllVargas(11.2,points(1));
 assert.deepEqual(a,b);assert.ok(Object.isFrozen(a));
 assert.ok(Object.isFrozen(a[0]));assert.ok(Object.isFrozen(a[0].planets[0]));
});
test('Sampled time sensitivity identifies changed D60 Lagna without inventing minute precision',()=>{
 const base=points(1);
 const result=compareSampledVargaStability([
  {offsetMinutes:-2,ascendantLongitude:10,points:base},
  {offsetMinutes:0,ascendantLongitude:10.1,points:base},
  {offsetMinutes:2,ascendantLongitude:10.6,points:base}
 ]);
 assert.equal(result.length,16);
 assert.equal(result.find(x=>x.division===1)?.lagnaChanged,false);
 assert.equal(result.find(x=>x.division===60)?.lagnaChanged,true);
 assert.ok(result.every(x=>x.method==='sampled_ephemeris_positions_only'));
 assert.throws(()=>compareSampledVargaStability([
  {offsetMinutes:1,ascendantLongitude:10,points:base},
  {offsetMinutes:1,ascendantLongitude:11,points:base}]),/unique/);
});

test('D60 exact all-720 half-degree cell matrix and boundary-side geometry independent of LLM',()=>{
 const counts=Array<number>(12).fill(0);
 let checked=0;
 for(let sign=0;sign<12;sign++)for(let part=0;part<60;part++){
  const left=30*sign+0.5*part;
  const expected=(sign+part)%12;
  for(const offset of [1e-7,0.25,0.5-1e-7]){
   assert.equal(vargaSign(left+offset,60),expected,
    'D60 sign='+sign+' cell='+part+' position='+offset);
   assert.equal(vargaPart(left+offset,60),part);
   checked++;
  }
  counts[expected]++;
  // A sector midpoint is precisely 0.25 deg from the next/previous edge.
  assert.ok(Math.abs(vargaBoundaryDistanceArcseconds(left+0.25,60)-900)<0.01);
 }
 assert.equal(checked,2160);
 assert.deepEqual(counts,Array(12).fill(60));
 // 359.999999 deg and 0.000001 deg belong to different pinned D60 parts.
 assert.notEqual(vargaSign(359.999999,60),vargaSign(0.000001,60));
});
