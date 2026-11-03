import {createVerifiedEventLagnaSampler} from '../apps/api/src/panchanga-event-lagna.ts';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateP385Special,p385NatalFromVerified,p385Aspects}
 from '../apps/api/src/panchanga-p385-special.ts';
import {findP385LagnaCrossings,findP385Windows}
 from '../apps/api/src/panchanga-p385-windows.ts';

const UTC='2026-11-03T09:00:00.000Z',SUN='2026-11-03T06:00:00.000Z',
 NEXT='2026-11-04T06:00:00.000Z';
const names=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn'];
const lons=[15,45,120,80,100,200,300];
const natal={provenance:'VERIFIED_OWNED_JQA3_D1_D9_D10',moonNakshatra:4,moonSign:2,
 birthLagnaSign:7,d9LagnaSign:5,d10LagnaSign:10,d9SeventhOccupied:false,d10TenthOccupied:true};
const partner={...natal,moonNakshatra:8,d9LagnaSign:8,d10LagnaSign:3};
const nodes={Rahu:150,Ketu:330,source:'JQA3_NATIVE_SWIEPH_MEAN_NODE_AND_OPPOSITE'};
const day={
 date:'2026-11-03',location:{timeZone:'Europe/Kyiv'},
 sunriseUtc:SUN,nextSunriseUtc:NEXT,sunsetUtc:'2026-11-03T16:00:00.000Z',
 sunrise:{vara:{number:3,name:'Mangalavara'},tithi:{number:10,paksha:'Shukla',numberWithinPaksha:10},
  nakshatra:{number:4,name:'Rohini',pada:2},yoga:{number:16,name:'Siddhi'},
  karana:{slot:19,name:'Taitila'}},
 daytimeKalas:{rahuKalam:{fromUtc:'2026-11-03T10:00:00.000Z',
  untilUtc:'2026-11-03T11:30:00.000Z'}},
 periods:{}
};
for(const k of ['tithi','nakshatra','yoga','karana'])
 day.periods[k]=[{startUtc:'2026-11-03T04:00:00.000Z',
  endUtc:'2026-11-04T07:00:00.000Z',value:day.sunrise[k]}];
