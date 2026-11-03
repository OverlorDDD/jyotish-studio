import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateVerifiedEventLagna} from '../apps/api/src/panchanga-event-lagna.ts';
import {assembleP384EventElection,P384_SCOPED_PANCHAKA} from '../apps/api/src/panchanga-event-election.ts';

const AT='2026-11-03T09:00:00.000Z',START='2026-11-03T06:00:00.000Z',END='2026-11-04T06:00:00.000Z';
const P={date:'2026-11-03',timeZone:'Europe/Kyiv',latitude:'47.9105',longitude:'33.3918'};
const SKY=[{name:'Sun',longitude:15},{name:'Moon',longitude:45},
 {name:'Mercury',longitude:120},{name:'Venus',longitude:80},
 {name:'Mars',longitude:100},{name:'Jupiter',longitude:200},{name:'Saturn',longitude:300}];
const MOCK={
 date:'2026-11-03',location:{timeZone:'Europe/Kyiv',latitude:47.9105,longitude:33.3918},
 sunriseUtc:START,nextSunriseUtc:END,sunsetUtc:'2026-11-03T16:00:00.000Z',
 sunrise:{moonSign:2,
  tithi:{number:10,paksha:'Shukla',numberWithinPaksha:10},
  vara:{number:3,name:'Mangalavara'},
  nakshatra:{number:4,name:'Rohini',pada:1},
  yoga:{number:16,name:'Siddhi'},karana:{slot:19,name:'Taitila'}},
 daytimeKalas:{rahuKalam:{fromUtc:'2026-11-03T10:00:00.000Z',
  untilUtc:'2026-11-03T11:30:00.000Z'}},
 periods:{}
};
for(const k of ['tithi','nakshatra','yoga','karana'])
 MOCK.periods[k]=[{startUtc:'2026-11-03T05:00:00.000Z',
  endUtc:'2026-11-04T07:00:00.000Z',value:MOCK.sunrise[k]}];
const NATAL={
 status:'available',version:'personal-resonance-v1',
 observation:'VERIFIED_SWISS_SAME_MOMENT_AND_OWNED_NATAL',
 date:P.date,timeZone:P.timeZone,latitude:Number(P.latitude),longitude:Number(P.longitude),
 sunriseUtc:START,nextSunriseUtc:END,evaluatedAtUtc:AT,
 transitMoon:{sign:2,nakshatraNumber:4},
 natal:{moonSign:2,lagnaSign:7},
 tarabala:{quality:'supportive',name:'Sampat',taraNumber:2,cycle:1,inclusiveCount:2,
  birthNakshatraIndex:3,transitNakshatraIndex:4},
 chandrabala:{quality:'supportive',houseFromJanmaRashi:1,ashtamaChandra:false,
  natalMoonSign:2,transitMoonSign:2},
 gochar:SKY.filter(x=>['Mercury','Venus','Mars','Jupiter','Saturn'].includes(x.name))
  .map(x=>{const sign=Math.floor(x.longitude/30)+1;
   return {name:x.name,sign,houseFromMoon:(sign-2+12)%12+1,houseFromLagna:(sign-7+12)%12+1};}),
 period:null
};
const input=async(activityId,partnerVerified=false)=>({
 activityId,atUtc:AT,eventLagna:await calculateVerifiedEventLagna({
  atUtc:AT,latitude:47.9105,longitude:33.3918,timeZone:'Europe/Kyiv'}),
 day:MOCK,point:P,personalReport:NATAL,sky:SKY,partnerVerified
});
test('P384: event Lagna not natal Lagna, seven planetary event houses correctly derived',async()=>{
 const raw=await input('job_start');
 const data=assembleP384EventElection(raw);
 assert.equal(data.status,'evaluated');
 assert.equal(data.eventLagna.lagnaSign,9);
 assert.equal(NATAL.natal.lagnaSign,7);
 assert.equal(data.eventSky.length,7);
 for(const sky of data.eventSky)
  assert.equal(sky.houseFromEventLagna,(sky.sign-data.eventLagna.lagnaSign+12)%12+1);
 assert.equal(data.calendarVerdict,'candidate');
 assert.equal(data.panchakaScope,'occupation');
 assert.equal(data.panchaka.electionLagnaSign,9);
 assert.equal(data.guidanceScope,'PARTIAL_EVENT_ELECTION_REQUIRES_SPECIAL_DOSHAS');
 assert.ok(data.remainingRuleGates.length>=3);
});
test('P384: same verified event sky has different classical Panchaka restrictions for wedding vs house building',async()=>{
 const w=assembleP384EventElection(await input('wedding',true));
 const foundation=assembleP384EventElection(await input('foundation'));
 assert.equal(w.panchaka.remainder,8); // 10 + 3 + 4 + 9 = 26 mod 9
 assert.equal(w.panchaka.name,'Roga');
 assert.equal(w.panchaka.forbiddenForScope,true);
 assert.equal(w.calendarVerdict,'needs_full_election');
 assert.equal(foundation.panchaka.forbiddenForScope,false);
 assert.equal(foundation.panchakaScope,'home_building');
 assert.equal(foundation.calendarVerdict,'needs_full_election');
 assert.ok(w.remainingRuleGates.includes('BOTH_PARTNERS_CLASSICAL_COMPATIBILITY'));
 assert.notEqual(w.panchaka.conclusion,foundation.panchaka.conclusion);
});
test('P384: wedding cannot be evaluated without verified partner, ordinary work does not require partner',async()=>{
 const wedding=await input('wedding');
 assert.throws(()=>assembleP384EventElection({...wedding,partnerVerified:false}),/partner chart/);
 assert.equal(assembleP384EventElection(await input('job_start')).partnerChart,'not_required');
});
test('P384: exact-event Swiss Moon and all five private planets must match owner-verified P3.3 signs',async()=>{
 const wrongMoon=await input('job_start');
 wrongMoon.sky=wrongMoon.sky.map(x=>x.name==='Moon'?{...x,longitude:190}:x);
 assert.throws(()=>assembleP384EventElection(wrongMoon),/event Moon/);
 const wrongGochar=await input('job_start');
 wrongGochar.sky=wrongGochar.sky.map(x=>x.name==='Mercury'?{...x,longitude:5}:x);
 assert.throws(()=>assembleP384EventElection(wrongGochar),/private transit mismatch/);
 const wrongPoint=await input('job_start');
 wrongPoint.point={...wrongPoint.point,longitude:'77.209'};
 assert.throws(()=>assembleP384EventElection(wrongPoint),/observer and exact instant/);
});
test('P384: no silent certification from an unsupported activity, no synthetic missing event Lagna',async()=>{
 const gentle=assembleP384EventElection(await input('first_date'));
 assert.equal(gentle.panchaka,null);
 assert.equal(gentle.panchakaScope,null);
 assert.notEqual(gentle.guidanceScope,'FULL_CERTIFIED_MUHURTA');
 const bad=await input('wedding',true);
 bad.eventLagna={...bad.eventLagna,panchakaLagnaNumber:7};
 assert.throws(()=>assembleP384EventElection(bad),/observer and exact instant/);
 assert.equal(P384_SCOPED_PANCHAKA.foundation,'home_building');
});
