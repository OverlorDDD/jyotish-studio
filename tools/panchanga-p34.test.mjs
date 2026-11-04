import test from 'node:test';
import assert from 'node:assert/strict';
import {interpretPanchanga} from '../apps/web/lib/panchanga-p32-engine.ts';
import {p34Boundaries,buildP34Timeline} from '../apps/web/lib/panchanga-p34-time-guidance.ts';

const point={date:'2026-11-02',timeZone:'Europe/Kyiv',latitude:'50.4501',longitude:'30.5234'};
const sunrise='2026-11-02T04:30:00.000Z',next='2026-11-03T04:31:00.000Z';
function day(){
 const d={date:point.date,location:{timeZone:point.timeZone},
  sunriseUtc:sunrise,nextSunriseUtc:next,sunsetUtc:'2026-11-02T14:30:00.000Z',
  sunrise:{tithi:{number:8,paksha:'Shukla',numberWithinPaksha:8},
   nakshatra:{number:4,name:'Rohini',pada:1},vara:{number:2,name:'Somavara'},
   yoga:{number:16,name:'Siddhi'},karana:{slot:2,name:'Bava'}},
  periods:{},daytimeKalas:{rahuKalam:{fromUtc:'2026-11-02T05:45:00.000Z',
   untilUtc:'2026-11-02T07:00:00.000Z'}}};
 for(const key of ['tithi','nakshatra','yoga','karana'])
  d.periods[key]=[{startUtc:'2026-11-02T03:00:00.000Z',
   endUtc:'2026-11-03T05:00:00.000Z',value:d.sunrise[key]}];
 d.periods.tithi=[
  {startUtc:'2026-11-02T03:00:00.000Z',endUtc:'2026-11-02T12:00:00.000Z',
   value:d.sunrise.tithi},
  {startUtc:'2026-11-02T12:00:00.000Z',endUtc:'2026-11-03T05:00:00.000Z',
   value:{number:9,paksha:'Shukla',numberWithinPaksha:9}}
 ];
 return d;
}
const bodies=['Mercury','Venus','Mars','Jupiter','Saturn'];
function report(atUtc,natalMoon=5){
 const birthNak=3,nak=4,moonSign=5,lagna=6;
 const count=(nak-birthNak+27)%27+1,tara=(count-1)%9+1;
 const house=(moonSign-natalMoon+12)%12+1;
 const gochar=bodies.map(name=>{
  const sign=name==='Saturn'?7:name==='Jupiter'?9:5;
  return {name,sign,houseFromMoon:(sign-natalMoon+12)%12+1,
   houseFromLagna:(sign-lagna+12)%12+1};
 });
 return {status:'available',version:'personal-resonance-v1',
  observation:'VERIFIED_SWISS_SAME_MOMENT_AND_OWNED_NATAL',
  date:point.date,timeZone:point.timeZone,latitude:Number(point.latitude),
  longitude:Number(point.longitude),sunriseUtc:sunrise,nextSunriseUtc:next,evaluatedAtUtc:atUtc,
  transitMoon:{sign:moonSign,nakshatraNumber:nak},natal:{moonSign:natalMoon,lagnaSign:lagna},
  tarabala:{quality:'supportive',name:'Sampat',taraNumber:tara,cycle:1,inclusiveCount:count,
   birthNakshatraIndex:birthNak,transitNakshatraIndex:nak},
  chandrabala:{quality:[1,3,6,7,10,11].includes(house)?'supportive':'challenging',
   houseFromJanmaRashi:house,ashtamaChandra:house===8,natalMoonSign:natalMoon,transitMoonSign:moonSign},
  period:{lord:'Mercury',start:'2024-01-01T00:00:00.000Z',end:'2034-01-01T00:00:00.000Z',
   antardasha:{lord:'Venus',start:'2026-01-01T00:00:00.000Z',end:'2027-01-01T00:00:00.000Z'}},
  gochar};
}
function privateData(d,natalMoon=5){
 const times=p34Boundaries(d),samples=times.slice(0,-1).map((a,i)=>{
  const atUtc=new Date(a+Math.min(1000,Math.floor((times[i+1]-a)/2))).toISOString();
  return {atUtc,report:report(atUtc,natalMoon)};
 });
 return {status:'available',version:'private-time-guidance-p34',
  observation:'VERIFIED_SWISS_BOUNDARIES_AND_OWNED_NATAL',
  date:point.date,timeZone:point.timeZone,
  latitude:Number(point.latitude),longitude:Number(point.longitude),
  sunriseUtc:sunrise,nextSunriseUtc:next,events:[],samples};
}
test('P3.4 searches EACH actual boundary, not noon/sunrise only',()=>{
 const d=day(),t=buildP34Timeline(d,point,'work');
 assert.equal(t.version,'time-guidance-p34');
 assert.equal(t.personalized,false);
 assert.equal(t.windows.length,5);
 assert.ok(t.windows.some(w=>w.startUtc==='2026-11-02T05:45:00.000Z'&&w.status==='avoid'));
 assert.ok(t.windows.some(w=>w.startUtc==='2026-11-02T07:00:00.000Z'&&w.status==='supported'));
 assert.ok(t.windows.some(w=>w.startUtc==='2026-11-02T12:00:00.000Z'&&w.status==='caution'));
 assert.equal(t.nextSupported?.startUtc,sunrise); // First verified window is before Rahu; separate test searches after Rahu starts.
 assert.equal(t.windows.at(-1).endUtc,next);
});
test('P3.4 search chooses a future window and does not cross its next hard boundary',()=>{
 const t=buildP34Timeline(day(),point,'work',null,'2026-11-02T06:00:00.000Z');
 assert.equal(t.nextSupported?.startUtc,'2026-11-02T07:00:00.000Z');
 const none=buildP34Timeline(day(),point,'work',null,'2026-11-02T12:01:00.000Z');
 assert.equal(none.nextSupported,null);
});
test('P3.4 evaluated interval after local midnight belongs to previous Vedic day',()=>{
 const d=day(),at='2026-11-03T00:10:00.000Z';
 const evaluated=interpretPanchanga(d,Date.parse(at),'work','at-instant');
 assert.equal(evaluated.evaluatedAtUtc,at);
 assert.equal(evaluated.moment,'interval');
 assert.equal(evaluated.status,'caution');
 assert.throws(()=>interpretPanchanga(d,Date.parse(next),'work','at-instant'),/outside/);
});
test('P3.4 private verified samples build coherent PERSONAL windows, Ashtama always overrides',()=>{
 const d=day(),p=privateData(d,10);
 const t=buildP34Timeline(d,point,'work',p);
 assert.equal(t.personalized,true);
 assert.ok(t.windows.every(w=>w.personalized));
 assert.ok(t.windows.every(w=>w.status==='avoid'));
 assert.equal(t.nextSupported,null);
 assert.ok(t.windows[0].factors.some(f=>f.id==='ASHTAMA_CHANDRA'));
});
test('P3.4 rejects incomplete private reports, fake observers, tampered boundaries',()=>{
 const d=day(),p=privateData(d);
 assert.throws(()=>buildP34Timeline(d,point,'work',{...p,samples:p.samples.slice(1)}),/coverage/);
 assert.throws(()=>buildP34Timeline(d,point,'work',{...p,latitude:49}),/coordinates/);
 assert.throws(()=>buildP34Timeline(d,point,'work',{...p,
  samples:p.samples.map((s,i)=>i===0?{...s,atUtc:'2026-11-02T06:00:00.000Z'}:s)}),/disagreement/);
 assert.throws(()=>buildP34Timeline(d,point,'work',{...p,
  events:[{atUtc:'2026-11-04T12:00:00.000Z',kind:'moon-sign'}]}),/outside/);
});
test('P3.4 rejects gaps, overlaps and invented day coverage instead of fabricating results',()=>{
 const a=day();a.periods.tithi[1].startUtc='2026-11-02T12:01:00.000Z';
 assert.throws(()=>buildP34Timeline(a,point,'work'),/gap or overlap/);
 const b=day();b.periods.tithi[1].startUtc='2026-11-02T11:59:00.000Z';
 assert.throws(()=>buildP34Timeline(b,point,'work'),/gap or overlap/);
 const c=day();c.periods.nakshatra[0].endUtc='2026-11-02T23:59:00.000Z';
 assert.throws(()=>buildP34Timeline(c,point,'work'),/last nakshatra/);
});
test('P3.4 accepts 23-hour verified sunrise day over European DST change',()=>{
 const d=day();d.date='2026-03-28';d.location.timeZone='Europe/Paris';
 d.sunriseUtc='2026-03-28T05:30:00.000Z';d.nextSunriseUtc='2026-03-29T04:30:00.000Z';
 d.sunsetUtc='2026-03-28T17:30:00.000Z';
 d.sunrise.vara={number:7,name:'Shanivara'};
 d.daytimeKalas.rahuKalam={fromUtc:'2026-03-28T06:00:00.000Z',untilUtc:'2026-03-28T07:30:00.000Z'};
 for(const key of ['tithi','nakshatra','yoga','karana'])
  d.periods[key]=[{startUtc:'2026-03-28T04:00:00.000Z',
   endUtc:'2026-03-29T05:00:00.000Z',value:d.sunrise[key]}];
 const p={...point,date:d.date,timeZone:d.location.timeZone};
 const t=buildP34Timeline(d,p,'travel');
 assert.equal(Date.parse(t.nextSunriseUtc)-Date.parse(t.sunriseUtc),23*3600000);
 assert.ok(t.windows.length>=3);
});
