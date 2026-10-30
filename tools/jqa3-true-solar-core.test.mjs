import test from 'node:test';
import assert from 'node:assert/strict';
import {findSiderealSolarCross,vimshottariTrueSiderealSolar} from '../packages/jyotish-core/src/solar-dasha.ts';
const msDay=86400000,jdUnix=2440587.5;
const hypotheticalYear=365.25636;
const sun=(jd)=>({
 longitude:((jd-jdUnix)*360/hypotheticalYear%360+360)%360,
 longitudeSpeed:360/hypotheticalYear
});
test('solar crossing solves rather than invents a fixed calendar offset',()=>{
 const jd=2451545;
 for(const years of [0.001,0.015,0.2,0.5,1,7,19,20]){
  const end=findSiderealSolarCross(sun,jd,years,1);
  assert.ok(Math.abs(end-jd-years*hypotheticalYear)<1e-6);
  const start=findSiderealSolarCross(sun,jd,years,-1);
  assert.ok(Math.abs(start-jd+years*hypotheticalYear)<1e-6);
 }
});
test('true sidereal solar periods are fully ordered, non-overlapping and UTC',()=>{
 const birth='2002-06-12T09:05:00Z';
 const periods=vimshottariTrueSiderealSolar(74.32884722222222,birth,sun);
 assert.equal(periods.length,9);
 for(let i=0;i<9;i++){
  const x=periods[i];assert.equal(x.antardashas.length,9);
  assert.equal(x.antardashas[0].start,x.start);
  assert.equal(x.antardashas[8].end,x.end);
  assert.ok(Date.parse(x.start)<Date.parse(x.end));
  if(i)assert.equal(periods[i-1].end,x.start);
  for(let j=1;j<9;j++)assert.equal(x.antardashas[j-1].end,x.antardashas[j].start);
 }
});
test('invalid solar speed or untrusted numeric output fails closed',()=>{
 assert.throws(()=>vimshottariTrueSiderealSolar(100,'not-a-date',sun));
 assert.throws(()=>findSiderealSolarCross(()=>({longitude:3,longitudeSpeed:0}),2451545,1,1));
});
