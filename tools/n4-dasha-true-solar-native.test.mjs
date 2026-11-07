import test from 'node:test';
import assert from 'node:assert/strict';
import {solveN4SolarArcInstant,inspectN416LocalDashaResiduals} from './n4-dasha-true-solar-native.mjs';
const DAY=86400000;
test('solar longitude crossing agrees with constant solar period in analytic circular model',()=>{
 const yearDays=365.24219,center=Date.parse('2010-01-15T12:00:00Z');
 const sunAt=ms=>((ms-center)/DAY/yearDays*360%360+360)%360;
 for(const years of [-1.8,-0.4,0.4,1,6.2,19]){
  const root=solveN4SolarArcInstant({startMs:center,years,yearDays,getSun:sunAt});
  assert.ok(Math.abs(root-(center+years*yearDays*DAY))<2000,years);
 }
});
test('invalid solar bracket never produces a fake date',()=>{
 assert.throws(()=>solveN4SolarArcInstant({
  startMs:Date.now(),years:1,yearDays:365.24219,getSun:()=>15
 }),/cannot be bracketed/);
 assert.throws(()=>solveN4SolarArcInstant({
  startMs:0,years:0,yearDays:365.25,getSun:()=>15
 }),/invalid root inputs/);
});

test('a single held-out day mismatch reports genuine synthetic case, lord and distance to local midnight',()=>{
 const lords=['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'];
 const first=Date.parse('2026-01-01T21:59:50.000Z');
 const original=[],computed=[];
 for(let i=0;i<9;i++){
  const at=first+i*365*86400000;
  const subs=Object.fromEntries(lords.map((x,j)=>[x,at+j*86400000]));
  const expected=Object.fromEntries(lords.map((x,j)=>[
   x,new Date(subs[x]+2*3600000).toISOString().slice(0,10)
  ]));
  if(i===3)expected.Venus=new Date(subs.Venus+2*3600000-86400000).toISOString().slice(0,10); // one day earlier
  original.push({lord:lords[i],start:new Date(at+2*3600000).toISOString().slice(0,10),
   antardashas:expected});
  computed.push({lord:lords[i],start:at,subs});
 }
 const r=inspectN416LocalDashaResiduals({
  computed,original,offsetMs:7200000,caseIndex:7
 });
 assert.equal(r.length,1);
 assert.equal(r[0].sourceCaseIndex,8);
 assert.equal(r[0].level,'antardasha');
 assert.equal(r[0].majorLord,'Moon');
 assert.equal(r[0].minorLord,'Venus');
 assert.equal(r[0].deltaCalendarDays,1);
 assert.equal(r[0].localTimeInterpretation.includes('not independently proven historical IANA DST'),true);
 assert.equal(r[0].secondsToNearestLocalMidnight,10);
});
test('case date evidence cannot be invented from an incomplete source',()=>{
 assert.throws(()=>inspectN416LocalDashaResiduals({
  computed:[],original:[],offsetMs:0,caseIndex:0
 }),/invalid residual inspection/);
});

test('a major start date can duplicate its first subperiod discrepancy, never count as two minor failures',()=>{
 const lords=['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'];
 const base=Date.parse('2030-01-01T12:00:00.000Z');
 const computed=lords.map((lord,i)=>{
  const start=base+i*365*86400000;
  return {lord,start,subs:Object.fromEntries(lords.map((s,j)=>[s,start+j*86400000]))};
 });
 const original=computed.map(p=>({
  lord:p.lord,start:new Date(p.start).toISOString().slice(0,10),
  antardashas:Object.fromEntries(Object.entries(p.subs).map(([lord,at])=>[
   lord,new Date(at).toISOString().slice(0,10)
  ]))
 }));
 const previousDay=new Date(base-86400000).toISOString().slice(0,10);
 original[0].start=previousDay;
 original[0].antardashas.Ketu=previousDay;
 const r=inspectN416LocalDashaResiduals({computed,original,offsetMs:0,caseIndex:0});
 assert.equal(r.length,2);
 assert.equal(r.filter(x=>x.level==='mahadasha').length,1);
 assert.equal(r.filter(x=>x.level==='antardasha').length,1);
 assert.ok(r.every(x=>x.deltaCalendarDays===1));
});
