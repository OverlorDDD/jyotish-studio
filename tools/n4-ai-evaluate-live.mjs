/** Strict, read-only QC of 48 genuine provider response records (NOT mock strings).
 * No response prose or personal birth data printed in logs. Human editorial review
 * is still mandatory even if every mechanical check is green.
 */
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {n4SyntheticAuditChart,n4AuditSampleId,N4_LIVE_AUDIT_CORPUS_VERSION} from './n4-ai-synthetic-profiles.mjs';
import {N4_EDITORIAL_VARIANT_VERSION,auditN4PairedModelIdentity} from './n4-ai-editorial-variants.mjs';
import {selectN4NarrativeThemes,reviewN4Narrative} from '../apps/api/src/n4-interpretation-brief.ts';
import {auditN4ExplicitClaims} from '../apps/api/src/n4-ai-claims.ts';
import {reviewGeneratedConsultation} from '../apps/api/src/consultation-prose-review.ts';
import {acceptDirectJyotishText} from '../apps/api/src/direct-jyotish.ts';
const f=process.argv[2];if(!f)throw Error('Usage: node --experimental-strip-types tools/n4-ai-evaluate-live.mjs /absolute/path/to/provider-responses.jsonl');
const rows=readFileSync(resolve(f),'utf8').split('\n').filter(Boolean).map(s=>JSON.parse(s));
const issues=[],same=new Map(),seen=new Set();
for(const row of rows){
 if(row.corpus!==N4_LIVE_AUDIT_CORPUS_VERSION||row.editorialVersion!==N4_EDITORIAL_VARIANT_VERSION||typeof row.id!=='string')throw Error('Untrusted corpus version/id');
 if(seen.has(row.id))throw Error('Duplicate real-provider record '+row.id);
 seen.add(row.id);
 const index=Array.from({length:48},(_,i)=>n4AuditSampleId(i)).find(t=>t.id===row.id);
 if(!index||row.seed!==index.seed||row.lang!==index.lang||row.variant!==index.variant)throw Error('Not a recognized synthetic case '+row.id);
 if(!['gemini','groq','openrouter'].includes(row.provider)||typeof row.model!=='string'||typeof row.text!=='string'){
  issues.push({id:row.id,reasons:['missing_real_provider_response']});continue;
 }
 const chart=n4SyntheticAuditChart(row.seed);
 const editorial=reviewN4Narrative(row.text,selectN4NarrativeThemes(chart));
 const explicit=auditN4ExplicitClaims(row.text,chart);
 const quality=reviewGeneratedConsultation(row.text,chart,row.lang,'2026-11-04');
 const accept=acceptDirectJyotishText(row.text);
 const local=[...editorial.codes,...quality.codes,...explicit.errors.map(()=> 'numeric_placement_mismatch'),
  ...(explicit.correct<2?['fewer_than_two_source_matched_placements']:[]),
  ...(!accept.ok?['incomplete_or_unsupported_prose']:[])];
 const digest=createHash('sha256').update(row.text).digest('hex');
 if(same.has(digest)&&same.get(digest)!==row.id)local.push('verbatim_repeated_response');
 same.set(digest,row.id);
 if(local.length)issues.push({id:row.id,reasons:[...new Set(local)]});
}
issues.push(...auditN4PairedModelIdentity(rows));
const wanted=Array.from({length:48},(_,i)=>n4AuditSampleId(i).id);
const missing=wanted.filter(id=>!seen.has(id));
const summary={status:issues.length||missing.length?'AUTOMATED_LIVE_CORPUS_INCOMPLETE_OR_ISSUES':'AUTOMATED_PRECHECK_PASS_HUMAN_EDITORIAL_REVIEW_REQUIRED',
 expected:48,received:rows.length,missing:missing.length,failed:issues.length,
 issues,manualReviewRequired:true,rawTextInOutput:false};
console.log(JSON.stringify(summary,null,2));
if(issues.length||missing.length)process.exitCode=2;
