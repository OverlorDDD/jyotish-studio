/** ASE-2 Western transits, natal contacts and bounded exact timing.
 * Numerical roots are found on Swiss sampled longitudes, not invented dates.
 * Exact moments are UT within ±5 minutes of a crossing; when the search
 * boundary cuts an orb interval, it is explicitly marked as CLIPPED.
 */
import {tropicalSkyAtUtc,type TropicalPlanet} from './western-horoscope.ts';
import {calculateAshtakavarga,avSignsFromNatal,grahaDrishti,AV_GRAHAS} from './ashtakavarga.ts';
import type {tropicalNatalChartAtUtc} from './western-natal.ts';
import type {dailyTransit} from './personal-transits.ts';
const PLANETS:readonly TropicalPlanet[]=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn'];
const ASPECTS=[
 {key:'conjunction',angle:0,orb:4},{key:'semisextile',angle:30,orb:1.5},
 {key:'semisquare',angle:45,orb:1.5},{key:'sextile',angle:60,orb:3},
 {key:'square',angle:90,orb:4},{key:'trine',angle:120,orb:4},
 {key:'sesquiquadrate',angle:135,orb:1.5},{key:'quincunx',angle:150,orb:2},
 {key:'opposition',angle:180,orb:4}
] as const;
type AspectDef=typeof ASPECTS[number];
type Natal=Awaited<ReturnType<typeof tropicalNatalChartAtUtc>>;
type Transit=Awaited<ReturnType<typeof dailyTransit>>;
const mod=(x:number)=>((x%360)+360)%360;
const signed=(x:number)=>mod(x+180)-180;
export function angleOrb(a:number,b:number,angle:number){
 if(![a,b,angle].every(Number.isFinite))throw Error('Invalid aspect input');
 const diff=mod(a-b);
 return Math.min(Math.abs(signed(diff-angle)),Math.abs(signed(diff+angle)));
}
function aspects(a:number,b:number){
 return ASPECTS.filter(def=>angleOrb(a,b,def.angle)<=def.orb+1e-9)
  .map(def=>({aspect:def.key,angle:def.angle,orb:angleOrb(a,b,def.angle),
   orbLimit:def.orb}));
}
const stamp=(t:number)=>new Date(t).toISOString();
function classify(a:number,b:number,angle:number,prev:number,next:number){
 const current=angleOrb(a,b,angle);
 const earlier=angleOrb(prev,b,angle),later=angleOrb(next,b,angle);
 if(Math.abs(later-earlier)<0.00001)return 'stationary_or_turning' as const;
 return later<earlier?'applying' as const:'separating' as const;
}
export function westernNatalContacts(natal:Natal){
 const rows=[];
 for(let i=0;i<PLANETS.length;i++)for(let j=i+1;j<PLANETS.length;j++){
  const a=PLANETS[i],b=PLANETS[j];
  for(const def of aspects(natal.planets[a].longitude,natal.planets[b].longitude))
   rows.push({id:'N:'+a+':'+b+':'+def.aspect,first:a,second:b,...def});
 }
 return rows.sort((x,y)=>x.orb-y.orb||x.id.localeCompare(y.id));
}
type Contact={id:string;planet:TropicalPlanet;target:TropicalPlanet;
 aspect:AspectDef['key'];angle:number;orb:number;orbLimit:number;
 applying:'applying'|'separating'|'stationary_or_turning'};
