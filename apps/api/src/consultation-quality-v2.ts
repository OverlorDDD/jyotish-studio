import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {buildChartFactGraph} from './consultation-fact-graph.ts';
import {classicalLordshipTable,yogakarakasForLagna} from './reader-classical.ts';
import {CLASSICAL_GRAHAS,dignityFor} from '../../../packages/jyotish-core/src/rules.ts';

/**
 * CQv2: deterministic evidence PRIOR to prompting, not post-hoc invented prose.
 *
 * "Supports" and "challenges" describe possible traditional expressions,
 * not psychological diagnoses or objectively demonstrated life events.
 * No numerical planetary strength/shadbala or neecha-bhanga inferred here.
 * We trust only data built by the core and validated in the fact graph.
 */
export const CONSULTATION_QUALITY_VERSION='cqv2.0';
type Focus='identity'|'relationships'|'career'|'resources'|'inner-life'|'timing';
export type QualityFactor={
 id:string;focus:Focus;weight:number;
 polarity:'potential'|'friction'|'mixed';statement:string;evidence:string[];
 condition?:string;limitations:string[];
};
export type QualityTheme={
 focus:Focus;priority:number;supporting:QualityFactor[];
 challenging:QualityFactor[];mixed:QualityFactor[];
 recommendation:string;
};
export type QualityPlan={version:typeof CONSULTATION_QUALITY_VERSION;themes:QualityTheme[];
 anchorFacts:string[];boundaries:string[]};
