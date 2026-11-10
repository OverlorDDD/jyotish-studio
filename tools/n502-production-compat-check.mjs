/**
 * Public, read-only runtime compatibility smoke for an actual deployed site.
 * No user birth data, API keys or cloud-model calls.
 */
import {isJyotishRuntimeCompatible} from '../apps/web/lib/jyotish-runtime-contract.ts';
const origin=(process.env.N502_SITE_ORIGIN||'https://galaxiora.com').replace(/\/$/,'');
const runtimeUrl=origin+'/api/v1/jyotish/runtime';
const controller=new AbortController();
const timeout=setTimeout(()=>controller.abort(),15000);
try{
 const res=await fetch(runtimeUrl,{headers:{Accept:'application/json'},signal:controller.signal,cache:'no-store'});
 if(!res.ok)throw Error('API_RUNTIME_HTTP_'+res.status);
 const runtime=await res.json();
 if(!isJyotishRuntimeCompatible(runtime))throw Error('READER_CONTRACT_MISMATCH');
 if(typeof runtime.pipeline!=='string'||!/^direct-v\d+$/.test(runtime.pipeline))
  throw Error('UNEXPECTED_AI_PIPELINE_VERSION');
 for(const locale of ['uk','en']){
  const r=await fetch(origin+'/'+locale+'/astrology/jyotish',{signal:controller.signal,cache:'no-store'});
  if(!r.ok)throw Error('NATAL_'+locale+'_HTTP_'+r.status);
 }
 console.log('N502_PUBLIC_WEB_API_COMPAT_VERIFIED pipeline='+runtime.pipeline);
}catch(err){
 console.error('N502_PUBLIC_WEB_API_COMPAT_FAILED '+(err instanceof Error?err.message:'unknown'));
 process.exitCode=2;
}finally{clearTimeout(timeout)}
