/** Horoscope v3: readable daily/weekly/monthly forecasts for the 12 signs in
 * two systems — Western (tropical, Sun sign) and Vedic (sidereal Lahiri, Moon
 * sign / Janma Rashi). Facts come from Swiss Ephemeris at local noon (Kyiv);
 * ratings follow the classical Gochara table of favourable transit houses
 * (Phaladeepika ch. 26) counted whole-sign from the reader's sign. Texts are
 * chosen by those houses; the date only rotates equivalent phrasings. */
import {dailyTransit,localToday,validLocalDay} from './personal-transits.ts';
import {tropicalSkyForDay,tropicalSkyAtUtc} from './western-horoscope.ts';
import {astronomicalEventsWindow} from './astronomical-events.ts';
import {createVerifiedSiderealPlanetAt} from './panchanga.ts';
import {skyHeadline} from './news-astronomy.ts';
import {localToUTC,nakshatraOf,signIndex} from '../../../packages/jyotish-core/src/index.ts';
import {ashtakoota,gunaBand,type Roles} from '../../../packages/jyotish-core/src/ashtakoota.ts';
import {MOON_HOUSE,LOVE_BY_HOUSE,WORK_BY_HOUSE,MONEY_BY_HOUSE,HEALTH_BY_HOUSE,BAND,PHASE,SUN_HOUSE,WEEKDAY,
 HOUSE_SPHERE,PLANET_NAME,type L} from './horoscope-v3-texts.ts';

export type System='western'|'vedic';
export type Category='mood'|'love'|'work'|'money'|'health';
const ZONE='Europe/Kyiv';
const PLANETS=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn'] as const;
type Planet=typeof PLANETS[number];
type Sky={system:System;date:string;sampledAtUtc:string;pos:Record<Planet,{sign:number;longitude:number}>;moonNakshatra?:{name:string;pada:number}};

/** Classical favourable transit houses counted from the reference sign. */
export const GOCHARA_GOOD:Record<Planet,number[]>={Sun:[3,6,10,11],Moon:[1,3,6,7,10,11],Mars:[3,6,11],
 Mercury:[2,4,6,8,10,11],Jupiter:[2,5,7,9,11],Venus:[1,2,3,4,5,8,9,11,12],Saturn:[3,6,11]};
const WEIGHTS:Record<Category,Partial<Record<Planet,number>>>={
 mood:{Moon:3,Sun:1,Jupiter:1},
 love:{Venus:2,Moon:1.5,Jupiter:.5},
 work:{Sun:1,Mercury:1,Mars:1,Saturn:1,Moon:1.5},
 money:{Jupiter:1.5,Venus:1,Mercury:1,Moon:1},
 health:{Mars:1,Saturn:1,Sun:1,Moon:1.5}
};
const BONUS:Record<Category,[number[],number][]>={
 mood:[],love:[[[5,7],.15],[[8,12],-.1]],work:[[[6,10,11],.1]],money:[[[2,11],.15],[[8,12],-.15]],health:[[[8,12],-.12]]
};
export const houseFrom=(ref:number,sign:number)=>((sign-ref+12)%12)+1;

