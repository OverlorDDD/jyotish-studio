/**
 * N4.9 chart-specific narrative plan. Deterministic facts, NOT generated astrology
 * predictions. The AI can interpret these only when the certified feature gate is on.
 * Not a reader-v6 implementation and not user identifying data.
 */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {calculateAllVargas,VARGA_RULESET_VERSION} from '../../../packages/jyotish-core/src/vargas.ts';
export const N4_NARRATIVE_VERSION='n4-editorial-brief-v1' as const;
type Theme=Readonly<{d:2|3|4|7|12|16|20|24|27|30|40|45;topic:string;h:number;anchor:string;question:string;scene:string;limit:string}>;
const THEMES:readonly Theme[]=[
 {d:2,topic:'resources and earning habits',h:2,anchor:'Mercury',question:'How are resources earned, organized and spent?',scene:'A real choice between saving for training and spending on a short-term convenience',limit:'Do not promise profit, wealth or investment returns.'},
 {d:3,topic:'initiative and communication',h:3,anchor:'Mars',question:'How can initiative become effective collaboration?',scene:'A difficult negotiation about responsibility for a new project',limit:'Do not assert a specific sibling or personal conflict.'},
 {d:4,topic:'home and belonging',h:4,anchor:'Moon',question:'What creates reliable emotional and domestic foundations?',scene:'A decision whether to move or improve an existing living space',limit:'Do not predict property purchase or separation.'},
 {d:7,topic:'creativity, mentorship and caring roles',h:5,anchor:'Jupiter',question:'How is creative responsibility expressed and sustained?',scene:'A sustained mentoring or creative project rather than a single moment of inspiration',limit:'Do not infer pregnancy, fertility, child count or sex.'},
 {d:12,topic:'family stories and inherited roles',h:4,anchor:'Sun',question:'Which family expectations deserve a conscious response?',scene:'A conversation about obligations and healthy boundaries',limit:'Do not invent parental history or diagnoses.'},
 {d:16,topic:'comfort, vehicles and lifestyle',h:4,anchor:'Venus',question:'How can comfort support rather than distract from stability?',scene:'Evaluating whether a costly upgrade improves daily life',limit:'Do not promise vehicles or material acquisitions.'},
 {d:20,topic:'spiritual practice and discipline',h:9,anchor:'Jupiter',question:'What makes an inner practice sustainable?',scene:'Choosing between an intensive retreat and small repeated daily practice',limit:'Do not imply supernatural proof or guaranteed spiritual attainment.'},
 {d:24,topic:'education and mastery',h:5,anchor:'Mercury',question:'How does learning turn into repeatable skill?',scene:'Learning with a mentor versus unguided study before a demanding exam or job change',limit:'Do not invent degrees, grades or a career history.'},
 {d:27,topic:'endurance and response to pressure',h:6,anchor:'Mars',question:'Which patterns help withstand difficulty without burning out?',scene:'Handling competing deadlines while protecting recovery time',limit:'Do not diagnose illness, trauma or strength scores.'},
 {d:30,topic:'obstacles and self-correction',h:6,anchor:'Saturn',question:'Where can practical safeguards prevent a repeated mistake?',scene:'Building a review checklist before a high-stakes commitment',limit:'Do not predict disasters, illness or death.'},
 {d:40,topic:'maternal-line traditions',h:4,anchor:'Moon',question:'Which inherited habits may be worth examining?',scene:'Separating a useful family routine from an unhelpful expectation',limit:'Do not state facts about actual maternal relatives.'},
 {d:45,topic:'paternal-line traditions',h:9,anchor:'Sun',question:'Which beliefs about duty and status are useful now?',scene:'Choosing a personal standard of success instead of inherited comparison',limit:'Do not state facts about actual paternal relatives.'}
];
const SIGN_LORDS=['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'] as const;
const mod=(n:number,m:number)=>((n%m)+m)%m;
export type N4NarrativeTheme=Readonly<{
 division:Theme['d'];topic:string;house:number;
 d1HouseLord:string;d1LordHouse:number;d1AnchorHouse:number;
 anchor:string;d1AnchorSign:number;vargaAnchorSign:number;vargaAnchorHouse:number;
 question:string;scene:string;limit:string;
}>;
/** Only sidereal D1 numeric coordinates enter; no birth input, UTC or owner identity. */
export function selectN4NarrativeThemes(chart:CalculatedChart):readonly N4NarrativeTheme[]{
 const asc=Math.floor(mod(chart.ascendant.longitude,360)/30);
 const planets=chart.d1;
 const all=calculateAllVargas(chart.ascendant.longitude,planets.map(p=>({
  name:p.name,longitude:p.longitude,speed:p.retrograde?-1:1
 })));
 const score=(t:Theme)=>{
  const inHouse=planets.filter(p=>mod(Math.floor(mod(p.longitude,360)/30)-asc,12)+1===t.h).length;
  const owner=SIGN_LORDS[mod(asc+t.h-1,12)];
  const anchor=planets.find(p=>p.name===t.anchor);
  return inHouse*3+(anchor&&mod(Math.floor(mod(anchor.longitude,360)/30)-asc,12)+1===t.h?2:0)+
   (planets.some(p=>p.name===owner&&mod(Math.floor(mod(p.longitude,360)/30)-asc,12)+1===t.h)?1:0);
 };
 return Object.freeze([...THEMES].sort((a,b)=>score(b)-score(a)||a.d-b.d).slice(0,3).map(t=>{
  const ruler=SIGN_LORDS[mod(asc+t.h-1,12)];
  const owner=planets.find(p=>p.name===ruler);
  const anchor=planets.find(p=>p.name===t.anchor);
  const varga=all.find(c=>c.division===t.d);
  const placement=varga?.planets.find(p=>p.name===t.anchor);
  if(!owner||!anchor||!placement)throw new Error('N4 incomplete validated planetary facts');
  return Object.freeze({
   division:t.d,topic:t.topic,house:t.h,d1HouseLord:ruler,
   d1LordHouse:mod(Math.floor(mod(owner.longitude,360)/30)-asc,12)+1,
   d1AnchorHouse:mod(Math.floor(mod(anchor.longitude,360)/30)-asc,12)+1,
   anchor:t.anchor,d1AnchorSign:Math.floor(mod(anchor.longitude,360)/30)+1,
   vargaAnchorSign:placement.vargaSign,vargaAnchorHouse:placement.house,
   question:t.question,scene:t.scene,limit:t.limit
  });
 }));
}
export function compactN4NarrativeBrief(chart:CalculatedChart):string{
 const selected=selectN4NarrativeThemes(chart);
 return [
  'N4 EDITORIAL BRIEF '+N4_NARRATIVE_VERSION+' rules='+VARGA_RULESET_VERSION,
  'All house/sign numbers are 1-based. D1 provides real natal context; each D-chart is a derived symbolic lens, not a new physical longitude.',
  'Choose at least TWO of these THREE chart-specific lenses. Explain a comparison, an opportunity AND a possible trade-off only where supported. Use a scene as an illustrative choice, never as a claim about the reader\'s actual history.',
  ...selected.map((t,i)=>[
   'LENS '+(i+1)+': D'+t.division+' '+t.topic,
   'D1 H'+t.house+' ruler '+t.d1HouseLord+' is in D1 H'+t.d1LordHouse,
   t.anchor+' D1 sign='+t.d1AnchorSign+' house='+t.d1AnchorHouse+
    '; D'+t.division+' sign='+t.vargaAnchorSign+' house='+t.vargaAnchorHouse,
   'Editorial question: '+t.question,
   'Concrete hypothetical scene: '+t.scene,
   'Interpretive boundary: '+t.limit
  ].join('; ')),
  'Never predict a wedding, pregnancy, diagnosis, profits or life events from a D-chart. Never present D60 or uncomputed strengths. Avoid boilerplate. Explain any contrast with D1 rather than listing tables.'
 ].join('\n');
}
export type N4EditorialReview=Readonly<{codes:readonly string[];mentioned:readonly number[]}>;
/** One-pass machine-checkable minimum; cannot itself certify semantic quality. */
export function reviewN4Narrative(text:string,themes:readonly N4NarrativeTheme[]):N4EditorialReview{
 const mentioned=themes.filter(t=>new RegExp('(?:^|[^0-9])D\\s*'+t.division+'(?![0-9])','iu').test(text)).map(t=>t.division);
 const codes:string[]=[];
 if(mentioned.length<2)codes.push('n4_missing_two_evidenced_lenses');
 if(/(?:^|[^0-9])D\s*60(?![0-9])|шашт[іи]амш/iu.test(text))codes.push('n4_unsupported_d60_narrative');
 return {codes:Object.freeze(codes),mentioned:Object.freeze(mentioned)};
}
