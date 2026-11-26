/**
 * Oracle-only, privacy-safe OpenRouter diagnostic.
 *
 * Default: GET /api/v1/key and public GET /api/v1/models (NO generation).
 * Opt-in --probe: exactly one <=32-output-token request to a verified :free
 * chat model with synthetic text; reads only HTTP status/limit_source.
 * No credential, label, provider body, customer chart or model prose is logged.
 */
import {resolve} from 'node:path';
import {existsSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {openRouterLimitSource,openRouterLimitClass} from '../apps/api/src/openrouter-rate-limit.ts';

const endpoint='https://openrouter.ai/api/v1';
export const isFreeModel=(model)=>/^[a-z0-9_.-]+\/[a-z0-9_.:-]+:free$/i.test(model);
export const safeModelCandidates=(models)=>{
 if(!Array.isArray(models))return [];
 return models.filter(x=>typeof x?.id==='string'&&isFreeModel(x.id)&&
  Number(x?.pricing?.prompt)===0&&Number(x?.pricing?.completion)===0&&
  Number(x?.context_length)>=16000&&
  Array.isArray(x?.architecture?.output_modalities)&&x.architecture.output_modalities.includes('text'))
  .map(x=>({model:x.id,contextTokens:x.context_length}))
  .sort((a,b)=>b.contextTokens-a.contextTokens||a.model.localeCompare(b.model)).slice(0,20);
};
async function getJson(url,key){
 const res=await fetch(url,{headers:key?{'Authorization':'Bearer '+key}:undefined,signal:AbortSignal.timeout(12000)});
 if(!res.ok)return {http:res.status,data:null};
 return {http:res.status,data:await res.json()};
}
export async function runOpenRouterDoctor(args=process.argv.slice(2),env=process.env){
 const key=env.OPENROUTER_API_KEY?.trim();
 if(!key){console.log('OPENROUTER_KEY=MISSING');process.exitCode=2;return;}
 const probe=args.includes('--probe');
 const selected=args.find(x=>x.startsWith('--model='))?.slice(8)||
  (isFreeModel(env.OPENROUTER_FREE_MODEL||'')?env.OPENROUTER_FREE_MODEL:'google/gemma-4-26b-a4b-it:free');
 if(!isFreeModel(selected)){console.log('STOP: MODEL_MUST_BE_EXPLICIT_FREE_SLUG');process.exitCode=2;return;}
 const account=await getJson(endpoint+'/key',key);
 const info=account.data?.data||{};
 console.log('OPENROUTER_ACCOUNT='+JSON.stringify({
  http:account.http,
  isFreeTier:typeof info.is_free_tier==='boolean'?info.is_free_tier:null,
  hasSpendLimit:typeof info.limit==='number',
  limitRemainingUsd:typeof info.limit_remaining==='number'?info.limit_remaining:null,
  note:'Usage fields are USD, not remaining daily free request counts.'
 }));
 const publicModels=await getJson(endpoint+'/models');
 const candidates=safeModelCandidates(publicModels.data?.data||[]);
 console.log('OPENROUTER_FREE_CHAT_CANDIDATES='+JSON.stringify({
  http:publicModels.http,models:candidates.filter(x=>!x.model.includes('gemma')).slice(0,8)
 }));
 if(!probe){
  console.log('PASS: OPENROUTER_READ_ONLY_DIAGNOSTIC_NO_INFERENCE');
  console.log('TO_CLASSIFY_PREVIOUS_429_RUN_WITH_--probe_ONLY_IF_YOU_ACCEPT_ONE_FREE_REQUEST');
  return;
 }
 console.log('OPENROUTER_PROBE_MODEL='+selected);
 const response=await fetch(endpoint+'/chat/completions',{
  method:'POST',signal:AbortSignal.timeout(20000),
  headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json'},
  body:JSON.stringify({model:selected,max_tokens:32,temperature:0,
   messages:[{role:'user',content:'Reply with the single word OK.'}]})
 });
 let source='unknown';
 if(!response.ok){
  try{source=openRouterLimitSource(await response.json());}catch{/*no response content logged*/}
 }else{
  // Never print the generated completion or provider response content.
  await response.body?.cancel();
 }
 console.log('OPENROUTER_ONE_REQUEST_RESULT='+JSON.stringify({
  http:response.status,
  limitSource:source,
  limitClass:openRouterLimitClass(source),
  retryAfterSeconds:Number(response.headers.get('retry-after'))||null,
  note:'HTTP 200 on one tiny probe does NOT prove full Natal consultation quality.'
 }));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 if(existsSync('.env')){try{process.loadEnvFile('.env');}catch{}}
 runOpenRouterDoctor().catch(e=>{
  console.error('OPENROUTER_DIAGNOSTIC_FAILED='+e?.constructor?.name);
  process.exitCode=2;
 });
}