export async function westernTransitContacts(natal:Natal,atUtc:string){
 const t=Date.parse(atUtc);
 if(!Number.isFinite(t))throw Error('Invalid transit sample');
 const [before,now,after]=await Promise.all([
  tropicalSkyAtUtc(stamp(t-3600000)),
  tropicalSkyAtUtc(stamp(t)),
  tropicalSkyAtUtc(stamp(t+3600000))
 ]);
 const rows:Contact[]=[];
 for(const planet of PLANETS)for(const target of PLANETS){
  const to=natal.planets[target].longitude;
  for(const def of aspects(now.planets[planet].longitude,to))
   rows.push({id:'T:'+planet+':'+target+':'+def.aspect,planet,target,...def,
    applying:classify(now.planets[planet].longitude,to,def.angle,
     before.planets[planet].longitude,after.planets[planet].longitude)});
 }
 return rows.sort((a,b)=>a.orb-b.orb||a.id.localeCompare(b.id));
}
/** Solve an inclusive ORB interval connected to this observation.
 * The solver is bounded to ±14d and honestly reports clipped edges.
 * Retrograde can produce >1 exact hit: all crossings in this connected
 * interval are retained. No speculative ingress dates beyond the horizon.
 */
export async function traceContactWindow(natal:Natal,contact:Contact,atUtc:string,
 options:{sample?: (at:string)=>Promise<number>;radiusDays?:number}={}){
 const center=Date.parse(atUtc),step=2*3600000,radius=(options.radiusDays??14)*86400000;
 if(!Number.isFinite(center)||radius<step||radius>45*86400000)throw Error('Invalid timing search');
 const target=natal.planets[contact.target].longitude;
 const sample=options.sample||async(utc:string)=>(await tropicalSkyAtUtc(utc)).planets[contact.planet].longitude;
 const at=async(t:number)=>angleOrb(await sample(stamp(t)),target,contact.angle)-contact.orbLimit;
 if(await at(center)>1e-6)throw Error('Timing contact not active at observation');
 // Bisection for first crossing to 5min (no extrapolation).
 const bisect=async(left:number,right:number)=>{
  let f=await at(left);
  for(let i=0;i<23&&right-left>300000;i++){
   const mid=Math.floor((left+right)/2),fm=await at(mid);
   if((f<=0)===(fm<=0)){left=mid;f=fm;}else right=mid;
  }
  return Math.floor((left+right)/2);
 };
 let start=center-radius,end=center+radius;
 let clippedStart=true,clippedEnd=true;
 for(let t=center;t>center-radius;t-=step){
  const next=Math.max(center-radius,t-step);
  if(await at(next)>0){start=await bisect(next,t);clippedStart=false;break;}
 }
 for(let t=center;t<center+radius;t+=step){
  const next=Math.min(center+radius,t+step);
  if(await at(next)>0){end=await bisect(t,next);clippedEnd=false;break;}
 }
 // Exact aspect occurs at either +angle or -angle (both branches).
 // Scan this one orb window with signed angular residuals to find all
 // direct and retrograde crossings; each root is bracketed independently.
 const residual=async(t:number,branch:number)=>signed((await sample(stamp(t)))-target-branch);
 const branches=contact.angle===0||contact.angle===180?
  [contact.angle]:[contact.angle,-contact.angle];
 const exactTimes:number[]=[];
 for(const branch of branches){
  let prev=start,fp=await residual(prev,branch);
  for(let t=start+step;t<=end+step;t+=step){
   const next=Math.min(end,t);if(next<=prev)break;
   const fn=await residual(next,branch);
   if(Math.abs(fp)<0.00001)exactTimes.push(prev);
   if((fp<0&&fn>0)||(fp>0&&fn<0)||Math.abs(fn)<0.00001){
    let l=prev,r=next,fl=fp;
    for(let j=0;j<22&&r-l>300000;j++){
     const mid=Math.floor((l+r)/2),fm=await residual(mid,branch);
     if((fl<=0)===(fm<=0)){l=mid;fl=fm;}else r=mid;
    }
    exactTimes.push(Math.floor((l+r)/2));
   }
   prev=next;fp=fn;
  }
 }
 const unique=[...new Set(exactTimes.map(t=>Math.round(t/300000)*300000))].sort((a,b)=>a-b);
 return {id:contact.id,startUtc:stamp(start),endUtc:stamp(end),
  exactUtc:unique.map(stamp),clippedStart,clippedEnd,
  precision:'NUMERICAL_SWISS_ROOT_WITHIN_FIVE_MINUTES',
  searchRadiusDays:radius/86400000};
}
export function vedicAdvancedEvidence(transit:Transit,natalPositions:ReadonlyArray<{name:string;sign:number}>,lagnaSign:number,
 period?:{lord:string;antardasha?:string|null;start?:string;end?:string}|null){
 if(!transit.ephemerisBackend.includes('verified-SWIEPH'))throw Error('Unverified Vedic ephemeris');
 const signs=avSignsFromNatal(natalPositions,lagnaSign);
 const ashtakavarga=calculateAshtakavarga(signs);
 const natalBySign=new Map<number,string[]>();
 for(const p of natalPositions){
  if(!Number.isInteger(p.sign)||p.sign<1||p.sign>12)throw Error('Invalid natal placement');
  const arr=natalBySign.get(p.sign)||[];arr.push(p.name);natalBySign.set(p.sign,arr);
 }
 const drishti=AV_GRAHAS.flatMap(name=>{
  const p=transit.planets.find(x=>x.name===name);
  if(!p)throw Error('Missing verified transit '+name);
  return grahaDrishti(name,p.sign).map(d=>({...d,
   natalTargets:natalBySign.get(d.toSign)||[],
   targetsLagna:d.toSign===lagnaSign,
   targetsMoon:d.toSign===signs.Moon,
   sampledAtUtc:transit.sampledAtUtc}));
 });
 const gochara=AV_GRAHAS.map(name=>{
  const p=transit.planets.find(x=>x.name===name)!;
  return {graha:name,sign:p.sign,longitude:p.longitude,
   bav:ashtakavarga.bav[name][p.sign-1],sav:ashtakavarga.sav[p.sign-1],
   houseFromMoon:((p.sign-signs.Moon+12)%12)+1,
   houseFromLagna:((p.sign-lagnaSign+12)%12)+1};
 });
 return {method:'SIDEREAL_LAHIRI_GRAHA_DRISHTI_ASHTAKAVARGA_V1',
  ashtakavarga,drishti,gochara,
  periodContext:period||null,
  periodRole:'VERIFIED_DASHA_TIMING_CONTEXT_NOT_NUMERIC_FATE_WEIGHT'};
}
export async function buildAdvancedSynthesis(input:{natal:Natal;transit:Transit;
 natalPositions:ReadonlyArray<{name:string;sign:number}>;lagnaSign:number;
 period?:{lord:string;antardasha?:string|null;start?:string;end?:string}|null;
 maxTimed?:number}){
 const {natal,transit}=input,observed=transit.sampledAtUtc;
 const contacts=await westernTransitContacts(natal,observed);
 const timed=await Promise.all(contacts.slice(0,Math.min(Math.max(input.maxTimed??6,0),8))
  .map(c=>traceContactWindow(natal,c,observed)));
 return {version:'ASE_V2' as const,method:'SWISS_TROPICAL_PLACIDUS_AND_LAHIRI_ADVANCED',
  natal:{method:natal.method,planets:natal.planets,
   ascendant:natal.ascendant,midheaven:natal.midheaven,cusps:natal.cusps,
   contacts:westernNatalContacts(natal)},
  western:{contacts,activeContacts:contacts.length,timed,
   timingLimitation:'UTC samples; 14-day search bounds; clipped intervals are not full duration'},
  vedic:vedicAdvancedEvidence(transit,input.natalPositions,input.lagnaSign,input.period),
  sourceIds:['SWISS_EPHEMERIS_PROGRAMMING_MANUAL','BPHS_ASHTAKAVARGA_UNREDUCED',
   'PARASHARI_FULL_GRAHA_DRISHTI','VERIFIED_VIMSHOTTARI_CONTEXT']};
}
