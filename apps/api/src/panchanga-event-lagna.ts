/**
 * P3.8.4 — Lagna of the FUTURE EVENT, not the user's birth Lagna.
 *
 * The calculation intentionally matches the existing JQA-3 Galaxiora natal
 * convention: Swiss Ephemeris tropical ASC from UT and geographic observer,
 * minus *mean* Lahiri for Swiss 2.02/JHora8 reference. See getEphemeris.
 *
 * Input is strict UTC, not a browser-local clock (DST ambiguity impossible).
 * We do not silently swap Porphyry/Placidus at polar latitudes, round
 * an ascendant across a sidereal sign, or replace Swiss with approximations.
 * No event "muhurta" is certified by this astronomical computation alone.
 */
import {divisionalLongitude,JHORA8_MEAN_LAHIRI_VERSION_DIFF_ARCSECONDS,jhora8SiderealLongitude,mod} from '../../../packages/jyotish-core/src/index.ts';
import {jhora8HistoricalJulianDay} from '../../../packages/jyotish-core/src/jhora8-delta-t-grid.ts';
import {assertSwissReturnFlags} from './swiss-backend-policy.ts';

export const EVENT_LAGNA_PROFILE='jqa3-swiss210-historical-jhora8-mean-lahiri-v1' as const;
export const EVENT_LAGNA_SOURCE='https://www.astro.com/ftp/swisseph/doc/swephprg.2.10.htm';
export type EventLocation={latitude:number;longitude:number;timeZone:string};
export type EventLagnaInput=EventLocation&{atUtc:string};
export type VerifiedEventLagna={
 status:'available';version:'p38-event-lagna-v1';
 provenance:'NATIVE_SWISS_TROPICAL_ASC_MINUS_VERIFIED_MEAN_LAHIRI';
 eventAtUtc:string;observer:EventLocation;
 localDate:string;localTime:string;
 julianDayUt:number;ayanamsaDegrees:number;
 tropicalAscendantDegrees:number;siderealAscendantDegrees:number;
 lagnaSign:number;degreesInSign:number;
 eventNavamsaLongitude:number;eventNavamsaSign:number;
 eventDasamsaLongitude:number;eventDasamsaSign:number;
 panchakaLagnaNumber:number;
 distanceToSignBoundaryArcseconds:number;
 profile:typeof EVENT_LAGNA_PROFILE;source:typeof EVENT_LAGNA_SOURCE;
};
const UTC_PATTERN=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const INDEPENDENTLY_TESTED_RANGE={minYear:1900,maxYear:2099};
export function validateEventLagnaInput(value:EventLagnaInput){
 if(!value||typeof value.atUtc!=='string'||!UTC_PATTERN.test(value.atUtc))
  throw Error('Event Lagna requires explicit UTC ISO moment (seconds, optional 3-digit milliseconds)');
 const ms=Date.parse(value.atUtc);
 if(!Number.isFinite(ms)||new Date(ms).toISOString()!==
    (value.atUtc.includes('.')?value.atUtc:value.atUtc.replace('Z','.000Z')))
  throw Error('Invalid exact UTC event moment');
 const year=new Date(ms).getUTCFullYear();
 if(year<INDEPENDENTLY_TESTED_RANGE.minYear||year>INDEPENDENTLY_TESTED_RANGE.maxYear)
  throw Error('Event Lagna outside 1900–2099 validated calendar domain');
 const {latitude,longitude,timeZone}=value;
 if(typeof latitude!=='number'||!Number.isFinite(latitude)||Math.abs(latitude)>=66.5||
  typeof longitude!=='number'||!Number.isFinite(longitude)||longitude< -180||longitude>180)
  throw Error('Event Lagna requires finite event coordinates below polar Placidus fallback latitude');
 if(typeof timeZone!=='string'||timeZone.length>64||!timeZone.trim())
  throw Error('Event Lagna requires an explicit IANA time zone');
 try{new Intl.DateTimeFormat('en-GB',{timeZone}).format(new Date(ms));}
 catch{throw Error('Invalid event IANA time zone');}
 return ms;
}
export async function calculateVerifiedEventLagna(input:EventLagnaInput):Promise<VerifiedEventLagna>{
 const ms=validateEventLagnaInput(input);
 // Fail closed on missing SWISS native module: no Python, Meeus, or chart reuse.
 const sw=await import('@swisseph/node');
 const t=new Date(ms);
 const hour=t.getUTCHours()+t.getUTCMinutes()/60+t.getUTCSeconds()/3600+t.getUTCMilliseconds()/3600000;
 const jd=sw.julianDay(t.getUTCFullYear(),t.getUTCMonth()+1,t.getUTCDate(),hour);
 if(!Number.isFinite(jd)||Math.abs(jd-(ms/86400000+2440587.5))>2e-8)
  throw Error('Swiss Julian day UT mismatch');
 sw.setSiderealMode(sw.SiderealMode.Lahiri);
 const flags=sw.CalculationFlag.SwissEphemeris|64; // SEFLG_NONUT for historical mean Lahiri
 const meanAyanamsa=sw.getAyanamsaExUt(jd,flags)-JHORA8_MEAN_LAHIRI_VERSION_DIFF_ARCSECONDS/3600;
 const asc=sw.calculateHouses(jd,input.latitude,input.longitude,sw.HouseSystem.Placidus).ascendant;
 if(!Number.isFinite(asc)||asc<0||asc>=360||!Number.isFinite(meanAyanamsa)||
   meanAyanamsa<0||meanAyanamsa>=360)
  throw Error('Invalid Swiss event houses or Lahiri ayanamsa');
 const sid=mod(asc-meanAyanamsa),deg=sid%30;
 const distanceArcSeconds=Math.min(deg,30-deg)*3600;
 // A sign exactly on its boundary is exquisitely sensitive to seconds of
 // location/time and floating-point conventions; never mislabel it as stable.
 if(distanceArcSeconds<=1)throw Error('Event Lagna within 1 arcsecond of sign boundary; refine event time');
 const nav=divisionalLongitude(sid,9),dash=divisionalLongitude(sid,10);
 const dt=new Intl.DateTimeFormat('en-GB',{timeZone:input.timeZone,
  year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',
  second:'2-digit',hourCycle:'h23'}).formatToParts(t);
 const find=(k:string)=>dt.find(p=>p.type===k)?.value||'';
 const localDate=find('year')+'-'+find('month')+'-'+find('day');
 const localTime=find('hour')+':'+find('minute')+':'+find('second');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(localDate)||!/^\d{2}:\d{2}:\d{2}$/.test(localTime))
  throw Error('Invalid event IANA clock conversion');
 return {status:'available',version:'p38-event-lagna-v1',
  provenance:'NATIVE_SWISS_TROPICAL_ASC_MINUS_VERIFIED_MEAN_LAHIRI',
  eventAtUtc:input.atUtc,observer:{latitude:input.latitude,longitude:input.longitude,timeZone:input.timeZone},
  localDate,localTime,julianDayUt:jd,ayanamsaDegrees:meanAyanamsa,
  tropicalAscendantDegrees:asc,siderealAscendantDegrees:sid,
  lagnaSign:Math.floor(sid/30)+1,degreesInSign:deg,
  eventNavamsaLongitude:nav,eventNavamsaSign:Math.floor(nav/30)+1,
  eventDasamsaLongitude:dash,eventDasamsaSign:Math.floor(dash/30)+1,
  panchakaLagnaNumber:Math.floor(sid/30)+1,
  distanceToSignBoundaryArcseconds:distanceArcSeconds,
  profile:EVENT_LAGNA_PROFILE,source:EVENT_LAGNA_SOURCE};
}

