/** Independent output parity, not certification of sub-day JHora instants.
 * Native current Swiss data + pure deterministic TS root solver compared with
 * 20 genuine (SHA-pinned) JHora 8 original printed calendar dates.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {vimshottariTrueSiderealSolar} from '../packages/jyotish-core/src/solar-dasha.ts';
import {assertSwissReturnFlags} from '../apps/api/src/swiss-backend-policy.ts';
const sw=await import('@swisseph/node');
const flag=sw.CalculationFlag.SwissEphemeris|sw.CalculationFlag.Speed|65536;
sw.setSiderealMode(sw.SiderealMode.Lahiri);
const sunAt=(jd)=>{
 const p=sw.calculatePosition(jd,sw.Planet.Sun,flag);
 assertSwissReturnFlags(p.flags,'SolarDasha.Sun');
 return {longitude:p.longitude,longitudeSpeed:p.longitudeSpeed};
};
const fmt=(utc,offset)=>new Date(Date.parse(utc)+offset*1000+30000).toISOString().slice(0,10);
function source(id){
 const fixture=JSON.parse(readFileSync(new URL('../tests/fixtures/jhora-corpus/'+id+'.json',import.meta.url),'utf8'));
 const capture=JSON.parse(readFileSync(new URL('../tests/fixtures/jhora-corpus/captures/'+id+'/capture.json',import.meta.url),'utf8'));
 return {fixture,offset:capture.utcOffsetSeconds};
}
test('20 authentic JHora date tables match independent native solar-Sun solver, without editing source',()=>{
 let maha=0,antara=0;const missed=[];
 for(let n=1;n<=20;n++){
  const id='jqa3-'+String(n).padStart(2,'0'),{fixture,offset}=source(id);
  const periods=vimshottariTrueSiderealSolar(fixture.expected.positions.Moon.longitude,fixture.civilTime.birthUtc,sunAt);
  assert.equal(periods.length,9);
  for(let i=0;i<9;i++){
   const expected=fixture.expected.vimshottari[i],got=periods[i];
   assert.equal(got.lord,expected.lord,id+' dasha lord');
   const d=fmt(got.start,offset);
   if(d===expected.start)maha++;else missed.push({id,maha:got.lord,observed:d,expected:expected.start});
   for(let k=0;k<9;k++){
    const sub=got.antardashas[k],day=fmt(sub.start,offset);
    if(day===expected.antardashas[sub.lord])antara++;
    else missed.push({id,maha:got.lord,antara:sub.lord,observed:day,expected:expected.antardashas[sub.lord]});
   }
  }
 }
 console.log('Independent native true-solar calendar comparison',JSON.stringify({maha,antara,missed}));
 assert.equal(maha,180,'every original JHora Mahadasha date must match');
 assert.equal(antara,1620,'every original JHora Antardasha date must match');
});
