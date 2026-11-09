import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {buildReaderV7} from './reader-v7.ts';
import {verifiedVargaSource} from './reader-varga-n4.ts';
import {extractN44Evidence,N44_CLASSICAL_RULESET_VERSION,sourceForRule,
 type ClassicalEvidence} from './reader-classical-n44.ts';
import {renderN45Narrative,N45_EDITORIAL_VERSION} from './reader-editorial-n45.ts';
import {buildSourceSynthesis,type ReaderSynthesis} from './reader-synthesis-n47.ts';
import {buildUnifiedN49,type N49Unified} from './reader-unified-n49.ts';
import {buildD60Preview,compactD60PreviewForAi,type D60Preview} from './reader-d60-n47.ts';

export const READER_V8_VERSION='reader-v8.0.0-n44' as const;
type Lang='uk'|'en';
export type ClassicalReaderInsight={
 division:number;title:string;headline:string;strength:string;challenge:string;
 highlight:string;
 context:string;step:string;proof:readonly string[];
 ruleIds:readonly string[];
 sources:readonly {id:string;work:string;chapter:string;stanza:string;
  edition:string;review:string;application:string}[];
 timeSensitivity:'ordinary'|'higher'|'near_boundary';
};
export type ClassicalReaderReport={
 version:typeof READER_V8_VERSION;
 editorialVersion:typeof N45_EDITORIAL_VERSION;
 ruleSetVersion:typeof N44_CLASSICAL_RULESET_VERSION;
 status:'available'|'unavailable';
 introduction:string;method:string;
 synthesis:ReaderSynthesis|null;
 integrated:N49Unified|null;
 d60Preview:D60Preview;
 highlights:readonly {id:'strength'|'challenge'|'career';division:number;title:string;text:string}[];
 insights:readonly ClassicalReaderInsight[];
 d60Notice:string;
};
function unique<T>(items:readonly T[]):T[]{return [...new Set(items)];}
function choose(activations:readonly ClassicalEvidence[],role:ClassicalEvidence['role']){
 return activations.filter(a=>a.role===role);
}
export function buildClassicalReaderV8(chart:CalculatedChart,lang:Lang,asOf:string):ClassicalReaderReport{
 const uk=lang==='uk';
 const basic=buildReaderV7(chart,lang);
 const unavailable:ClassicalReaderReport={
  version:READER_V8_VERSION,editorialVersion:N45_EDITORIAL_VERSION,
  ruleSetVersion:N44_CLASSICAL_RULESET_VERSION,
  status:'unavailable',introduction:uk?
   'Детальне класичне прочитання можливе лише за перевіреною натальною картою.':
   'A classical reading requires a verified natal calculation.',
  method:uk?'Правила без перевірених даних не застосовуються.':'No classical rule is applied without verified data.',
  synthesis:null,integrated:null,d60Preview:buildD60Preview(chart,lang),
  highlights:[],insights:[],d60Notice:basic.d60Notice
 };
 if(!verifiedVargaSource(chart)||basic.status!=='available'||basic.insights.length!==15)return unavailable;
 const insights:ClassicalReaderInsight[]=basic.insights.map(base=>{
  const activations=extractN44Evidence(chart,base.division,asOf);
  const support=choose(activations,'resource');
  const caution=choose(activations,'friction');
  const context=choose(activations,'context');
  const narration=renderN45Narrative({
   division:base.division,title:base.title,proof:base.proof,
   support:support.length>0,friction:caution.length>0,
   contrast:activations.some(a=>a.ruleId.startsWith('N44-CONTRAST')),
   complement:activations.some(a=>a.ruleId.startsWith('N44-COMPLEMENT')),
   directCareer:base.division===10&&context.some(a=>a.application==='direct_natal'),
   timeSensitive:base.timeSensitivity!=='ordinary'
  },lang);
  const proof=unique([...base.proof,...activations.flatMap(a=>a.facts)]);
  const ruleIds=unique(activations.map(a=>a.ruleId));
  const sources=unique(activations.map(a=>a.sourceId)).map(id=>{
   const source=sourceForRule(id);
   return {id,work:source.work,chapter:source.chapter,stanza:source.stanza,
    edition:source.edition,review:source.review,
    application:activations.some(a=>a.sourceId===id&&a.application==='direct_natal')?
     'direct_natal':'modern_extension_or_dasha'};
  });
  return {
   division:base.division,title:base.title,
   headline:narration.headline,strength:narration.strength,challenge:narration.challenge,
   context:narration.context,step:narration.step,highlight:narration.highlight,
   proof,ruleIds,sources,timeSensitivity:base.timeSensitivity
  };
 });
 const select=(d:number)=>insights.find(x=>x.division===d)!;
 const activated=(d:number,kind:'resource'|'friction')=>{
  const rules=extractN44Evidence(chart,d,asOf);
  return rules.filter(r=>r.role===kind).length*3+rules.filter(r=>r.role==='context').length;
 };
 // Choose actual chart-specific leading themes; the work area remains explicit.
 const primary=([27,24,2,9,3,4,12,7,16,20,40,45,1,30] as number[])
  .sort((a,b)=>activated(b,'resource')-activated(a,'resource'))[0];
 const secondary=([30,27,9,2,4,24,7,3,12,20,45,1,16,40] as number[])
  .filter(d=>d!==primary&&d!==10)
  .sort((a,b)=>activated(b,'friction')-activated(a,'friction'))[0];
 const polarity={
  resource:extractN44Evidence(chart,primary,asOf).some(x=>x.role==='resource'),
  friction:extractN44Evidence(chart,secondary,asOf).some(x=>x.role==='friction')
 };
 const synthesis=buildSourceSynthesis(chart,lang,insights,primary,secondary,polarity);
 const integrated=buildUnifiedN49(chart,lang,asOf,primary,secondary);
 if(!integrated||integrated.links.length!==15||integrated.threads.length!==5)return unavailable;
 /* The three lead cards use verified facts, not generic reflective questions. */
 const highlights=synthesis.highlights as ClassicalReaderReport['highlights'];
 return {
  version:READER_V8_VERSION,editorialVersion:N45_EDITORIAL_VERSION,
  ruleSetVersion:N44_CLASSICAL_RULESET_VERSION,
  status:'available',
  introduction:uk?
   'Цей огляд читає основну карту разом із картою стосунків, професії, витривалості та викликів. Спочатку — ваші найвиразніші можливості й суперечності; далі — п’ятнадцять докладних життєвих тем.':
   'This overview reads the main chart together with the relationship, vocational, resilience and challenge lenses. First comes your central pattern and its trade-offs; then the fifteen life themes.',
  method:uk?
   'Джерела: Brihat Jataka (переклад 1905) і Laghu Parashari (1900). OCR-уривки прочитані, але не всі звірені зі сканами; дослівні прогнози не переносяться. Вищі карти залежать від точності часу народження.':
   'Sources: Brihat Jataka (1905 translation) and Laghu Parashari (1900). OCR excerpts were reviewed but not all scan-verified; literal predictions are not imported. Higher divisions depend on accurate birth time.',
  synthesis,integrated,d60Preview:buildD60Preview(chart,lang),
  highlights,insights,d60Notice:basic.d60Notice
 };
}
/** Short evidence-bound context for the cloud writer. No DOB, coordinates or cities. */
export function compactClassicalReaderV8ForAi(chart:CalculatedChart,asOf:string):string{
 const r=buildClassicalReaderV8(chart,'en',asOf);
 if(r.status!=='available')return 'Classical Reader 8: source-bound synthesis unavailable. Use D1/D9/D10 only.';
 const selected=[10,27,30,9,24,2];
 return ['Classical Reader 8 evidence: historical book metadata are OCR-reviewed, not independently scan-certified.',
  'Full synthesis: '+r.synthesis?.opening+' Opportunity: '+r.synthesis?.strength+
   ' Challenge: '+r.synthesis?.challenge+' Direction: '+r.synthesis?.direction,
  compactD60PreviewForAi(chart), // place BEFORE long thematic facts so it cannot be truncated
  ...(r.integrated?[
   'N4.9 linked evidence (conditional modern Dn synthesis, NOT literal classic verse or Shadbala):',
   ...r.integrated.threads.map(t=>t.title+': '+t.text+' Calculated proofs: '+t.evidence.join(', '))
  ]:[]),
  ...selected.map(d=>{
   const i=r.insights.find(x=>x.division===d)!;
   return 'D'+d+' '+i.title+'; '+i.headline+' Resource: '+i.strength+
    ' Concern: '+i.challenge+' Context: '+i.context+
    ' Rules: '+(i.ruleIds.join(',')||'no additional directly verified rule');
  }),
  'Distinguish the literal natal rules from modern Dn generalization. Never invent planetary houses or repeat fatalistic old predictions.',
  'Do not treat provisional D60 as certainty or claim personal houses, lagna, karma or events as proven.'
 ].join('\n').slice(0,6500);
}
