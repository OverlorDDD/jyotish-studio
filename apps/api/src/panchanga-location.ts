/** Authenticated Panchanga observer preferences. No natal birth time/date is returned. */
export type PanchangaLocation={place:string;timeZone:string;latitude:number;longitude:number};
export function normalizePanchangaLocation(value:unknown,fallbackPlace='Birth chart location'):PanchangaLocation|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const input=value as Record<string,unknown>;
 const rawPlace=typeof input.place==='string'?input.place:fallbackPlace;
 // Validate before trimming: hidden line breaks must never silently become profile names.
 if(/[<>\\\r\n]/.test(rawPlace))return null;
 const place=rawPlace.trim();
 if(!place||place.length>120)return null;
 if(typeof input.timeZone!=='string'||input.timeZone.length>64)return null;
 try{new Intl.DateTimeFormat('en',{timeZone:input.timeZone});}
 catch{return null;}
 const lat=input.latitude,lon=input.longitude;
 if(typeof lat!=='number'||typeof lon!=='number'||!Number.isFinite(lat)||!Number.isFinite(lon)||
  lat<=-90||lat>=90||lon< -180||lon>180)return null;
 return {place,timeZone:input.timeZone,latitude:lat,longitude:lon};
}
