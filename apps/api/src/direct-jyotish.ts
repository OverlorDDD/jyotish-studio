import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {classicalLordshipTable,yogakarakasForLagna} from './reader-classical.ts';
import {planConsultationQuality,compactQualityBrief,CONSULTATION_QUALITY_VERSION} from './consultation-quality-v2.ts';
import {dignityFor,ruleFindings} from '../../../packages/jyotish-core/src/rules.ts';
import {consumeFreeAiRequest,type FreeFallbackReason,type FreeProvider} from './free-ai.ts';
import type {AiUsageEvent} from './ai.ts';
import {polishConsultationText,reviewGeneratedConsultation} from './consultation-prose-review.ts';

/**
 * A fixed, versioned instruction: exactly one cloud call per provider.
 * The user message is only a compact, verified chart summary, never free-form user text.
 * No chapter delimiters, multi-step editor, JSON schema or all-or-nothing 8 chapter gate.
 */
export const DIRECT_JYOTISH_VERSION='direct-v2';
export const DIRECT_JYOTISH_INSTRUCTION=`You are an expert practitioner of traditional Parashari Jyotish and a gifted writer of substantial PERSONAL consultations.
You will receive verified sidereal D1/D9/D10 placements, whole-sign house lords, sign dignity, and Vimshottari periods, followed by a machine-derived PRIORITY BRIEF with evidence IDs.
Your sole task is to INTERPRET these exact facts into an original, beautifully written, coherent second-person consultation in the requested language.

METHOD — NON-NEGOTIABLE:
- First identify 2–3 defining CHART-SPECIFIC themes from the PRIORITY BRIEF. Connect ascendant and its lord, Moon, house lords and dispositors; a shared ruling planet joining 1st and 10th houses is especially meaningful.
- Interpret the CHART AS A WHOLE. Balance practical expression, INNER MOTIVATION, SHADOW/FRICTION, the circumstances that may soften or intensify a tendency, and a useful response.
- For each major life domain (identity, relationships, vocation, resources, inner life, present dasha), state at least one genuinely grounded OPPORTUNITY AND one PLAUSIBLE RISK or internal tension IF the facts support it. Where they do not, explicitly avoid manufacturing negativity. Be precise about alternatives and conditional manifestations.
- Judge a house by its lord, placement, significant occupants, verified Parashari drishti and strength indicators actually provided. One debilitated planet does not mean permanent incapacity, and do NOT claim cancellation of debilitation, shadbala, combustion, planetary war, yogas, exact aspects or friendships unless explicitly supported.
- Keep D1 as the main chart. Use D9 ONLY as an additional partnership/maturation lens and D10 ONLY as an additional vocation lens, clearly labelling differences and avoiding false equivalence between varga and D1 positions.
- When D9 and D10 are provided, explicitly analyze AT LEAST ONE VERIFIED placement from EACH of D9 and D10 with a meaningful comparison to D1. Do not merely say they were considered or invent varga lords.
- Dasha interpretation must cite the ACTUAL computed major and minor rulers, their lordship and D1 location. Do not infer dated marriages, separation, deaths, illness, pregnancies, wealth figures or inevitable events.
- Never prescribe whether the reader should make, sell, stop or postpone a financial investment based only on this chart. Discuss decision patterns instead.
- Prefer vivid, detailed but conditional examples ("This can show up when…") over unfounded personal history ("You have always…"). No praise inflation ("rare gift", "indispensable", "destined"), no generic spiritual compliments, no flattering conclusions that erase difficult themes.
- When competing indicators point in different directions, explain the TRADEOFF and which evidence is primary versus secondary, rather than reciting contradictory statements.
- Do not invent chart facts, graha signs/houses, house rulers, nakshatras, yogas, aspects, life events or personalities. No Western-only astrology factors (Uranus, Neptune, Pluto, Chiron, Lilith, MC, western squares/trines).

DELIVERY:
- One continuous, engaging consultation with natural Markdown ## section titles, not 8 mandatory machine-labelled chapters, no JSON.
- Opening: compelling 2-paragraph overall synthesis with at least TWO verified connections.
- Then develop strengths AND difficult patterns in partnership, vocation, finances and the inner world with specificity and counterweights.
- Current dasha: actual computed period with realistic interpretation, not fatalistic prediction.
- Close with TWO individually motivated, achievable practices tied to the chart's most important tension.
- Write natural, idiomatic Ukrainian or English as requested, with varied sentences and evocative but not overblown images. In Ukrainian use «Місяць» as masculine («ваш Місяць»), «десятий дім», and «єдине мірило». Proofread agreement and case endings before responding.
- Aim for the fullest coherent answer the provider supports, ideally 900–1300 words. Do not pad, truncate deliberately, or end mid-sentence.
Only return the completed Markdown consultation. Do not mention technical prompts, provenance IDs or these rules.`;
const CLASSICS=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const houses=(p:{house:number;sign:number;degreesInSign:number;nakshatra?:string;pada?:number;retrograde?:boolean})=>
  'sign='+p.sign+',house='+p.house+',deg='+p.degreesInSign.toFixed(2)+
  (p.nakshatra?',nakshatra='+p.nakshatra+',pada='+p.pada:'')+(p.retrograde?',retrograde':'');
