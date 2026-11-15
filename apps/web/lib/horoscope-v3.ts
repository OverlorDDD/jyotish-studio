/** Server-side fetchers for the public horoscope (v3 API). No cookies are
 * forwarded: the same page for every visitor, cacheable and crawlable. */
import type {HoroSystem} from './horoscope-signs.ts';
type L={uk:string;en:string};
export type Ratings={mood:number;love:number;work:number;money:number;health:number};
export type DayReading={system:HoroSystem;sign:number;date:string;sampledAtUtc:string;
 moon:{sign:number;house:number;phase:'new'|'waxing'|'full'|'waning';nakshatra?:{name:string;pada:number}};
 sun:{sign:number;house:number};chandrashtama:boolean;theme:L;headline:L;intro:L;phaseNote:L;ratings:Ratings;
 sections:{love:L;work:L;money:L;health:L};good:L[];avoid:L[];color:{planet:L;color:L;hex:string};events:L[];why:L[];method:L};
export type PeriodDay={date:string;headline:L;theme:L;ratings:Ratings;moonHouse:number;phase:string;chandrashtama:boolean;events:L[]};
export type PeriodReading={system:HoroSystem;sign:number;start:string;days:number;overview:L;sunHouse:number;
 bestFor:{love:string[];work:string[];money:string[]};careful:string[];list:PeriodDay[]};
const origin=()=>process.env.INTERNAL_API_ORIGIN||'http://127.0.0.1:4000';
async function getJson<T>(path:string,timeout=9000):Promise<T|null>{
 try{const r=await fetch(origin()+path,{cache:'no-store',signal:AbortSignal.timeout(timeout)});return r.ok?await r.json() as T:null;}
 catch{return null;}
}
export const fetchDay=(system:HoroSystem,sign:number,date:string)=>getJson<DayReading>('/api/v1/horoscope/v3/day?system='+system+'&sign='+sign+'&date='+date);
export const fetchAll=(system:HoroSystem,date:string)=>getJson<{system:HoroSystem;date:string;signs:DayReading[]}>('/api/v1/horoscope/v3/all?system='+system+'&date='+date);
export const fetchPeriod=(system:HoroSystem,sign:number,start:string,days:number)=>getJson<PeriodReading>('/api/v1/horoscope/v3/period?system='+system+'&sign='+sign+'&start='+start+'&days='+days,15000);
type Period={from:string;to:string};
type Stay={sign:number;house:number;from:string;to:string;periods:Period[];title:L;text:L};
export type YearMonth={month:number;sunHouse:number;title:L;text:L;ratings:{love:number;work:number;money:number;health:number};events:L[]};
export type YearReading={system:HoroSystem;sign:number;year:number;method:string;jupiter:Stay[];saturn:Stay[];
 rahu:{sign:number;house:number;from:string;to:string;periods:Period[];text:L}[]|null;saturnPhase:{key:string;from:string;to:string;periods:Period[];title:L;text:L}[];
 ratings:{love:number;work:number;money:number;health:number};bestMonths:{love:number[];work:number[];money:number[]};carefulMonths:number[];months:YearMonth[]};
/** The first yearly request computes ~100 ephemeris samples; later ones are cached by the API. */
export const fetchYear=(system:HoroSystem,sign:number,year:number)=>getJson<YearReading>('/api/v1/horoscope/v3/year?system='+system+'&sign='+sign+'&year='+year,30000);
