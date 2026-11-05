/**
 * Synthetic N4 complete-life postflight: explicit, machine-checkable minimum.
 * Not a semantic truth certificate, nor a replacement for original JHora.
 */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {buildN4LifeEvidence} from './n4-comprehensive-reading.ts';
import {reviewN4EditorialGate} from './n4-editorial-gate.ts';
import {auditN4ExplicitClaims} from './n4-ai-claims.ts';

export const N4_COMPLETE_REVIEW_VERSION='n4-complete-life-postflight-v1' as const;
export function reviewN4CompleteLifeText(text:string,chart:CalculatedChart,lang:'uk'|'en',asOf:string){
 const base=reviewN4EditorialGate(text,chart,lang,asOf);
 const dossier=buildN4LifeEvidence(chart,asOf);
 const claims=auditN4ExplicitClaims(text,chart);
 const required=dossier.scopes.filter(x=>x.status==='INTERNAL_MATH_ONLY').map(x=>x.division);
 const mentioned=[1,...required].filter(d=>new RegExp('(?:^|[^\\d])(?:D|Д)\\s*'+d+'(?!\\d)','iu').test(text));
 const grounded=new Set(claims.claims.map(c=>Number(/^D(\d+)\s/.exec(c)?.[1])).filter(Number.isInteger));
 const words=text.trim().split(/\s+/u).filter(Boolean).length;
 const codes=[
  ...base.codes,
  ...(required.some(d=>!mentioned.includes(d))?['n4_complete_missing_specific_domain']:[]),
  ...([1,9,10].some(d=>!mentioned.includes(d))?['n4_complete_missing_main_d1_d9_d10']:[]),
  ...([1,9,10].some(d=>!grounded.has(d))?['n4_complete_missing_verified_core_claims']:[]),
  ...(required.filter(d=>grounded.has(d)).length<8?['n4_complete_weak_multivarga_evidence']:[]),
  ...(words<550?['n4_complete_insufficient_substantive_length']:[])
 ];
 return Object.freeze({
  version:N4_COMPLETE_REVIEW_VERSION,codes:Object.freeze([...new Set(codes)]),
  words,requiredCharts:Object.freeze([1,...required]),mentionedCharts:Object.freeze(mentioned),
  groundedCharts:Object.freeze([...grounded].sort((a,b)=>a-b)),
  originalJHoraCertified:false,humanSemanticReviewed:false,
  note:'A syntactic pass never certifies domain correctness, predictions, style or tradition.'
 });
}