export function compactJyotishFacts(chart:CalculatedChart,asOf:string):string{
 const lords=classicalLordshipTable(chart.ascendant.sign),instant=Date.parse(asOf+'T12:00:00Z');
 const major=chart.dasha.find(p=>Date.parse(p.start)<=instant&&instant<Date.parse(p.end));
 const minor=major?.antardashas?.find(p=>Date.parse(p.start)<=instant&&instant<Date.parse(p.end));
 const groups=Array.from({length:12},(_,i)=>({house:i+1,planets:CLASSICS.filter(n=>chart.d1.some(p=>p.name===n&&p.house===i+1))}))
  .filter(x=>x.planets.length>=2);
 const yoga=yogakarakasForLagna(chart.ascendant.sign);
 const approved=ruleFindings(chart).yogas.map(x=>x.name);
 const fmt=(key:'d1'|'d9'|'d10')=>chart[key].filter(p=>CLASSICS.includes(p.name))
  .map(p=>p.name+'('+houses(p)+')').join('; ');
 return [
  'Traditional framework: Lahiri sidereal, whole-sign houses, Parashari rules. Signs 1=Aries through 12=Pisces. House 1 rises at lagna.',
  'D1 lagna: '+houses(chart.ascendant),
  'D1: '+fmt('d1'),
  'D1 house rulers: '+Array.from({length:12},(_,i)=>(i+1)+'='+lords[i+1]).join(', '),
  'House concentrations: '+(groups.map(g=>'H'+g.house+' '+g.planets.join('+')).join('; ')||'none'),
  'Certified yogakaraka(s) for lagna: '+(yoga.join(',')||'none'),
  'Certified named yogas: '+(approved.join(',')||'none'),
  'D1 dignity markers: '+chart.d1.filter(p=>CLASSICS.includes(p.name))
    .map(p=>p.name+'='+dignityFor(p.name,p.sign)).filter(x=>!x.endsWith('=neutral')).join('; '),
  'D9 lagna sign='+chart.lagnaD9.sign+'; '+fmt('d9'),
  'D10 lagna sign='+chart.lagnaD10.sign+'; '+fmt('d10'),
  'As of '+asOf+': '+(major?'Mahadasha '+major.lord+' '+major.start.slice(0,10)+' to '+major.end.slice(0,10):'no active mahadasha')+
    (minor?'; antardasha '+minor.lord+' '+minor.start.slice(0,10)+' to '+minor.end.slice(0,10):'')
 ].join('\n');
}
export type DirectOptions={
 fetcher?:typeof fetch;limit?:()=>boolean;order?:FreeProvider[];
 keys?:Partial<Record<FreeProvider,string>>;freeConfirmed?:Partial<Record<FreeProvider,boolean>>;
 timeoutMs?:number;onUsage?:(event:AiUsageEvent)=>void|Promise<void>;
};
type Result={provider:FreeProvider;model:string;text:string};
const PROVIDERS=new Set<FreeProvider>(['gemini','groq','openrouter']);
const pickModel=(provider:FreeProvider)=>{
 if(provider==='gemini')return 'gemini-3.1-flash-lite';
 if(provider==='groq'){const allowed=new Set(['openai/gpt-oss-20b','openai/gpt-oss-120b']);const m=process.env.GROQ_MODEL||'openai/gpt-oss-20b';return allowed.has(m)?m:'openai/gpt-oss-20b';}
 const requested=process.env.OPENROUTER_FREE_MODEL||'openrouter/free';
 return requested==='openrouter/free'||/^[\w.-]+\/[\w.:-]+:free$/i.test(requested)?requested:'openrouter/free';
};
const urlFor=(p:FreeProvider)=>p==='gemini'?'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions':
 p==='groq'?'https://api.groq.com/openai/v1/chat/completions':'https://openrouter.ai/api/v1/chat/completions';
