import test from 'node:test';
import assert from 'node:assert/strict';
import {validateP387Public,validateP387Natal,validateP387Finder,p387Rows}
 from '../apps/web/lib/panchanga-p387-unified.ts';
import {findP385Windows} from '../apps/api/src/panchanga-p385-windows.ts';

const MS=86400000, HOUR=3600000;
const stamp=t=>new Date(t).toISOString();
const bodies=['Mercury','Venus','Mars','Jupiter','Saturn'];
function fixtures(start='2026-10-01',count=31,dst=true){
 const point={date:start,timeZone:'Europe/Kyiv',latitude:'50.4501',longitude:'30.5234'};
 const base=Date.parse(start+'T00:00:00Z');
 const date=i=>stamp(base+i*MS).slice(0,10);
 const sunrise=i=>stamp(base+i*MS+4.5*HOUR+(dst&&i>=24?HOUR:0));
 const rangeDays=Array.from({length:count},(_,i)=>({
  date:date(i),sunriseUtc:sunrise(i),sunsetUtc:stamp(Date.parse(sunrise(i))+10*HOUR),
  nextSunriseUtc:sunrise(i+1),
  sunrise:{moonSign:5,tithi:{number:8,paksha:'Shukla',numberWithinPaksha:8},
   nakshatra:{number:4,name:'Rohini'},vara:{number:2,name:'Somavara'},
   yoga:{number:16,name:'Siddhi'},karana:{slot:2,name:'Bava'}}
 }));
 const range={version:'panchanga-range-v1',
  scope:'five-angas-at-local-sunrise-not-all-day-intervals',
  startDate:start,observer:{latitude:50.4501,longitude:30.5234,timeZone:point.timeZone},
  astronomyProfile:'SWISS JHORA8 LAHIRI VERIFIED',sourceMethod:'SwissBatchRises',days:rangeDays};
 const personalDays=rangeDays.map(d=>({
  date:d.date,sampledAtUtc:d.sunriseUtc,transitMoon:{sign:5,nakshatraNumber:4},
  tarabala:{quality:'supportive',taraNumber:2,cycle:1,inclusiveCount:2,
   birthNakshatraIndex:3,transitNakshatraIndex:4},
  chandrabala:{quality:'supportive',houseFromJanmaRashi:1,ashtamaChandra:false,
   natalMoonSign:5,transitMoonSign:5},
  period:{lord:'Mercury',start:'2020-01-01T00:00:00.000Z',end:'2030-01-01T00:00:00.000Z',
   antardasha:null},
  gochar:bodies.map(name=>({name,sign:5,houseFromMoon:1,houseFromLagna:12}))
 }));
 const personal={status:'available',version:'personal-panchanga-calendar-p35',
  observation:'OWNER_VERIFIED_SWISS_AT_EACH_LOCAL_SUNRISE',
  scope:'SUNRISE_SNAPSHOTS_WITH_EXACT_LUNAR_AND_DASHA_TRANSITIONS_NOT_FULL_DAY_MUHURTA',
  range,personal:{natal:{moonSign:5,lagnaSign:6},days:personalDays,events:[]}};
 const overview={version:'vedic-calendar-v1',
  scope:'calculated-observance-indications-not-definitive-religious-fasting-dates',
  startDate:start,astronomyProfile:range.astronomyProfile,sourceMethod:range.sourceMethod,
  observer:range.observer,
  days:rangeDays.map(d=>({
   date:d.date,sunriseUtc:d.sunriseUtc,nextSunriseUtc:d.nextSunriseUtc,
   sunriseAngas:{tithi:d.sunrise.tithi,nakshatra:d.sunrise.nakshatra,
    vara:d.sunrise.vara,yoga:d.sunrise.yoga,karana:d.sunrise.karana}
  }))
 };
 return {point,overview,personal,rangeDays};
}
function finder(f,activityId='job_start',windows=[]){
 return {version:'p385-time-finder-v1',
  scope:'OWNER_NATAL_AND_EVENT_CITY_SAME_VERIFIED_UTC',
  activityId,complete:true,
  selectionPolicy:'FIRST_CANDIDATE_AND_REVIEW_PER_LOCAL_SUNRISE_DAY',
  observer:f.overview.observer,daysRequested:30,
  startUtc:f.rangeDays[0].sunriseUtc,
  searchThroughUtc:f.rangeDays.at(-1).nextSunriseUtc,
  candidate:windows.find(w=>w.status==='candidate')||null,
  review:windows.find(w=>w.status==='requires_review')||null,
  status:windows.some(w=>w.status==='candidate')?'candidate_found':
   windows.some(w=>w.status==='requires_review')?'review_only':'none_in_checked_range',
  windows};
}
function windowAt(d,status='candidate'){
 const startUtc=stamp(Date.parse(d.sunriseUtc)+2*HOUR);
 return {startUtc,sampleUtc:startUtc,
  endUtc:stamp(Date.parse(startUtc)+45*60000),sunriseDate:d.date,
  reasonIds:['CLASSICAL_RULE'],status};
}
test('P387: every 7, 28, 29, 30 and 31-day full-calendar natal overlay matches its exact public sunrise and five limbs',()=>{
 for(const [start,count] of [['2026-11-02',7],['2027-02-01',28],
  ['2028-02-01',29],['2026-11-01',30],['2026-10-01',31]]){
  const f=fixtures(start,count,false);
  assert.equal(validateP387Public(f.overview,f.point,count),f.overview);
  assert.equal(validateP387Natal(f.overview,f.point,count,f.personal),f.personal);
  const rows=p387Rows(f.overview,f.point,count,f.personal,null,'job_start');
  assert.equal(rows.length,count);
  assert.ok(rows.every(r=>r.personalDay?.sampledAtUtc));
 }
});
test('P387: October observer sunrise continuity allows the 25-hour DST transition',()=>{
 const f=fixtures();
 const row=f.overview.days[23];
 assert.equal((Date.parse(row.nextSunriseUtc)-Date.parse(row.sunriseUtc))/HOUR,25);
 assert.doesNotThrow(()=>validateP387Natal(f.overview,f.point,31,f.personal));
});
test('P387: late-night UTC personal event belongs to previous SOURCE sunrise day, not civil midnight',()=>{
 const f=fixtures('2026-11-01',7,false);
 f.personal.personal.events.push({kind:'nakshatra',from:4,to:5,
  atUtc:'2026-11-02T01:00:00.000Z'});
 const rows=p387Rows(f.overview,f.point,7,f.personal,null,'job_start');
 assert.equal(rows[0].personalEvents.length,1);
 assert.equal(rows[1].personalEvents.length,0);
});
test('P387: tampered coordinates, truncated days, unmatched sunrise, inconsistent five limbs and foreign ephemeris fail closed',()=>{
 const f=fixtures('2026-11-01',30,false);
 const variants=[];
 let c=structuredClone(f.overview);c.observer.longitude=33;variants.push([c,f.personal]);
 c=structuredClone(f.overview);c.days.pop();variants.push([c,f.personal]);
 c=structuredClone(f.overview);c.days[2].sunriseUtc=stamp(Date.parse(c.days[2].sunriseUtc)+1000);variants.push([c,f.personal]);
 c=structuredClone(f.overview);c.days[3].sunriseAngas.karana.slot=3;variants.push([c,f.personal]);
 let p=structuredClone(f.personal);p.range.sourceMethod='OTHER_UNVERIFIED_SOURCE';variants.push([f.overview,p]);
 for(const [pub,priv] of variants)
  assert.throws(()=>p387Rows(pub,f.point,30,priv,null,'job_start'),/mismatch|P35 source mismatch/);
});
test('P387: exact per-day candidate and review windows are distinguishable and never fill unchecked days',()=>{
 const f=fixtures('2026-11-01',30,false);
 const windows=[windowAt(f.rangeDays[0],'requires_review'),
  windowAt(f.rangeDays[1],'candidate'),windowAt(f.rangeDays[4],'requires_review')];
 const report=finder(f,'wedding',windows);
 const result=validateP387Finder(report,f.point,'wedding');
 assert.equal(result.status,'candidate_found');
 const rows=p387Rows(f.overview,f.point,30,null,result,'wedding');
 assert.equal(rows[0].windows[0].status,'requires_review');
 assert.equal(rows[1].windows[0].status,'candidate');
 assert.equal(rows[2].windows.length,0);
 assert.equal(rows[4].windows[0].status,'requires_review');
});
test('P387: missing full-Muhurta approval does not become a positive candidate; forged candidate status or UTC is rejected',()=>{
 const f=fixtures('2026-11-01',30,false);
 const review=finder(f,'wedding',[windowAt(f.rangeDays[0],'requires_review')]);
 assert.equal(validateP387Finder(review,f.point,'wedding').status,'review_only');
 const empty=finder(f,'wedding',[]);
 assert.equal(validateP387Finder(empty,f.point,'wedding').status,'none_in_checked_range');
 const forged=structuredClone(review);forged.status='candidate_found';
 assert.throws(()=>validateP387Finder(forged,f.point,'wedding'),/mismatch/);
 const bogus=structuredClone(review);bogus.windows[0].startUtc='2026-10-31T00:00:00.000Z';
 assert.throws(()=>validateP387Finder(bogus,f.point,'wedding'),/mismatch/);
 const duplicate=structuredClone(review);duplicate.windows.push({...review.windows[0]});
 assert.throws(()=>validateP387Finder(duplicate,f.point,'wedding'),/mismatch/);
 const moved=structuredClone(review);moved.observer.latitude=48.1;
 assert.throws(()=>validateP387Finder(moved,f.point,'wedding'),/mismatch/);
});
test('P387: bounded 7-day existing P385 evaluator yields first candidate and review for each sunrise day',async()=>{
 const f=fixtures('2026-11-01',7,false);
 const days=f.rangeDays.map(d=>({
  date:d.date,sunriseUtc:d.sunriseUtc,nextSunriseUtc:d.nextSunriseUtc,
  sunsetUtc:d.sunsetUtc,location:{timeZone:f.point.timeZone},
  daytimeKalas:{rahuKalam:{fromUtc:stamp(Date.parse(d.sunriseUtc)+4*HOUR),
   untilUtc:stamp(Date.parse(d.sunriseUtc)+5*HOUR)}},
  periods:Object.fromEntries(['tithi','nakshatra','yoga','karana'].map(k=>
   [k,[{startUtc:stamp(Date.parse(d.sunriseUtc)-HOUR),
     endUtc:stamp(Date.parse(d.nextSunriseUtc)+HOUR),value:d.sunrise[k]}]]))
 }));
 const result=await findP385Windows({activityId:'job_start',days,
  fromUtc:stamp(Date.parse(days[0].sunriseUtc)+60000),
  extraBoundaries:()=>[],
  evaluate:async(day,atUtc)=>({
   status:Date.parse(atUtc)<Date.parse(day.sunriseUtc)+4*HOUR?'candidate':'requires_review',
   reasonIds:['VERIFIED_TEST_ONLY'],
   source:'NATIVE_SWISS_SAME_UTC_WITH_CLASSICAL_RULES'
  })
 });
 assert.equal(result.windows.length,14);
 assert.equal(new Set(result.windows.map(w=>w.sunriseDate)).size,7);
 assert.equal(result.selectionPolicy,'FIRST_CANDIDATE_AND_REVIEW_PER_LOCAL_SUNRISE_DAY');
 assert.equal(result.candidate?.status,'candidate');
 assert.equal(result.review?.status,'requires_review');
});
