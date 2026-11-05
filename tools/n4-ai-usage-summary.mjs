/** Read-only local N4 synthetic provider-token aggregation, never production DB. */
import {existsSync,readFileSync} from 'node:fs';
import {n4SafeLocalOutput} from './n4-ai-capture-path.mjs';
const read=file=>existsSync(file)?readFileSync(file,'utf8').split('\n').filter(Boolean).map(JSON.parse):[];
export function summarizeN4LocalUsage(accepted,failed){
 if(!Array.isArray(accepted)||!Array.isArray(failed))throw Error('Expected local audit rows');
 const rows=[...accepted,...failed];
 const withUsage=rows.filter(r=>r.tokenUsage&&Number.isSafeInteger(r.tokenUsage.totalTokens)&&r.tokenUsage.totalTokens>=0);
 const sum=key=>withUsage.reduce((n,r)=>n+(Number.isSafeInteger(r.tokenUsage[key])?r.tokenUsage[key]:0),0);
 const byProvider={};
 for(const r of withUsage){
  const name=['gemini','groq','openrouter'].includes(r.provider)?r.provider:'unidentified';
  const row=byProvider[name]??={recordsWithTokenUsage:0,promptTokensReported:0,completionTokensReported:0,totalTokensReported:0,cachedTokensReported:0};
  row.recordsWithTokenUsage++;
  for(const [target,key] of [['promptTokensReported','promptTokens'],['completionTokensReported','completionTokens'],['totalTokensReported','totalTokens'],['cachedTokensReported','cachedTokens']])
   row[target]+=Number.isSafeInteger(r.tokenUsage[key])?r.tokenUsage[key]:0;
 }
 return {scope:'LOCAL_SYNTHETIC_LAB_NOT_PRODUCTION_ADMIN',status:'ONLY_PROVIDER_REPORTED_VALUES',
  acceptedReadings:accepted.length,rejectedRecords:failed.length,
  recordsWithTokenUsage:withUsage.length,recordsWithoutTokenUsage:rows.length-withUsage.length,
  promptTokensReported:sum('promptTokens'),completionTokensReported:sum('completionTokens'),
  totalTokensReported:sum('totalTokens'),cachedTokensReported:sum('cachedTokens'),
  byProvider,note:'Legacy failures may include multiple HTTP attempts; do not interpret JSONL record count as exact provider calls. Unknown usage is NOT zero.'};
}
if(process.argv[2]){
 const file=n4SafeLocalOutput(process.argv[2]);
 console.log(JSON.stringify(summarizeN4LocalUsage(read(file),read(file+'.failures.jsonl')),null,2));
}
