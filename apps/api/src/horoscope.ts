import {Controller,Get,Header,ServiceUnavailableException} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {calendarDays,dailyTransit,localToday} from './personal-transits.ts';
import {readPublicSign,EDITORIAL_REFERENCE} from './horoscope-editorial.ts';
import {dailySkyContext} from './sky-context.ts';
import {tropicalSkyForDay,westernSignReading,WESTERN_HOROSCOPE_SOURCES,TROPICAL_METHOD} from './western-horoscope.ts';
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
  const sky=await dailySkyContext(date,zone);
  return {date,zone,reference:'SIDEREAL_MOON_SIGN',sampledAtUtc:transit.sampledAtUtc,sky,
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
  const sky=await dailySkyContext(startDate,zone);
  return {startDate,zone,reference:'SIDEREAL_MOON_SIGN',notAPersonalChart:true,sky,
   days:days.map(transit=>({
    date:transit.date,sampledAtUtc:transit.sampledAtUtc,
    moon:{sign:transit.moon.sign,nakshatra:transit.moon.nakshatra,pada:transit.moon.pada},
    signs:Array.from({length:12},(_,i)=>readPublicSign(i+1,transit))
   })),sources:EDITORIAL_REFERENCE};
 }
 @Get('western/today') @Header('Cache-Control','public,max-age=300')
 async westernToday(){
  const zone='Europe/Kyiv',date=localToday(zone);
  let sky:Awaited<ReturnType<typeof tropicalSkyForDay>>;
  try{sky=await tropicalSkyForDay(date,zone);}
  catch{throw new ServiceUnavailableException('Verified tropical Swiss Ephemeris unavailable; cannot publish Western horoscope');}
  return {date,zone,reference:'TROPICAL_SUN_SIGN',sampledAtUtc:sky.sampledAtUtc,
   sun:sky.sun,moon:sky.moon,method:TROPICAL_METHOD,
   signs:Array.from({length:12},(_,i)=>westernSignReading(i+1,sky,date)),
   sources:WESTERN_HOROSCOPE_SOURCES,notAPersonalChart:true};
 }

 @Get('western/week') @Header('Cache-Control','public,max-age=300')
 async westernWeek(){
  const zone='Europe/Kyiv',startDate=localToday(zone);
  let days:{date:string;sky:Awaited<ReturnType<typeof tropicalSkyForDay>>}[];
  try{days=await Promise.all(calendarDays(startDate,7).map(async date=>
   ({date,sky:await tropicalSkyForDay(date,zone)})));}
  catch{throw new ServiceUnavailableException('Verified tropical Swiss Ephemeris unavailable; cannot publish Western week');}
  return {startDate,zone,reference:'TROPICAL_SUN_SIGN',method:TROPICAL_METHOD,
   days:days.map(({date,sky})=>({date,sampledAtUtc:sky.sampledAtUtc,
    sun:sky.sun,moon:sky.moon,
    signs:Array.from({length:12},(_,i)=>westernSignReading(i+1,sky,date))})),
   sources:WESTERN_HOROSCOPE_SOURCES,notAPersonalChart:true};
 }
}
Reflect.defineMetadata('design:paramtypes',[],HoroscopeController.prototype,'today');
Reflect.defineMetadata('design:paramtypes',[],HoroscopeController.prototype,'week');