function makeEvent(activityId,lagnaSign=9,longitudeArray=lons){
 return {status:'evaluated',version:'p384-event-election-v1',activityId,eventAtUtc:UTC,
  eventLagna:{status:'available',lagnaSign},
  eventSky:names.map((name,i)=>{
   const longitude=longitudeArray[i],sign=Math.floor(longitude/30)+1;
   return {name,longitude,sign,houseFromEventLagna:(sign-lagnaSign+12)%12+1};
  }),
  panchaka:null,remainingRuleGates:[]};
}
test('P385 marriage: Raman Ch IX exact wedding rules differentiate 7th-house occupation, Mars 8th and weekday',()=>{
 const w=evaluateP385Special({event:makeEvent('wedding'),day,owner:natal,partner,nodes});
 assert.equal(w.state,'excluded');
 const ids=w.rules.filter(r=>r.state==='excluded').map(r=>r.id);
 assert.ok(ids.includes('MARRIAGE_HOUSE_7_OCCUPIED'));
 assert.ok(ids.includes('MARRIAGE_MARS_HOUSE_8'));
 assert.ok(ids.includes('MARRIAGE_TUESDAY'));
 assert.equal(w.dinaKuta.ownerToPartner,5);
 assert.equal(w.dinaKuta.partnerToOwner,24);
 assert.equal(w.dinaKuta.status,'both_directions_reported_role_not_assumed');
 assert.equal(w.certification,'NOT_A_COMPLETE_CEREMONIAL_MUHURTA');
 assert.ok(w.remainingGates.includes('FULL_EIGHT_KUTA_AND_SEVENTH_EIGHTH_NATAL_HOUSE_REVIEW'));
});
test('P385 wedding: independent partner chart is REQUIRED and no user roles inferred',()=>{
 assert.throws(()=>evaluateP385Special({event:makeEvent('wedding'),day,owner:natal,nodes}),
  /second VERIFIED owned natal/);
 assert.ok(evaluateP385Special({event:makeEvent('wedding'),day,owner:natal,
  partner,nodes}).partner);
});
test('P385 foundation: Rohini, Shukla10, fixed Taurus Lagna and empty 8th can pass stated subset without falsely certifying all doshas',()=>{
 const f=evaluateP385Special({event:makeEvent('foundation',2),day,owner:natal,nodes});
 assert.equal(f.state,'screened_requires_review');
 assert.ok(f.rules.some(x=>x.id==='FOUNDATION_FIXED_LAGNA'&&x.state==='preferred'));
 assert.ok(f.rules.some(x=>x.id==='FOUNDATION_BEST_NAKSHATRA'&&x.state==='preferred'));
 assert.ok(f.rules.some(x=>x.id==='FOUNDATION_EIGHTH_OCCUPIED'&&x.state==='context'));
 assert.equal(f.certification,'NOT_A_COMPLETE_CEREMONIAL_MUHURTA');
 const contaminated=makeEvent('foundation',2,[15,45,120,80,250,200,300]);
 const bad=evaluateP385Special({event:contaminated,day,owner:natal,nodes});
 assert.equal(bad.state,'excluded');
 assert.ok(bad.rules.some(x=>x.id==='FOUNDATION_EIGHTH_OCCUPIED'&&x.state==='excluded'));
});
test('P385 foundational graha drishti: Mars 4/7/8, Jupiter 5/7/9, Saturn 3/7/10',()=>{
 for(const [planet,distance] of [['Mars',4],['Mars',8],['Jupiter',5],['Jupiter',9],
 ['Saturn',3],['Saturn',10],['Venus',7],['Sun',7]])
  assert.equal(p385Aspects(planet,2,(2+distance-2)%12+1),true,planet+' '+distance);
 assert.equal(p385Aspects('Venus',2,10),false);
 assert.throws(()=>p385Aspects('Mars',0,1));
});
test('P385 source-backed natal snapshots use D1 Moon, D9/D10 lagnas without inventing scores',()=>{
 const planets=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
 const chart=(asc)=>planets.map((name,i)=>{const sign=i+1;
  return {name,longitude:i*30+10,sign,house:(sign-asc+12)%12+1};});
 const input={verification:{status:'verified_internal'},ascendant:{sign:7},
  lagnaD9:{sign:5},lagnaD10:{sign:10},
  d1:chart(7),d9:chart(5),d10:chart(10)};
 const p=p385NatalFromVerified(input);
 assert.equal(p.moonNakshatra,4);
 assert.equal(p.d9LagnaSign,5);assert.equal(p.d10LagnaSign,10);
 assert.throws(()=>p385NatalFromVerified({...input,d10:[]}),/D1\/D9\/D10/);
 assert.throws(()=>p385NatalFromVerified({...input,verification:{status:'unverified'}}));
});
const iso=x=>new Date(x).toISOString();
test('P385 exact event Lagna boundary bisection finds 12th->1st sign crossing, never guesses by hours',()=>{
 const a=Date.parse(SUN),b=Date.parse(NEXT);
 const sampler=t=>{
  const lon=(350+(t-a)/(b-a)*20)%360;
  return {longitude:lon,sign:Math.floor(lon/30)+1};
 };
 const result=findP385LagnaCrossings(a,b,sampler);
 assert.equal(result.length,1);
 assert.ok(Math.abs(Date.parse(result[0])-(a+(b-a)/2))<=1000);
 assert.throws(()=>findP385LagnaCrossings(a,b,()=>({longitude:45,sign:12})),/invalid Swiss/);
 const jump=t=>{const lon=t<a+120000?30:270;return {longitude:lon,sign:Math.floor(lon/30)+1};};
 assert.throws(()=>findP385LagnaCrossings(a,b,jump),/sampling envelope/);
});
test('P385 Time Finder: choose first real verified interval after all Rahu/planet transitions, no fake clock',async()=>{
 const r=await findP385Windows({activityId:'job_start',days:[day],fromUtc:UTC,
  extraBoundaries:()=>['2026-11-03T12:00:00.000Z','2026-11-03T12:45:00.000Z'],
  evaluate:async(_day,at)=>{
   const status=Date.parse(at)>=Date.parse('2026-11-03T12:00:00.000Z')?'candidate':'excluded';
   return {status,reasonIds:['TEST_CLASSICAL_RULE'],source:'NATIVE_SWISS_SAME_UTC_WITH_CLASSICAL_RULES'};
  }});
 assert.equal(r.status,'candidate_found');
 assert.equal(r.candidate.startUtc,'2026-11-03T12:00:00.000Z');
 assert.equal(r.candidate.endUtc,'2026-11-03T12:45:00.000Z');
 assert.equal(r.candidate.sampleUtc,'2026-11-03T12:00:15.000Z');
 assert.ok(r.excludedCount>0);assert.equal(r.complete,true);
});
test('P385 30 consecutive sunrise-days search cannot fabricate a next date if all intervals excluded',async()=>{
 const days=Array.from({length:30},(_,i)=>{
  const a=Date.parse(SUN)+i*86400000,next=a+86400000;
  return {...day,date:iso(Date.parse(day.date+'T00:00:00Z')+i*86400000).slice(0,10),
   sunriseUtc:iso(a),nextSunriseUtc:iso(next),sunsetUtc:iso(a+10*3600000),
   daytimeKalas:{rahuKalam:{fromUtc:iso(a+4*3600000),untilUtc:iso(a+5.5*3600000)}},
   periods:Object.fromEntries(['tithi','nakshatra','yoga','karana'].map(k=>
    [k,[{startUtc:iso(a-3600000),endUtc:iso(next+3600000),value:day.sunrise[k]}]]))}
 });
 const r=await findP385Windows({activityId:'foundation',days,fromUtc:UTC,
  extraBoundaries:()=>[],evaluate:async()=>({status:'excluded',reasonIds:['SOURCE_RULE'],
   source:'NATIVE_SWISS_SAME_UTC_WITH_CLASSICAL_RULES'})});
 assert.equal(r.status,'none_in_checked_range');
 assert.equal(r.candidate,null);
 assert.equal(r.daysRequested,30);
 assert.equal(r.searchThroughUtc,days[29].nextSunriseUtc);
});
test('P385 fail-closed: wrong observer day order, missing signed source, and invalid start',async()=>{
 const base={activityId:'job_start',days:[day],fromUtc:UTC,extraBoundaries:()=>[],
  evaluate:async()=>({status:'candidate',reasonIds:[],source:'INVENTED'})};
 await assert.rejects(()=>findP385Windows(base),/source-scoped evidence/);
 await assert.rejects(()=>findP385Windows({...base,fromUtc:'2026-11-03T05:00:00.000Z'}),
  /first sunrise day/);
});

test('P385 all twelve real Swiss event-Lagna ingresses match independent Python within one second',async()=>{
 const vector=JSON.parse(readFileSync(new URL('../tests/fixtures/p385-independent-swiss-lagna-crossings.json',import.meta.url),'utf8'));
 const at=await createVerifiedEventLagnaSampler(vector.observer);
 const list=findP385LagnaCrossings(Date.parse(vector.startUtc),Date.parse(vector.endUtc),at);
 assert.equal(list.length,vector.crossings.length);
 for(let i=0;i<list.length;i++){
  const desired=vector.crossings[i],t=Date.parse(list[i]),want=Date.parse(desired.atUtc);
  assert.ok(Math.abs(t-want)<=vector.toleranceMs,
   'Swiss ascendant sign ingress '+i+': '+list[i]+' vs '+desired.atUtc);
  assert.equal(at(t-2000).sign,desired.from);
  assert.equal(at(t+2000).sign,desired.to);
 }
});