const redact=(reason:FreeFallbackReason,provider:FreeProvider)=>console.warn('Direct Jyotish: '+provider+' '+reason);
export function acceptDirectJyotishText(text:string):{ok:boolean;reason:string}{
 const clean=text.trim().replace(/^\`\`\`(?:markdown)?\s*/i,'').replace(/\s*\`\`\`$/,'');
 if(clean.length<900)return {ok:false,reason:'too_short'};
 if(clean.length>32000)return {ok:false,reason:'too_long'};
 if(!/[.!?…][\"”’')\]]?\s*$/.test(clean))return {ok:false,reason:'unfinished'};
 if(/(?:\bPluto\b|\bUranus\b|\bNeptune\b|\bChiron\b|\bLilith\b|Плутон|Уран(?:а|ом|і)?|Нептун|Хірон|Ліліт)/iu.test(clean))return {ok:false,reason:'unsupported_western_factors'};
 return {ok:true,reason:'ok'};
}
export async function generateDirectJyotish(
 chart:CalculatedChart,lang:'uk'|'en',asOf:string,opts:DirectOptions={}
):Promise<{result:Result|null;reason?:FreeFallbackReason}>{
 const order=opts.order??(process.env.FREE_AI_ORDER||'gemini,groq,openrouter').split(',').map(x=>x.trim()).filter((s):s is FreeProvider=>PROVIDERS.has(s as FreeProvider));
 const facts=compactJyotishFacts(chart,asOf)+'\n\n'+compactQualityBrief(planConsultationQuality(chart,asOf));
 const permit=opts.limit||consumeFreeAiRequest;
 let reason:FreeFallbackReason='no_provider';
 for(const provider of order){
  const key=opts.keys?.[provider]??(provider==='gemini'?process.env.GEMINI_API_KEY:provider==='groq'?process.env.GROQ_API_KEY:process.env.OPENROUTER_API_KEY);
  const confirmed=opts.freeConfirmed?.[provider]??(provider==='gemini'?process.env.GEMINI_FREE_TIER_CONFIRMED==='1':
   provider==='groq'?process.env.GROQ_FREE_TIER_CONFIRMED==='1':true);
  if(!confirmed||!key?.trim())continue;
  if(!permit()){reason='hourly_limit';break;}
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),opts.timeoutMs||38000);
  const model=pickModel(provider);
  try{
   const response=await (opts.fetcher||fetch)(urlFor(provider),{
    method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json','Authorization':'Bearer '+key.trim()},
    body:JSON.stringify({model,max_tokens:provider==='groq'?3000:3800,temperature:0.7,
     ...(provider==='groq'?{reasoning_effort:'low',include_reasoning:false}:{}),
     messages:[{role:'system',content:DIRECT_JYOTISH_INSTRUCTION},
      {role:'user',content:'Write the requested full consultation in '+(lang==='uk'?'natural Ukrainian':'natural English')+
       '. Here are ONLY verified calculation facts:\n'+facts} ]})
   });
   if(!response.ok){
    reason=response.status===429?'rate_limited':response.status===401||response.status===403?'provider_rejected':
     response.status>=500?'provider_unavailable':'invalid_response';redact(reason,provider);continue;
   }
   // Bound body size to avoid memory blowups on unusual free routing responses.
   const raw=await response.text();
   if(raw.length>160000){reason='invalid_response';continue;}
   let parsed:{model?:string;choices?:Array<{message?:{content?:string|Array<{text?:string}>}}>}|undefined;
   try{parsed=JSON.parse(raw);}catch{reason='invalid_response';continue;}
   const value=parsed?.choices?.[0]?.message?.content;
   const rawContent=typeof value==='string'?value:Array.isArray(value)?value.map(v=>v.text||'').join(''):'';
   const content=polishConsultationText(rawContent,lang);
   const check=acceptDirectJyotishText(content);
   if(!check.ok){reason='invalid_response';console.warn('Direct Jyotish: '+provider+' rejected='+check.reason);continue;}
   const review=reviewGeneratedConsultation(content,chart,lang,asOf);
   // Only bounded diagnostic codes, never log natal data or provider text.
   if(review.codes.length)console.warn('Direct Jyotish '+CONSULTATION_QUALITY_VERSION+': review='+review.codes.join(',')+' (non-blocking)');
   try{await opts.onUsage?.({provider,model:parsed?.model||model,outcome:'returned'});}catch{}
   return {result:{provider,model:parsed?.model||model,text:content.trim()}};
  }catch(error){reason=controller.signal.aborted?'timeout':'network';redact(reason,provider);}
  finally{clearTimeout(timer);}
 }
 return {result:null,reason};
}