/** Mean Rahu and opposing Ketu for EVENT elections (not user's natal nodes).
 * Native SWIEPH returned flags are mandatory; never substitute Moshier.
 */
export async function calculateVerifiedEventNodesAt(atUtc:string){
 const ms=Date.parse(atUtc);
 if(typeof atUtc!=='string'||!Number.isSafeInteger(ms)||
    new Date(ms).toISOString()!==atUtc)throw Error('P385 verified UTC event required for lunar nodes');
 const sw=await import('@swisseph/node');
 sw.setSiderealMode(sw.SiderealMode.Lahiri);
 const jd=ms/86400000+2440587.5,year=new Date(ms).getUTCFullYear();
 if(year<1900||year>2099)throw Error('P385 lunar nodes outside verified event range');
 const planetJd=jhora8HistoricalJulianDay(jd);
 const flags=sw.CalculationFlag.SwissEphemeris|sw.CalculationFlag.Speed|65536;
 const point=sw.calculatePosition(planetJd,sw.LunarPoint.MeanNode,flags);
 assertSwissReturnFlags(point.flags,'P385.Event.MeanRahu');
 const rahu=jhora8SiderealLongitude(point.longitude);
 if(!Number.isFinite(rahu)||rahu<0||rahu>=360)throw Error('P385 non-finite SWIEPH Rahu');
 return {Rahu:rahu,Ketu:mod(rahu+180),source:'JQA3_NATIVE_SWIEPH_MEAN_NODE_AND_OPPOSITE' as const};
}
