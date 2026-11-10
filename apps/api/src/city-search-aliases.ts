/**
 * Explicit historic/transliteration aliases that Open-Meteo/GeoNames may rank
 * under a different place. Never synthesize coordinates: final results must
 * still originate from a live geocoding record with its ID, lat, lon and IANA TZ.
 */
export type CityAlias={canonical:string;geoNamesId:string};
const KRYVYI_RIH:CityAlias={canonical:'Kryvyi Rih',geoNamesId:'703845'};
const aliases=new Set([
 'krivoy rog','krivoi rog','kriviy rog','krivyi rog',
 'krivy rog','krivoy roh','krivoi roh',
 'kryviy rih','kryvyj rih','kryvyy rih','kryvyi rig','kryviy rig',
 'кривой рог','кривий рiг'
]);
export function resolveCityAlias(input:string):CityAlias|null{
 const normalized=input.normalize('NFKC').toLocaleLowerCase('en')
  .replace(/\s+/gu,' ').trim();
 return aliases.has(normalized)?KRYVYI_RIH:null;
}

export type GeoCity={id:string;name:string;country:string;region:string;
 latitude:number;longitude:number;timeZone:string};
export function mergeAliasResults(
 original:readonly GeoCity[],canonical:readonly GeoCity[],alias:CityAlias|null,limit=9
):GeoCity[]{
 if(!alias)return original.slice(0,limit);
 // A trusted geocoder response for the exact GeoNames ID, never a fabricated
 // hardcoded coordinate nor a same-named town in a different country.
 const official=canonical.find(x=>x.id===alias.geoNamesId&&
  x.timeZone==='Europe/Kyiv');
 const output:GeoCity[]=[];
 if(official)output.push(official);
 for(const city of original){
  if(!output.some(x=>x.id===city.id))output.push(city);
  if(output.length>=limit)break;
 }
 return output.slice(0,limit);
}
