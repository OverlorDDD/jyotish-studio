import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {createHourlyLimiter,generateOpenAiInterpretation,AiProviderError} from './ai.ts';

/** Only these provider IDs are eligible; never accept a paid model name for OpenRouter. */
type FreeProvider='openrouter'|'ollama';
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

/** Try only zero-price OpenRouter router and explicitly enabled localhost Ollama.
 * One free cloud request per attempt, never paid OpenAI, no general-purpose URL input.
 * If every provider fails, return null so Jyotish's deterministic local reading wins. */
export async function generateFreeInterpretation(
 chart:CalculatedChart,lang:'uk'|'en',opts:{fetcher?:typeof fetch;limit?:()=>boolean;order?:FreeProvider[];key?:string;ollamaEnabled?:boolean;ollamaModel?:string}={}
){
 if(!(opts.limit||allowFreeRequest)())return null;
 const providers=opts.order||order();
 const openrouterKey=opts.key??process.env.OPENROUTER_API_KEY?.trim()??'';
 const ollamaEnabled=opts.ollamaEnabled??process.env.OLLAMA_ENABLED==='1';
 const ollamaModel=opts.ollamaModel||process.env.OLLAMA_MODEL||'gemma3:1b';
 for(const provider of providers){
  try{
   if(provider==='openrouter'){
    if(!openrouterKey)continue;
    const result=await generateOpenAiInterpretation(chart,lang,{
     provider:'openrouter',key:openrouterKey,
     model:'openrouter/free', // Strictly free router; never configurable to paid models.
     fetcher:opts.fetcher,limit:()=>true
    });
    return result;
   }
   if(provider==='ollama'){
    if(!ollamaEnabled)continue;
    const result=await generateOpenAiInterpretation(chart,lang,{
     provider:'ollama',key:'',model:ollamaModel,
     fetcher:opts.fetcher,limit:()=>true
    });
    return result;
   }
  }catch(e){
   // Public route never prints token, upstream provider payloads, or birth information.
   const reason=e instanceof AiProviderError?e.reason:'unavailable';
   console.warn(`Free AI fallback: ${provider} ${reason}; trying next provider`);
  }
 }
 return null;
}
