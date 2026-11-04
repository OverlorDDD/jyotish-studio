/** User-directed global city search for Panchanga. Open-Meteo geocoding supplies
 * geographic coordinates AND an IANA zone as one consistent atomic choice.
 * Demo/non-commercial tier; switch provider before monetizing.
 */
import {Controller,Get,Query,BadRequestException,ServiceUnavailableException,Header} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {validTimeZone} from './personal-transits.ts';
type Row={id:number;name:string;country?:string;admin1?:string;latitude:number;longitude:number;timezone?:string;country_code?:string};
const cache=new Map<string,{at:number;rows:ReturnType<typeof selectCities>}>();
const selectCities=(input:unknown)=>{const data=(input as {results?:Row[]})?.results;
 if(!Array.isArray(data))return [];
 return data.filter(x=>x&&typeof x.name==='string'&&Number.isFinite(x.latitude)&&
  Number.isFinite(x.longitude)&&x.latitude>-90&&x.latitude<90&&
  x.longitude>=-180&&x.longitude<=180&&typeof x.timezone==='string'&&validTimeZone(x.timezone))
  .slice(0,9).map(x=>({id:String(x.id),name:x.name,country:x.country||'',
   region:x.admin1||'',latitude:x.latitude,longitude:x.longitude,timeZone:x.timezone!}));
};
@ApiTags('Panchanga places')
@Controller('api/v1/panchanga')
export class PanchangaPlacesController{
 @Get('cities') @Header('Cache-Control','public,max-age=300')
 async search(@Query('q')q='',@Query('lang')lang='uk'){
  const term=q.trim();
  if(term.length<2||term.length>85||/[<>\\\r\n]/.test(term)||
    !['uk','en'].includes(lang))throw new BadRequestException('Enter 2–85 city characters and uk/en language');
  const key=lang+':'+term.toLocaleLowerCase(),now=Date.now(),old=cache.get(key);
  if(old&&now-old.at<24*60*60*1000)return {items:old.rows,source:'Open-Meteo Geocoding'};
  const u=new URL(process.env.GALAXIORA_GEOCODING_ORIGIN||'https://geocoding-api.open-meteo.com/v1/search');
  if(u.protocol!=='https:'||!['geocoding-api.open-meteo.com'].includes(u.hostname))
   throw new ServiceUnavailableException('Geocoding provider not configured');
  u.searchParams.set('name',term);u.searchParams.set('count','10');
  u.searchParams.set('language',lang);u.searchParams.set('format','json');
  try{
   const res=await fetch(u,{signal:AbortSignal.timeout(6500),headers:{Accept:'application/json'}});
   if(!res.ok)throw Error('Geocoding HTTP '+res.status);
   const rows=selectCities(await res.json());
   if(cache.size>180)cache.delete(cache.keys().next().value!);
   cache.set(key,{at:now,rows});
   return {items:rows,source:'Open-Meteo Geocoding'};
  }catch{throw new ServiceUnavailableException('City search temporarily unavailable; enter coordinates and IANA time zone manually');}
 }
}
Reflect.defineMetadata('design:paramtypes',[String,String],PanchangaPlacesController.prototype,'search');
