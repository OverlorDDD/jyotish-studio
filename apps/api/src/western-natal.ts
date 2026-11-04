/**
 * Tropical full classical seven-planet natal chart, exact birth UT + birth coordinates.
 * Placidus is explicit. Polar/invalid cusp geometry fails closed: no fake houses.
 * Coordinates never leave the server-side ownership-gated calculation.
 * https://github.com/swisseph-js/swisseph/blob/main/docs/api/node.md
 */
import {tropicalSkyAtUtc,type TropicalPlanet} from './western-horoscope.ts';
const NAMES:readonly TropicalPlanet[]=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn'];
const mod=(x:number)=>((x%360)+360)%360;
export function houseFromCusps(longitude:number,cusps:readonly number[]):number{
 if(!Number.isFinite(longitude)||longitude<0||longitude>=360||cusps.length!==12||
  cusps.some(c=>!Number.isFinite(c)||c<0||c>=360))throw Error('Invalid tropical cusp geometry');
 const arcs=cusps.map((x,i)=>mod(cusps[(i+1)%12]-x));
 if(arcs.some(x=>x<0.1||x>=180)||Math.abs(arcs.reduce((a,b)=>a+b,0)-360)>1e-5)
  throw Error('Unsupported Placidus cusp geometry');
 for(let i=0;i<12;i++)if(mod(longitude-cusps[i])<arcs[i])return i+1;
 throw Error('No house for tropical longitude');
}
export async function tropicalNatalChartAtUtc(utc:string,latitude:number,longitude:number){
 if(!Number.isFinite(latitude)||Math.abs(latitude)>66||
    !Number.isFinite(longitude)||Math.abs(longitude)>180)
  throw Error('Full Placidus natal houses require verified birth location outside polar limits');
 const sky=await tropicalSkyAtUtc(utc); // independently checks Swiss returned backend flags
 const sw=await import('@swisseph/node');
 const date=new Date(utc);
 const hour=date.getUTCHours()+date.getUTCMinutes()/60+date.getUTCSeconds()/3600+
  date.getUTCMilliseconds()/3600000;
 const jd=sw.julianDay(date.getUTCFullYear(),date.getUTCMonth()+1,date.getUTCDate(),hour);
 const result=sw.calculateHouses(jd,latitude,longitude,sw.HouseSystem.Placidus);
 const cusps=result.cusps.slice(1,13).map(mod);
 if(cusps.length!==12||!Number.isFinite(result.ascendant)||!Number.isFinite(result.mc))
  throw Error('Incomplete Swiss Placidus natal houses');
 const planets=Object.fromEntries(NAMES.map(name=>[name,{
  longitude:sky.planets[name].longitude,sign:sky.planets[name].sign,
  house:houseFromCusps(sky.planets[name].longitude,cusps)
 }])) as Record<TropicalPlanet,{longitude:number;sign:number;house:number}>;
 return {method:'SWISS_TROPICAL_PLACIDUS_UT_V1',sampledAtUtc:sky.sampledAtUtc,
  planets,ascendant:mod(result.ascendant),midheaven:mod(result.mc),cusps,
  source:'SWISS_NATIVE_TROPICAL_VERIFIED_SWIEPH_AND_HOUSE_CUSPS'};
}
