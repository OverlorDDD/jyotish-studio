/** Release integration: one provenance-bearing astronomical context shared by
 * horoscopes, Personal, Yoga and owned astro news. Independent failures never
 * silently turn a candidate festival into an authoritative fasting date.
 */
import {astronomicalEventsWindow} from './astronomical-events.ts';
import {vedicCalendarWindow} from './vedic-calendar.ts';
import {eventInsight} from '../../../packages/jyotish-core/src/astro-education.ts';
import {validLocalDay,validTimeZone} from './personal-transits.ts';
export type SkyContext={version:'galaxiora-sky-context-v1';date:string;zone:string;
 events:{kind:string;body?:string;atUtc:string;localDate:string;practice:{uk:string;en:string};
  meaning:{uk:string;en:string};tradition:{uk:string;en:string}}[];
 observances:{id:string;atUtc:string;rule:string;category:string;date:string}[];
 referenceLocation:{name:string;latitude:number;longitude:number}|null;
 observanceDayCertifiedByTradition:false;available:{events:boolean;festivals:boolean}};
export async function dailySkyContext(date:string,zone:string,includeReferenceFestivals=true):Promise<SkyContext>{
 if(!validLocalDay(date)||!validTimeZone(zone))throw Error('Invalid astronomical day and zone');
 const [astro,festival]=await Promise.allSettled([
  astronomicalEventsWindow({start:date,days:7,timeZone:zone}),
  includeReferenceFestivals?vedicCalendarWindow({start:date,days:1,timeZone:'Europe/Kyiv',
   latitude:50.4501,longitude:30.5234,monthSystem:'amanta'}):Promise.resolve(null)
 ]);
 const events=astro.status==='fulfilled'?astro.value.events.slice(0,12).map(e=>({
  kind:e.kind,body:e.body,atUtc:e.atUtc,localDate:e.localDate,
  practice:{uk:eventInsight(e.kind,'uk').practice,en:eventInsight(e.kind,'en').practice},
  meaning:{uk:eventInsight(e.kind,'uk').meaning,en:eventInsight(e.kind,'en').meaning},
  tradition:{uk:eventInsight(e.kind,'uk').tradition,en:eventInsight(e.kind,'en').tradition}
 })):[];
 const data=festival.status==='fulfilled'?festival.value:null;
 return {version:'galaxiora-sky-context-v1',date,zone,events,
  observances:data?.days[0]?.observances.map(o=>({
   id:o.id,atUtc:o.atUtc,rule:o.rule,category:o.category,date:o.date}))||[],
  referenceLocation:data?{name:'Kyiv (reference observances, not user location)',latitude:50.4501,longitude:30.5234}:null,
  observanceDayCertifiedByTradition:false,
  available:{events:astro.status==='fulfilled',festivals:data!==null}};
}
