/** N4.4 additive, opt-in machine facts for an LLM. Never modifies Reader v6 or digest. */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {calculateAllVargas,VARGA_RULESET_VERSION,VARGA_PROFILE} from '../../../packages/jyotish-core/src/vargas.ts';
export const N4_EVIDENCE_VERSION='n4-varga-facts-v1' as const;
export const N4_AI_INSTRUCTION=`
OPTIONAL N4 VERIFIED VARGA EXTENSION:
- D1, D9 and D10 remain the basis of the existing report; do NOT overwrite its primary synthesis.
- Additional D-charts use traditional Parashari symbolic correspondences, not astronomical degrees.
- Use ONLY explicit body=sign/house statements in the N4 annex. It is optional evidence, not a reason to invent new yogas, dignities, doshas, aspects or dates.
- Interpret 2–3 of the selected N4 EDITORIAL BRIEF lenses, each supported by a named graha in D1 and its D-chart. For each used lens, say WHY the contrast matters, show both a possible strength and a specific friction, then make a practical recommendation grounded in those placements. Name the D number (e.g. D2) so the reader can open its chart.
- Never merely recite placements; turn each verified configuration into a specific life situation with alternative responses, clearly introduced as an example, not as an invented past event.
- Prioritize thoughtful, interesting synthesis over 12 copied mini-horoscopes. Use 2–3 strongest lenses to connect a topic to the reader's existing D1 story; keep D9 and D10 analysis as mandatory, separate domain lenses.
- Include at least one actual D1-versus-varga comparison with house numbers; never claim a sign, house, dispositorship, dignity, aspect, yoga or causal certainty not included in the supplied facts.
- For Ukrainian write warm, idiomatic practitioner prose with tangible imagery and natural syntax, not repetitive generic advice. For English write distinctive conversational interpretation rather than a list of abstract personality adjectives.
- Avoid unearned praise, deterministic verdicts, invented family members, pregnancy/fertility claims, financial promises, medical advice, or fabricated degrees. Do not mention D60 at all because it is excluded until time-accuracy validation.
- Never claim D60 and never infer birth-time accuracy from an unverified input.
- Do not present a promise of marriage, children, illness or financial results. Do not add unsupported technical placements.
- If the supplementary evidence is absent, work entirely from the original D1/D9/D10 facts.`;
const EXTENDED:[number,string][]=[
 [2,'resources'],[3,'initiative'],[4,'home'],[7,'children-and-creativity'],[12,'parents-and-family'],
 [16,'comfort'],[20,'spiritual-practice'],[24,'education'],[27,'resilience'],
 [30,'obstacles'],[40,'maternal-line'],[45,'paternal-line']
];
/** Does not accept user prompts, birth date/time/location or any raw identifying metadata. */
export function compactN4VargaFacts(chart:CalculatedChart):string{
 const p=chart.d1.map(g=>({name:g.name,longitude:g.longitude,speed:g.retrograde?-1:1}));
 const charts=calculateAllVargas(chart.ascendant.longitude,p);
 const lines=[
  'N4 facts version='+N4_EVIDENCE_VERSION+'; rules='+VARGA_RULESET_VERSION,
  'Traditional profile='+VARGA_PROFILE,
  'Each line is a derived VARGA SIGN and house relative to that varga ascendant (both 1-based), NOT physical sky longitude.',
  'D60 is omitted because the exact birth-time sensitivity was not independently tested.'
 ];
 for(const [d,theme] of EXTENDED){
  const c=charts.find(v=>v.division===d);
  if(!c)throw new Error('N4 missing D'+d);
  const chosen=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn']
   .map(name=>c.planets.find(p=>p.name===name))
   .filter((v):v is NonNullable<typeof v>=>Boolean(v));
  lines.push('D'+d+' '+theme+' lagna='+c.lagna.vargaSign+
   '; '+chosen.map(p=>p.name+' sign='+p.vargaSign+' house='+p.house).join('; '));
 }
 return lines.join('\n');
}
export function n4AiEligible(env:Record<string,string|undefined>=process.env):boolean{
 return env.N4_VARGA_AI_ENABLED==='1'&&
   env.N4_VARGA_INDEPENDENT_REFERENCE_APPROVED==='1';
}
