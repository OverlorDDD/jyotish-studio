import {Controller,Get,Header,ServiceUnavailableException} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {calendarDays,dailyTransit,localToday} from './personal-transits.ts';
import {readPublicSign,EDITORIAL_REFERENCE} from './horoscope-editorial.ts';
/** Moon moves about 11–16 degrees per 24h. Reject reused/corrupted daily snapshots. */
export function verifyLunarContinuity(days:Awaited<ReturnType<typeof dailyTransit>>[]){
 for(let i=1;i<days.length;i++){
  const a=days[i-1].moon.longitude,b=days[i].moon.longitude;
  const delta=((b-a)%360+360)%360;
  if(!Number.isFinite(delta)||delta<5||delta>20)
   throw new ServiceUnavailableException('Lunar noon observations failed continuity check');
 }
}
/** Public Janma-Rashi references, not personal natal readings.
 * Always derives lunar positions from existing Swiss/Lahiri calculation.
 */
@ApiTags('Horoscopes')
@Controller('api/v1/horoscope')
export class HoroscopeController{
 @Get('today') @Header('Cache-Control','public,max-age=300')
 async today(){
  const zone='Europe/Kyiv',date=localToday(zone);
  let transit:Awaited<ReturnType<typeof dailyTransit>>;
  try{transit=await dailyTransit(date,zone);}
  catch{throw new ServiceUnavailableException('Astronomical data unavailable; no forecast generated');}
  return {date,zone,reference:'SIDEREAL_MOON_SIGN',sampledAtUtc:transit.sampledAtUtc,
   moon:{sign:transit.moon.sign,nakshatra:transit.moon.nakshatra,pada:transit.moon.pada},
   signs:Array.from({length:12},(_,i)=>readPublicSign(i+1,transit)),
   sources:EDITORIAL_REFERENCE,notAPersonalChart:true};
 }

 @Get('week') @Header('Cache-Control','public,max-age=300')
 async week(){
  const zone='Europe/Kyiv',startDate=localToday(zone);
  let days:Awaited<ReturnType<typeof dailyTransit>>[];
  try{days=await Promise.all(calendarDays(startDate,7).map(day=>dailyTransit(day,zone)));}
  catch{throw new ServiceUnavailableException('Astronomical data unavailable; no forecast generated');}
  verifyLunarContinuity(days);
  return {startDate,zone,reference:'SIDEREAL_MOON_SIGN',notAPersonalChart:true,
   days:days.map(transit=>({
    date:transit.date,sampledAtUtc:transit.sampledAtUtc,
    moon:{sign:transit.moon.sign,nakshatra:transit.moon.nakshatra,pada:transit.moon.pada},
    signs:Array.from({length:12},(_,i)=>readPublicSign(i+1,transit))
   })),sources:EDITORIAL_REFERENCE};
 }
}
Reflect.defineMetadata('design:paramtypes',[],HoroscopeController.prototype,'today');
Reflect.defineMetadata('design:paramtypes',[],HoroscopeController.prototype,'week');
