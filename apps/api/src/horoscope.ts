import {Controller,Get,Header,ServiceUnavailableException} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {dailyTransit,localToday} from './personal-transits.ts';
import {readPublicSign,EDITORIAL_REFERENCE} from './horoscope-editorial.ts';
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
}
Reflect.defineMetadata('design:paramtypes',[],HoroscopeController.prototype,'today');
