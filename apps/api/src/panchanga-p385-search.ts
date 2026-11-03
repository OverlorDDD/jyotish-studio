/** P3.8.5 server-side Swiss electional search.
 * One signed-in owner's verified D1/D9/D10 charts, one observer, one request.
 * Never accept natal DOB/time or chart positions from the browser.
 */
import {calculatePanchangaDay,createVerifiedSiderealPlanetAt,validatePanchangaLocation}
 from './panchanga.ts';
import {createVerifiedEventLagnaSampler,createVerifiedMeanNodeAt,
 calculateVerifiedEventLagna,type EventLocation} from './panchanga-event-lagna.ts';
import {assembleP384EventElection} from './panchanga-event-election.ts';
import {evaluateP385Special,p385NatalFromVerified} from './panchanga-p385-special.ts';
import {findP385LagnaCrossings,findP385MoonPadaCrossings,findP385Windows} from './panchanga-p385-windows.ts';
import {findVerifiedSignIngresses} from './panchanga-ingress.ts';
import {verifiedDailyMoonStrength} from '../../../packages/jyotish-core/src/lunar-strength.ts';
import type {RecoveredChart} from './personal-chart-recovery.ts';
import type {P32Day} from '../../web/lib/panchanga-p32-engine.ts';
import type {P33Report,P33Point} from '../../web/lib/panchanga-p33-resonance.ts';
import {p38Activity,type P38ActivityId} from '../../web/lib/panchanga-p38-decision.ts';

const DAY=86400000,MAX_DAYS=30,MAX_EVENTS=400;
const NAK_LEN=360/27;
const utc=(value:string)=>{
 const ms=Date.parse(value);
 if(typeof value!=='string'||!Number.isSafeInteger(ms)||
    new Date(ms).toISOString()!==value)throw Error('P385 requires absolute UTC milliseconds');
 return ms;
};
const civilDate=(ms:number,zone:string)=>{
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:zone,
  year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(ms));
 const p=(k:string)=>parts.find(x=>x.type===k)?.value||'';
 return p('year')+'-'+p('month')+'-'+p('day');
};
const addDate=(s:string,n:number)=>
 new Date(Date.parse(s+'T00:00:00Z')+n*DAY).toISOString().slice(0,10);
