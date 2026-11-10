/** User-directed global city search for Panchanga. Open-Meteo geocoding supplies
 * geographic coordinates AND an IANA zone as one consistent atomic choice.
 * Demo/non-commercial tier; switch provider before monetizing.
 */
import {Controller,Get,Query,BadRequestException,ServiceUnavailableException,Header} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {validTimeZone} from './personal-transits.ts';
import {resolveCityAlias,mergeAliasResults,shouldRetryUkrainianCityIndex} from './city-search-aliases.ts';
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
  const endpoint=process.env.GALAXIORA_GEOCODING_ORIGIN||'https://geocoding-api.open-meteo.com/v1/search';
  const base=new URL(endpoint);
  if(base.protocol!=='https:'||base.hostname!=='geocoding-api.open-meteo.com')
   throw new ServiceUnavailableException('Geocoding provider not configured');
  const lookup=async(name:string,language: 'uk'|'en'=lang as 'uk'|'en')=>{
   const u=new URL(endpoint);
   u.searchParams.set('name',name);u.searchParams.set('count','10');
   u.searchParams.set('language',language);u.searchParams.set('format','json');
   const response=await fetch(u,{signal:AbortSignal.timeout(6500),headers:{Accept:'application/json'}});
   if(!response.ok)throw Error('Geocoding HTTP '+response.status);
   return selectCities(await response.json());
  };
  const alias=resolveCityAlias(term);
  try{
   // For an exact historic alias, also retrieve the canonical city record.
   // Keep original candidates: "Krivoy Rog" is also a place name in Russia.
   const results=await Promise.allSettled(alias?[lookup(term),lookup(alias.canonical)]:[lookup(term)]);
   const original=results[0].status==='fulfilled'?results[0].value:[];
   const canonical=results[1]?.status==='fulfilled'?results[1].value:[];
   if(!results.some(x=>x.status==='fulfilled'))throw Error('Both geocoders failed');
   let rows=mergeAliasResults(original,canonical,alias);
   // Open-Meteo often indexes Ukrainian Cyrillic spellings only with
   // language=uk. The EN page must not hide Kharkiv, Lviv, Odesa or Kyiv
   // merely because a visitor typed their native Ukrainian name.
   if(shouldRetryUkrainianCityIndex(term,lang,rows.length)){
    rows=await lookup(term,'uk').catch(()=>[]);
   }
   if(cache.size>180)cache.delete(cache.keys().next().value!);
   cache.set(key,{at:now,rows});
   return {items:rows,source:'Open-Meteo Geocoding'};
  }catch{throw new ServiceUnavailableException('City search temporarily unavailable; enter coordinates and IANA time zone manually');}
 }
}
Reflect.defineMetadata('design:paramtypes',[String,String],PanchangaPlacesController.prototype,'search');
