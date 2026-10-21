/**
 * One-shot, user-safe OpenRouter account/model doctor.
 * Only prints statuses and public model IDs, never token, user identifier, HTTP body or prompt.
 * --probe submits ONE synthetic 9-word prompt to a free-only model.
 * Importable for deterministic tests (no network needed in CI).
 */
const BASE='https://openrouter.ai/api/v1';
const ROUTER='openrouter/free';
const SAFE_MODEL=/^[a-z0-9_.-]+\/[a-z0-9_.:-]+:free$/i;
const httpMeaning={
  400:'bad_request',
  401:'invalid_or_expired_key',
  402:'payment_or_account_budget_required',
  403:'access_or_guardrail_denied',
  404:'model_or_route_not_found',
  408:'request_timeout',
  429:'rate_limited',
  503:'provider_unavailable'
};
function meaning(status){return httpMeaning[status]||(status>=500?'provider_server_error':'request_rejected')}
function priceZero(value){return (typeof value==='number'||typeof value==='string')&&Number(value)===0}
export function selectedFreeModel(env){
 const raw=(env.OPENROUTER_FREE_MODEL||'').trim();
 return SAFE_MODEL.test(raw)?raw:ROUTER;
}
export async function diagnoseOpenRouter({env=process.env,fetcher=fetch,probe=false,log=console.log}={}){
 const key=(env.OPENROUTER_API_KEY||'').trim(),model=selectedFreeModel(env);
 const emit=line=>log(line);
 emit('A7 OpenRouter doctor');
 emit('AI_MODE='+String(env.AI_MODE||'(not set)'));
 emit('Configured model='+model);
 if(!key){emit('KEY: MISSING (add OPENROUTER_API_KEY to private .env)');return {ok:false,reason:'missing_key'};}
 const headers={'Authorization':'Bearer '+key,'Accept':'application/json'};
 const request=async(url,init={})=>fetcher(url,{...init,headers:{...headers,...(init.headers||{})},signal:AbortSignal.timeout(15000)});
 try{
  const auth=await request(BASE+'/key');
  emit('KEY: HTTP '+auth.status+' '+(auth.ok?'VALID':meaning(auth.status)));
  if(!auth.ok)return {ok:false,reason:'auth_http_'+auth.status};
  let authData;
  try{authData=await auth.json();}catch{emit('KEY: unparseable_metadata');return {ok:false,reason:'invalid_key_metadata'};}
  if(typeof authData?.data?.is_free_tier==='boolean')emit('Free-tier key: '+authData.data.is_free_tier);
  const catalog=await request(BASE+'/models?output_modalities=text');
  emit('CATALOG: HTTP '+catalog.status+' '+(catalog.ok?'OK':meaning(catalog.status)));
  if(!catalog.ok)return {ok:false,reason:'catalog_http_'+catalog.status};
  let data;
  try{data=await catalog.json();}catch{emit('CATALOG: unparseable_json');return {ok:false,reason:'invalid_catalog'};}
  const models=Array.isArray(data?.data)?data.data:[];
  const free=models.filter(x=>typeof x?.id==='string'&&SAFE_MODEL.test(x.id)&&priceZero(x.pricing?.prompt)&&priceZero(x.pricing?.completion)&&!x.architecture?.output_modalities?.length||false);
  // Include normal text-output models; never infer actual endpoint health from catalogue membership.
  const available=models.filter(x=>typeof x?.id==='string'&&SAFE_MODEL.test(x.id)
    &&priceZero(x.pricing?.prompt)&&priceZero(x.pricing?.completion)
    &&(!Array.isArray(x.architecture?.output_modalities)||x.architecture.output_modalities.includes('text')));
  emit('Free text models in catalog='+available.length);
  const displayed=available.slice(0,8).map(x=>x.id);
  if(displayed.length)emit('Sample FREE models: '+displayed.join(' | '));
  const exists=model===ROUTER||available.some(x=>x.id===model);
  emit('SELECTED MODEL: '+(exists?'listed or free router':'NOT IN CURRENT FREE CATALOG'));
  if(!exists){
   emit('ACTION: Remove the OPENROUTER_FREE_MODEL entry or replace it with a listed :free model.');
   return {ok:false,reason:'model_not_listed'};
  }
  if(model!==ROUTER){
   const endpoints=await request(BASE+'/models/'+model+'/endpoints');
   emit('ENDPOINTS: HTTP '+endpoints.status+' '+(endpoints.ok?'OK':meaning(endpoints.status)));
   if(endpoints.ok){
    let list;try{list=await endpoints.json();}catch{list=null}
    const n=list?.data?.endpoints?.length;
    if(typeof n==='number'){
     emit('Active endpoint records='+n);
     if(n===0){emit('ACTION: Selected free model has zero endpoints; choose another free model.');return {ok:false,reason:'no_endpoints'};}
    }
   }else if(endpoints.status===404){
    emit('ACTION: This free model has no matching endpoint; use a different available free model.');
    return {ok:false,reason:'endpoint_404'};
   }
  }
  if(!probe){emit('KEY/MODEL PRECHECK: PASS; actual generation NOT yet tested. Run npm run ai:doctor -- --probe.');return {ok:true,reason:'precheck_only'};}
  emit('PROBE: one synthetic free-model request, no user data');
  const body={model,stream:false,max_tokens:36,temperature:0,messages:[{role:'user',content:'Write only the single word OK.'}]};
  const response=await request(BASE+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  emit('PROBE HTTP '+response.status+' '+(response.ok?'OK':meaning(response.status)));
  if(!response.ok){
   emit(response.status===401?'ACTION: Replace OPENROUTER_API_KEY.':response.status===403?'ACTION: Check key restrictions and privacy/guardrail settings.':response.status===404?'ACTION: Select a currently available free model.':'ACTION: Check key/model availability and try another free provider.');
   return {ok:false,reason:'probe_http_'+response.status};
  }
  let payload;try{payload=await response.json();}catch{emit('PROBE: malformed_provider_json');return {ok:false,reason:'probe_invalid_json'};}
  const message=payload?.choices?.[0]?.message?.content;
  if(typeof message!=='string'||!message.trim()){emit('PROBE: empty_completion');return {ok:false,reason:'probe_empty_completion'};}
  emit('PROBE: PASS (nonempty external completion, no personal information used)');
  return {ok:true,reason:'probe_pass'};
 }catch(e){
  emit('NETWORK: '+(e?.name==='TimeoutError'||e?.name==='AbortError'?'timeout':'unavailable'));
  return {ok:false,reason:'network_error'};
 }
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1].replaceAll('\\','/')).href){
 const result=await diagnoseOpenRouter({probe:process.argv.includes('--probe')});
 if(!result.ok)process.exitCode=1;
}
