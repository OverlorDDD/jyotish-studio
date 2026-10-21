import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {createHourlyLimiter,generateOpenAiInterpretation,AiProviderError,type AiUsageEvent} from './ai.ts';
import type {AiChapterSpec} from './consultation-ai.ts';

/** Free by configuration only: Gemini requires separately verified FREE billing tier. */
export type FreeProvider='openrouter'|'gemini'|'groq';
export type FreeFallbackReason='hourly_limit'|'no_provider'|'rate_limited'|'provider_rejected'|'provider_unavailable'|'invalid_response'|'timeout'|'network';
const allowed=new Set<FreeProvider>(['openrouter','gemini','groq']);
const order=():FreeProvider[]=>{
 const configured=process.env.FREE_AI_ORDER||'gemini,groq,openrouter';
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
/** Diagnostic codes are selected from our own fixed messages: never print provider text. */
function safeFormatDiagnostic(error:unknown){
 if(!(error instanceof AiProviderError)||error.reason!=='format')return '';
 const known:Record<string,string>={
  'Insufficient safe plain-language paragraphs':'unsafe_or_short_prose',
  'AI output is not valid JSON':'malformed_json',
  'AI output is missing sections':'missing_sections',
  'Too few verified interpretation sections':'unsafe_or_short_sections',
  'Invalid, duplicate or unverified interpretation section':'unsafe_or_duplicate_sections',
  'OpenAI returned no interpretation':'empty_completion',
  'AI provider returned invalid JSON':'malformed_provider_response',
  'empty_provider_body':'empty_provider_body',
  'oversized_provider_body':'oversized_provider_body',
  'provider_returned_html':'provider_returned_html',
  'malformed_provider_json':'malformed_provider_json',
  'malformed_sse_payload':'malformed_sse_payload',
  'empty_sse_completion':'empty_sse_completion',
  'unexpected_provider_shape':'unexpected_provider_shape',
  'insufficient_verified_chapters':'insufficient_verified_chapters'
 };
 return known[error.message]||'unverified_format';
}
/** Only the numeric upstream HTTP status, never upstream text or credentials. */
function safeHttpDiagnostic(error:unknown){
 if(!(error instanceof AiProviderError))return '';
 const m=/^OpenAI HTTP (\d{3})(?:\s|$)/.exec(error.message);
 return m?'HTTP '+m[1]:'';
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
 ollamaEnabled?:boolean;ollamaModel?:string;geminiEnabled?:boolean;geminiKey?:string;
 groqEnabled?:boolean;groqKey?:string;groqModel?:string;
 factsOverride?:ReadonlyArray<{id:string;fact:string}>;reportMode?:boolean;chapterSpecs?:ReadonlyArray<AiChapterSpec>;approvedYogas?:ReadonlyArray<string>;
 onUsage?:(event:AiUsageEvent)=>Promise<void>|void;signal?:AbortSignal;timeoutMs?:number;
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
 const geminiKey=opts.geminiKey??process.env.GEMINI_API_KEY?.trim()??'';
 // Deliberate opt-in only after confirming in Google AI Studio that billing is OFF/free tier.
 const geminiEnabled=opts.geminiEnabled??process.env.GEMINI_FREE_TIER_CONFIRMED==='1';
 const groqKey=opts.groqKey??process.env.GROQ_API_KEY?.trim()??'';
 // Explicit free-plan consent: never auto-use a paid Groq account.
 const groqEnabled=opts.groqEnabled??process.env.GROQ_FREE_TIER_CONFIRMED==='1';
 const permittedGroqModels=new Set(['openai/gpt-oss-120b','openai/gpt-oss-20b']);
 const preferredGroq=opts.groqModel||process.env.GROQ_MODEL||'openai/gpt-oss-120b';
 const groqModel=permittedGroqModels.has(preferredGroq)?preferredGroq:'openai/gpt-oss-120b';
 const customOpenRouter=(process.env.OPENROUTER_FREE_MODEL||'').trim();
 // Permit ONLY explicitly free model slugs. Do not turn failover into paid inference.
 const openRouterModel=customOpenRouter&&/^[a-z0-9_.-]+\/[a-z0-9_.:-]+:free$/i.test(customOpenRouter)?customOpenRouter:'openrouter/free';
 let reason:FreeFallbackReason='no_provider';
 for(const provider of providers){
  if(provider==='openrouter'&&!openrouterKey)continue;
  if(provider==='gemini'&&(!geminiEnabled||!geminiKey))continue;
  if(provider==='groq'&&(!groqEnabled||!groqKey))continue;
  try{
   if(provider==='openrouter'){
    if(!permit()){reason='hourly_limit';continue;}
    const request=(formatMode:'strict'|'prompt'|'prose'|'consultation')=>generateOpenAiInterpretation(chart,lang,{
     provider:'openrouter',key:openrouterKey,model:openRouterModel,
     formatMode,fetcher:opts.fetcher,limit:()=>true,factsOverride:opts.factsOverride,reportMode:opts.reportMode,chapterSpecs:opts.chapterSpecs,approvedYogas:opts.approvedYogas,onUsage:opts.onUsage,signal:opts.signal,timeoutMs:opts.timeoutMs
    });
    try{
     // Long-form advice uses vetted paragraphs, not JSON: openrouter/free rotates models
     // which often cannot honour JSON-schema. Keep legacy short-reading strict.
     return {result:await request(opts.chapterSpecs?'consultation':opts.reportMode?'prose':'strict')};
    }catch(error){
     // Free routers may choose endpoints that ignore strict schemas.
     // Retry only malformed/unsupported format, never 401/403/429/5xx or network errors.
     const rejected=error instanceof AiProviderError&&
      (error.reason==='format'||(error.reason==='upstream'&&/^OpenAI HTTP (400|422)\b/.test(error.message)));
     // Transport failures or eight-chapter mode should switch providers: a JSON retry
     // cannot fix a non-JSON HTTP envelope and cannot create missing chapters.
     if(opts.chapterSpecs||error instanceof AiProviderError&&['malformed_provider_json','empty_provider_body','provider_returned_html','malformed_sse_payload','empty_sse_completion','oversized_provider_body'].includes(error.message))throw error;
     if(!rejected)throw error;
     if(!permit()){reason='hourly_limit';continue;}
     console.warn('Free AI: first response rejected'+(safeFormatDiagnostic(error)?' ('+safeFormatDiagnostic(error)+')':'')+'; retrying a fact-linked JSON prompt');
     return {result:await request('prompt')};
    }
   }
   if(provider==='gemini'){
    if(!permit()){reason='hourly_limit';continue;}
    const result=await generateOpenAiInterpretation(chart,lang,{
     provider:'gemini',key:geminiKey,model:'gemini-3.1-flash-lite',formatMode:opts.chapterSpecs?'consultation':'prompt',
     fetcher:opts.fetcher,limit:()=>true,factsOverride:opts.factsOverride,reportMode:opts.reportMode,chapterSpecs:opts.chapterSpecs,
     approvedYogas:opts.approvedYogas,onUsage:opts.onUsage,signal:opts.signal,timeoutMs:opts.timeoutMs
    });
    return {result};
   }
   if(provider==='groq'){
    if(!permit()){reason='hourly_limit';continue;}
    const result=await generateOpenAiInterpretation(chart,lang,{
     provider:'groq',key:groqKey,model:groqModel,
     formatMode:opts.chapterSpecs?'consultation':'prompt',
     fetcher:opts.fetcher,limit:()=>true,factsOverride:opts.factsOverride,reportMode:opts.reportMode,
     chapterSpecs:opts.chapterSpecs,approvedYogas:opts.approvedYogas,onUsage:opts.onUsage,signal:opts.signal,timeoutMs:opts.timeoutMs
    });
    return {result};
   }

  }catch(error){
   reason=failureReason(error);
   // No raw provider errors: they may include private account information.
   console.warn(`Free AI fallback: ${provider} ${reason}${safeHttpDiagnostic(error)?' ('+safeHttpDiagnostic(error)+')':safeFormatDiagnostic(error)?' ('+safeFormatDiagnostic(error)+')':''}; trying next provider`);
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
