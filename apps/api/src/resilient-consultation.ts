import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {generateFreeInterpretationDetailed,type FreeAiOptions,type FreeAiOutcome,type FreeProvider} from './free-ai.ts';
import type {AiConsultationChapter,AiChapterSpec} from './consultation-ai.ts';

/**
 * A8.8: a full eight-chapter consultation is too expensive and fragile as a
 * single free Groq completion (25-second timeout, 8k TPM for GPT-OSS-120B).
 * Chunk server-authored facts into two requests; retain every approved chapter.
 * Never infer positions or issue paid calls; the existing deterministic Reader
 * V5 already supplies full prose for every missing chapter.
 */
export async function generateResilientFreeConsultation(
 chart:CalculatedChart,lang:'uk'|'en',options:FreeAiOptions={}
):Promise<FreeAiOutcome>{
 const specs=options.chapterSpecs;
 if(!specs||specs.length<=4)return generateFreeInterpretationDetailed(chart,lang,options);
 const groups:AiChapterSpec[][]=[];
 for(let i=0;i<specs.length;i+=4)groups.push(specs.slice(i,i+4).map(ch=>({
  ...ch,
  // Only the narrow evidence and a sample of the authored prose are transmitted.
  // The server keeps the complete, trusted draft for rendering.
  facts:options.preserveChapterContext?ch.facts:ch.facts.slice(0,3).map(f=>f.slice(0,210)),
  draft:ch.draft?.map(p=>p.slice(0,165))
 })));
 const controller=new AbortController();
 const onAbort=()=>controller.abort();
 options.signal?.addEventListener('abort',onAbort,{once:true});
 // End-to-end deadline prevents HTTP request hang; successful portions survive.
 const clock=setTimeout(()=>controller.abort(),42000);
 const chapters:AiConsultationChapter[]=[];
 let selectedProvider:FreeProvider|undefined;
 let selectedModel='';
 let lastReason:FreeAiOutcome['reason']='no_provider';
 try{
  for(const group of groups){
   if(controller.signal.aborted)break;
   const result=await generateFreeInterpretationDetailed(chart,lang,{
    ...options,chapterSpecs:group,reportMode:true,
    order:selectedProvider?[selectedProvider]:options.order,
    timeoutMs:16000,signal:controller.signal
   });
   if(result.result?.chapters?.length){
    const incoming=result.result.chapters;
    if(!selectedProvider){
     // Each successful report is attributed only to the actual model producing it.
     selectedProvider=result.result.provider as FreeProvider;
     selectedModel=result.result.model;
    }
    chapters.push(...incoming.filter(c=>!chapters.some(existing=>existing.id===c.id)));
   }else{
    lastReason=result.reason||'invalid_response';
    // Failure never discards earlier LLM content, and never replaces Reader V5.
    // Don't continue with more calls if the free budget is exhausted.
    if(lastReason==='hourly_limit'||lastReason==='rate_limited')break;
   }
  }
 }finally{
  clearTimeout(clock);options.signal?.removeEventListener('abort',onAbort);
 }
 if(!chapters.length)return {result:null,reason:controller.signal.aborted?'timeout':lastReason};
 const ordered=specs.flatMap(spec=>chapters.filter(ch=>ch.id===spec.id));
 const text=ordered.map(c=>'[['+c.id+']]\n'+c.paragraphs.join('\n\n')).join('\n\n');
 return {result:{
  provider:selectedProvider!,model:selectedModel,text,chapters:ordered
 } as NonNullable<FreeAiOutcome['result']>};
}
