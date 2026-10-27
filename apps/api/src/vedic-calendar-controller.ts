import {Controller,Get,Header,Query,BadRequestException,ServiceUnavailableException} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {vedicCalendarWindow,validateVedicCalendar} from './vedic-calendar.ts';
@ApiTags('Vedic Festivals & Muhurta')
@Controller('api/v1/vedic-calendar')
export class VedicCalendarController{
 @Get('week') @Header('Cache-Control','public,max-age=120')
 async week(@Query('start')start?:string,@Query('days')days?:string,@Query('zone')zone?:string,
  @Query('latitude')latitude?:string,@Query('longitude')longitude?:string,
  @Query('monthSystem')monthSystem?:string){
  const values={start,days:days===undefined?undefined:Number(days),timeZone:zone,
   latitude:latitude===undefined?undefined:Number(latitude),
   longitude:longitude===undefined?undefined:Number(longitude),
   monthSystem:monthSystem as 'amanta'|'purnimanta'|undefined};
  try{validateVedicCalendar(values);}
  catch(err){throw new BadRequestException(err instanceof Error?err.message:'Invalid observer or Vedic calendar policy');}
  try{return await vedicCalendarWindow(values);}
  catch{throw new ServiceUnavailableException('Verified Swiss festival-calendar source unavailable; no speculative observance dates returned');}
 }
}
Reflect.defineMetadata('design:paramtypes',[String,String,String,String,String,String],VedicCalendarController.prototype,'week');
