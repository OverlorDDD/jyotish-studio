import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {createHourlyLimiter,generateOpenAiInterpretation,AiProviderError} from './ai.ts';

/** Every cloud inference request uses the strictly free OpenRouter model router. */
type FreeProvider='openrouter'|'ollama';
export type FreeFallbackReason='hourly_limit'|'no_provider'|'rate_limited'|'provider_rejected'|'provider_unavailable'|'invalid_response'|'timeout'|'network';
const allowed=new Set<FreeProvider>(['openrouter','ollama']);
const order=():FreeProvider[]=>{
 const configured=process.env.FREE_AI_ORDER||'openrouter,ollama';
 return [...new Set(configured.split(',').map(s=>s.trim()).filter((s):s is FreeProvider=>allowed.has(s as FreeProvider)))];
};
let budget:(()=>boolean)|undefined;
function allowFreeRequest(){
 if(!budget){
  const n=Number(process.env.FREE_AI_MAX_CALLS_PER_HOUR);
  budget=createHourlyLimiter(Number.isFinite(n)&&n>=1?Math.min(60,Math.floor(n)):10);
 }
 return budget();
}
function failureReason(error:unknown):FreeFallbackReason{
 if(!(error instanceof AiProviderError))return 'network';
 if(error.reason==='timeout')return 'timeout';
 if(error.reason==='format')return 'invalid_response';
 if(error.reason==='limit')return 'hourly_limit';
 const match=/^OpenAI HTTP (\d{3})/.exec(error.message);
 if(!match)return 'network';
 const status=Number(match[1]);
 if(status===429)return 'rate_limited';
 if(status===400||status===422)return 'invalid_response';
 if(status===401||status===403||status===404)return 'provider_rejected';
 if(status>=500)return 'provider_unavailable';
 return 'provider_unavailable';
}
export type FreeAiOptions={
 fetcher?:typeof fetch;limit?:()=>boolean;order?:FreeProvider[];key?:string;
 ollamaEnabled?:boolean;ollamaModel?:string;
 factsOverride?:ReadonlyArray<{id:string;fact:string}>;reportMode?:boolean;approvedYogas?:ReadonlyArray<string>;
};
export type FreeAiOutcome={
 result:Awaited<ReturnType<typeof generateOpenAiInterpretation>>|null;
 reason?:FreeFallbackReason;
};

/** A failed free provider never triggers paid OpenAI.
 * Machine-readable reasons do not include credentials, prompts or response bodies. */
export async function generateFreeInterpretationDetailed(
 chart:CalculatedChart,lang:'uk'|'en',opts:FreeAiOptions={}
):Promise<FreeAiOutcome>{
 const permit=opts.limit||allowFreeRequest; // Count every free cloud attempt, including a JSON retry.
 const providers=opts.order||order();
 const openrouterKey=opts.key??process.env.OPENROUTER_API_KEY?.trim()??'';
 const ollamaEnabled=opts.ollamaEnabled??process.env.OLLAMA_ENABLED==='1';
 const ollamaModel=opts.ollamaModel||process.env.OLLAMA_MODEL||'gemma3:1b';
 let reason:FreeFallbackReason='no_provider';
 for(const provider of providers){
  if(provider==='openrouter'&&!openrouterKey)continue;
  if(provider==='ollama'&&!ollamaEnabled)continue;
  try{
   if(provider==='openrouter'){
    if(!permit()){reason='hourly_limit';continue;}
    const request=(formatMode:'strict'|'prompt'|'prose')=>generateOpenAiInterpretation(chart,lang,{
     provider:'openrouter',key:openrouterKey,model:'openrouter/free',
     formatMode,fetcher:opts.fetcher,limit:()=>true,factsOverride:opts.factsOverride,reportMode:opts.reportMode,approvedYogas:opts.approvedYogas
    });
    try{
     return {result:await request(opts.reportMode?'prose':'strict')};
    }catch(error){
     // Free routers may choose endpoints that ignore strict schemas.
     // Retry only malformed/unsupported format, never 401/403/429/5xx or network errors.
     const rejected=error instanceof AiProviderError&&
      (error.reason==='format'||(error.reason==='upstream'&&/^OpenAI HTTP (400|422)\b/.test(error.message)));
     if(!rejected)throw error;
     if(!permit()){reason='hourly_limit';continue;}
     console.warn('Free AI: first response rejected; retrying with a simpler fact-linked JSON prompt');
     return {result:await request('prompt')};
    }
   }
   if(provider==='ollama'){
    const result=await generateOpenAiInterpretation(chart,lang,{
     provider:'ollama',key:'',model:ollamaModel,
     fetcher:opts.fetcher,limit:()=>true,factsOverride:opts.factsOverride,reportMode:opts.reportMode,approvedYogas:opts.approvedYogas
    });
    return {result};
   }
  }catch(error){
   reason=failureReason(error);
   // No raw provider errors: they may include private account information.
   console.warn(`Free AI fallback: ${provider} ${reason}; trying next provider`);
  }
 }
 return {result:null,reason};
}
/** Backward-compatible simple helper used by existing tests. */
export async function generateFreeInterpretation(
 chart:CalculatedChart,lang:'uk'|'en',opts:FreeAiOptions={}
){
 return (await generateFreeInterpretationDetailed(chart,lang,opts)).result;
}