const skyCache=new Map<string,Promise<Sky>>();
export function skyFor(system:System,date:string):Promise<Sky>{
 const key=system+':'+date;let hit=skyCache.get(key);
 if(!hit){
  hit=(async():Promise<Sky>=>{
   if(system==='western'){
    const s=await tropicalSkyForDay(date,ZONE);
    const pos=Object.fromEntries(PLANETS.map(p=>[p,{sign:s.planets[p].sign,longitude:s.planets[p].longitude}])) as Sky['pos'];
    return {system,date,sampledAtUtc:s.sampledAtUtc,pos};
   }
   const t=await dailyTransit(date,ZONE);
   const pos=Object.fromEntries(PLANETS.map(p=>{const x=t.planets.find(q=>q.name===p);if(!x)throw Error('Missing '+p);return [p,{sign:x.sign,longitude:x.longitude}];})) as Sky['pos'];
   return {system,date,sampledAtUtc:t.sampledAtUtc,pos,moonNakshatra:{name:t.moon.nakshatra,pada:t.moon.pada}};
  })();
  skyCache.set(key,hit);
  if(skyCache.size>800)skyCache.delete(skyCache.keys().next().value!);
  hit.catch(()=>skyCache.delete(key));
 }
 return hit;
}
export function moonPhase(sky:Sky):'new'|'waxing'|'full'|'waning'{
 const e=((sky.pos.Moon.longitude-sky.pos.Sun.longitude)%360+360)%360;
 if(e<22.5||e>=337.5)return 'new';
 if(e>=157.5&&e<202.5)return 'full';
 return e<180?'waxing':'waning';
}
export function ratings(sign:number,sky:Sky):Record<Category,number>{
 const moonHouse=houseFrom(sign,sky.pos.Moon.sign);
 const out={} as Record<Category,number>;
 for(const c of Object.keys(WEIGHTS) as Category[]){
  let sum=0,w=0;
  for(const [p,weight] of Object.entries(WEIGHTS[c]) as [Planet,number][]){
   sum+=(GOCHARA_GOOD[p].includes(houseFrom(sign,sky.pos[p].sign))?1:0)*weight;w+=weight;
  }
  let s=sum/w;
  for(const [houses,b] of BONUS[c])if(houses.includes(moonHouse))s+=b;
  s=Math.max(0,Math.min(1,s));
  let r=1+Math.round(s*4);
  // Chandrashtama (Moon in the 8th): the classical «careful» days.
  if(moonHouse===8)r=Math.min(r,c==='mood'?2:3);
  out[c]=r;
 }
 return out;
}
const variant=(seed:string,n:number)=>{let h=2166136261;for(const ch of seed){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return Math.abs(h)%n;};
const band=(r:number)=>r>=4?0:r===3?1:2;
const ord=(n:number)=>n+'-му';

export type DayReading=ReturnType<typeof composeDay>;
export function composeDay(system:System,sign:number,sky:Sky,events:L[]=[]){
 const moonHouse=houseFrom(sign,sky.pos.Moon.sign),sunHouse=houseFrom(sign,sky.pos.Sun.sign);
 const r=ratings(sign,sky),phase=moonPhase(sky),mh=MOON_HOUSE[moonHouse-1];
 const v=variant(sky.date+':'+sign+':'+system,1000);
 const pick=<T,>(arr:readonly T[],salt=0)=>arr[(v+salt)%arr.length];
 const section=(c:'love'|'work'|'money'|'health',bank:L[]):L=>{
  const b=BAND[c][band(r[c])],closing=b[(v+c.length)%b.length],line=bank[moonHouse-1];
  return {uk:line.uk+' '+closing.uk,en:line.en+' '+closing.en};
 };
 const weekday=new Date(sky.date+'T12:00:00Z').getUTCDay();
 const color=WEEKDAY[weekday];
 const why:L[]=[{uk:'Місяць у вашому '+ord(moonHouse)+' домі — '+HOUSE_SPHERE[moonHouse-1].uk+'.',en:'The Moon is in your '+moonHouse+suffix(moonHouse)+' house — '+HOUSE_SPHERE[moonHouse-1].en+'.'}];
 for(const p of ['Venus','Mercury','Mars','Jupiter','Saturn'] as Planet[]){
  const h=houseFrom(sign,sky.pos[p].sign),good=GOCHARA_GOOD[p].includes(h);
  why.push({uk:PLANET_NAME[p].uk+' у '+ord(h)+' домі ('+HOUSE_SPHERE[h-1].uk+') — '+(good?'сприятливо':'вимагає уважності')+'.',
   en:PLANET_NAME[p].en+' in the '+h+suffix(h)+' house ('+HOUSE_SPHERE[h-1].en+') — '+(good?'supportive':'calls for care')+'.'});
 }
 return {system,sign,date:sky.date,sampledAtUtc:sky.sampledAtUtc,
  moon:{sign:sky.pos.Moon.sign,house:moonHouse,phase,...(sky.moonNakshatra?{nakshatra:sky.moonNakshatra}:{})},
  sun:{sign:sky.pos.Sun.sign,house:sunHouse},
  chandrashtama:moonHouse===8,
  theme:mh.theme,headline:pick(mh.headlines),intro:pick(mh.intro,1),phaseNote:PHASE[phase],
  ratings:r,
  sections:{love:section('love',LOVE_BY_HOUSE),work:section('work',WORK_BY_HOUSE),money:section('money',MONEY_BY_HOUSE),health:section('health',HEALTH_BY_HOUSE)},
  good:mh.good,avoid:mh.avoid,
  color:{planet:color.planet,color:color.color,hex:color.hex},
  events,why,
  method:{uk:system==='western'?'Тропічний зодіак, Swiss Ephemeris, опівдні за Києвом; будинки рахуються від вашого знака Сонця.':'Сидеричний зодіак (Лахірі), Swiss Ephemeris, опівдні за Києвом; будинки рахуються від вашого знака Місяця (Джанма-раші).',
   en:system==='western'?'Tropical zodiac, Swiss Ephemeris, at noon Kyiv time; houses counted from your Sun sign.':'Sidereal zodiac (Lahiri), Swiss Ephemeris, at noon Kyiv time; houses counted from your Moon sign (Janma Rashi).'}};
}
function suffix(n:number){return n===1?'st':n===2?'nd':n===3?'rd':'th';}

/** Sky events of a local day worth a line in the reading. Stations and Moon
 * phases are zodiac-independent; sidereal ingresses are shown only for Vedic. */
async function eventsOn(system:System,date:string):Promise<L[]>{
 try{
  const w=await astronomicalEventsWindow({start:date,days:1,timeZone:ZONE});
  return w.events.filter(e=>!(e.kind==='sidereal_ingress'&&(e.body==='Moon'||system==='western')))
   .map(e=>{const h=skyHeadline(e as never);return {uk:h.uk.replace(/ \d+ [^ ]+ \d{4}$/,''),en:h.en.replace(/ on \d+ [A-Za-z]+ \d{4}$/,'')};});
 }catch{return [];}
}
const addDays=(d:string,n:number)=>new Date(Date.parse(d+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);

export function validSign(x:unknown):number|null{const n=Number(x);return Number.isInteger(n)&&n>=1&&n<=12?n:null;}
export function validSystem(x:unknown):System|null{return x==='western'||x==='vedic'?x:null;}
/** Public range: the start of the current month (or yesterday) … ~2 months ahead. */
export function inRange(date:string,today=localToday(ZONE)){
 const first=today.slice(0,8)+'01',yesterday=addDays(today,-1);
 return validLocalDay(date)&&date>=(first<yesterday?first:yesterday)&&date<=addDays(today,62);
}
export async function dayReading(system:System,sign:number,date:string){
 const [sky,events]=await Promise.all([skyFor(system,date),eventsOn(system,date)]);
 return composeDay(system,sign,sky,events);
}
/** All 12 signs for one day (hub page). */
export async function allSigns(system:System,date:string){
 const [sky,events]=await Promise.all([skyFor(system,date),eventsOn(system,date)]);
 return Array.from({length:12},(_,i)=>composeDay(system,i+1,sky,events));
}
function summarize(days:DayReading[]){
 const best=(c:Category)=>[...days].filter(d=>!d.chandrashtama).sort((a,b)=>b.ratings[c]-a.ratings[c]||a.date.localeCompare(b.date)).slice(0,3).map(d=>d.date).sort();
 return {bestFor:{love:best('love'),work:best('work'),money:best('money')},
  // Chandrashtama first, then the hardest remaining days; at most 6 so the list stays useful.
  careful:[...days.filter(d=>d.chandrashtama),...days.filter(d=>!d.chandrashtama&&d.ratings.mood<=1).sort((a,b)=>a.ratings.mood-b.ratings.mood)].slice(0,6).map(d=>d.date).sort()};
}
export async function periodReading(system:System,sign:number,start:string,days:number){
 const list=await Promise.all(Array.from({length:days},(_,i)=>dayReading(system,sign,addDays(start,i))));
 const sunHouse=list[Math.floor(days/2)].sun.house;
 return {system,sign,start,days,
  overview:SUN_HOUSE[sunHouse-1],sunHouse,
  ...summarize(list),
  // Compact days for calendars/strips; full text only for the first day.
  list:list.map(d=>({date:d.date,headline:d.headline,theme:d.theme,ratings:d.ratings,moonHouse:d.moon.house,
   phase:d.moon.phase,chandrashtama:d.chandrashtama,events:d.events}))};
}

type Birth={date:string;time?:string;zone?:string};
/** One birth moment: tropical Sun, sidereal Sun and Moon (Lahiri). Without a
 * time we use local noon and report the Moon sign/nakshatra range of that day. */
async function birthSky(input:Birth){
 const zone=input.zone||ZONE;
 if(!validLocalDay(input.date)||input.date<'1900-01-01'||input.date>'2099-12-31')throw Error('Invalid birth date');
 if(input.time!==undefined&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time))throw Error('Invalid birth time');
 const ms=(time:string)=>Date.parse(localToUTC(input.date,time,zone));
 const at=ms(input.time||'12:00');
 const planetAt=await createVerifiedSiderealPlanetAt();
 const tropical=await tropicalSkyAtUtc(new Date(at).toISOString());
 const sidSun=planetAt(at,'Sun').longitude;
 const moonLon=planetAt(at,'Moon').longitude;
 const dayMoon=input.time?null:[planetAt(ms('00:00'),'Moon').longitude,planetAt(ms('23:59'),'Moon').longitude];
 return {zone,timeKnown:Boolean(input.time),tropical,sidSun,moonLon,dayMoon};
}
const uniq=(xs:number[])=>[...new Set(xs)];

/** «Зоряний паспорт»: Western Sun sign, Vedic Sun and Moon signs, nakshatra and
 * the ayanamsha gap — computed, never stored. Without a birth time the Moon may
 * have changed sign that day; both candidates are then returned. */
export async function passport(input:Birth){
 const b=await birthSky(input);
 const moonSigns=b.dayMoon?uniq(b.dayMoon.map(l=>signIndex(l)+1)):[signIndex(b.moonLon)+1];
 const nak=nakshatraOf(b.moonLon);
 const gap=((b.tropical.sun.longitude-b.sidSun)%360+360)%360;
 return {date:input.date,timeKnown:b.timeKnown,zone:b.zone,
  western:{sunSign:b.tropical.sun.sign,sunLongitude:b.tropical.sun.longitude},
  vedic:{sunSign:signIndex(b.sidSun)+1,sunLongitude:b.sidSun,moonSigns,
   nakshatra:b.timeKnown?{name:nak.name,pada:nak.pada}:null},
  ayanamshaDegrees:gap,
  method:'Swiss Ephemeris; tropical vs sidereal Lahiri; nothing is stored'};
}

/** Couple matching: Western Sun signs plus the classical Ashtakoota (36 gunas)
 * from both sidereal Moons. Without a birth time the day's Moon may span two
 * nakshatras; the result is then marked approximate. Nothing is stored. */
export async function matchCouple(input:{a:Birth;b:Birth;roles?:Roles}){
 const roles:Roles=input.roles==='aBride'||input.roles==='bBride'?input.roles:'none';
 const [x,y]=await Promise.all([birthSky(input.a),birthSky(input.b)]);
 const person=(b:Awaited<ReturnType<typeof birthSky>>)=>{
  const nak=nakshatraOf(b.moonLon),sign=signIndex(b.moonLon)+1;
  const range=b.dayMoon?{signs:uniq(b.dayMoon.map(l=>signIndex(l)+1)),nakshatras:uniq(b.dayMoon.map(l=>nakshatraOf(l).index))}:null;
  return {sunSign:b.tropical.sun.sign,vedicSunSign:signIndex(b.sidSun)+1,moonSign:sign,
   nakshatra:{index:nak.index,name:nak.name,pada:nak.pada},timeKnown:b.timeKnown,
   exact:!range||(range.signs.length===1&&range.nakshatras.length===1),range,
   point:{sign,nakshatra:nak.index,degInSign:((b.moonLon%30)+30)%30}};
 };
 const pa=person(x),pb=person(y);
 const result=ashtakoota(pa.point,pb.point,roles);
 return {a:{...pa,point:undefined},b:{...pb,point:undefined},approximate:!pa.exact||!pb.exact,
  ashtakoota:result,band:gunaBand(result.total),
  method:'Swiss Ephemeris, sidereal Lahiri Moon; Ashtakoota '+result.version+'; nothing is stored'};
}