const INTEREST:Record<Focus,number[]>={
 identity:[1,5,9],relationships:[7,2,8],career:[10,6,9,11],
 resources:[2,11,6], 'inner-life':[4,12,8],timing:[1,10,7]
};
const suggestions:Record<Focus,string>={
 identity:'Observe where personally chosen purpose differs from outside expectations; name one action that belongs to you.',
 relationships:'Name one recurring expectation in a relationship and ask what a fair agreement would actually require.',
 career:'Pick one measurable piece of work to complete; distinguish genuine craft from the hunger for recognition.',
 resources:'Separate reliable resources from hoped-for gains; review one decision where urgency competes with sustainability.',
 'inner-life':'Protect a repeatable period of quiet or reflection without treating solitude as a failure.',
 timing:'Review the themes of the active major and minor rulers without claiming a dated future event.'
};
const find=(chart:CalculatedChart,n:string)=>{const p=chart.d1.find(x=>x.name===n);if(!p)throw Error('CQv2 missing '+n);return p;};
const focusOf=(h:number):Focus[]=>Object.entries(INTEREST).filter(([name,hs])=>name!=='timing'&&hs.includes(h)).map(([name])=>name as Focus);
const rank=(a:QualityFactor,b:QualityFactor)=>b.weight-a.weight||a.id.localeCompare(b.id,'en');
const unique=(items:QualityFactor[])=>[...new Map(items.map(x=>[x.id,x])).values()].sort(rank);
export function planConsultationQuality(chart:CalculatedChart,asOf:string):QualityPlan{
 const graph=buildChartFactGraph(chart,asOf),ids=new Set(graph.nodes.map(x=>x.id));
 const lords=classicalLordshipTable(chart.ascendant.sign),yogakarakas=yogakarakasForLagna(chart.ascendant.sign);
 const factors:QualityFactor[]=[];
 const add=(factor:QualityFactor)=>{
  if(factor.evidence.some(id=>!ids.has(id)))throw Error('CQv2 unverified evidence '+factor.id);
  factors.push(factor);
 };
 const home=(name:string)=>find(chart,name).house;
 // Lordship is the main chart-specific structural link. Double lordships must remain visible.
 for(const lord of [...new Set(Object.values(lords))]){
  const owned=Array.from({length:12},(_,i)=>i+1).filter(h=>lords[h]===lord),p=find(chart,lord);
  const dignity=dignityFor(lord,p.sign),dusthana=[6,8,12].includes(p.house);
  const isYogakaraka=yogakarakas.includes(lord);
  const core=owned.filter(h=>[1,7,10].includes(h));
  const weighted=4+(core.length?3:0)+(isYogakaraka?2:0)+
    (owned.some(h=>[5,9].includes(h))?1:0);
  for(const focus of new Set([...owned.flatMap(focusOf),...focusOf(p.house),
   ...(owned.includes(1)?['identity'] as Focus[]:[]),
   ...(owned.includes(10)?['career'] as Focus[]:[])])){
   const evid=['D1.'+lord,'D1.house-lord.'+owned[0],...(owned.length>1?['D1.house-lord.'+owned[1]]:[])];
   const statement=lord+' rules D1 house(s) '+owned.join('+')+' and occupies H'+p.house+
     ' sign '+p.sign+'. '+(isYogakaraka?'This lord is the VERIFIED yogakaraka for this lagna. ':'');
   const limits=['One house ruler does not determine a person or guarantee the results of its houses.'];
   if(dignity==='own'||dignity==='exalted'){
    add({id:'lord-support:'+focus+':'+lord,focus,weight:weighted+2,
     polarity:'potential',statement:statement+'Classical sign dignity: '+dignity+'.',
     evidence:evid,limitations:limits});
   }
   if(dignity==='debilitated'||dusthana){
    add({id:'lord-friction:'+focus+':'+lord,focus,weight:weighted+2,
     polarity:'friction',statement:statement+
      (dignity==='debilitated'?'Sign-level debilitation; do NOT infer cancellation or permanent weakness. ':'')+
      (dusthana?'D1 ruler positioned in H'+p.house+' (6/8/12): may demand extra effort or adjustment.':''),
     condition:'Check for supporting factors in the same focus before describing difficulty.',
     evidence:evid,limitations:[...limits,'No Shadbala, combust status, cancellation yoga or automatic bad outcome computed.']});
   }
   if(dignity==='other'&&!dusthana){
    add({id:'lord-neutral:'+focus+':'+lord,focus,weight:weighted,
     polarity:'mixed',statement:statement+'Do not label this placement inherently strong or weak.',
     evidence:evid,limitations:limits});
   }
  }
 }
 // Genuine planetary co-presence only. Same house is not an exact-degree conjunction.
 for(let h=1;h<=12;h++){
  const planets=CLASSICAL_GRAHAS.filter(p=>home(p)===h);
  if(planets.length<2)continue;
  const targetFocus=focusOf(h);
  for(const focus of targetFocus){
   add({id:'cluster:'+focus+':'+h,focus,weight:6+Math.min(planets.length,4),
    polarity:'mixed',statement:planets.join('+')+' share D1 H'+h+' (same sign), not necessarily a close-degree conjunction. Sign dispositor: '+lords[h]+
     ' (located H'+home(lords[h])+'). Name both constructive and demanding possibilities without equating co-presence with an approved named yoga.',
    evidence:[...planets.map(p=>'D1.'+p),...planets.map(p=>'D1.dispositor.'+p)],
    limitations:['Co-presence alone is not proof of a named yoga or precise conjunction.']});
  }
 }
 // Strictly graph-certified Parashari house aspects, never western square/trine.
 const relevant=[1,4,7,9,10];
 const candidateAspects=graph.nodes.filter(n=>n.kind==='aspect'&&relevant.includes(Number(n.value.targetHouse))&&
  typeof n.value.occupants==='string'&&n.value.occupants.length>0).slice(0,15);
 for(const n of candidateAspects){
  const house=Number(n.value.targetHouse);
  for(const focus of focusOf(house)){
   add({id:'aspect:'+focus+':'+n.id,focus,weight:3,
    polarity:'mixed',
    statement:'Verified sign-level Parashari drishti: '+n.subject+' aspects H'+house+
      ' occupied by '+n.value.occupants+'. This is a secondary nuance, not sufficient for a fixed prediction.',
    evidence:[n.id],limitations:['Do not infer exact aspect strength or western aspects.']});
  }
 }
 // D9/D10 should refine, not contradict, the D1 primary reading.
 for(const [focus,scope,lagna,planet] of [
  ['relationships','D9',chart.lagnaD9,'Venus'],['career','D10',chart.lagnaD10,lords[10]]
 ] as const){
  const placements=scope==='D9'?chart.d9:chart.d10,p=placements.find(x=>x.name===planet);
  if(p)add({id:'varga:'+scope,focus,weight:5,polarity:'mixed',
   statement:scope+' supplementary lens: ascendant sign '+lagna.sign+', '+planet+' in H'+p.house+
   '. This is varga placement, not the D1 position; do not treat D9/D10 as guarantees or overrule D1.',
   evidence:[scope+'.ascendant',scope+'.'+planet],
   limitations:['D9 and D10 are interpretive secondary charts and not literal biographical confirmation.']});
 }
 // Time: only use actually calculated dasha/antardasha.
 const major=graph.nodes.find(n=>n.id==='vimshottari.major');
 const minor=graph.nodes.find(n=>n.id==='vimshottari.minor');
 if(major){
  const relevantMajor=major.subject;add({id:'period:major',focus:'timing',weight:11,polarity:'mixed',
   statement:'Active mahadasha '+relevantMajor+' '+major.value.start+' to '+major.value.end+
   '. D1 H'+home(relevantMajor)+'; its owned houses: '+Object.entries(lords).filter(([,lord])=>lord===relevantMajor).map(([h])=>h).join(',')+'.',
   evidence:['vimshottari.major','D1.'+relevantMajor],
   limitations:['No dates of future events can be inferred from dasha alone.']});
  if(minor)add({id:'period:minor',focus:'timing',weight:10,polarity:'mixed',
   statement:'Active antardasha '+minor.subject+' '+minor.value.start+' to '+minor.value.end+
    '. D1 H'+home(minor.subject)+'. Combine major and minor roles; do not make categorical future claims.',
   evidence:['vimshottari.minor','vimshottari.major','D1.'+minor.subject],
   limitations:['The timing indicates a traditional period emphasis, not certainty about outcomes.']});
 }
 const themes=(Object.keys(INTEREST) as Focus[]).map(focus=>{
  const matched=unique(factors.filter(x=>x.focus===focus));
  const support=matched.filter(x=>x.polarity==='potential').slice(0,3);
  const challenge=matched.filter(x=>x.polarity==='friction').slice(0,3);
  const mixed=matched.filter(x=>x.polarity==='mixed').slice(0,4);
  const relevant=matched.slice(0,4);
  return {focus,priority:relevant.reduce((sum,x)=>sum+x.weight,0),
   supporting:support,challenging:challenge,mixed,recommendation:suggestions[focus]};
 }).sort((a,b)=>b.priority-a.priority||a.focus.localeCompare(b.focus,'en'));
 const anchorFacts=[
  'D1 lagna sign '+chart.ascendant.sign+'; ascendant lord '+lords[1]+' in H'+home(lords[1]),
  'D1 tenth lord '+lords[10]+' in H'+home(lords[10])+
   (lords[10]===lords[1]?' — SAME planet rules both first and tenth houses':''),
  'D1 seventh lord '+lords[7]+' in H'+home(lords[7]),
  'Moon D1 H'+home('Moon')+' nakshatra '+find(chart,'Moon').nakshatra,
  ...(major?['ACTIVE mahadasha '+major.subject+' '+major.value.start+' → '+major.value.end]:[]),
  ...(minor?['ACTIVE antardasha '+minor.subject+' '+minor.value.start+' → '+minor.value.end]:[])
 ];
 return {version:CONSULTATION_QUALITY_VERSION,themes,anchorFacts,boundaries:[
  'Traditional Jyotish interpretation, not a documented life history or certainty of future events.',
  'Natural benefic/malefic labels and sign dignity are only parts of an assessment; no Shadbala/combustion/neecha-bhanga confirmed.',
  'Mixed and difficult factors must not be automatically rewritten as flattery or unqualified harm.',
  'D1 primary, D9 and D10 secondary; no western-only planets/aspects or unverified named yoga.'
 ]};
}
/** Keep EVERY theme in the brief, even under a strict budget.
 * Add primary support/friction/mixed evidence before enriching any one theme. */
