/**
 * Explicit, synthetic-only live provider editorial sampling, NEVER part of CI.
 * Use free-tier-confirmed, opt-in provider credentials; 2 requests maximum/run.
 * Writes original model prose to an access-restricted LOCAL output file for
 * human review, not to GitHub logs, a database or a production service.
 */
import {existsSync,appendFileSync,readFileSync,realpathSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {generateDirectJyotish} from '../apps/api/src/direct-jyotish.ts';
import {n4SyntheticAuditChart,n4AuditSampleId,N4_LIVE_AUDIT_CORPUS_VERSION} from './n4-ai-synthetic-profiles.mjs';
if(process.env.N4_LIVE_EDITORIAL_EXPLICIT_OPT_IN!=='YES_SYNTHETIC_ONLY')
 throw Error('Live AI corpus: explicit synthetic-only opt-in required');
const provider=process.env.N4_LIVE_EDITORIAL_PROVIDER||'';
if(!['gemini','groq','openrouter'].includes(provider))throw Error('Choose a supported provider');
const keys={gemini:process.env.GEMINI_API_KEY,groq:process.env.GROQ_API_KEY,openrouter:process.env.OPENROUTER_API_KEY};
const confirmed={gemini:process.env.GEMINI_FREE_TIER_CONFIRMED==='1',groq:process.env.GROQ_FREE_TIER_CONFIRMED==='1',
 openrouter:(process.env.OPENROUTER_FREE_MODEL||'openrouter/free').includes('free')};
if(!keys[provider]?.trim()||!confirmed[provider])
 throw Error('Refusing call without configured key AND independently confirmed free-tier model');
const file=process.env.N4_LIVE_EDITORIAL_OUTPUT;
if(!file?.startsWith('/'))throw Error('Require explicit absolute non-repository LOCAL output path');
const dest=resolve(file),cwd=resolve(process.cwd());
if(dest.startsWith(cwd+sep)||dest===cwd)throw Error('Refusing to store model responses under Git repository');
const from=Number(process.env.N4_LIVE_EDITORIAL_START||0),size=Number(process.env.N4_LIVE_EDITORIAL_BATCH_SIZE||2);
if(!Number.isInteger(from)||from<0||from>=48||!Number.isInteger(size)||size<1||size>2||from+size>48)
 throw Error('Batch index/count must stay inside 0..47 and <=2 calls');
const previous=existsSync(dest)?readFileSync(dest,'utf8').split('\n').filter(Boolean).map(x=>JSON.parse(x)):[];
const used=new Set(previous.map(x=>x.id));
if(previous.some(x=>x.corpus!==N4_LIVE_AUDIT_CORPUS_VERSION))
 throw Error('Mixed corpus versions in output — refuse');
process.env.N4_VARGA_AI_ENABLED='1';
process.env.N4_VARGA_INDEPENDENT_REFERENCE_APPROVED='1'; // ISOLATED TEST-ONLY; no server, no production flags.
let completed=0;
for(let i=from;i<from+size;i++){
 const sample=n4AuditSampleId(i);
 if(used.has(sample.id))throw Error('Existing sample, choose an unrecorded index');
 const chart=n4SyntheticAuditChart(sample.seed),diagnostics=[];
 const outcome=await generateDirectJyotish(chart,sample.lang,'2026-11-04',{
  order:[provider],keys:{[provider]:keys[provider]},freeConfirmed:{[provider]:true},
  onDiagnostic:d=>diagnostics.push({stage:d.stage,reason:d.reason,httpStatus:d.httpStatus})
 });
 const entry={corpus:N4_LIVE_AUDIT_CORPUS_VERSION,id:sample.id,seed:sample.seed,
  lang:sample.lang,variant:sample.variant,provider,model:outcome.result?.model||null,
  generatedAt:new Date().toISOString(),
  text:outcome.result?.text||null,
  failureReason:outcome.reason||null,diagnostics};
 appendFileSync(dest,JSON.stringify(entry)+'\n',{mode:0o600});
 console.log('N4_SYNTHETIC_LIVE_QA_CAPTURED '+sample.id+' status='+(outcome.result?'ACCEPTED':'REJECTED'));
 completed++;
}
console.log('N4_LIVE_QA_PROVENANCE_SAVED_LOCALLY only_synthetic=true captured='+completed);
