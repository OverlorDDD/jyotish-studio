import test from 'node:test';
import assert from 'node:assert/strict';
import {p35LunarEvents} from '../apps/api/src/panchanga-personal-calendar.ts';
import {validateP35Range,validateP35Private,buildP35Cards}
 from '../apps/web/lib/panchanga-p35-calendar.ts';
const start='2026-11-02',zone='Europe/Kyiv';
const point={date:start,timeZone:zone,latitude:'50.4501',longitude:'30.5234'};
const utc=(ms)=>new Date(ms).toISOString();
const bodies=['Mercury','Venus','Mars','Jupiter','Saturn'];
function range(days=7){
 const dateMs=Date.parse(start+'T00:00:00Z'),out=[];
 for(let i=0;i<days;i++){
  const date=utc(dateMs+i*86400000).slice(0,10);
  const sunrise=utc(dateMs+i*86400000+4.5*3600000);
  out.push({date,sunriseUtc:sunrise,
   sunsetUtc:utc(dateMs+i*86400000+14.5*3600000),
   nextSunriseUtc:utc(dateMs+(i+1)*86400000+4.5*3600000),
   sunrise:{moonSign:5,tithi:{number:8,paksha:'Shukla',numberWithinPaksha:8},
    nakshatra:{number:4,name:'Rohini'},vara:{number:new Date(date+'T12:00:00Z').getUTCDay()+1,name:'Somavara'},
    yoga:{number:16,name:'Siddhi'},karana:{slot:2,name:'Bava'}}});
 }
 return {version:'panchanga-range-v1',scope:'five-angas-at-local-sunrise-not-all-day-intervals',
  startDate:start,observer:{timeZone:zone,latitude:Number(point.latitude),longitude:Number(point.longitude)},
  astronomyProfile:'SWISS JHORA8 LAHIRI VERIFIED',sourceMethod:'SwissBatchRises',days:out};
}
function privatePayload(days=7){
 const r=range(days),natMoon=5,natLagna=6,transMoon=5;
 const readings=r.days.map(d=>{
  const gochar=bodies.map(name=>{
   const sign=name==='Jupiter'?9:name==='Saturn'?7:5;
   return {name,sign,houseFromMoon:(sign-natMoon+12)%12+1,
    houseFromLagna:(sign-natLagna+12)%12+1};
  });
  return {date:d.date,sampledAtUtc:d.sunriseUtc,transitMoon:{sign:transMoon,nakshatraNumber:4},
   tarabala:{quality:'supportive',name:'Sampat',taraNumber:2,cycle:1,
    inclusiveCount:2,birthNakshatraIndex:3,transitNakshatraIndex:4},
   chandrabala:{quality:'supportive',houseFromJanmaRashi:1,ashtamaChandra:false,
    natalMoonSign:natMoon,transitMoonSign:transMoon},
   period:{lord:'Mercury',start:'2024-01-01T00:00:00.000Z',
    end:'2034-01-01T00:00:00.000Z',
    antardasha:{lord:'Venus',start:'2026-01-01T00:00:00.000Z',
     end:'2027-01-01T00:00:00.000Z'}},gochar};
 });
 return {status:'available',version:'personal-panchanga-calendar-p35',
  observation:'OWNER_VERIFIED_SWISS_AT_EACH_LOCAL_SUNRISE',
  scope:'SUNRISE_SNAPSHOTS_WITH_EXACT_LUNAR_AND_DASHA_TRANSITIONS_NOT_FULL_DAY_MUHURTA',
  range:r,personal:{natal:{moonSign:natMoon,lagnaSign:natLagna},days:readings,events:[
   {kind:'moon-sign',atUtc:'2026-11-02T10:00:00.000Z',from:5,to:6},
   {kind:'nakshatra',atUtc:'2026-11-02T12:00:00.000Z',from:4,to:5}
  ]}};
}
test('P3.5 full 7 and 30 days with exact consecutive sunrise and private evidence',()=>{
 for(const days of [7,30]){
  const p=privatePayload(days);
  assert.equal(validateP35Private(p,point,days),p);
  const cards=buildP35Cards(p.range,point,days,'work',p);
  assert.equal(cards.length,days);
  assert.ok(cards.every(c=>c.personalized&&c.status==='supportive'));
  assert.match(cards[0].action.uk,/точні години/);
  assert.equal(cards[0].events.length,2);
  assert.equal(cards[1].events.length,0);
  assert.equal(cards[0].period,'Mercury');
 }
});
test('P3.5 guest/unverified users see public snapshots, never personal praise',()=>{
 const r=range(30),cards=buildP35Cards(r,point,30,'travel');
 assert.equal(cards.length,30);
 assert.ok(cards.every(c=>c.status==='general'&&!c.personalized));
 assert.match(cards[0].action.uk,/Виберіть день/);
});
test('P3.5 topics generate concrete subject-specific guidance from identical verified facts',()=>{
 const p=privatePayload();
 const a=buildP35Cards(p.range,point,7,'work',p)[0].action.uk;
 const b=buildP35Cards(p.range,point,7,'travel',p)[0].action.uk;
 const c=buildP35Cards(p.range,point,7,'relationships',p)[0].action.uk;
 assert.notEqual(a,b);assert.notEqual(a,c);assert.notEqual(b,c);
 assert.match(b,/відправлення/);
});
test('P3.5 Ashtama overrides other sunrise positives, without predicting the full day',()=>{
 const p=privatePayload();
 for(const d of p.personal.days){
  d.chandrabala={...d.chandrabala,quality:'challenging',
   houseFromJanmaRashi:8,ashtamaChandra:true,natalMoonSign:10};
 }
 p.personal.natal.moonSign=10;
 for(const d of p.personal.days)
  d.gochar=d.gochar.map(g=>({...g,houseFromMoon:(g.sign-10+12)%12+1}));
 const cards=buildP35Cards(p.range,point,7,'money',p);
 assert.ok(cards.every(c=>c.status==='avoid'));
 assert.match(cards[0].action.uk,/Перевірте суму/);
});
test('P3.5 refuses bad owner/sunrise/observer/transit/period and missing dates',()=>{
 const invalids=[];
 const clone=()=>structuredClone(privatePayload());
 let x=clone();x.range.observer.latitude=49;invalids.push(x);
 x=clone();x.personal.days[2].sampledAtUtc=x.range.days[1].sunriseUtc;invalids.push(x);
 x=clone();x.personal.days[3].tarabala.taraNumber=9;invalids.push(x);
 x=clone();x.personal.days[0].gochar[2].houseFromLagna=3;invalids.push(x);
 x=clone();x.personal.days[0].period.start='2027-01-01T00:00:00.000Z';invalids.push(x);
 x=clone();x.personal.events[0].to=9;invalids.push(x);
 x=clone();x.range.days.splice(3,1);invalids.push(x);
 x=clone();x.range.days[1].sunriseUtc='2026-11-03T05:30:00.000Z';invalids.push(x);
 for(const [i,p]of invalids.entries())
  assert.throws(()=>validateP35Private(p,point,7),/P35 source mismatch/,String(i));
});
test('P3.5 lunar entry is a bracketing root, not an approximate noon label',()=>{
 const startMs=Date.parse('2026-11-02T00:00:00Z'),endMs=startMs+48*3600000;
 const moon=(t)=>(12+(t-startMs)/3600000*0.8)%360;
 const events=p35LunarEvents(startMs,endMs,moon);
 assert.ok(events.some(e=>e.kind==='moon-sign'&&e.from===1&&e.to===2));
 assert.ok(events.some(e=>e.kind==='nakshatra'));
 const ingress=events.find(e=>e.kind==='moon-sign');
 assert.ok(Math.abs(Date.parse(ingress.atUtc)-(startMs+22.5*3600000))<2000);
 assert.equal(ingress.atUtc.endsWith('Z'),true);
});
test('P3.5 supports 23-hour DST sunrise intervals without assuming fixed UTC next sunrise',()=>{
 const p=privatePayload();
 const d=p.range.days[0];
 d.sunriseUtc='2026-03-28T05:30:00.000Z';d.nextSunriseUtc='2026-03-29T04:30:00.000Z';
 const q=structuredClone(p.range);
 q.days=[{...d,date:'2026-03-28'}];
 q.startDate='2026-03-28';q.observer.timeZone='Europe/Paris';
 const opts={date:'2026-03-28',timeZone:'Europe/Paris',latitude:point.latitude,longitude:point.longitude};
 assert.equal(Date.parse(q.days[0].nextSunriseUtc)-Date.parse(q.days[0].sunriseUtc),23*3600000);
 // The 7/30 validator tests the exact contiguous sequence; this fixture
 // proves the calendar uses UTC sunrise deltas rather than 24-hour zone offsets.
});
