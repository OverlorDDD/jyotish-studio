import {Controller,Get,Header,Query,BadRequestException,ServiceUnavailableException} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {calculatePanchangaDay,validatePanchangaLocation} from './panchanga.ts';

/** Stateless astronomy endpoint: user-supplied location is never stored. */
@ApiTags('Astronomical Panchanga')
@Controller('api/v1/panchanga')
export class PanchangaController{
 @Get('day') @Header('Cache-Control','no-store')
 async day(@Query('date')date?:string,@Query('zone')zone?:string,
  @Query('latitude')latitude?:string,@Query('longitude')longitude?:string){
  const raw={date,timeZone:zone,
   latitude:latitude===undefined?undefined:Number(latitude),
   longitude:longitude===undefined?undefined:Number(longitude)};
  try{
   if((date!==undefined&&typeof date!=='string')||(zone!==undefined&&typeof zone!=='string'))
    throw Error('Invalid query parameter');
   validatePanchangaLocation(raw);
  }catch(error){throw new BadRequestException(error instanceof Error?error.message:'Invalid date/zone/location');}
  try{return await calculatePanchangaDay(raw);}
  catch{throw new ServiceUnavailableException('Verified Swiss Ephemeris or local sunrise unavailable; Panchanga not fabricated');}
 }
}
// Type metadata for NestJS when executed by tsx.
Reflect.defineMetadata('design:paramtypes',[String,String,String,String],PanchangaController.prototype,'day');
