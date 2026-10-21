import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {CLASSICAL_RULERS,dignityFor} from '../../../packages/jyotish-core/src/rules.ts';
import {buildChartFactGraph,requireGraphFacts,type ChartFactGraph} from './consultation-fact-graph.ts';
import {buildAiChapterSpecs,CHAPTER_IDS,type AiChapterSpec} from './consultation-ai.ts';
import {generateResilientFreeConsultation} from './resilient-consultation.ts';
import {checkNarrativeLordClaims} from './reader-classical.ts';
import type {FreeAiOptions,FreeAiOutcome} from './free-ai.ts';

/** A8.9 preview only: rules here are arithmetic facts, not unverified OCR interpretations. */
export type SupportedClaim={
 id:string;kind:'placement'|'lordship'|'dispositor'|'dignity'|'aspect'|'yoga'|'period';
 evidence:string[];topic:string;ruleId:string;reviewStatus:'calculation_verified';
};
export type ConsultationPlan={
 fingerprint:string;thesis:string;themes:{id:string;weight:number;claimIds:string[];counterpoints:string[]}[];
 chapterClaims:Record<string,string[]>;
};
export const CONSULTATION_INTELLIGENCE_VERSION='a8.9-preview-1';
const NAMES_UK:Record<string,string>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн'};
function position(graph:ChartFactGraph,scope:string,name:string){
 return requireGraphFacts(graph,[scope+'.'+name])[0];
}
export function buildSupportedClaims(graph:ChartFactGraph):SupportedClaim[]{
 const claims:SupportedClaim[]=graph.nodes.filter(n=>
  ['placement','house-lord','dispositor','aspect','yoga','period'].includes(n.kind)).map(n=>({
  id:n.id,kind:n.kind==='house-lord'?'lordship':n.kind as SupportedClaim['kind'],
  evidence:[n.id,...n.derivedFrom.filter(x=>!x.startsWith('ephemeris:'))],
  topic:n.scope==='vimshottari'?'timing':n.kind==='yoga'?'vocation':n.kind==='house-lord'?'lordship':n.scope,
  ruleId:n.ruleId,reviewStatus:'calculation_verified' as const
 }));
 for(const name of Object.keys(NAMES_UK)){
  const p=position(graph,'D1',name);
  const dignity=dignityFor(name,Number(p.value.sign));
  claims.push({id:'D1.dignity.'+name,kind:'dignity',evidence:[p.id],topic:'D1',ruleId:'SEVEN_GRAHA_SIGN_DIGNITY',
   reviewStatus:'calculation_verified'});
  if(!dignity)throw Error('Missing dignity');
 }
 return claims;
}
export function planConsultation(graph:ChartFactGraph,claims:readonly SupportedClaim[],lang:'uk'|'en'):ConsultationPlan{
 const exists=new Set(claims.map(c=>c.id));
 const lords=Array.from({length:12},(_,i)=>String(requireGraphFacts(graph,['D1.house-lord.'+(i+1)])[0].value.ruler));
 const asc=Number(requireGraphFacts(graph,['D1.ascendant'])[0].value.sign);
 const dominant=Array.from({length:12},(_,i)=>({house:i+1,
  names:Object.keys(NAMES_UK).filter(name=>position(graph,'D1',name).value.house===i+1)}))
   .sort((a,b)=>b.names.length-a.names.length||a.house-b.house)[0];
 const themes=[
  {id:'identity',weight:100,claimIds:['D1.ascendant','D1.'+lords[0],'D1.Moon'],counterpoints:['D1.Sun']},
  {id:'configuration',weight:90+dominant.names.length*3,
   claimIds:[...dominant.names.map(n=>'D1.'+n),...dominant.names.map(n=>'D1.dispositor.'+n)],counterpoints:['D1.'+lords[8]]},
  {id:'vocation',weight:88,claimIds:['D1.house-lord.10','D1.'+lords[9],'D10.'+lords[9]],counterpoints:['D1.house-lord.9']},
  {id:'relationships',weight:85,claimIds:['D1.house-lord.7','D1.'+lords[6],'D9.Venus'],counterpoints:['D1.Moon']},
  {id:'timing',weight:75,claimIds:['vimshottari.major','vimshottari.minor'],counterpoints:['D1.Moon']}
 ].map(t=>({...t,claimIds:[...new Set(t.claimIds)].filter(exists.has.bind(exists)),
  counterpoints:t.counterpoints.filter(exists.has.bind(exists))})).filter(t=>t.claimIds.length>=2||t.id==='timing');
 // Chapter allocation is intentionally global, not separate per-chapter model planning.
 const mapping:Record<string,string[]>={portrait:['identity'],configuration:['configuration'],
  tensions:['configuration','identity'],relationships:['relationships'],career:['vocation'],
  resources:['configuration','vocation'],timing:['timing'],conclusion:['identity','vocation','relationships']};
 const chapterClaims=Object.fromEntries(Object.entries(mapping).map(([id,themeIds])=>
  [id,[...new Set(themeIds.flatMap(t=>themes.find(x=>x.id===t)?.claimIds||[]))]]));
 const thesis=lang==='uk'?
  'Лагна у '+(['Овні','Тельці','Близнюках','Раку','Леві','Діві','Терезах','Скорпіоні','Стрільці','Козорозі','Водолії','Рибах'][asc-1])+
  ': особистий напрям пов’язаний з управителем '+(NAMES_UK[lords[0]]||lords[0])+
  ', а головне скупчення класичних грах зосереджене в '+dominant.house+'-му домі.':
  'The ascendant ruler '+lords[0]+' and the strongest classical graha concentration in house '+dominant.house+
  ' provide two distinct angles on this chart.';
 return {fingerprint:graph.fingerprint,thesis,themes,chapterClaims};
}
/** Conservative verification: parseable explicit factual assertions must agree with chart.
 * No automated tool can fully verify every implicit psychological claim. */
