import {Controller,Get,Header,Query,BadRequestException,ServiceUnavailableException} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {astronomicalEventsWindow,validateEventSearch} from './astronomical-events.ts';

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
}
Reflect.defineMetadata('design:paramtypes',[String,String,String],AstronomicalEventsController.prototype,'events');