export type P385SearchInput={
 activityId:P38ActivityId;fromUtc:string;days:number;observer:EventLocation;
 owner:RecoveredChart;partner?:RecoveredChart|null;
};
/** No constructed birth chart, calendar and event site can be conflated. */
export async function searchP385Time(input:P385SearchInput){
 const from=utc(input.fromUtc);
 if(!Number.isSafeInteger(input.days)||input.days<1||input.days>MAX_DAYS)
  throw Error('P385 search horizon must be 1–30 sunrise days');
 const {observer}=input,activity=p38Activity(input.activityId);
 const today=civilDate(from,observer.timeZone);
 validatePanchangaLocation({date:today,timeZone:observer.timeZone,
  latitude:observer.latitude,longitude:observer.longitude});
 if(from<Date.now()-60000||from>Date.now()+5*365.25*DAY)
  throw Error('P385 time finder starts only in a future five-year horizon');
 const owner=p385NatalFromVerified(input.owner);
 const partner=input.partner?p385NatalFromVerified(input.partner):null;
 if(activity.required.includes('partner_chart')&&!partner)
  return {status:'requires_partner_chart',nextAction:'select_owned_verified_partner_chart'};
 const moon= input.owner.d1.find(p=>p.name==='Moon');
 if(!moon||moon.sign!==owner.moonSign)throw Error('P385 certified natal Moon missing');
 let first=await calculatePanchangaDay({date:today,...observer});
 let startDate=today;
 if(from<Date.parse(first.sunriseUtc)){
  startDate=addDate(today,-1);
  first=await calculatePanchangaDay({date:startDate,...observer});
 }
 if(from<Date.parse(first.sunriseUtc)||from>=Date.parse(first.nextSunriseUtc))
  throw Error('P385 from moment outside verified event-local sunrise day');
 const days:P32Day[]=[first as unknown as P32Day];
 for(let i=1;i<input.days;i++){
  const d=await calculatePanchangaDay({date:addDate(startDate,i),...observer});
  days.push(d as unknown as P32Day);
 }
 const atLagna=await createVerifiedEventLagnaSampler(observer),
  atPlanet=await createVerifiedSiderealPlanetAt(),
  atNode=await createVerifiedMeanNodeAt();
 const planetNames=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn'] as const;
 // Dynamic source data: each astronomy provider is instantiated ONCE per search.
 const events=async(day:P32Day)=>{
  const a=Date.parse(day.sunriseUtc),b=Date.parse(day.nextSunriseUtc);
  const crossings=findP385LagnaCrossings(a,b,atLagna);
  crossings.push(...findP385MoonPadaCrossings(a,b,ms=>atPlanet(ms,'Moon')));
  for(const name of planetNames){
   const ingress=findVerifiedSignIngresses(a,b,ms=>atPlanet(ms,name));
   crossings.push(...ingress.map(e=>e.atUtc));
  }
  const rahuIngress=findVerifiedSignIngresses(a,b,atNode);
  crossings.push(...rahuIngress.map(e=>e.atUtc));
  for(const period of input.owner.dasha||[]){
   for(const s of [period.start,period.end]){
    const t=Date.parse(s);
    if(Number.isFinite(t)&&t>a&&t<b)crossings.push(new Date(t).toISOString());
   }
   for(const d of period.antardashas||[])for(const s of [d.start,d.end]){
    const t=Date.parse(s);
    if(Number.isFinite(t)&&t>a&&t<b)crossings.push(new Date(t).toISOString());
   }
  }
  if(crossings.length>MAX_EVENTS)throw Error('P385 source transition budget exceeded');
  return crossings;
 };
 const evaluate=async(day:P32Day,atUtc:string)=>{
  const ms=utc(atUtc);
  // The astronomical ASC is computed AGAIN at the exact safe midpoint,
  // rather than inferred from the interval's first sign.
  const asc=await calculateVerifiedEventLagna({atUtc,...observer});
  const sky=planetNames.map(name=>({name,longitude:atPlanet(ms,name).longitude}));
  const moonPos=sky.find(p=>p.name==='Moon')!;
  const moonSign=Math.floor(moonPos.longitude/30)+1;
  const nak=Math.floor(moonPos.longitude/NAK_LEN)+1;
  const strengths=verifiedDailyMoonStrength({moonLongitude:moon.longitude,moonSign:owner.moonSign},
   {nakshatraNumber:nak,moonSign});
  const gochar=(['Mercury','Venus','Mars','Jupiter','Saturn'] as const).map(name=>{
   const sign=Math.floor(sky.find(p=>p.name===name)!.longitude/30)+1;
   return {name,sign,houseFromMoon:(sign-owner.moonSign+12)%12+1,
    houseFromLagna:(sign-owner.birthLagnaSign+12)%12+1};
  });
  const period=(input.owner.dasha||[]).find(p=>Date.parse(p.start)<=ms&&ms<Date.parse(p.end));
  const minor=period?.antardashas?.find(p=>Date.parse(p.start)<=ms&&ms<Date.parse(p.end));
  const report:P33Report={
   status:'available',version:'personal-resonance-v1',
   observation:'VERIFIED_SWISS_SAME_MOMENT_AND_OWNED_NATAL',
   date:day.date,timeZone:observer.timeZone,latitude:observer.latitude,
   longitude:observer.longitude,sunriseUtc:day.sunriseUtc,nextSunriseUtc:day.nextSunriseUtc,
   evaluatedAtUtc:atUtc,transitMoon:{sign:moonSign,nakshatraNumber:nak},
   natal:{moonSign:owner.moonSign,lagnaSign:owner.birthLagnaSign},
   tarabala:{...strengths.tarabala,
    quality:strengths.tarabala.quality as P33Report['tarabala']['quality']},
   chandrabala:{...strengths.chandrabala,
    quality:strengths.chandrabala.quality as P33Report['chandrabala']['quality']},
   period:period?{lord:period.lord,start:period.start,end:period.end,
    antardasha:minor?{lord:minor.lord,start:minor.start,end:minor.end}:null}:null,
   gochar
  };
  const point:P33Point={date:day.date,timeZone:observer.timeZone,
   latitude:String(observer.latitude),longitude:String(observer.longitude)};
  const result=assembleP384EventElection({activityId:input.activityId,atUtc,day,point,
   eventLagna:asc,personalReport:report,sky,partnerVerified:!!partner});
  const reasons:string[]=[
   ...result.calendarEvidence.filter(e=>e.polarity!=='context').map(e=>e.id),
   ...(result.panchaka?.forbiddenForScope?['RAMAN_PANCHAKA_SCOPE']:[])
  ];
  const flags=result.panchaka?.forbiddenForScope?'excluded':result.calendarVerdict==='avoid'?'excluded':null;
  // Only full wedding and foundation rules use this specialist module.
  // Engagement remains an incomplete special election until an engagement-
  // specific source register is reviewed; NEVER infer wedding rules.
  if(input.activityId==='wedding'||input.activityId==='foundation'){
   const p=atNode(ms),nodes={Rahu:p.longitude,Ketu:(p.longitude+180)%360,
    source:'JQA3_NATIVE_SWIEPH_MEAN_NODE_AND_OPPOSITE' as const};
   const special=evaluateP385Special({event:result,day,owner,partner,nodes});
   // Preserve BOTH positive and exclusionary source-backed specialist facts
    // in the signed Time Finder result: the UI must not show an identical
    // 'requires review' summary for distinct verified event charts.
    reasons.push(...special.rules.filter(r=>r.state==='excluded'||r.state==='preferred')
     .map(r=>r.id));
   return {status:flags==='excluded'||special.state==='excluded'?'excluded' as const:
     'requires_review' as const,reasonIds:reasons,
    source:'NATIVE_SWISS_SAME_UTC_WITH_CLASSICAL_RULES' as const};
  }
  if(flags==='excluded')return {status:'excluded' as const,reasonIds:reasons,
   source:'NATIVE_SWISS_SAME_UTC_WITH_CLASSICAL_RULES' as const};
  if(activity.method==='direct'&&result.calendarVerdict==='candidate'&&
    !activity.required.includes('election_lagna'))
   return {status:'candidate' as const,reasonIds:reasons,
    source:'NATIVE_SWISS_SAME_UTC_WITH_CLASSICAL_RULES' as const};
  if(activity.method==='special_election')return {status:'requires_review' as const,
   reasonIds:['SPECIAL_ELECTION_RULE_COVERAGE_INCOMPLETE',...reasons],
   source:'NATIVE_SWISS_SAME_UTC_WITH_CLASSICAL_RULES' as const};
  return {status:'undetermined' as const,reasonIds:['NO_DOCUMENTED_POSITIVE_ELECTION'],
   source:'NATIVE_SWISS_SAME_UTC_WITH_CLASSICAL_RULES' as const};
 };
 const timeline=await findP385Windows({activityId:input.activityId,days,fromUtc:input.fromUtc,
  extraBoundaries:events,evaluate,maxExamined:6000});
 // D1/D9/D10 are verified context, not a synthetic additive "luck score".
 // D9 is relevant for ceremony review; D10 for profession, and both remain
 // informational until corresponding chapter-specific election rules are audited.
 const divisionFocus=input.activityId==='wedding'||input.activityId==='engagement'?
  'D9_MARRIAGE_CONTEXT_PENDING_COMPLETE_KUTAS':
  activity.category==='work'?'D10_PROFESSION_CONTEXT_PENDING_SOURCE_RULES':
  'D1_NATAL_LUNAR_CONTEXT';
 return {...timeline,observer:{...observer},divisionFocus,natalDivisions:{
  d1LagnaSign:owner.birthLagnaSign,
  d9LagnaSign:owner.d9LagnaSign,d9SeventhLord:owner.d9SeventhLord,
  d9SeventhOccupants:owner.d9SeventhOccupants,
  d10LagnaSign:owner.d10LagnaSign,d10TenthLord:owner.d10TenthLord,
  d10TenthOccupants:owner.d10TenthOccupants
 }};
}
