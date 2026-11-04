/** Western tropical astrology — separate from Lahiri/Jyotish.
 * Native Swiss Ephemeris returns TROPICAL longitudes directly (no sidereal
 * flag; no JHora historical ayanamsa adjustment). Reject Moshier fallback.
 * Interpretive tradition: whole-sign transits relative to a tropical natal
 * Sun-sign reference, NOT a personalized natal chart or causal prediction.
 */
import {assertSwissReturnFlags} from './swiss-backend-policy.ts';
import {localToUTC,signIndex} from '../../../packages/jyotish-core/src/index.ts';
import {validLocalDay,validTimeZone} from './personal-transits.ts';
import {editorialWesternReading} from './horoscope-editorial.ts';
type L={uk:string;en:string};
const l=(uk:string,en:string):L=>({uk,en});
export type Body={longitude:number;sign:number};
export type TropicalPlanet='Sun'|'Moon'|'Mercury'|'Venus'|'Mars'|'Jupiter'|'Saturn';
export type TropicalSky={sampledAtUtc:string;sun:Body;moon:Body;planets:Record<TropicalPlanet,Body>;method:string};
export const TROPICAL_METHOD='Swiss Ephemeris / tropical-of-date / whole-sign-from-natal-Sun / local-noon-sample-v1';
const memo=new Map<string,Promise<TropicalSky>>();
export async function tropicalSkyAtUtc(utc:string):Promise<TropicalSky>{
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(utc)||
    !Number.isFinite(Date.parse(utc)))throw Error('Invalid UTC birth instant');
 let cached=memo.get(utc);
 if(!cached){
  cached=(async()=>{
   const sw=await import('@swisseph/node');
   const dt=new Date(utc);
   const hour=dt.getUTCHours()+dt.getUTCMinutes()/60+dt.getUTCSeconds()/3600+
    dt.getUTCMilliseconds()/3600000;
   const jd=sw.julianDay(dt.getUTCFullYear(),dt.getUTCMonth()+1,dt.getUTCDate(),hour);
   const flags=sw.CalculationFlag.SwissEphemeris|sw.CalculationFlag.Speed;
   const compute=(planet:number,name:string):Body=>{
    const p=sw.calculatePosition(jd,planet,flags);
    assertSwissReturnFlags(p.flags,'Tropical '+name);
    if(!Number.isFinite(p.longitude))throw Error('Invalid tropical '+name+' longitude');
    const longitude=((p.longitude%360)+360)%360;
    return {longitude,sign:signIndex(longitude)+1};
   };
   const planets={
    Sun:compute(sw.Planet.Sun,'Sun'),Moon:compute(sw.Planet.Moon,'Moon'),
    Mercury:compute(sw.Planet.Mercury,'Mercury'),Venus:compute(sw.Planet.Venus,'Venus'),
    Mars:compute(sw.Planet.Mars,'Mars'),Jupiter:compute(sw.Planet.Jupiter,'Jupiter'),
    Saturn:compute(sw.Planet.Saturn,'Saturn')
   };
   return {sampledAtUtc:utc,sun:planets.Sun,moon:planets.Moon,planets,method:TROPICAL_METHOD};
  })();
  memo.set(utc,cached);
  if(memo.size>96)memo.delete(memo.keys().next().value!);
  cached.catch(()=>{if(memo.get(utc)===cached)memo.delete(utc)});
 }
 return cached;
}
export async function tropicalSkyForDay(date:string,zone:string):Promise<TropicalSky>{
 if(!validLocalDay(date)||!validTimeZone(zone))throw Error('Invalid day or IANA time zone');
 return tropicalSkyAtUtc(localToUTC(date,'12:00',zone));
}
/** Western Sun-sign transit reading for real Sun, Moon and Mercury houses.
 * Public and natal-selected mode share real sky; never claim Placidus natal
 * houses, dasha, or events when only the Sun-sign anchor is used.
 */
export function westernSignReading(referenceSign:number,sky:TropicalSky,date:string){
 if(!Number.isInteger(referenceSign)||referenceSign<1||referenceSign>12||
    !validLocalDay(date))throw Error('Invalid tropical sign reading');
 for(const name of ['Sun','Moon','Mercury'] as const){
  const p=sky.planets[name];
  if(!p||!Number.isFinite(p.longitude)||!Number.isInteger(p.sign)||p.sign<1||p.sign>12||
    Math.floor(p.longitude/30)+1!==p.sign)throw Error('Incomplete Western transit '+name);
 }
 const sunHouse=((sky.sun.sign-referenceSign+12)%12)+1;
 const moonHouse=((sky.moon.sign-referenceSign+12)%12)+1;
 const mercuryHouse=((sky.planets.Mercury.sign-referenceSign+12)%12)+1;
 const prose=editorialWesternReading({sunHouse,moonHouse,mercuryHouse});
 return {...prose,referenceSign,house:moonHouse,
  evidence:{
   kind:'PUBLIC_TROPICAL_SOLAR_REFERENCE',method:TROPICAL_METHOD,
   sampledAtUtc:sky.sampledAtUtc,day:date,
   sunSign:sky.sun.sign,sunLongitude:sky.sun.longitude,
   moonSign:sky.moon.sign,moonLongitude:sky.moon.longitude,
   mercurySign:sky.planets.Mercury.sign,mercuryLongitude:sky.planets.Mercury.longitude,
   mercuryHouse,sunHouse,house:moonHouse,referenceSign,
   editorialPolicy:'HOUSE_FOCUSED_DETERMINISTIC_UK_EN_V2'
  }};
}
export const WESTERN_HOROSCOPE_SOURCES={
 astronomy:'Swiss Ephemeris tropical-of-date; verified SWIEPH backend',
 interpretation:'Western whole-sign Sun-sign and Moon-transit symbolism; editorial themes, not event predictions',
 individualBirthChart:false
} as const;
