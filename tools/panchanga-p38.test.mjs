import {calculateRamanPanchaka} from '../apps/web/lib/panchanga-p38-panchaka.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {P38_ACTIVITIES,p38Activity,evaluateP38,screenP38Day} from '../apps/web/lib/panchanga-p38-decision.ts';

const POINT={date:'2026-11-03',timeZone:'Europe/Kyiv',latitude:'47.9105',longitude:'33.3918'};
const SUN='2026-11-03T06:00:00.000Z',END='2026-11-04T06:00:00.000Z';
const starNames={1:'Ashwini',2:'Bharani',3:'Krittika',4:'Rohini',5:'Mrigashira',
 7:'Punarvasu',11:'Purva Phalguni',15:'Swati',18:'Jyeshtha'};
const varas={2:'Somavara',3:'Mangalavara',4:'Budhavara',5:'Guruvara'};
function fixture({nak=4,tithi=10,slot=19,yoga=16,date=POINT.date,weekday=3}={}){
 const d={date,location:{timeZone:'Europe/Kyiv'},
  sunriseUtc:SUN.replace('2026-11-03',date),
  sunsetUtc:'2026-11-03T16:00:00.000Z'.replace('2026-11-03',date),
  nextSunriseUtc:new Date(Date.parse(date+'T06:00:00Z')+86400000).toISOString(),
  sunrise:{moonSign:5,
   tithi:{number:tithi,paksha:'Shukla',numberWithinPaksha:tithi},
   nakshatra:{number:nak,name:starNames[nak]||'Rohini',pada:2},
   vara:{number:weekday,name:varas[weekday]},yoga:{number:yoga,name:yoga===16?'Siddhi':yoga===17?'Vyatipata':'Shubha'},
   karana:{slot,name:slot===15||slot===22?'Vishti':slot===19?'Taitila':slot===20?'Garaja':'Bava'}},
  daytimeKalas:{rahuKalam:{
   fromUtc:'2026-11-03T10:00:00.000Z'.replace('2026-11-03',date),
   untilUtc:'2026-11-03T11:30:00.000Z'.replace('2026-11-03',date)}},
  periods:{}};
 for(const kind of ['tithi','nakshatra','yoga','karana'])
  d.periods[kind]=[{startUtc:new Date(Date.parse(d.sunriseUtc)-3600000).toISOString(),
   endUtc:new Date(Date.parse(d.nextSunriseUtc)+3600000).toISOString(),value:d.sunrise[kind]}];
 return d;
}
const when=(date=POINT.date,time='09:00:01')=>date+'T'+time+'.000Z';
const check=(d,action,at=when(d.date))=>evaluateP38(d,at,action);
function report(d,at,{birthNak=3,birthMoon=5}={}){
 const nak=d.sunrise.nakshatra.number,moon=5,lagna=6;
 const count=(nak-birthNak+27)%27+1,tara=(count-1)%9+1,cycle=Math.floor((count-1)/9)+1;
 const h=(moon-birthMoon+12)%12+1;
 const gochar=['Mercury','Venus','Mars','Jupiter','Saturn'].map((name,i)=>{
  const sign=2+i;return {name,sign,houseFromMoon:(sign-birthMoon+12)%12+1,
   houseFromLagna:(sign-lagna+12)%12+1};
 });
 return {status:'available',version:'personal-resonance-v1',
  observation:'VERIFIED_SWISS_SAME_MOMENT_AND_OWNED_NATAL',
  date:d.date,timeZone:POINT.timeZone,latitude:Number(POINT.latitude),longitude:Number(POINT.longitude),
  sunriseUtc:d.sunriseUtc,nextSunriseUtc:d.nextSunriseUtc,evaluatedAtUtc:at,
  transitMoon:{sign:moon,nakshatraNumber:nak},natal:{moonSign:birthMoon,lagnaSign:lagna},
  tarabala:{quality:tara===1?'caution':[2,4,6,8,9].includes(tara)?'supportive':'challenging',
   name:tara===2?'Sampat':'Tara '+tara,taraNumber:tara,cycle,inclusiveCount:count,
   birthNakshatraIndex:birthNak,transitNakshatraIndex:nak},
  chandrabala:{quality:[1,3,6,7,10,11].includes(h)?'supportive':'challenging',
   houseFromJanmaRashi:h,ashtamaChandra:h===8,natalMoonSign:birthMoon,transitMoonSign:moon},
  period:null,gochar};
}
test('P3.8 registry has 8 real categories, distinct activities, explicit method and verifiable rule sources',()=>{
 assert.equal(P38_ACTIVITIES.length,25);
 assert.equal(new Set(P38_ACTIVITIES.map(a=>a.id)).size,25);
 assert.equal(new Set(P38_ACTIVITIES.map(a=>a.category)).size,8);
 for(const a of P38_ACTIVITIES){
  assert.equal(p38Activity(a.id),a);
  assert.match(a.source,/^https:\/\//);
  assert.ok(a.name.uk&&a.name.en&&a.sourceDetail);
  if(a.method==='special_election')assert.ok(a.required.includes('election_lagna'));
 }
 assert.ok(p38Activity('wedding').required.includes('partner_chart'));
 assert.ok(p38Activity('foundation').required.includes('event_location'));
 assert.equal(p38Activity('first_date').method,'analogy');
});
test('P3.8 fixed-star service can be candidate, whereas travel and a wedding are NOT automatically approved',()=>{
 const d=fixture(),job=check(d,'job_start'),travel=check(d,'short_journey'),foundation=check(d,'foundation');
 assert.equal(job.verdict,'candidate');
 assert.equal(travel.verdict,'undetermined'); // Not preferred is not negative
 assert.equal(foundation.verdict,'needs_full_election');
 assert.ok(job.observations.some(e=>e.id==='CLASS_FIXED'));
 assert.ok(!job.observations.some(e=>e.polarity==='excludes'));
});
test('P3.8 same sky gives DIFFERENT legitimate decisions: Chara supports travel, not all work',()=>{
 const d=fixture({nak:15});
 assert.equal(check(d,'short_journey').verdict,'candidate');
 assert.equal(check(d,'job_start').verdict,'undetermined');
 assert.equal(check(d,'wedding').verdict,'avoid'); // Tuesday-specific classical wedding exclusion
 assert.ok(check(d,'wedding').observations.some(e=>e.id==='MARRIAGE_TUESDAY'));
});
test('P3.8 gentle Nakshatra directly supports making friends, but dating is clearly a modern analogy',()=>{
 const d=fixture({nak:5});
 assert.equal(check(d,'making_friends').verdict,'candidate');
 assert.equal(check(d,'first_date').verdict,'analogy');
 assert.equal(check(d,'job_start').verdict,'candidate'); // gentle inherits fixed works, per Drik Panchang
});
test('P3.8 travel has specific named exclusions; same Bharani day is not universally bad for all actions',()=>{
 const d=fixture({nak:2,tithi:8,slot:16});
 const travel=check(d,'short_journey'),job=check(d,'job_start');
 assert.equal(travel.verdict,'avoid');
 assert.ok(travel.observations.some(e=>e.id==='RAMAN_TRAVEL_STAR'));
 assert.ok(travel.observations.some(e=>e.id==='RAMAN_TRAVEL_TITHI'));
 assert.notEqual(job.verdict,'avoid');
});
test('P3.8 ordinary daily meditation is not forbidden by an electional Rahu window',()=>{
 const d=fixture(),moment=when(d.date,'10:10:00');
 assert.equal(check(d,'job_start',moment).verdict,'avoid');
 assert.equal(check(d,'daily_meditation',moment).verdict,'routine');
});
test('P3.8 casual first date is not universally forbidden by the start-of-major-undertaking Rahu rule',()=>{
 const d=fixture({nak:5}),at=when(d.date,'10:10:00');
 const date=evaluateP38(d,at,'first_date');
 assert.notEqual(date.verdict,'avoid');
 assert.ok(date.observations.some(e=>e.id==='RAHU_START'&&e.polarity==='context'));
 assert.equal(evaluateP38(d,at,'job_start').verdict,'avoid');
});
test('P3.8 yoga caution is not a blanket daily ban; Vishti remains explicit for auspicious starts',()=>{
 const d=fixture({nak:4,yoga:17});
 assert.equal(check(d,'job_start').verdict,'mixed');
 assert.equal(check(d,'daily_meditation').verdict,'routine');
 const v=fixture({nak:4,tithi:11,slot:22});
 assert.equal(check(v,'job_start').verdict,'avoid');
 assert.ok(check(v,'job_start').observations.some(e=>e.id==='VISHTI_AUSPICIOUS_START'));
});
test('P3.8 lunar caution does not force every good calendar day into negative status',()=>{
 const d=fixture(),at=when();
 const good=evaluateP38(d,at,'job_start',{point:POINT,report:report(d,at)});
 assert.equal(good.verdict,'candidate');
 const taraCaution=evaluateP38(d,at,'job_start',{point:POINT,report:report(d,at,{birthNak:27,birthMoon:2})});
 assert.equal(taraCaution.verdict,'mixed');
 assert.ok(taraCaution.observations.some(e=>e.id==='TARA_FIRST_CYCLE'));
 assert.ok(taraCaution.observations.some(e=>e.id==='CHANDRA_OTHER'));
});
test('P3.8 rejects synthetic astral impossibilities, not merely invalid values',()=>{
 const d=fixture();
 d.sunrise.karana={slot:8,name:'Vishti'};
 d.periods.karana[0].value=d.sunrise.karana;
 assert.throws(()=>check(d,'job_start'),/impossible Tithi\/Karana angular combination/);
 const next=fixture();next.sunrise.nakshatra.name='Bharani';
 next.periods.nakshatra[0].value=next.sunrise.nakshatra;
 assert.throws(()=>check(next,'job_start'),/Nakshatra number\/name mismatch/);
});
test('P3.8 three adjacent dates do not default to caution: clear candidate, undetermined, candidate',()=>{
 const cases=[
  {date:'2026-11-03',weekday:3,nak:4,expected:'candidate'},
  {date:'2026-11-04',weekday:4,nak:15,expected:'undetermined'},
  {date:'2026-11-05',weekday:5,nak:5,expected:'candidate'}
 ];
 for(const {date,weekday,nak,expected} of cases){
  const d=fixture({date,weekday,nak});
  assert.equal(check(d,'job_start',when(date)).verdict,expected);
 }
});
test('P3.8 exact verified sunrise boundaries find a next candidate AFTER Rahu, never inside it',()=>{
 const d=fixture(),result=screenP38Day(d,POINT,'job_start',when(d.date,'10:15:00'));
 assert.equal(result.personalized,false);
 assert.equal(result.nextCandidate?.fromUtc,when(d.date,'11:30:00'));
 assert.equal(result.windows.some(w=>w.verdict==='avoid'),true);
 assert.equal(result.windows.some(w=>w.verdict==='candidate'),true);
 const full=screenP38Day(d,POINT,'foundation');
 assert.equal(full.nextCandidate,null);
 assert.ok(full.windows.every(w=>w.verdict!=='candidate'));
});
test('P3.8 private calendar must use exact owner-verified report for EACH split interval',()=>{
 const d=fixture();
 const bounds=[Date.parse(d.sunriseUtc),Date.parse(d.daytimeKalas.rahuKalam.fromUtc),
  Date.parse(d.daytimeKalas.rahuKalam.untilUtc),Date.parse(d.sunsetUtc),Date.parse(d.nextSunriseUtc)];
 const samples=bounds.slice(0,-1).map((a,i)=>{
  const at=new Date(a+Math.min(1000,Math.floor((bounds[i+1]-a)/2))).toISOString();
  return {atUtc:at,report:report(d,at)};
 });
 const privateTiming={status:'available',version:'private-time-guidance-p34',
  observation:'VERIFIED_SWISS_BOUNDARIES_AND_OWNED_NATAL',date:d.date,
  timeZone:POINT.timeZone,latitude:Number(POINT.latitude),longitude:Number(POINT.longitude),
  sunriseUtc:d.sunriseUtc,nextSunriseUtc:d.nextSunriseUtc,events:[],samples};
 const t=screenP38Day(d,POINT,'job_start',when(d.date,'10:15:00'),privateTiming);
 assert.equal(t.personalized,true);
 assert.equal(t.nextCandidate?.fromUtc,when(d.date,'11:30:00'));
 const bad={...privateTiming,samples:privateTiming.samples.slice(1)};
 assert.throws(()=>screenP38Day(d,POINT,'job_start',d.sunriseUtc,bad),/private timing identity or completeness mismatch/);
});

test('P3.8 classical Raman worked example 13+1+9+6 = 29, remainder 2 (Agni)',()=>{
 const row={tithiNumber:13,varaNumber:1,nakshatraNumber:9,electionLagnaSign:6};
 const p=calculateRamanPanchaka(row,'home_building');
 assert.equal(p.sum,29);assert.equal(p.remainder,2);assert.equal(p.name,'Agni');
 assert.equal(p.conclusion,'specific_exclusion');
 assert.equal(calculateRamanPanchaka(row,'travel').forbiddenForScope,false);
});
test('P3.8 SAME exact electional sky yields different activity-specific Panchaka rulings',()=>{
 const shared={varaNumber:1,nakshatraNumber:9,electionLagnaSign:6};
 const raja={...shared,tithiNumber:6}; // sum22 => 4
 assert.equal(calculateRamanPanchaka(raja,'occupation').forbiddenForScope,true);
 assert.equal(calculateRamanPanchaka(raja,'home_building').forbiddenForScope,true);
 assert.equal(calculateRamanPanchaka(raja,'travel').forbiddenForScope,false);
 const chora={...shared,tithiNumber:8}; // sum24 => 6
 assert.equal(calculateRamanPanchaka(chora,'travel').forbiddenForScope,true);
 assert.equal(calculateRamanPanchaka(chora,'marriage').forbiddenForScope,false);
 const roga={...shared,tithiNumber:1}; // sum17 => 8
 assert.equal(calculateRamanPanchaka(roga,'marriage').forbiddenForScope,true);
 assert.equal(calculateRamanPanchaka(roga,'occupation').forbiddenForScope,false);
});
test('P3.8 Panchaka without one required verified event factor is NOT estimated',()=>{
 const base={tithiNumber:13,varaNumber:1,nakshatraNumber:9,electionLagnaSign:6};
 assert.throws(()=>calculateRamanPanchaka({...base,electionLagnaSign:undefined},'marriage'),/event Lagna/);
 assert.throws(()=>calculateRamanPanchaka({...base,tithiNumber:31},'travel'),/verified/);
 assert.throws(()=>calculateRamanPanchaka({...base,nakshatraNumber:0},'travel'),/verified/);
 assert.throws(()=>calculateRamanPanchaka(base,'unknown'),/unsupported/);
});

test('P3.8 exhaustive 68,040 electional Tithi/Vara/Nakshatra/Lagna combinations across four activity scopes',()=>{
 const scopes=['occupation','home_building','travel','marriage'];
 const blocked={occupation:[4],home_building:[2,4],travel:[6],marriage:[1,8]};
 let combinations=0,scopeEvaluations=0;
 const seen=new Set();
 for(let tithiNumber=1;tithiNumber<=30;tithiNumber++)
  for(let varaNumber=1;varaNumber<=7;varaNumber++)
   for(let nakshatraNumber=1;nakshatraNumber<=27;nakshatraNumber++)
    for(let electionLagnaSign=1;electionLagnaSign<=12;electionLagnaSign++){
     combinations++;
     const sample={tithiNumber,varaNumber,nakshatraNumber,electionLagnaSign};
     const expected=(tithiNumber+varaNumber+nakshatraNumber+electionLagnaSign)%9;
     seen.add(expected);
     for(const scope of scopes){
      const got=calculateRamanPanchaka(sample,scope);
      assert.equal(got.remainder,expected);
      assert.equal(got.forbiddenForScope,blocked[scope].includes(expected));
      assert.equal(got.conclusion,blocked[scope].includes(expected)?'specific_exclusion':'no_specific_exclusion');
      scopeEvaluations++;
     }
    }
 assert.equal(combinations,68040);
 assert.equal(scopeEvaluations,272160);
 assert.deepEqual([...seen].sort((a,b)=>a-b),[0,1,2,3,4,5,6,7,8]);
});

test('P3.8 generic caution without activity support is NOT labelled mixed support',()=>{
 const d=fixture({nak:15,yoga:17});
 const result=check(d,'job_start');
 assert.equal(result.verdict,'caution');
 assert.equal(result.observations.some(e=>e.polarity==='supports'&&e.scope==='activity'),false);
});
test('P3.8 missing requirements reflect provided verified natal and observer location, not all registry requirements',()=>{
 const d=fixture(),at=when();
 const unknown=check(d,'foundation');
 assert.ok(unknown.missingRequirements.includes('natal_chart'));
 assert.ok(!unknown.missingRequirements.includes('event_location'));
 const withNatal=evaluateP38(d,at,'foundation',{point:POINT,report:report(d,at)});
 assert.ok(!withNatal.missingRequirements.includes('natal_chart'));
 assert.ok(withNatal.missingRequirements.includes('election_lagna'));
});

test('P3.8.9 wedding/foundation public screening exposes real DIFFERENT specialist rule evidence, without final ceremony certificate',()=>{
 const d=fixture({nak:4,tithi:10,slot:19,weekday:5,yoga:16});
 const w=check(d,'wedding'),f=check(d,'foundation'),job=check(d,'job_start');
 assert.equal(w.verdict,'needs_full_election');
 assert.equal(f.verdict,'needs_full_election');
 assert.equal(job.verdict,'candidate');
 assert.ok(w.observations.some(x=>x.id==='MARRIAGE_PREFERRED_STAR'&&x.polarity==='supports'));
 assert.ok(f.observations.some(x=>x.id==='FOUNDATION_BEST_NAKSHATRA'&&x.polarity==='supports'));
 assert.ok(!w.observations.some(x=>x.id==='FOUNDATION_BEST_NAKSHATRA'));
 assert.ok(!f.observations.some(x=>x.id==='MARRIAGE_PREFERRED_STAR'));
 assert.equal(w.certification,'calendar-screening-only');
 assert.ok(w.missingRequirements.includes('partner_chart'));
});
test('P3.8.9 special exclusions are action-specific and supported by Raman, not generic negative defaults',()=>{
 const d=fixture({nak:2,tithi:8,slot:16,weekday:3,yoga:17});
 const w=check(d,'wedding'),f=check(d,'foundation');
 assert.equal(w.verdict,'avoid');
 assert.ok(w.observations.some(x=>x.id==='MARRIAGE_NAKSHATRA_UNLISTED'));
 assert.ok(w.observations.some(x=>x.id==='MARRIAGE_TITHI_EXCLUSION'));
 assert.equal(f.verdict,'avoid');
 assert.ok(f.observations.some(x=>x.id==='FOUNDATION_TITHI'));
 assert.ok(!f.observations.some(x=>x.id==='MARRIAGE_TUESDAY'));
});
