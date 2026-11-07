import test from 'node:test';
import {readFileSync} from 'node:fs';
import {loadCorpus,verifyReference} from './jqa3-corpus.mjs';
import assert from 'node:assert/strict';
import {solveN4SolarArcInstant,inspectN416LocalDashaResiduals,n418MoonPrintSensitivitySeconds} from './n4-dasha-true-solar-native.mjs';
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

test('JHora02 original Moon 0.01 arcsecond print half-step can shift a ten-year initial Dasa by ~32.873 seconds',()=>{
 const seconds=n418MoonPrintSensitivitySeconds({
  initialLordYears:10,roundingStepArcsec:0.01,solarYearDays:365.25636
 });
 assert.ok(Math.abs(seconds-32.8730724)<0.000001);
 assert.ok(seconds>14.382);
 assert.ok(seconds<60);
});
test('precision estimate refuses nonexistent or unphysical source step and first-period inputs',()=>{
 const valid={initialLordYears:10,roundingStepArcsec:0.01,solarYearDays:365.25636};
 for(const input of [
  {...valid,initialLordYears:0},
  {...valid,initialLordYears:21},
  {...valid,roundingStepArcsec:0},
  {...valid,roundingStepArcsec:2},
  {...valid,solarYearDays:NaN},
  {...valid,solarYearDays:360}
 ]) assert.throws(()=>n418MoonPrintSensitivitySeconds(input),/invalid source precision model/);
});

test('JQA3-02 raw original JHora Moon is genuinely printed at 0.01 arcsecond precision and SHA-bound',()=>{
 const r=loadCorpus().records.filter(x=>x.hasOriginalJHoraIni);
 assert.equal(r.length,20);
 assert.equal(r[1].id,'jqa3-02');
 const ref=verifyReference(r[1]); // verifies capture SHA256 and original Git blob SHA1
 const raw=readFileSync(new URL('../'+r[1].captureDir+'/chart_data.txt',import.meta.url),'utf8');
 const moon=raw.split(/\r?\n/).find(x=>/^Moon\s/.test(x));
 assert.match(moon,/17\s+Ta\s+34'\s+24\.61"/);
 assert.equal(ref.expected.positions.Moon.longitude,30+17+34/60+24.61/3600);
 const original=ref.expected.vimshottari.find(x=>x.lord==='Jupiter');
 assert.equal(original.antardashas.Ketu,'2018-11-15');
 assert.equal(ref.civilTime.birthUtc,'1982-08-14T00:20:00Z');
});
