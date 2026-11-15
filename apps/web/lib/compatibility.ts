/** Sign-pair compatibility for the 78 public pair pages. Pure and deterministic:
 * Western view from the classical aspect between the signs, their elements and
 * their traditional rulers; Vedic view from the four sign-level Ashtakoota
 * kootas (Varna, Vashya, Graha Maitri, Bhakoot = 15 of 36 points). */
import {ashtakoota,grahaMaitri,SIGN_LORD,KOOTA_MAX} from '../../../packages/jyotish-core/src/ashtakoota.ts';
import {SIGNS,type HoroLocale,type SignInfo} from './horoscope-signs.ts';
import {ASPECTS,ELEMENT_PAIR,TAGLINE} from './compatibility-texts.ts';

export type Pair={a:SignInfo;b:SignInfo;slug:string};
const ELEMENT_ORDER=['fire','earth','air','water'];

export const pairSlug=(x:SignInfo,y:SignInfo)=>x.n<=y.n?x.slug+'-'+y.slug:y.slug+'-'+x.slug;
/** All 78 unordered pairs in zodiac order. */
export const ALL_PAIRS:Pair[]=SIGNS.flatMap((a,i)=>SIGNS.slice(i).map(b=>({a,b,slug:pairSlug(a,b)})));
/** Parses «aries-leo»; returns the canonical slug too (so «leo-aries» can redirect). */
export function parsePair(slug:string):Pair&{canonical:boolean}|null{
 for(const a of SIGNS)if(slug.startsWith(a.slug+'-')){
  const b=SIGNS.find(s=>s.slug===slug.slice(a.slug.length+1));
  if(b)return {a:a.n<=b.n?a:b,b:a.n<=b.n?b:a,slug:pairSlug(a,b),canonical:a.n<=b.n};
 }
 return null;
}
export const compatPath=(locale:HoroLocale,slug?:string)=>'/'+locale+'/horoscope/compatibility'+(slug?'/'+slug:'');

/** Steps around the zodiac between the signs: 0 same … 6 opposition. */
export const aspectSteps=(a:number,b:number)=>{const d=Math.abs(a-b)%12;return Math.min(d,12-d);};
export const elementKey=(a:SignInfo,b:SignInfo)=>[a.element.en,b.element.en].sort((x,y)=>ELEMENT_ORDER.indexOf(x)-ELEMENT_ORDER.indexOf(y)).join('-');

export type WesternScores={overall:number;love:number;passion:number;friendship:number;trust:number;work:number};
const BASE=[74,58,82,52,90,48,70];
const clamp=(x:number)=>Math.max(30,Math.min(97,Math.round(x)));
/** Western compatibility in percent. Base from the aspect; categories lean on
 * what each aspect classically favours; the rulers' natural friendship
 * (0..5 Graha Maitri scale) nudges every category by up to ±5. */
export function westernScores(a:SignInfo,b:SignInfo):WesternScores{
 const k=aspectSteps(a.n,b.n),base=BASE[k];
 const rulers=(grahaMaitri(SIGN_LORD[a.n-1],SIGN_LORD[b.n-1])-2.5)*2;
 const sameQuality=a.quality.en===b.quality.en;
 const love=clamp(base+[2,0,2,-2,4,-2,6][k]+rulers);
 const passion=clamp(base+[-2,-6,-4,14,-6,6,14][k]+(a.element.en==='fire'||b.element.en==='fire'?3:0));
 const friendship=clamp(base+[4,6,8,-6,2,0,-4][k]+rulers*0.6);
 const trust=clamp(base+[6,0,2,-8,4,-8,-2][k]+rulers);
 const work=clamp(base+[-4,4,4,6,0,2,0][k]+(sameQuality&&k!==0?-4:0)+(a.element.en==='earth'||b.element.en==='earth'?3:0));
 const overall=clamp((love*2+passion+friendship+trust*2+work)/7);
 return {overall,love,passion,friendship,trust,work};
}

/** Vedic sign-level points (Moon signs). Sagittarius and Capricorn change their
 * Vashya class at 15°, so Vashya is averaged over both halves of the sign. */
export function vedicSignLevel(a:SignInfo,b:SignInfo){
 const halves=[7.5,22.5];
 const runs=halves.flatMap(x=>halves.map(y=>ashtakoota({sign:a.n,degInSign:x},{sign:b.n,degInSign:y})));
 const r=runs[0];
 const vashya=Math.round(runs.reduce((s,x)=>s+(x.scores.vashya??0),0)/runs.length*4)/4;
 const scores={varna:r.scores.varna!,vashya,grahaMaitri:r.scores.grahaMaitri!,bhakoot:r.scores.bhakoot!};
 const total=scores.varna+scores.vashya+scores.grahaMaitri+scores.bhakoot;
 const max=KOOTA_MAX.varna+KOOTA_MAX.vashya+KOOTA_MAX.grahaMaitri+KOOTA_MAX.bhakoot;
 return {scores,total,max,bhakoot:r.bhakoot,lords:r.detail.lords as [string,string]};
}

export function pairContent(p:Pair){
 const k=aspectSteps(p.a.n,p.b.n);
 return {tagline:TAGLINE[p.slug],aspect:ASPECTS[k],aspectSteps:k,element:ELEMENT_PAIR[elementKey(p.a,p.b)],
  western:westernScores(p.a,p.b),vedic:vedicSignLevel(p.a,p.b)};
}

/** Short verbal band for a percentage. */
export function bandLabel(pct:number,locale:HoroLocale){
 const uk=locale==='uk';
 return pct>=85?(uk?'чудова сумісність':'excellent match'):pct>=72?(uk?'добра сумісність':'good match'):pct>=60?(uk?'потребує зусиль':'takes some work'):(uk?'складна, але можлива':'challenging but possible');
}
