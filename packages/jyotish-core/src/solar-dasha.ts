/** True sidereal-solar Vimshottari — experimental CALENDAR method.
 * Standalone deterministic calculation; does not alter production charts until
 * exact JHora calendar-date certification and integrity integration are complete.
 * The Sun's actual observed sidereal longitude defines each elapsed year.
 * Swiss return flags and source ephemeris files must be independently verified.
 */
import {nakshatraOf,DASHA_LORDS,DASHA_YEARS,mod,type DashaPeriod} from './index.ts';

const MS_DAY=86400000;
const JD_UNIX=2440587.5;
const MEAN_SIDEREAL_YEAR=365.25636;
export const VIMSHOTTARI_SOLAR_METHOD='true-sidereal-solar-revolution-v1';
export type SolarPoint={longitude:number;longitudeSpeed:number};
export type SolarPositionAtJulianDay=(julianDayUt:number)=>SolarPoint;

function signedAngularDistance(a:number,b:number){
 return mod(a-b+180,360)-180;
}
function checkedSun(at:SolarPositionAtJulianDay,jd:number):SolarPoint{
 const p=at(jd);
 if(!Number.isFinite(jd)||!Number.isFinite(p.longitude)||
    !Number.isFinite(p.longitudeSpeed)||p.longitudeSpeed<0.8||p.longitudeSpeed>1.2)
  throw new Error('Invalid verified-SWIEPH sidereal solar position or speed');
 return p;
}
/** Solve the desired longitude crossing nearest a physically chosen year count.
 * This is root finding, not multiplication by a fixed year duration.
 */
export function findSiderealSolarCross(
 at:SolarPositionAtJulianDay,startJdUt:number,dashaYears:number,direction:1|-1
):number{
 if(!Number.isFinite(startJdUt)||!Number.isFinite(dashaYears)||dashaYears<0||dashaYears>25)
  throw new Error('Invalid solar-period root request');
 if(dashaYears===0)return startJdUt;
 const origin=checkedSun(at,startJdUt);
 const target=mod(origin.longitude+direction*360*mod(dashaYears,1));
 const estimate=startJdUt+direction*dashaYears*MEAN_SIDEREAL_YEAR;
 let jd=estimate;
 for(let i=0;i<14;i++){
  const p=checkedSun(at,jd);
  const residual=signedAngularDistance(p.longitude,target);
  const correction=residual/p.longitudeSpeed;
  if(!Number.isFinite(correction)||Math.abs(correction)>12)
   throw new Error('Sidereal-Sun crossing left expected 12-day bracket');
  jd-=correction;
  if(Math.abs(correction)<1e-9){
   if(Math.abs((jd-estimate))>12||direction*(jd-startJdUt)<=0)
    throw new Error('Sidereal-Sun crossing outside expected cycle');
   return jd;
  }
 }
 throw new Error('Sidereal-Sun crossing failed to converge');
}
const toISOString=(jdUt:number):string=>{
 const ms=(jdUt-JD_UNIX)*MS_DAY;
 if(!Number.isFinite(ms))throw new Error('Invalid UTC Julian calendar date');
 return new Date(Math.round(ms)).toISOString();
};
/** 9 maha + 81 antara periods, UTC timestamps, no assumptions on local display date.
 * The calendar date seen by a user must be obtained through their IANA zone.
 */
export function vimshottariTrueSiderealSolar(
 moonLongitude:number,birthUtc:string,sunAt:SolarPositionAtJulianDay
):DashaPeriod[]{
 const nak=nakshatraOf(moonLongitude),first=nak.index%9;
 const ms=Date.parse(birthUtc);
 if(!Number.isFinite(ms))throw new Error('Invalid birth UTC instant');
 const jd=ms/MS_DAY+JD_UNIX;
 let cursor=findSiderealSolarCross(sunAt,jd,DASHA_YEARS[first]*nak.fraction,-1);
 const periods:DashaPeriod[]=[];
 for(let i=0;i<9;i++){
  const k=(first+i)%9,lord=DASHA_LORDS[k];
  const end=findSiderealSolarCross(sunAt,cursor,DASHA_YEARS[k],1);
  const antar=[];
  let sub=cursor;
  for(let j=0;j<9;j++){
   const p=(k+j)%9;
   const nominalNext=findSiderealSolarCross(sunAt,sub,DASHA_YEARS[k]*DASHA_YEARS[p]/120,1);
   if(!(nominalNext>sub))throw new Error('Non-positive antardasha duration');
   const next=j===8?end:nominalNext;
   if(!(next>sub)||next>end+1/86400)throw new Error('Solar dasha subperiod escaped its mahadasha');
   antar.push({lord:DASHA_LORDS[p],start:toISOString(sub),end:toISOString(next)});
   sub=next;
  }
  periods.push({lord,start:toISOString(cursor),end:toISOString(end),antardashas:antar});
  cursor=end;
 }
 return periods;
}
