import {Controller,Get,Header,Query,BadRequestException,ServiceUnavailableException} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {astronomicalEventsWindow,validateEventSearch} from './astronomical-events.ts';
import {observerEclipses,validateEclipseRequest} from './astronomy-eclipses.ts';

@ApiTags('Astronomical Events')
@Controller('api/v1/astronomy')
export class AstronomicalEventsController{
 /** The browser chooses a local-date window; values are independently
  * computed in UTC and the response is explicitly not eclipse certification.
  */
 @Get('events') @Header('Cache-Control','public,max-age=120')
 async events(@Query('start')start?:string,@Query('days')days?:string,
  @Query('zone')zone?:string){
  const query={start,timeZone:zone,days:days===undefined?undefined:Number(days)};
  try{validateEventSearch(query);}
  catch(error){throw new BadRequestException(error instanceof Error?error.message:'Invalid event range');}
  try{return await astronomicalEventsWindow(query);}
  catch{throw new ServiceUnavailableException('Verified Swiss astronomical event source unavailable; no estimated data returned');}
 }
 /** Solar/lunar eclipses worldwide, with visibility at the explicitly
  * selected observer, not inferred from geocentric new/full Moon. */
 @Get('eclipses') @Header('Cache-Control','public,max-age=120')
 async eclipses(@Query('start')start?:string,@Query('days')days?:string,
  @Query('zone')zone?:string,@Query('latitude')latitude?:string,
  @Query('longitude')longitude?:string,@Query('altitudeM')altitudeM?:string){
  const input={start,timeZone:zone,
   days:days===undefined?undefined:Number(days),
   latitude:latitude===undefined?undefined:Number(latitude),
   longitude:longitude===undefined?undefined:Number(longitude),
   altitudeM:altitudeM===undefined?undefined:Number(altitudeM)};
  try{validateEclipseRequest(input);}
  catch(e){throw new BadRequestException(e instanceof Error?e.message:'Invalid eclipse search');}
  try{return await observerEclipses(input);}
  catch{throw new ServiceUnavailableException('Verified Swiss eclipse geometry unavailable; no eclipse invented');}
 }
}
Reflect.defineMetadata('design:paramtypes',[String,String,String],AstronomicalEventsController.prototype,'events');
Reflect.defineMetadata('design:paramtypes',[String,String,String,String,String,String],AstronomicalEventsController.prototype,'eclipses');
