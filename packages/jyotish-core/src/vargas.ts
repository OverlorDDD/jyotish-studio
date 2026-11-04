/**
 * N4.1: pure, versioned Parashari Shodashavarga sign mapping.
 * This is a symbolic varga sign, NOT a new physical ecliptic longitude.
 * No changes to legacy D1/D9/D10, Reader v6 or API contracts.
 * Parity with JHora 8.0 is an EXTERNAL gate, not presumed.
 */
export const VARGA_RULESET_VERSION='n4-parashari-v1.0.0' as const;
export const VARGA_PROFILE='parashari-sunmoon-hora-unequal-trimsamsa-jhora-style-d60-v1' as const;
export const SHODASHAVARGA=[1,2,3,4,7,9,10,12,16,20,24,27,30,40,45,60] as const;
export type VargaNumber=typeof SHODASHAVARGA[number];
export type VargaPoint=Readonly<{name:string;longitude:number;speed?:number}>;
export type VargaPlacement=Readonly<{name:string;birthLongitude:number;birthSign:number;vargaSign:number;house:number;part:number;boundaryDistanceArcseconds:number;retrograde:boolean}>;
export type VargaChart=Readonly<{division:VargaNumber;profile:typeof VARGA_PROFILE;rulesVersion:typeof VARGA_RULESET_VERSION;certification:'internal_rules_only_external_reference_pending';lagna:VargaPlacement;planets:readonly VargaPlacement[]}>;
const mod=(x:number,n:number)=>((x%n)+n)%n;
const normalize=(x:number):number=>{if(!Number.isFinite(x))throw new RangeError('Varga longitude must be finite');return mod(x,360);};
const valid=(n:number)=>{if(!(SHODASHAVARGA as readonly number[]).includes(n))throw new RangeError('Unsupported varga');};
const coords=(x:number)=>{const lon=normalize(x),s=Math.floor(lon/30);return {s,u:lon-s*30};};
const odd=(s:number)=>s%2===0; // Aries, 0-based, is zodiac sign #1
const part=(u:number,n:number)=>Math.min(n-1,Math.floor(u*n/30));
const ODD_LIMITS=[5,10,18,25,30] as const;
const EVEN_LIMITS=[5,12,20,25,30] as const;
const ODD_SIGNS=[0,10,8,2,6] as const;
const EVEN_SIGNS=[1,5,11,9,7] as const;
export function vargaSign(longitude:number,division:VargaNumber):number{
 valid(division);const {s,u}=coords(longitude),p=part(u,division),m=s%3;
 switch(division){
  case 1:return s;
  case 2:return odd(s)?(p===0?4:3):(p===0?3:4); // Sun/Moon Hora
  case 3:return mod(s+4*p,12);
  case 4:return mod(s+3*p,12);
  case 7:return mod(s+(odd(s)?0:6)+p,12);
  case 9:return mod(s*9+p,12); // identical to legacy Galaxiora D9
  case 10:return mod((odd(s)?s:s+8)+p,12); // legacy D10
  case 12:return mod(s+p,12);
  case 16:return mod([0,4,8][m]+p,12);
  case 20:return mod([0,8,4][m]+p,12);
  case 24:return mod((odd(s)?4:3)+p,12); // pinned even-sign forward method
  case 27:return mod(3*(s%4)+p,12);
  case 30:{const lim=odd(s)?ODD_LIMITS:EVEN_LIMITS,signs=odd(s)?ODD_SIGNS:EVEN_SIGNS;return signs[lim.findIndex(end=>u<end)];}
  case 40:return mod((odd(s)?0:6)+p,12);
  case 45:return mod([0,4,8][m]+p,12);
  case 60:return mod(s+p,12); // JHora-style inclusive count, alternative BPHS exists
 }
}
export function vargaPart(longitude:number,division:VargaNumber):number{
 valid(division);const {s,u}=coords(longitude);
 if(division===30)return (odd(s)?ODD_LIMITS:EVEN_LIMITS).findIndex(end=>u<end);
 return part(u,division);
}
export function vargaBoundaryDistanceArcseconds(longitude:number,division:VargaNumber):number{
 valid(division);const {s,u}=coords(longitude);
 if(division===30)return Math.min(u,...(odd(s)?ODD_LIMITS:EVEN_LIMITS).map(end=>Math.abs(u-end)))*3600;
 const width=30/division,offset=mod(u,width);return Math.min(offset,width-offset)*3600;
}
export function calculateVargaFromLongitudes(division:VargaNumber,ascendantLongitude:number,points:readonly VargaPoint[]):VargaChart{
 valid(division);
 if(!Array.isArray(points)||points.length!==9)throw new RangeError('Expected nine natal grahas');
 const names=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
 if(new Set(points.map(p=>p.name)).size!==9||names.some(n=>!points.some(p=>p.name===n)))
  throw new RangeError('Missing or duplicate natal graha');
 const asc=vargaSign(ascendantLongitude,division);
 const make=(p:VargaPoint):VargaPlacement=>{
  const lon=normalize(p.longitude),sign=vargaSign(lon,division);
  return Object.freeze({name:p.name,birthLongitude:lon,birthSign:Math.floor(lon/30)+1,
    vargaSign:sign+1,house:mod(sign-asc,12)+1,part:vargaPart(lon,division)+1,
    boundaryDistanceArcseconds:vargaBoundaryDistanceArcseconds(lon,division),retrograde:(p.speed??0)<0});
 };
 return Object.freeze({division,profile:VARGA_PROFILE,rulesVersion:VARGA_RULESET_VERSION,
  certification:'internal_rules_only_external_reference_pending',
  lagna:make({name:'Ascendant',longitude:ascendantLongitude}),
  planets:Object.freeze(points.map(make))});
}
export function calculateAllVargas(ascendantLongitude:number,points:readonly VargaPoint[]):readonly VargaChart[]{
 return Object.freeze(SHODASHAVARGA.map(n=>calculateVargaFromLongitudes(n,ascendantLongitude,points)));
}
/**
 * Compare ephemeris-recalculated time samples. This does NOT certify a stable
 * interval between samples or infer time accuracy from angular distance.
 */
