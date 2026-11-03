/**
 * P3.9 compact favorability index for source-verified P38 observations.
 * This is a TRANSPARENT PRODUCT HEURISTIC, not a canonical shastra score,
 * calibrated success probability, or permission to override hard exclusions.
 *
 * Untested rule = neutral (0.5) within an independently measured calendar
 * component; it is never recorded as supporting evidence. Personal inputs
 * are omitted completely when not present, not treated as unfavorable.
 * Tithi and Karana measure the same angular separation, so share a bucket.
 * One strict activity/time-specific exclusion always blocks recommendation.
 */
import type {P38ActivityId,P38Method,P38Observation} from './panchanga-p38-decision.ts';

export type P390Input={
 activityId:P38ActivityId;method:P38Method;
 observations:readonly P38Observation[];personalized:boolean;
};
export type P390Rating={
 version:'p390-favorability-v1';
 score:number|null;rawScore:number;
 blocked:boolean;hardReasonIds:string[];
 hasActivitySupport:boolean;supportCount:number;cautionCount:number;
 checkedGroups:number;personalized:boolean;
 label:'blocked'|'very_favorable'|'favorable'|'mostly_favorable'|'mixed'|'unfavorable'|'insufficient'|'routine'|'preliminary';
 basis:'WEIGHTED_TRADITIONAL_SCREENING_NOT_SUCCESS_PROBABILITY';
};
type Group='nakshatra'|'elongation'|'yoga'|'vara'|'rahu'|'tara'|'chandra';
const GROUPS:readonly {id:Group;weight:number}[]=[
 {id:'nakshatra',weight:30},
 {id:'elongation',weight:15},
 {id:'yoga',weight:12},
 {id:'vara',weight:7},
 {id:'rahu',weight:10},
 {id:'tara',weight:14},
 {id:'chandra',weight:12}
] as const;
const rank={context:0,supports:1,cautions:2,excludes:3} as const;
const value={context:0.5,supports:1,cautions:0.25,excludes:0} as const;
const group=(e:P38Observation):Group=>{
 if(e.domain==='tithi'||e.domain==='karana')return 'elongation';
 if(e.domain==='tarabala')return 'tara';
 if(e.domain==='chandrabala')return 'chandra';
 return e.domain;
};
export function scoreP390(input:P390Input):P390Rating{
 if(!input||!Array.isArray(input.observations))throw Error('P390 verified observation array required');
 const groups=new Map<Group,P38Observation['polarity']>();
 let activitySupport=false;
 const hardReasonIds:string[]=[];
 for(const observation of input.observations as readonly P38Observation[]){
  const e:P38Observation=observation;
  if(!e.id||!e.source?.startsWith('https://')||
    !['activity','personal','general_election'].includes(e.scope)||
    !Object.hasOwn(rank,e.polarity))
   throw Error('P390 invalid or unsourced factor');
  if(e.polarity==='supports'&&e.scope==='activity')activitySupport=true;
  if(e.polarity==='excludes')hardReasonIds.push(e.id);
  const g=group(e),old=groups.get(g);
  if(!old||rank[e.polarity]>rank[old])groups.set(g,e.polarity);
 }
 const blocked=hardReasonIds.length>0;
 const weighted=GROUPS.filter(g=>input.personalized||!['tara','chandra'].includes(g.id));
 const denominator=weighted.reduce((s,g)=>s+g.weight,0);
 const numerator=weighted.reduce((s,g)=>s+g.weight*value[groups.get(g.id)||'context'],0);
 const rawScore=Math.round(100*numerator/denominator);
 const relevant=weighted.map(g=>groups.get(g.id)).filter(Boolean);
 const supportCount=relevant.filter(v=>v==='supports').length;
 const cautionCount=relevant.filter(v=>v==='cautions').length;
 const base={version:'p390-favorability-v1' as const,blocked,
  score:blocked||input.method==='routine'?null:rawScore,rawScore,
  hardReasonIds:[...new Set(hardReasonIds)],
  hasActivitySupport:activitySupport,supportCount,cautionCount,
  checkedGroups:groups.size,personalized:input.personalized,
  basis:'WEIGHTED_TRADITIONAL_SCREENING_NOT_SUCCESS_PROBABILITY' as const};
 let label:P390Rating['label'];
 if(input.method==='routine')label='routine';
 else if(blocked)label='blocked';
 else if(input.method==='special_election')label='preliminary';
 else if(!activitySupport&&supportCount<2)label='insufficient';
 else if(rawScore>=82)label='very_favorable';
 else if(rawScore>=68)label='favorable';
 else if(rawScore>=60)label='mostly_favorable';
 else if(rawScore>=45)label='mixed';
 else label='unfavorable';
 return {...base,label};
}
/** Positive, review and strict veto must use the identical scoring function
 * as the visible percentage and server's event-time selection.
 */
export function p390CanRecommend(r:P390Rating,method:P38Method):boolean{
 return !r.blocked&&method==='direct'&&r.hasActivitySupport&&
  r.score!==null&&r.score>=60;
}
