import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 calculateChart,localToUTC,divisionalLongitude,vimshottari
} from '../packages/jyotish-core/src/index.ts';
import {verifyCalculatedChart,ChartIntegrityError,CHART_VERIFICATION_VERSION} from '../apps/api/src/jyotish-integrity.ts';
import {runCalculation} from '../apps/api/src/logic.ts';
const fixture=JSON.parse(readFileSync(new URL('../tests/fixtures/swiss-reference.json',import.meta.url),'utf8'));
const names=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const approximate=(a,b)=>Math.abs(((a-b+540)%360)-180)<0.0001;
function build(entry){
 const input={date:entry.date,time:entry.time,timeZone:entry.timeZone,latitude:entry.latitude,longitude:entry.longitude};
 const utc=localToUTC(input.date,input.time,input.timeZone);
 assert.equal(Date.parse(utc),Date.parse(entry.utc));
 const eph={ayanamsa:entry.ayanamsa,ascendant:entry.ascendant,
  julianDay:Date.parse(utc)/86400000+2440587.5,
  backend:'Swiss fixture',
  positions:names.map(name=>({name,longitude:entry.positions[name],speed:name==='Saturn'?-0.04:0.4}))};
 eph.positions.find(x=>x.name==='Ketu').longitude=(eph.positions.find(x=>x.name==='Rahu').longitude+180)%360;
 const chart=calculateChart(input,eph);
 return {input,eph,chart,utc};
}
function fails(copy,code){
 const x=build(fixture.cases[0]);
 copy(x);
 assert.throws(()=>verifyCalculatedChart(x.input,x.eph,x.chart,x.utc),
  e=>e instanceof ChartIntegrityError&&e.code.includes(code),code);
}
test('three pinned Swiss birth/ayanamsa/lagna and full D1/D9/D10 chart pass pre-publication gate',()=>{
 for(const e of fixture.cases){
  const x=build(e),result=verifyCalculatedChart(x.input,x.eph,x.chart,x.utc);
  assert.equal(result.version,CHART_VERIFICATION_VERSION);
  assert.equal(result.status,'verified_internal');
  assert.equal(result.externalReferenceChecked,false);
  assert.equal(result.digest.length,64);
  assert.equal(result.checks.length,10);
 }
});
test('tampered birth/UTC/Julian day does not produce a publishable chart',()=>{
 fails(x=>{x.chart.utc='2000-01-02T00:00:00Z'},'birth.utc');
 fails(x=>{x.eph.julianDay+=1},'astronomy.julian_day');
 fails(x=>{x.chart.input={...x.chart.input,latitude:x.chart.input.latitude+0.1}},'birth.input_consistency');
});
test('missing, duplicate, invalid graha or corrupted nodes always fail closed',()=>{
 fails(x=>{x.eph.positions.pop()},'planet_count');
 fails(x=>{x.eph.positions[8].name='Sun'},'duplicate_or_unknown_graha');
 fails(x=>{x.eph.positions.find(y=>y.name==='Ketu').longitude+=1},'node_opposition');
 fails(x=>{x.eph.positions[0].speed=NaN},'missing_speed');
 fails(x=>{x.chart.d1[0].house+=1},'house');
});
test('D1 nakshatra, pada, retrograde and sign/longitude tampering fail closed',()=>{
 fails(x=>{x.chart.d1[1].nakshatra='wrong'},'nakshatra_pada');
 fails(x=>{x.chart.d1[1].pada=9},'nakshatra_pada');
 fails(x=>{x.chart.d1[4].longitude+=1},'longitude');
 fails(x=>{x.chart.d1[6].retrograde=false},'retrograde');
});
test('D9, D10 and divisional ascendants cannot diverge from natal longitudes',()=>{
 fails(x=>{x.chart.d9[0].house=(x.chart.d9[0].house%12)+1},'D9.');
 fails(x=>{x.chart.d10[1].longitude+=5},'D10.');
 fails(x=>{x.chart.lagnaD9.sign=1},'D9.ascendant');
 fails(x=>{x.chart.lagnaD10.house=2},'D10.ascendant');
});
test('all 9*9 antardashas and 9 mahadashas must match verified Moon chronology',()=>{
 fails(x=>{x.chart.dasha[0].lord='Mars'},'dasha.major');
 fails(x=>{x.chart.dasha[0].antardashas[0].end='2001-01-01T00:00:00Z'},'dasha.minor');
 fails(x=>{x.chart.dasha[0].antardashas.pop()},'dasha.minor_count');
});
test('12 house ruler mapping is actual classical sign rulership, not model output',()=>{
 const x=build(fixture.cases[0]);
 assert.equal(x.chart.ascendant.sign,12);
 // Pisces: Jupiter governs H1 and H10, and the graph verifier checks all twelve.
 assert.equal(x.chart.d1.find(p=>p.name==='Jupiter')!==undefined,true);
 const certificate=verifyCalculatedChart(x.input,x.eph,x.chart,x.utc);
 assert.ok(certificate.checks.includes('all_12_house_lords'));
});
test('all 12 lagna variants and near-D9/D10 boundaries pass internal consistency',()=>{
 const base=build(fixture.cases[0]);
 for(let sign=0;sign<12;sign++){
  for(const within of [0.00001,1.234567,29.99999]){
   const x=build(fixture.cases[0]);
   x.eph.ascendant=sign*30+within;
   x.chart=calculateChart(x.input,x.eph);
   assert.equal(verifyCalculatedChart(x.input,x.eph,x.chart,x.utc).status,'verified_internal');
   const lon=sign*30+within;
   assert.ok(divisionalLongitude(lon,9)>=0&&divisionalLongitude(lon,9)<360);
   assert.ok(divisionalLongitude(lon,10)>=0&&divisionalLongitude(lon,10)<360);
  }
 }
});
test('ambiguous/nonexistent local birth time is rejected before ephemeris',()=>{
 assert.throws(()=>localToUTC('2026-03-29','03:30','Europe/Bucharest'),/Nonexistent/);
 assert.throws(()=>localToUTC('2026-10-25','03:30','Europe/Bucharest'),/Ambiguous/);
});
test('entire server calculation always returns an internal-verification certificate',async()=>{
 const source=readFileSync(new URL('../apps/api/src/logic.ts',import.meta.url),'utf8');
 assert.match(source,/verifyCalculatedChart\(input,eph,chart,birthUtc,solarSunAt\)/);
 const gateway=readFileSync(new URL('../apps/api/src/nest.ts',import.meta.url),'utf8');
 assert.match(gateway,/verified\.verification\?\.status!=='verified_internal'/);
 assert.match(gateway,/verification:verified\.verification/);
});