export function verifyUnifiedConsultation(
 chapters:readonly {id:string;paragraphs:readonly string[]}[],graph:ChartFactGraph,lang:'uk'|'en'
):{ok:boolean;errors:string[]}{
 const errors:string[]=[];
 if(chapters.length!==CHAPTER_IDS.length||chapters.some((c,i)=>c.id!==CHAPTER_IDS[i]))
  errors.push('incomplete_document');
 const all=chapters.flatMap(c=>c.paragraphs).join('\n');
 if(all.length<3200||chapters.some(c=>c.paragraphs.length<2))errors.push('insufficient_depth');
 const houseLords=Object.fromEntries(Array.from({length:12},(_,i)=>{
  const n=requireGraphFacts(graph,['D1.house-lord.'+(i+1)])[0];
  return [i+1,String(n.value.ruler)];
 }));
 errors.push(...checkNarrativeLordClaims(all,houseLords).errors);
 if(/(?:гарантован[оіий]|неодмінно|will certainly|guaranteed profit|fatal disease|безплідн)/iu.test(all))errors.push('unfounded_certainty');
 if(lang==='uk'&&/(?:\b(?:который|является|отношения|согласно)\b)/iu.test(all))errors.push('ru_mixed');
 // Only explicit planet-house associations. Other claims remain subject to editorial review.
 const planet='(Сонце|Місяць|Марс|Меркурій|Юпітер|Венера|Сатурн|Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn)';
 const aliases:Record<string,string>={...Object.fromEntries(Object.entries(NAMES_UK).map(([en,uk])=>[uk,en])),
  ...Object.fromEntries(Object.keys(NAMES_UK).map(x=>[x,x]))};
 const re=new RegExp(planet+'\\s+(?:знаходиться|стоїть|перебуває|is|occupies|stands|in)\\s+(?:в|у|in)?\\s*(1[0-2]|[1-9])(?:[ -]?(?:му|м|го|й|th|st|nd|rd))?\\s*(?:домі|дому|будинку|house)','giu');
 for(const m of all.matchAll(re)){
  const n=position(graph,'D1',aliases[m[1]]);
  if(Number(n.value.house)!==Number(m[2]))errors.push('wrong_house:'+aliases[m[1]]);
 }
 return {ok:errors.length===0,errors:[...new Set(errors)]};
}
export async function generateConsultationIntelligence(chart:CalculatedChart,lang:'uk'|'en',asOf:string,
 editorial:{chapters:ReadonlyArray<{id:string;title:string;evidence:ReadonlyArray<string>;paragraphs?:ReadonlyArray<string>}>;findings:Parameters<typeof buildAiChapterSpecs>[0]['findings']},
 options:FreeAiOptions={}):Promise<FreeAiOutcome&{plan:ConsultationPlan}>{
 const graph=buildChartFactGraph(chart,asOf);
 const claims=buildSupportedClaims(graph);
 const plan=planConsultation(graph,claims,lang);
 const specs=buildAiChapterSpecs(editorial).map(spec=>{
  const links=plan.chapterClaims[spec.id]||[];
  const facts=links.slice(0,10).map(id=>{
   const node=graph.nodes.find(n=>n.id===id);
   return node?'Confirmed '+node.id+' '+JSON.stringify(node.value):'';
  }).filter(Boolean);
  const global='One consultation thesis: '+plan.thesis+' Main themes: '+plan.themes.map(t=>t.id).join(', ')+
   '. Your chapter contributes uniquely to this global argument; never restate earlier chapters.';
  return {...spec,facts:[...facts,...spec.facts],focus:global+' '+(spec.focus||'')} as AiChapterSpec;
 });
 const free=await generateResilientFreeConsultation(chart,lang,{...options,chapterSpecs:specs});
 // No patchwork: if one of eight chapters fails, the ENTIRE AI overlay is discarded.
 const chapters=free.result?.chapters||[];
 const check=verifyUnifiedConsultation(chapters,graph,lang);
 if(!free.result||!check.ok)return {result:null,reason:free.reason||'invalid_response',plan};
 return {...free,plan};
}
