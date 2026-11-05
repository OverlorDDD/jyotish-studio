/** Compare old and one-shot N4 prompt payload sizes without external API calls. */
import {n4SyntheticAuditChart} from './n4-ai-synthetic-profiles.mjs';
import {buildN4TokenLeanPrompt} from '../apps/api/src/n4-token-lean.ts';
import {DIRECT_JYOTISH_INSTRUCTION,compactJyotishFacts} from '../apps/api/src/direct-jyotish.ts';
import {N4_AI_INSTRUCTION,compactN4VargaFacts} from '../apps/api/src/n4-varga-evidence.ts';
import {compactN4NarrativeBrief} from '../apps/api/src/n4-interpretation-brief.ts';
import {planConsultationQuality,compactQualityBrief} from '../apps/api/src/consultation-quality-v2.ts';

const rows=[];
for(let seed=0;seed<12;seed++)for(const lang of ['uk','en']){
 const chart=n4SyntheticAuditChart(seed),asOf='2026-11-04';
 const oldSystem=DIRECT_JYOTISH_INSTRUCTION+N4_AI_INSTRUCTION;
 const oldUser='Write the requested full consultation in '+(lang==='uk'?'natural Ukrainian':'natural English')+
  '. Here are ONLY verified calculation facts:\n'+
  compactJyotishFacts(chart,asOf)+'\n\n'+compactQualityBrief(planConsultationQuality(chart,asOf))+
  '\n\n'+compactN4VargaFacts(chart)+'\n\n'+compactN4NarrativeBrief(chart);
 const lean=buildN4TokenLeanPrompt(chart,lang,asOf);
 const baselineChars=oldSystem.length+oldUser.length;
 rows.push({seed,lang,baselineChars,oneShotChars:lean.chars,reduction:1-lean.chars/baselineChars});
}
const avg=name=>Math.round(rows.reduce((n,row)=>n+row[name],0)/rows.length);
const summary={status:'STATIC_CHARACTER_BENCHMARK_NOT_PROVIDER_TOKEN_COUNT',samples:rows.length,
 baselineAverageChars:avg('baselineChars'),tokenLeanAverageChars:avg('oneShotChars'),
 characterReductionPercent:Math.round(rows.reduce((n,r)=>n+r.reduction*100,0)/rows.length),
 minReductionPercent:Math.floor(Math.min(...rows.map(r=>r.reduction*100))),
 maxOneShotChars:Math.max(...rows.map(r=>r.oneShotChars)),
 warning:'Provider token usage must be measured from live response; chars != tokens; output length and reasoning also consume TPM.'};
if(rows.some(row=>row.oneShotChars>=row.baselineChars||row.oneShotChars>4200))
 throw Error('TokenLean failed to reduce the static prompt');
console.log(JSON.stringify(summary,null,2));
