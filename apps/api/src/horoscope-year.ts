/** Yearly sign horoscope (public, no personal data).
 * Slow planets set the year: Jupiter (growth), Saturn (lesson) and, in the
 * Vedic system, Rahu; Saturn's position from the Moon sign gives Sade Sati,
 * Ashtama and Kantaka Shani. Month ratings use classical Gochara favourable
 * houses for Sun, Mercury, Venus, Mars, Jupiter and Saturn sampled four times
 * a month (the Moon is left out: it averages away over a month). Ingress dates
 * are found by day-level bisection between samples; stations come from the
 * shared astronomical-events search. Eclipse dates are the NASA catalogue. */
import {GOCHARA_GOOD,houseFrom,skyFor,type System} from './horoscope-v3.ts';
import {dailyTransit} from './personal-transits.ts';
import {astronomicalEventsWindow} from './astronomical-events.ts';
import {HOUSE_SPHERE,PLANET_NAME,SUN_HOUSE} from './horoscope-v3-texts.ts';
import {JUPITER_HOUSE,MONTH_TITLE,RAHU_HOUSE,RETRO_ADVICE,SATURN_HOUSE,SATURN_PHASE} from './horoscope-year-texts.ts';

type L={uk:string;en:string};
type Cat='love'|'work'|'money'|'health';
const ZONE='Europe/Kyiv';
export const YEAR_METHOD='horoscope-year-v1';

/** NASA Five Millennium Canon dates (UTC), same list as the /eclipses/2027 page. */
export const YEAR_ECLIPSES:Record<number,{date:string;solar:boolean;kind:L}[]>={
 2027:[
  {date:'2027-02-06',solar:true,kind:{uk:'кільцеподібне сонячне затемнення',en:'annular solar eclipse'}},
  {date:'2027-02-20',solar:false,kind:{uk:'напівтіньове місячне затемнення',en:'penumbral lunar eclipse'}},
  {date:'2027-07-18',solar:false,kind:{uk:'слабке напівтіньове місячне затемнення',en:'faint penumbral lunar eclipse'}},
  {date:'2027-08-02',solar:true,kind:{uk:'повне сонячне затемнення',en:'total solar eclipse'}},
  {date:'2027-08-17',solar:false,kind:{uk:'напівтіньове місячне затемнення',en:'penumbral lunar eclipse'}}
 ]
};
export const YEARS=Object.keys(YEAR_ECLIPSES).map(Number);
export const validYear=(x:unknown)=>{const n=Number(x);return YEARS.includes(n)?n:null;};