export type VargaTimeSample=Readonly<{offsetMinutes:number;ascendantLongitude:number;points:readonly VargaPoint[]}>;
export type VargaSampledStability=Readonly<{division:VargaNumber;testedOffsetsMinutes:readonly number[];changedBodies:readonly string[];lagnaChanged:boolean;method:'sampled_ephemeris_positions_only'}>;
export function compareSampledVargaStability(samples:readonly VargaTimeSample[]):readonly VargaSampledStability[]{
 if(!Array.isArray(samples)||samples.length<2||samples.length>100)
  throw new RangeError('Supply 2..100 independently recomputed time samples');
 const offsets=samples.map(s=>s.offsetMinutes);
 if(offsets.some(x=>!Number.isFinite(x))||new Set(offsets).size!==offsets.length||!offsets.includes(0))
  throw new RangeError('A unique finite offset for each sample and a 0-minute baseline are required');
 const charts=samples.map(s=>calculateAllVargas(s.ascendantLongitude,s.points));
 const baseline=charts[offsets.indexOf(0)];
 return Object.freeze(SHODASHAVARGA.map((n,i)=>{
  const changed=new Set<string>(),base=baseline[i];
  for(const chart of charts){
   if(chart[i].lagna.vargaSign!==base.lagna.vargaSign)changed.add('Ascendant');
   for(const p of base.planets){
    if(chart[i].planets.find(q=>q.name===p.name)?.vargaSign!==p.vargaSign)changed.add(p.name);
   }
  }
  return Object.freeze({division:n,testedOffsetsMinutes:Object.freeze([...offsets].sort((a,b)=>a-b)),
   changedBodies:Object.freeze([...changed].sort()),lagnaChanged:changed.has('Ascendant'),
   method:'sampled_ephemeris_positions_only' as const});
 }));
}
