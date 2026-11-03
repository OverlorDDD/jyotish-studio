/**
 * P3.8.6 UI evidence share (NOT a probability of worldly success).
 *
 * Count only source-cited, actually triggered, interpretable supports/cautions/
 * exclusions. Deliberately merge Tithi and Karana into a SINGLE lunar-elongation
 * group: both are derived from the same Sun-Moon angle. A missing observation
 * does not become a positive vote. A required full election cannot receive a
 * misleading percent. This is a transparent display statistic, not a Shastra
 * score or an empirically calibrated future-event probability.
 */
import type {P38Moment,P38Observation} from './panchanga-p38-decision.ts';

export type P386EvidenceShare={
  numerator:number;denominator:number;percent:number|null;
  positive:number;caution:number;excluded:number;
  completeForDisplay:boolean;
  basis:'TRIGGERED_SOURCE_EVIDENCE_NOT_OUTCOME_PROBABILITY';
};
const priority={supports:1,cautions:2,excludes:3} as const;
export function p386EvidenceShare(moment:P38Moment):P386EvidenceShare{
 if(moment.version!=='p38-election-screening-v1'||!Array.isArray(moment.observations))
  throw Error('P386 requires verified P38 classical activity evaluation');
 const buckets=new Map<string,P38Observation['polarity']>();
 for(const e of moment.observations){
  if(e.polarity==='context')continue;
  if(!e.source?.startsWith('https://')||!e.id||!e.scope)
   throw Error('P386 unsourced classical evidence');
  const key=e.domain==='karana'||e.domain==='tithi'?'sun_moon_elongation':e.domain;
  const prev=buckets.get(key);
  if(!prev||priority[e.polarity]>priority[prev as keyof typeof priority])
   buckets.set(key,e.polarity);
 }
 const values=[...buckets.values()];
 const positive=values.filter(p=>p==='supports').length;
 const caution=values.filter(p=>p==='cautions').length;
 const excluded=values.filter(p=>p==='excludes').length;
 const denominator=positive+caution+excluded;
 // Do not render "100%" for a case with only general positive natal
 // factors but NO traditional support for the SPECIFIC selected activity.
 // And never put a cheery percentage alongside a documented hard exclusion.
 const activitySupport=moment.observations.some(e=>e.polarity==='supports'&&e.scope==='activity');
 const completeForDisplay=moment.activityMethod==='direct'&&
  (moment.verdict==='candidate'||moment.verdict==='mixed')&&
  activitySupport&&excluded===0&&denominator>=2;
 const percent=completeForDisplay?Math.round(positive/denominator*100):null;
 return {numerator:positive,denominator,percent,positive,caution,excluded,
  completeForDisplay,basis:'TRIGGERED_SOURCE_EVIDENCE_NOT_OUTCOME_PROBABILITY'};
}
