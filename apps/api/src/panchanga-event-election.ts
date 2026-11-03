/**
 * P3.8.4: Complete the *astronomical* event instant and apply only the
 * specifically documented Raman Panchaka rule. This is NOT yet a full
 * Vivaha, Griha-pravesha, travel or foundation muhurtam: most classical
 * divisional, natal/partner and planetary doshas are a separate QA gate.
 */
import {evaluateP38,p38Activity,type P38ActivityId} from '../../web/lib/panchanga-p38-decision.ts';
import {calculateRamanPanchaka,type P38PanchakaScope} from '../../web/lib/panchanga-p38-panchaka.ts';
import type {P32Day} from '../../web/lib/panchanga-p32-engine.ts';
import type {P33Report,P33Point} from '../../web/lib/panchanga-p33-resonance.ts';
import type {VerifiedEventLagna} from './panchanga-event-lagna.ts';

export const P384_SCOPED_PANCHAKA:Readonly<Partial<Record<P38ActivityId,P38PanchakaScope>>>={
 job_start:'occupation',
 shop_opening:'occupation',
 foundation:'home_building',
 short_journey:'travel',
 long_journey:'travel',
 business_journey:'travel',
 wedding:'marriage'
};
export type P384Planet={
 name:'Sun'|'Moon'|'Mercury'|'Venus'|'Mars'|'Jupiter'|'Saturn';
 longitude:number;sign:number;houseFromEventLagna:number;
};
export type P384Evaluation={
 status:'evaluated';version:'p384-event-election-v1';
 eventAtUtc:string;activityId:P38ActivityId;
 eventLagna:VerifiedEventLagna;eventSky:P384Planet[];
 calendarVerdict:ReturnType<typeof evaluateP38>['verdict'];
 panchaka:ReturnType<typeof calculateRamanPanchaka>|null;
 panchakaScope:P38PanchakaScope|null;
 ownerChart:'verified_owner_only';partnerChart:'verified_owner_saved_chart'|'not_required';
 guidanceScope:'PARTIAL_EVENT_ELECTION_REQUIRES_SPECIAL_DOSHAS';
 remainingRuleGates:string[];
};
type BuildInput={activityId:P38ActivityId;atUtc:string;day:P32Day;
 eventLagna:VerifiedEventLagna;point:P33Point;personalReport:P33Report;
 sky:ReadonlyArray<{name:P384Planet['name'];longitude:number}>;partnerVerified:boolean};
const SIDEREAL_PARTS=30;
export function assembleP384EventElection(input:BuildInput):P384Evaluation{
 const {eventLagna,atUtc,day,activityId,point,personalReport,partnerVerified}=input;
 const activity=p38Activity(activityId),at=Date.parse(atUtc);
 if(eventLagna.status!=='available'||
    eventLagna.provenance!=='NATIVE_SWISS_TROPICAL_ASC_MINUS_VERIFIED_MEAN_LAHIRI'||
    eventLagna.lagnaSign!==Math.floor(eventLagna.siderealAscendantDegrees/30)+1||
    eventLagna.panchakaLagnaNumber!==eventLagna.lagnaSign||
    eventLagna.eventAtUtc!==atUtc||
    at<Date.parse(day.sunriseUtc)||at>=Date.parse(day.nextSunriseUtc)||
    day.date!==point.date||day.location.timeZone!==point.timeZone||
    eventLagna.observer.latitude!==Number(point.latitude)||
    eventLagna.observer.longitude!==Number(point.longitude)||
    eventLagna.observer.timeZone!==point.timeZone)
  throw Error('P384 event/natal/sky observer and exact instant must agree');
 if(activity.required.includes('partner_chart')&&!partnerVerified)
  throw Error('P384 verified partner chart required for this ceremonial activity');
 if(!Array.isArray(input.sky)||input.sky.length!==7||
    new Set(input.sky.map(p=>p.name)).size!==7)
  throw Error('P384 complete Swiss event 7-planet snapshot required');
 const eventSky:P384Planet[]=input.sky.map(p=>{
  if(!Number.isFinite(p.longitude)||p.longitude<0||p.longitude>=360)
   throw Error('P384 invalid Swiss planetary longitude');
  const sign=Math.floor(p.longitude/SIDEREAL_PARTS)+1;
  return {name:p.name,longitude:p.longitude,sign,
   houseFromEventLagna:(sign-eventLagna.lagnaSign+12)%12+1};
 });
 const moon=eventSky.find(p=>p.name==='Moon')!;
 if(moon.sign!==personalReport.transitMoon.sign)
  throw Error('P384 event Moon does not match owner-verified personal Swiss Moon');
 const screening=evaluateP38(day,atUtc,activityId,{point,report:personalReport});
 const scope=P384_SCOPED_PANCHAKA[activityId]||null;
 const find=<K extends keyof P32Day['periods']>(key:K)=>{
  const periods=day.periods[key].filter(p=>Date.parse(p.startUtc)<=at&&at<Date.parse(p.endUtc));
  if(periods.length!==1)throw Error('P384 incomplete exact '+key+' period');
  return periods[0].value;
 };
 const tithi=find('tithi') as P32Day['sunrise']['tithi'];
 const nak=find('nakshatra') as P32Day['sunrise']['nakshatra'];
 const panchaka=scope?calculateRamanPanchaka({
  tithiNumber:tithi.number,varaNumber:day.sunrise.vara.number,
  nakshatraNumber:nak.number,electionLagnaSign:eventLagna.panchakaLagnaNumber
 },scope):null;
 const remainingRuleGates=[
  'ACTIVITY_SPECIFIC_CLASSICAL_DOSHAS_AND_EXCEPTIONS',
  'PERSONAL_NATAL_HOUSES_AND_PERIOD_ELECTION_REVIEW',
  'NAVAMSA_AND_GRAHA_DRISHTI_FOR_SPECIAL_MUHURTA'
 ];
 if(activity.required.includes('partner_chart'))
  remainingRuleGates.push('BOTH_PARTNERS_CLASSICAL_COMPATIBILITY');
 return {status:'evaluated',version:'p384-event-election-v1',
  eventAtUtc:atUtc,activityId,eventLagna,eventSky,
  calendarVerdict:screening.verdict,panchaka,panchakaScope:scope,
  ownerChart:'verified_owner_only',
  partnerChart:partnerVerified?'verified_owner_saved_chart':'not_required',
  guidanceScope:'PARTIAL_EVENT_ELECTION_REQUIRES_SPECIAL_DOSHAS',
  remainingRuleGates};
}
