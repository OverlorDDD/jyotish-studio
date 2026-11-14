/** GalaxiNews rubrics that publish themselves:
 *  «Тиждень у небі» — every week (Monday–Sunday, Kyiv), published from Saturday;
 *  «Небо <місяця>» — every month, published from the 24th of the month before.
 * Rows carry only a title, a short teaser and the period key (tags); the page
 * content is recomputed from Swiss Ephemeris on request (rubricData), so no
 * text can drift from the calculation and no schema change is needed. */
import {createHash} from 'node:crypto';
import type {PrismaService} from './prisma.ts';
import {astronomicalEventsWindow} from './astronomical-events.ts';
import {observerEclipses} from './astronomy-eclipses.ts';
import {panchangaRange} from './panchanga-range.ts';
import {createVerifiedSiderealPlanetAt} from './panchanga.ts';
import {astronomicalNewsSiteOrigin} from './news-astronomy.ts';
import {localToday} from './personal-transits.ts';

export type RubricKind='week'|'month';
const ZONE='Europe/Kyiv',KYIV={latitude:50.4501,longitude:30.5234};
const MONTH_GEN_UK=['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'];
const MONTH_EN=['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY=86400000;
const iso=(ms:number)=>new Date(ms).toISOString().slice(0,10);
const addDays=(day:string,n:number)=>iso(Date.parse(day+'T00:00:00Z')+n*DAY);

/** Monday of the ISO week containing `day` (YYYY-MM-DD). */
export function weekStart(day:string){
 const d=new Date(day+'T00:00:00Z'),dow=(d.getUTCDay()+6)%7;
 return addDays(day,-dow);
}
export function validRubricKey(kind:RubricKind,key:string){
 if(kind==='week')return /^\d{4}-\d{2}-\d{2}$/.test(key)&&Number.isFinite(Date.parse(key+'T00:00:00Z'))&&weekStart(key)===key&&key>='2026-01-01'&&key<='2098-12-01';
 return /^\d{4}-(0[1-9]|1[0-2])$/.test(key)&&key>='2026-01'&&key<='2098-12';
}
export function rubricRange(kind:RubricKind,key:string){
 if(kind==='week')return {start:key,days:7,end:addDays(key,7)};
 const [y,m]=key.split('-').map(Number);
 const start=key+'-01',end=iso(Date.UTC(m===12?y+1:y,m===12?0:m,1));
 return {start,days:Math.round((Date.parse(end)-Date.parse(start))/DAY),end};
}
export function rubricTitle(kind:RubricKind,key:string){
 const {start,end}=rubricRange(kind,key);
 if(kind==='month'){
  const [y,m]=key.split('-').map(Number);
  return {uk:'Небо '+MONTH_GEN_UK[m-1]+' '+y+': фази Місяця, переходи планет і дні Панчанги',
   en:'The sky in '+MONTH_EN[m-1]+' '+y+': Moon phases, planetary ingresses and Panchanga days'};
 }
 const last=addDays(end,-1);
 const [ys,ms,ds]=start.split('-').map(Number),[ye,me,de]=last.split('-').map(Number);
 const uk=ms===me?ds+'–'+de+' '+MONTH_GEN_UK[me-1]+' '+ye:ds+' '+MONTH_GEN_UK[ms-1]+(ys!==ye?' '+ys:'')+' – '+de+' '+MONTH_GEN_UK[me-1]+' '+ye;
 const en=ms===me?ds+'–'+de+' '+MONTH_EN[me-1]+' '+ye:ds+' '+MONTH_EN[ms-1]+(ys!==ye?' '+ys:'')+' – '+de+' '+MONTH_EN[me-1]+' '+ye;
 return {uk:'Тиждень у небі: '+uk,en:'The week in the sky: '+en};
}
/** Which rubric periods should exist at `today` (Kyiv civil date). */
export function duePeriods(today:string):{kind:RubricKind;key:string}[]{
 const out:{kind:RubricKind;key:string}[]=[{kind:'week',key:weekStart(today)},{kind:'month',key:today.slice(0,7)}];
 const dow=(new Date(today+'T00:00:00Z').getUTCDay()+6)%7; // 5 = Saturday
 if(dow>=5)out.push({kind:'week',key:addDays(weekStart(today),7)});
 if(Number(today.slice(8,10))>=24){
  const [y,m]=today.split('-').map(Number);
  out.push({kind:'month',key:(m===12?y+1:y)+'-'+String(m===12?1:m+1).padStart(2,'0')});
 }
 return out;
}
export const rubricTags=(kind:RubricKind,key:string)=>['astronomy','jyotish','rubric:'+kind,'rk:'+key];
export function rubricFromTags(tags:readonly string[]):{kind:RubricKind;key:string}|null{
 const kind=tags.find(t=>t.startsWith('rubric:'))?.slice(7),key=tags.find(t=>t.startsWith('rk:'))?.slice(3);
 if((kind!=='week'&&kind!=='month')||!key||!validRubricKey(kind,key))return null;
 return {kind,key};
}

export type PanchangaKeyDay={date:string;kind:'ekadashi'|'purnima'|'amavasya';paksha:'Shukla'|'Krishna'};
const BODIES=['Mercury','Venus','Mars','Jupiter','Saturn'] as const;
const cache=new Map<string,{at:number;value:Promise<unknown>}>();
/** Everything a rubric page needs, computed for Kyiv. Cached for 6 hours. */
export async function rubricData(kind:RubricKind,key:string){
 if(!validRubricKey(kind,key))throw Error('Invalid rubric period');
 const ck=kind+':'+key,hit=cache.get(ck);
 if(hit&&Date.now()-hit.at<6*3600000)return hit.value;
 const value=(async()=>{
  const {start,days,end}=rubricRange(kind,key);
  // Event search covers ≤30 days per call.
  const windows=days>30?[{start,days:16},{start:addDays(start,16),days:days-16}]:[{start,days}];
  const [eventsParts,panchanga,eclipses,planetAt]=await Promise.all([
   Promise.all(windows.map(w=>astronomicalEventsWindow({...w,timeZone:ZONE}))),
   panchangaRange({start,days,timeZone:ZONE,...KYIV}).catch(()=>null),
   observerEclipses({start,days,timeZone:ZONE,...KYIV}).catch(()=>null),
   createVerifiedSiderealPlanetAt()
  ]);
  const events=eventsParts.flatMap(p=>p.events);
  const keyDays:PanchangaKeyDay[]=[];
  for(const d of (panchanga?.days||[]) as {date:string;sunrise:{tithi:{number:number;paksha:string;numberWithinPaksha:number}}}[]){
   const t=d.sunrise?.tithi;if(!t)continue;
   const paksha=t.paksha==='Krishna'?'Krishna':'Shukla';
   if(t.numberWithinPaksha===11)keyDays.push({date:d.date,kind:'ekadashi',paksha});
   else if(t.numberWithinPaksha===15)keyDays.push({date:d.date,kind:paksha==='Shukla'?'purnima':'amavasya',paksha});
  }
  const startMs=Date.parse(eventsParts[0].startUtc);
  const retrogradeAtStart=BODIES.filter(b=>planetAt(startMs,b).longitudeSpeed<0);
  const eclipseList=((eclipses?.events||[]) as {type:string;eclipseKind?:string;maximumUtc:string;visibleHere?:boolean}[])
   .filter(x=>x.maximumUtc>=eventsParts[0].startUtc&&x.maximumUtc<eventsParts[eventsParts.length-1].endUtc)
   .map(x=>({type:x.type,eclipseKind:x.eclipseKind||null,maximumUtc:x.maximumUtc,visibleHere:Boolean(x.visibleHere)}));
  return {kind,key,start,end,days,timeZone:ZONE,place:'Kyiv',events,keyDays,eclipses:eclipseList,retrogradeAtStart,
   method:'Swiss Ephemeris; sidereal zodiac, Lahiri ayanamsha; Panchanga at Kyiv sunrise'};
 })();
 cache.set(ck,{at:Date.now(),value});
 if(cache.size>24)cache.delete(cache.keys().next().value!);
 value.catch(()=>cache.delete(ck));
 return value;
}

/** Creates the rubric rows that are due; idempotent (urlHash per period). */
export async function publishRubrics(prisma:PrismaService,today=localToday(ZONE)){
 const origin=astronomicalNewsSiteOrigin();
 if(!origin)return {created:0,reason:'public_https_site_url_not_configured'};
 const now=new Date();
 const input=duePeriods(today).map(({kind,key})=>{
  const t=rubricTitle(kind,key),hash=createHash('sha256').update('galaxiora-rubric-v1:'+kind+':'+key).digest('hex');
  const {start}=rubricRange(kind,key);
  const teaserUk=kind==='week'?'Фази Місяця, переходи планет, Екадаші й ретроградні планети на тиждень — за розрахунком Swiss Ephemeris для Києва.':
   'Усі події неба за місяць: фази Місяця, переходи й розвороти планет, затемнення, Екадаші й Пурніма — за розрахунком Swiss Ephemeris.';
  const teaserEn=kind==='week'?'Moon phases, planetary ingresses, Ekadashi and retrograde planets for the week — calculated with Swiss Ephemeris for Kyiv.':
   'Every sky event of the month: Moon phases, ingresses and stations, eclipses, Ekadashi and Purnima — calculated with Swiss Ephemeris.';
  return {urlHash:hash,url:origin+'/uk/panchanga?date='+start+'#rubric-'+kind,
   title:t.en.slice(0,240),titleUk:t.uk.slice(0,300),titleEn:t.en.slice(0,300),source:'Galaxiora Sky Rubric',language:'uk',
   topic:'astrology',tags:rubricTags(kind,key),score:kind==='month'?82:80,
   summary:teaserEn,summaryKind:'ai_editorial',summaryUk:teaserUk,summaryEn:teaserEn,
   publishedAccuracy:'published',publishedAt:now,imageCredit:'Original Galaxiora thematic illustration'};
 });
 const created=await prisma.newsArticle.createMany({data:input,skipDuplicates:true});
 return {created:created.count,due:input.length};
}