const YEAR_WEIGHTS:Record<Cat,Partial<Record<'Sun'|'Mercury'|'Venus'|'Mars'|'Jupiter'|'Saturn',number>>>={
 love:{Venus:2,Jupiter:1,Mars:.5,Sun:.5},
 work:{Sun:1,Saturn:1.5,Jupiter:1,Mars:1,Mercury:1},
 money:{Jupiter:2,Venus:1,Mercury:1,Sun:.5},
 health:{Saturn:1.5,Mars:1,Sun:1,Jupiter:.5}
};
const pad=(n:number)=>String(n).padStart(2,'0');
const addDays=(d:string,n:number)=>new Date(Date.parse(d+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
const daysBetween=(a:string,b:string)=>Math.round((Date.parse(b)-Date.parse(a))/86400000);

type Body='Jupiter'|'Saturn'|'Rahu';
type Point={date:string;sign:number};
async function bodySign(system:System,body:Body,date:string){
 if(body==='Rahu'){const t=await dailyTransit(date,ZONE);const r=t.planets.find(p=>p.name==='Rahu');if(!r)throw Error('Missing Rahu');return r.sign;}
 return (await skyFor(system,date)).pos[body].sign;
}
/** Sign periods of a slow body across the year (day precision). */
async function stays(system:System,body:Body,samples:Point[]){
 const out:{sign:number;from:string;to:string}[]=[];
 let cur={sign:samples[0].sign,from:samples[0].date};
 for(let i=1;i<samples.length;i++){
  const a=samples[i-1],b=samples[i];
  if(a.sign===b.sign)continue;
  // Bisection: the first day on which the body is in b's sign.
  let lo=a.date,hi=b.date;
  while(daysBetween(lo,hi)>1){const mid=addDays(lo,Math.floor(daysBetween(lo,hi)/2));if(await bodySign(system,body,mid)===a.sign)lo=mid;else hi=mid;}
  out.push({sign:cur.sign,from:cur.from,to:addDays(hi,-1)});
  cur={sign:b.sign,from:hi};
 }
 out.push({sign:cur.sign,from:cur.from,to:samples[samples.length-1].date});
 return out;
}

async function stationsOf(year:number){
 const out:{date:string;body:string;kind:'retrograde_station'|'direct_station'}[]=[];
 // 13 windows of 30 days cover the year plus a margin; failures leave the list empty.
 for(let i=0;i<13;i++){
  const start=addDays(year+'-01-01',i*30);
  if(start>year+'-12-31')break;
  try{
   const w=await astronomicalEventsWindow({start,days:30,timeZone:ZONE});
   for(const e of w.events as {kind:string;body?:string;localDate:string}[])
    if((e.kind==='retrograde_station'||e.kind==='direct_station')&&e.body&&['Mercury','Venus','Mars','Jupiter','Saturn'].includes(e.body)&&e.localDate.startsWith(String(year)))
     out.push({date:e.localDate,body:e.body,kind:e.kind});
  }catch{/* stations are optional context */}
 }
 const seen=new Set<string>();
 return out.filter(x=>{const k=x.date+x.body+x.kind;if(seen.has(k))return false;seen.add(k);return true;}).sort((a,b)=>a.date.localeCompare(b.date));
}

const cache=new Map<string,Promise<YearData>>();
export function yearData(system:System,year:number){
 const key=system+':'+year;let hit=cache.get(key);
 if(!hit){hit=computeYear(system,year);cache.set(key,hit);hit.catch(()=>cache.delete(key));}
 return hit;
}

async function computeYear(system:System,year:number){
 const sampleDates=Array.from({length:12},(_,m)=>[1,8,15,22].map(d=>year+'-'+pad(m+1)+'-'+pad(d))).flat();
 sampleDates.push(year+'-12-31');
 const skies:Awaited<ReturnType<typeof skyFor>>[]=[];
 for(const d of sampleDates)skies.push(await skyFor(system,d));
 const track=async(body:Body)=>{
  const pts:Point[]=[];
  for(let i=0;i<sampleDates.length;i++)pts.push({date:sampleDates[i],sign:body==='Rahu'?await bodySign(system,'Rahu',sampleDates[i]):skies[i].pos[body].sign});
  return stays(system,body,pts);
 };
 const jupiter=await track('Jupiter'),saturn=await track('Saturn');
 const rahu=system==='vedic'?await track('Rahu'):null;
 const stations:{date:string;body:string;kind:'retrograde_station'|'direct_station';sign:number}[]=[];
 for(const st of await stationsOf(year))stations.push({...st,sign:(await skyFor(system,st.date)).pos[st.body as 'Mercury'].sign});
 const eclipseSigns:{date:string;solar:boolean;kind:L;sign:number}[]=[];
 for(const e of YEAR_ECLIPSES[year]){
  const sky=await skyFor(system,e.date);
  // Solar: Sun and Moon conjoin; lunar: the Moon is opposite the Sun.
  eclipseSigns.push({...e,sign:e.solar?sky.pos.Sun.sign:((sky.pos.Sun.sign+5)%12)+1});
 }
 return {sampleDates,skies,jupiter,saturn,rahu,stations,eclipses:eclipseSigns};
}

const score01=(sign:number,sky:Awaited<ReturnType<typeof skyFor>>,c:Cat)=>{
 let s=0,w=0;
 for(const [p,weight] of Object.entries(YEAR_WEIGHTS[c]) as [keyof typeof GOCHARA_GOOD,number][]){
  const h=houseFrom(sign,sky.pos[p as 'Sun'].sign);
  s+=(GOCHARA_GOOD[p].includes(h)?1:0)*weight;w+=weight;
 }
 return s/w;
};
const to5=(x:number)=>Math.max(1,Math.min(5,1+Math.round(x*4)));
const fmtDay=(date:string,uk:boolean)=>{const [,m,d]=date.split('-').map(Number);return uk?d+' '+['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'][m-1]:['January','February','March','April','May','June','July','August','September','October','November','December'][m-1]+' '+d;};

export type YearData=Awaited<ReturnType<typeof computeYear>>;
export async function yearReading(system:System,sign:number,year:number){
 return composeYear(system,sign,year,await yearData(system,year));
}
/** Pure composition from precomputed sky data (unit-testable without Swiss). */
export function composeYear(system:System,sign:number,year:number,y:Pick<YearData,'skies'|'jupiter'|'saturn'|'rahu'|'stations'|'eclipses'>){
 const months=Array.from({length:12},(_,m)=>{
  const idx=[0,1,2,3].map(k=>m*4+k);
  const r={} as Record<Cat,number>;
  const raw={} as Record<Cat,number>;
  for(const c of ['love','work','money','health'] as Cat[]){raw[c]=idx.reduce((s,i)=>s+score01(sign,y.skies[i],c),0)/4;r[c]=to5(raw[c]);}
  const sunHouse=houseFrom(sign,y.skies[m*4+2].pos.Sun.sign);
  const mm=year+'-'+pad(m+1);
  const dated:{date:string;text:L}[]=[];
  for(const s of y.stations.filter(x=>x.date.startsWith(mm))){
   const house=houseFrom(sign,s.sign);
   dated.push({date:s.date,text:s.kind==='retrograde_station'
    ?{uk:fmtDay(s.date,true)+': '+PLANET_NAME[s.body].uk+' розвертається назад у вашому '+house+'-му домі ('+HOUSE_SPHERE[house-1].uk+') — '+RETRO_ADVICE[s.body].uk+'.',en:fmtDay(s.date,false)+': '+PLANET_NAME[s.body].en+' turns retrograde in your house '+house+' ('+HOUSE_SPHERE[house-1].en+') — '+RETRO_ADVICE[s.body].en+'.'}
    :{uk:fmtDay(s.date,true)+': '+PLANET_NAME[s.body].uk+' знову йде прямо — справи у сфері «'+HOUSE_SPHERE[house-1].uk+'» рушають далі.',en:fmtDay(s.date,false)+': '+PLANET_NAME[s.body].en+' turns direct — matters of '+HOUSE_SPHERE[house-1].en+' move forward again.'}});
  }
  for(const e of y.eclipses.filter(x=>x.date.startsWith(mm))){
   const house=houseFrom(sign,e.sign);
   dated.push({date:e.date,text:{uk:fmtDay(e.date,true)+': '+e.kind.uk+' у вашому '+house+'-му домі — сфера «'+HOUSE_SPHERE[house-1].uk+'» '+(e.solar?'отримує новий старт.':'підходить до кульмінації й завершення.'),
    en:fmtDay(e.date,false)+': '+e.kind.en+' in your house '+house+' — '+HOUSE_SPHERE[house-1].en+' '+(e.solar?'get a fresh start.':'reach a culmination.')}});
  }
  for(const [body,list] of [['Jupiter',y.jupiter],['Saturn',y.saturn]] as const)for(const st of list.slice(1))if(st.from.startsWith(mm)){
   const house=houseFrom(sign,st.sign);
   dated.push({date:st.from,text:{uk:fmtDay(st.from,true)+': '+PLANET_NAME[body].uk+' переходить у ваш '+house+'-й дім — '+HOUSE_SPHERE[house-1].uk+'.',en:fmtDay(st.from,false)+': '+PLANET_NAME[body].en+' moves into your house '+house+' — '+HOUSE_SPHERE[house-1].en+'.'}});
  }
  const events=dated.sort((a,b)=>a.date.localeCompare(b.date)).map(x=>x.text);
  return {month:m+1,sunHouse,title:MONTH_TITLE[sunHouse-1],text:SUN_HOUSE[sunHouse-1],ratings:r,raw,events};
 });
 const best=(c:Cat)=>[...months].sort((a,b)=>b.raw[c]-a.raw[c]||a.month-b.month).slice(0,3).map(x=>x.month).sort((a,b)=>a-b);
 const avg=(c:Cat)=>to5(months.reduce((s,x)=>s+x.raw[c],0)/12);
 const overall=months.map(x=>(x.raw.love+x.raw.work+x.raw.money+x.raw.health)/4);
 const careful=months.map((x,i)=>({m:x.month,s:overall[i]})).sort((a,b)=>a.s-b.s||a.m-b.m).slice(0,2).map(x=>x.m).sort((a,b)=>a-b);
 // Group stays by house (a retrograde body can leave and come back), keeping every period.
 const group=<T extends {house:number}>(xs:(T&{from:string;to:string})[])=>{
  const out:(T&{from:string;to:string;periods:{from:string;to:string}[]})[]=[];
  for(const x of xs){const g=out.find(o=>o.house===x.house);if(g){g.periods.push({from:x.from,to:x.to});g.to=x.to;}else out.push({...x,periods:[{from:x.from,to:x.to}]});}
  return out;
 };
 const stay=(list:{sign:number;from:string;to:string}[],texts:{title:L;text:L}[])=>group(list.map(s=>{const house=houseFrom(sign,s.sign);return {sign:s.sign,house,from:s.from,to:s.to,title:texts[house-1].title,text:texts[house-1].text};}));
 // Vedic Saturn phases from the Moon sign (the sign itself, read as a Moon sign).
 const saturnPhase=system==='vedic'?mergePhases(y.saturn.map(s=>{const h=houseFrom(sign,s.sign);
  const k=h===12?'sadeSati1':h===1?'sadeSati2':h===2?'sadeSati3':h===8?'ashtama':h===4?'kantaka':null;
  return k?{key:k,from:s.from,to:s.to,...SATURN_PHASE[k as keyof typeof SATURN_PHASE]}:null;}).filter(x=>x!==null)):[];
 return {system,sign,year,method:YEAR_METHOD,
  jupiter:stay(y.jupiter,JUPITER_HOUSE),saturn:stay(y.saturn,SATURN_HOUSE),
  rahu:y.rahu?group(y.rahu.map(s=>{const house=houseFrom(sign,s.sign);return {sign:s.sign,house,from:s.from,to:s.to,text:RAHU_HOUSE[house-1]};})):null,
  saturnPhase,
  ratings:{love:avg('love'),work:avg('work'),money:avg('money'),health:avg('health')},
  bestMonths:{love:best('love'),work:best('work'),money:best('money')},carefulMonths:careful,
  months:months.map(({raw,...x})=>x)};
}
function mergePhases<T extends {key:string;from:string;to:string}>(xs:T[]){
 const out:(T&{periods:{from:string;to:string}[]})[]=[];
 for(const x of xs){const g=out.find(o=>o.key===x.key);if(g){g.periods.push({from:x.from,to:x.to});g.to=x.to;}else out.push({...x,periods:[{from:x.from,to:x.to}]});}
 return out;
}
