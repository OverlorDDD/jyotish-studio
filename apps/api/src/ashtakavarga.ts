/**
 * ASE-2: classical unreduced Parashari Bhinna/Sarvashtakavarga.
 * All positions count INCLUSIVELY from contributor's sidereal natal sign.
 * BAV includes 7 grahas + Lagna (Lagna has no own BAV). Rahu/Ketu omitted.
 * Source table: BPHS Ashtakavarga chapter / Phaladipika 23;
 * cross-check https://witchcraftdaily.com/vedic/library/ashtakavarga/
 * This is the UNREDUCED 337-point form; no shodhana or pinda is claimed.
 */
export const AV_GRAHAS=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'] as const;
export type AvGraha=typeof AV_GRAHAS[number];
export const AV_CONTRIBUTORS=[...AV_GRAHAS,'Lagna'] as const;
export type AvContributor=typeof AV_CONTRIBUTORS[number];
export type AvSigns=Record<AvContributor,number>;
const TABLE:Record<AvGraha,readonly (readonly number[])[]>={
 Sun:[
  [1,2,4,7,8,9,10,11],[3,6,10,11],[1,2,4,7,8,9,10,11],
  [3,5,6,9,10,11,12],[5,6,9,11],[6,7,12],
  [1,2,4,7,8,9,10,11],[3,4,6,10,11,12]],
 Moon:[
  [3,6,7,8,10,11],[1,3,6,7,10,11],[2,3,5,6,9,10,11],
  [1,3,4,5,7,8,10,11],[1,4,7,8,10,11,12],
  [3,4,5,7,9,10,11],[3,5,6,11],[3,6,10,11]],
 Mars:[
  [3,5,6,10,11],[3,6,11],[1,2,4,7,8,10,11],
  [3,5,6,11],[6,10,11,12],[6,8,11,12],
  [1,4,7,8,9,10,11],[1,3,6,10,11]],
 Mercury:[
  [5,6,9,11,12],[2,4,6,8,10,11],[1,2,4,7,8,9,10,11],
  [1,3,5,6,9,10,11,12],[6,8,11,12],
  [1,2,3,4,5,8,9,11],[1,2,4,7,8,9,10,11],[1,2,4,6,8,10,11]],
 Jupiter:[
  [1,2,3,4,7,8,9,10,11],[2,5,7,9,11],[1,2,4,7,8,10,11],
  [1,2,4,5,6,9,10,11],[1,2,3,4,7,8,10,11],
  [2,5,6,9,10,11],[3,5,6,12],[1,2,4,5,6,7,9,10,11]],
 Venus:[
  [8,11,12],[1,2,3,4,5,8,9,11,12],[3,5,6,9,11,12],
  [3,5,6,9,11],[5,8,9,10,11],[1,2,3,4,5,8,9,10,11],
  [3,4,5,8,9,10,11],[1,2,3,4,5,8,9,11]],
 Saturn:[
  [1,2,4,7,8,10,11],[3,6,11],[3,5,6,10,11,12],
  [6,8,9,10,11,12],[5,6,11,12],[6,11,12],
  [3,5,6,11],[1,3,4,6,10,11]]
};
const TOTALS:Record<AvGraha,number>={Sun:48,Moon:49,Mars:39,Mercury:54,Jupiter:56,Venus:52,Saturn:39};
const isSign=(x:unknown)=>Number.isInteger(x)&&typeof x==='number'&&x>=1&&x<=12;
export function calculateAshtakavarga(signs:AvSigns){
 for(const name of AV_CONTRIBUTORS)if(!isSign(signs[name]))throw Error('Invalid natal sidereal sign: '+name);
 const bav={} as Record<AvGraha,number[]>,sav=Array<number>(12).fill(0);
 for(const graha of AV_GRAHAS){
  const values=Array<number>(12).fill(0);
  for(let i=0;i<8;i++){
   const source=AV_CONTRIBUTORS[i],offsets=TABLE[graha][i];
   if(new Set(offsets).size!==offsets.length||offsets.some(x=>!isSign(x)))throw Error('Invalid AV rule table');
   for(const offset of offsets)values[(signs[source]+offset-2)%12]++;
  }
  if(values.some(x=>x<0||x>8)||values.reduce((a,b)=>a+b,0)!==TOTALS[graha])
   throw Error('BAV integrity: '+graha);
  bav[graha]=values;
  for(let i=0;i<12;i++)sav[i]+=values[i];
 }
 if(sav.reduce((a,b)=>a+b,0)!==337)throw Error('SAV invariant 337 violated');
 return {version:'BPHS_UNREDUCED_AV_V1' as const,bav,sav,total:337,
  note:'No Trikona/Ekadhipatya Shodhana or Pinda; unreduced transit context only',
  source:'BPHS_ASHTAKAVARGA_SEVEN_GRAHAS_EIGHT_CONTRIBUTORS'};
}
export function avSignsFromNatal(placements:ReadonlyArray<{name:string;sign:number}>,lagnaSign:number):AvSigns{
 const result:Partial<AvSigns>={Lagna:lagnaSign};
 for(const row of placements)if(AV_GRAHAS.some(g=>g===row.name)) {
  if(result[row.name as AvGraha]!==undefined)throw Error('Duplicate natal graha '+row.name);
  result[row.name as AvGraha]=row.sign;
 }
 for(const key of AV_CONTRIBUTORS)if(!isSign(result[key]))throw Error('Missing valid natal '+key);
 return result as AvSigns;
}
/** Parashari FULL graha drishti, counted incl. source sign. Distinct from Western orbs. */
const DRISHTI:Record<AvGraha,readonly number[]>={
 Sun:[7],Moon:[7],Mars:[4,7,8],Mercury:[7],
 Jupiter:[5,7,9],Venus:[7],Saturn:[3,7,10]
};
export function grahaDrishti(graha:AvGraha,fromSign:number){
 if(!isSign(fromSign)||!DRISHTI[graha])throw Error('Invalid drishti input');
 return DRISHTI[graha].map(offset=>({graha,fromSign,offset,
  toSign:((fromSign+offset-2)%12)+1,ruleId:'PARASHARI_FULL_GRAHA_DRISHTI'}));
}