export function compactQualityBrief(plan:QualityPlan,limit=5100):string{
 const lines=['CONSULTATION_QUALITY '+plan.version,
  ...plan.anchorFacts.map(x=>'ANCHOR: '+x)];
 for(const theme of plan.themes){
  lines.push('THEME '+theme.focus+' priority='+theme.priority);
  for(const [label,items] of [
   ['POTENTIAL',theme.supporting],['CHALLENGE',theme.challenging],['TENSION',theme.mixed]
  ] as const){
   if(items[0]){
    const x=items[0];
    const statement=x.statement.length>150?x.statement.slice(0,147)+'…':x.statement;
    lines.push(label+': '+statement+' [evidence '+x.evidence.slice(0,2).join(',')+']');
   }
  }
  lines.push('PRACTICE: '+theme.recommendation);
 }
 // Safety notes only once, after the main themes so that budget pressure does
 // not erase important chart-specific factors.
 lines.push('BOUNDARIES: sign dignity alone does not prove Shadbala/neecha-bhanga/inevitable outcomes; D1 primary, D9/D10 secondary.');
 const included:string[]=[];
 let used=0;
 for(const line of lines){
  if(used+line.length+1>limit)break;
  included.push(line);used+=line.length+1;
 }
 return included.join('\n');
}
