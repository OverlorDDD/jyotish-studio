/**
 * N4 TokenLean v1: deterministic relevance/rule selection, one model call.
 * Public production MUST remain separately gated by original JHora certification.
 * No birth inputs, chart IDs, name, city, longitude or API key enter this prompt.
 */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {selectN4NarrativeThemes} from './n4-interpretation-brief.ts';
import {classicalLordshipTable} from './reader-classical.ts';

export const N4_TOKEN_LEAN_VERSION='n4-tokenlean-one-shot-v1' as const;
const P=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'] as const;
const staticRules=[
 'You are a skilled Parashari Jyotish INTERPRETER, never an ephemeris or rules calculator.',
 'Use ONLY the given precomputed placements and named rule lenses. D1 is primary; D9 is a separate relationship lens; D10 is a separate career lens; Dn is a symbolic supplementary chart.',
 'Numeric s=1..12 zodiac sign, h=1..12 whole-sign house. Never equate Dn houses with D1 houses. Do not infer facts missing from the packet.',
 'Write a coherent, distinctly chart-specific 320-450 word consultation with short Markdown headings, not a data dump.',
 'Integrate BOTH short exact PROOF labels from the evidence packet once each in natural prose, preserving D number, planet and house=N. Explain what they mean; do not invent other placements.',
 'Incorporate one explicitly grounded D9 placement and one D10 placement, explaining their relationship with D1. Use BOTH selected Dn rule lenses with literal D-number, named planet and correct numeric house.',
 'For each selected lens: evidence -> possible constructive use and tension -> a realistic CONDITIONAL scene -> one achievable next step. Contrast evidence rather than claiming personal biography.',
 'No guaranteed events, invented degrees/yogas/aspects, D60, medical diagnoses, fertility statements or investment directives. Do not claim a missing fact is adverse.',
 'Natural Ukrainian if lang=uk (Місяць is masculine); natural English if lang=en. End a full sentence. Return Markdown text only, no self-assessment or citations.'
].join('\n');

export function buildN4TokenLeanPrompt(chart:CalculatedChart,lang:'uk'|'en',asOf:string){
 if(!chart||!Array.isArray(chart.d1)||chart.d1.length!==9||!['uk','en'].includes(lang))
  throw Error('N4 TokenLean requires an intact synthetic or trusted calculated chart and locale');
 const d1=chart.d1;
 if(P.some(n=>!d1.some(p=>p.name===n)))throw Error('N4 TokenLean D1 missing graha');
 const lords=classicalLordshipTable(chart.ascendant.sign);
 const themes=selectN4NarrativeThemes(chart).slice(0,2);
 if(themes.length!==2||themes[0].division===themes[1].division)throw Error('N4 TokenLean needs two independent divisional lenses');
 const pos=(xs:typeof d1,name:string)=>{
  const p=xs.find(p=>p.name===name);
  if(!p)throw Error('N4 TokenLean missing '+name);
  return name+' s'+p.sign+' h'+p.house;
 };
 const active=chart.dasha.find(p=>p.start.slice(0,10)<=asOf&&asOf<p.end.slice(0,10));
 const minor=active?.antardashas?.find(p=>p.start.slice(0,10)<=asOf&&asOf<p.end.slice(0,10));
 const proofs=themes.map(t=>'D'+t.division+' '+t.anchor+' house='+t.vargaAnchorHouse);
 const lines=[
  'lang='+lang+'; asof='+asOf+'; sidereal=Lahiri; houses=whole-sign; s=sign h=house, both 1-based.',
  'D1 lagna s'+chart.ascendant.sign+'; rulers H1='+lords[1]+' H7='+lords[7]+' H10='+lords[10]+'.',
  'D1 '+P.map(name=>pos(d1,name)).join('; ')+'.',
  'D9 lagna s'+chart.lagnaD9.sign+'; '+['Venus','Jupiter'].map(n=>pos(chart.d9,n)).join('; ')+'.',
  'D10 lagna s'+chart.lagnaD10.sign+'; '+['Sun','Saturn'].map(n=>pos(chart.d10,n)).join('; ')+'.',
  'Time '+(active?'mahadasha='+active.lord+(minor?' antardasha='+minor.lord:''):'no verified active period')+'.',
  'REQUIRED PROOFS: '+proofs.join(' | ')+'.',
  'Selected rule evidence (ONLY these two supplementary lenses are authorized):',
  ...themes.map(t=>
   'R-D'+t.division+' topic='+t.topic+'; D1 H'+t.house+' lord='+t.d1HouseLord+' in h'+t.d1LordHouse+
   '; D1 '+t.anchor+' s'+t.d1AnchorSign+' h'+t.d1AnchorHouse+
   '; D'+t.division+' '+t.anchor+' s'+t.vargaAnchorSign+' h'+t.vargaAnchorHouse+
   '; scenario='+t.scene+'; boundary='+t.limit+'.'
  )
 ];
 const user=lines.join('\n');
 const totalChars=staticRules.length+user.length;
 if(totalChars>4200)throw Error('N4 TokenLean evidence exceeds strict character preflight; do not send an oversized model request');
 return Object.freeze({version:N4_TOKEN_LEAN_VERSION,system:staticRules,user,
  selectedDivisions:Object.freeze(themes.map(t=>t.division)),
  proofs:Object.freeze(proofs),
  chars:totalChars});
}
