import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {classicalLordshipTable,yogakarakasForLagna} from './reader-classical.ts';
import {dignityFor,ruleFindings} from '../../../packages/jyotish-core/src/rules.ts';
import {consumeFreeAiRequest,type FreeFallbackReason,type FreeProvider} from './free-ai.ts';
import type {AiUsageEvent} from './ai.ts';

/**
 * A fixed, versioned instruction: exactly one cloud call per provider.
 * The user message is only a compact, verified chart summary, never free-form user text.
 * No chapter delimiters, multi-step editor, JSON schema or all-or-nothing 8 chapter gate.
 */
export const DIRECT_JYOTISH_VERSION='direct-v1';
export const DIRECT_JYOTISH_INSTRUCTION=`You are a mature, accomplished practitioner of traditional Parashari Jyotish and an excellent literary writer.
Write a beautifully composed PERSONAL natal-chart consultation, directly addressing the reader in the SECOND PERSON.
You receive verified sidereal astronomical facts and traditional Jyotish rules. Interpret ONLY those facts.
Do not recalculate the chart or invent graha signs/houses, house lords, yogas, aspects, dates, transits, future events, biographies or health/fertility outcomes.
Never use Western tropical-only factors (Uranus, Neptune, Pluto, Chiron, Lilith, MC or Western square/trine aspects).
This must feel like a genuine consultation, not a technical inventory: begin with an immediately recognizable, compelling synthesis of the person's outer drive and inner rhythm.
Weave actual interactions: ascendant + its ruler; Moon + its house; concentrated houses + their sign dispositor; tenth/seventh/second lords; D9 for partnership; D10 for vocational expression; active dasha if present.
Organize with natural, evocative Markdown ## headings, progressing from inner character through central tensions, love, vocation, resources, current period, strengths and practical integration.
Within each theme explain at least TWO grounded indications and one relatable conditional example. Avoid copy-paste pattern statements, clichés, self-referential explanations, numbered fact dumps, broad guarantees and repeating the same factors in every section.
Write an engaging, detailed, warm and confident consultation; aim for 1200-1700 words when the free-tier provider can supply them, but prioritize completed coherent prose over hitting an exact length.
Include two thoughtful, specific practices at the end. Never conclude mid-sentence.
Only return finished Markdown consultation. No metadata, no JSON, no delimiters or disclaimers. The reader can inspect exact calculations separately.`;
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
 const facts=compactJyotishFacts(chart,asOf),permit=opts.limit||consumeFreeAiRequest;
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
   const content=typeof value==='string'?value:Array.isArray(value)?value.map(v=>v.text||'').join(''):'';
   const check=acceptDirectJyotishText(content);
   if(!check.ok){reason='invalid_response';console.warn('Direct Jyotish: '+provider+' rejected='+check.reason);continue;}
   try{await opts.onUsage?.({provider,model:parsed?.model||model,outcome:'returned'});}catch{}
   return {result:{provider,model:parsed?.model||model,text:content.trim()}};
  }catch(error){reason=controller.signal.aborted?'timeout':'network';redact(reason,provider);}
  finally{clearTimeout(timer);}
 }
 return {result:null,reason};
}
