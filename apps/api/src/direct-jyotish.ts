import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {classicalLordshipTable,yogakarakasForLagna} from './reader-classical.ts';
import {planConsultationQuality,compactQualityBrief,CONSULTATION_QUALITY_VERSION} from './consultation-quality-v2.ts';
import {dignityFor,ruleFindings} from '../../../packages/jyotish-core/src/rules.ts';
import {consumeFreeAiRequest,type FreeFallbackReason,type FreeProvider} from './free-ai.ts';
import type {AiUsageEvent} from './ai.ts';
import {polishConsultationText,reviewGeneratedConsultation} from './consultation-prose-review.ts';
import {compactN4VargaFacts,verifiedVargaSource} from './reader-varga-n4.ts';
import {compactReaderV7ForAi} from './reader-v7.ts';
import {compactClassicalReaderV8ForAi} from './reader-v8.ts';

/**
 * A fixed, versioned instruction: exactly one cloud call per provider.
 * The user message is only a compact, verified chart summary, never free-form user text.
 * No chapter delimiters, multi-step editor, JSON schema or all-or-nothing 8 chapter gate.
 */
export const DIRECT_JYOTISH_VERSION='direct-v2';
export const DIRECT_JYOTISH_INSTRUCTION=`You are an expert practitioner of traditional Parashari Jyotish and a gifted writer of substantial PERSONAL consultations.
You will receive verified sidereal D1/D9/D10 placements, whole-sign house lords, sign dignity, and Vimshottari periods, followed by an optional VERIFIED N4 VARGA FACT LIST and a machine-derived PRIORITY BRIEF with evidence IDs.
You will also receive source-anchored Classical Reader 8 interpretation prompts distinguishing historical rules from modern extensions. They are hypotheses to communicate understandably, never facts observed about the person's life.
Your sole task is to INTERPRET these exact facts into an original, beautifully written, coherent second-person consultation in the requested language.

METHOD — NON-NEGOTIABLE:
- First identify 2–3 defining CHART-SPECIFIC themes from the PRIORITY BRIEF. Connect ascendant and its lord, Moon, house lords and dispositors; a shared ruling planet joining 1st and 10th houses is especially meaningful.
- Interpret the CHART AS A WHOLE. Balance practical expression, INNER MOTIVATION, SHADOW/FRICTION, the circumstances that may soften or intensify a tendency, and a useful response.
- For each major life domain (identity, relationships, vocation, resources, inner life, present dasha), state at least one genuinely grounded OPPORTUNITY AND one PLAUSIBLE RISK or internal tension IF the facts support it. Where they do not, explicitly avoid manufacturing negativity. Be precise about alternatives and conditional manifestations.
- Judge a house by its lord, placement, significant occupants, verified Parashari drishti and strength indicators actually provided. One debilitated planet does not mean permanent incapacity, and do NOT claim cancellation of debilitation, shadbala, combustion, planetary war, yogas, exact aspects or friendships unless explicitly supported.
- Keep D1 as the main chart. D9 refines partnership; D10 refines work. When verified N4 facts are supplied, connect AT LEAST TWO pertinent new life areas (e.g. resilience D27, obstacles D30, learning D24 or money D2) to the relevant D1 theme. First tell the reader WHAT IT MEANS in everyday language. Introduce chart abbreviations only once in short parentheses (e.g. «витривалість (D27)»); avoid raw house numbers and graha lists in user-facing prose unless absolutely needed and explained. Never merely recite an inventory.
- N4 varga meanings are topic-specific traditional lenses, NOT independent new natal skies, shadbala scores, medical/fertility diagnoses, quantitative ratings or guaranteed life outcomes. One placement cannot alone prove a strength, weakness or event; explain tradeoffs when D1 and varga differ.
- Do NOT construct an N4 D-chart yourself, invent its grahas, special ascendants, divisions, lordships, conjunctions or strengths. Only the given focus-ruler sign/house, the separately provided second comparison graha sign/house, and the lagna sign may be used for each new division. D1 house lordship is NOT automatically the same as a Dn house lordship.
- D60 is a method-verified but per-birth provisional chart: individual D60 lagna/house stability is NOT certified. Do NOT mention D60 in the final consultation or make any personal D60 interpretation, karmic verdict or past-life claim. If N4 facts are unavailable, stay strictly with verified D1/D9/D10.
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
- Write for a reader who has never heard the word Jyotish. Give a direct, specific explanation of likely strengths, possible blind spots, the circumstance in which each pattern might appear, and ONE immediately actionable low-risk experiment per major area.
- Avoid jargon such as lagna, nakshatra, shadbala, yogakaraka, kendra, trikona, antardasha and technical chart ruler numbers in the visible consultation. When needed, translate once: «період активної планети» rather than «антардаша». NEVER invent or diagnose a weakness based on a single placement; use two actually provided factors.
- Each paragraph should answer a real human question: what can be useful, what may obstruct it, and what to do. Do not tell the reader to believe the chart blindly.
- Write natural, idiomatic Ukrainian or English as requested, with varied sentences and evocative but not overblown images. In Ukrainian use «Місяць» as masculine («ваш Місяць»), «десятий дім», and «єдине мірило». Proofread agreement and case endings before responding.
- Produce a substantial yet clear consultation, ideally 650–950 words; useful detail matters more than length. Do not pad, truncate deliberately, or end mid-sentence.
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
  compactN4VargaFacts(chart),
  compactClassicalReaderV8ForAi(chart,asOf),
  'As of '+asOf+': '+(major?'Mahadasha '+major.lord+' '+major.start.slice(0,10)+' to '+major.end.slice(0,10):'no active mahadasha')+
    (minor?'; antardasha '+minor.lord+' '+minor.start.slice(0,10)+' to '+minor.end.slice(0,10):'')
 ].join('\n');
}
export type DirectDiagnostic={
 provider:FreeProvider;
 stage:'config'|'limit'|'http'|'response'|'validation'|'transport'|'success';
 reason:string;
 /** Status is numeric only: never expose headers, upstream body, prompt or API key. */
 httpStatus?:number;
};
export type DirectOptions={
 fetcher?:typeof fetch;limit?:()=>boolean;order?:FreeProvider[];
 keys?:Partial<Record<FreeProvider,string>>;freeConfirmed?:Partial<Record<FreeProvider,boolean>>;
 timeoutMs?:number;onUsage?:(event:AiUsageEvent)=>void|Promise<void>;
 /** Optional safe, machine-readable diagnostics for local troubleshooting. */
 onDiagnostic?:(diagnostic:DirectDiagnostic)=>void;
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
 // A complete sentence wrapped in Markdown bold/italic still ends in punctuation.
 const proseTail=clean.replace(/(?:\*{1,3}|_{1,3})+\s*$/u,'').trim();
 if(!/[.!?…][\"”’')\]]?\s*$/.test(proseTail))return {ok:false,reason:'unfinished'};
 if(/(?:\bPluto\b|\bUranus\b|\bNeptune\b|\bChiron\b|\bLilith\b|Плутон|Уран(?:а|ом|і)?|Нептун|Хірон|Ліліт)/iu.test(clean))return {ok:false,reason:'unsupported_western_factors'};
 return {ok:true,reason:'ok'};
}
/**
 * Lightweight post-generation guard: stop fabricated divisions and prevent an
 * LLM from silently ignoring every new verified topical chart. This does not
 * certify prose, which remains a symbolic interpretation.
 */
export function validateN4ConsultationReferences(text:string,chart:CalculatedChart):{ok:boolean;reason:string}{
 const verified=Boolean(verifiedVargaSource(chart));
 const allowed=new Set(verified?[1,2,3,4,7,9,10,12,16,20,24,27,30,40,45]:[1,9,10]);
 const mentioned=[...text.matchAll(/[DД]\s*(\d{1,2})(?!\d)/giu)].map(m=>Number(m[1]));
 if(mentioned.some(n=>!allowed.has(n)))return {ok:false,reason:'unsupported_divisional_chart'};
 if(!verified)return {ok:true,reason:'ok'};
 const novel=new Set(mentioned.filter(n=>![1,9,10].includes(n)));
 if(novel.size<2)return {ok:false,reason:'missing_n4_cross_varga_synthesis'};
 // Reject explicit numerical placement claims inconsistent with the bound source.
 const source=verifiedVargaSource(chart)!;
 const placement=/[DД]\s*(\d{1,2})\s*[:—-]?\s*(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\s+(?:in\s+)?(?:house|H)\s*(\d{1,2})/giu;
 for(const claim of text.matchAll(placement)){
  const division=Number(claim[1]),house=Number(claim[3]);
  const varga=source.charts.find(d=>d.division===division);
  const actual=varga?.planets.find(x=>x.name.toLowerCase()===claim[2].toLowerCase());
  if(!actual||actual.house!==house)return {ok:false,reason:'fabricated_varga_placement'};
 }
 // Repetitive filler must not pass the word-count requirement.
 const chunks=text.split(/[.!?]+/u).map(x=>x.trim().toLowerCase()).filter(x=>x.length>35);
 const frequencies=new Map<string,number>();
 for(const sentence of chunks){
  const n=(frequencies.get(sentence)||0)+1;frequencies.set(sentence,n);
  if(n>=3)return {ok:false,reason:'repetitive_ai_filler'};
 }
 return {ok:true,reason:'ok'};
}
export async function generateDirectJyotish(
 chart:CalculatedChart,lang:'uk'|'en',asOf:string,opts:DirectOptions={}
):Promise<{result:Result|null;reason?:FreeFallbackReason}>{
 const order=opts.order??(process.env.FREE_AI_ORDER||'gemini,groq,openrouter').split(',').map(x=>x.trim()).filter((s):s is FreeProvider=>PROVIDERS.has(s as FreeProvider));
 const facts=compactJyotishFacts(chart,asOf)+'\n\n'+compactQualityBrief(planConsultationQuality(chart,asOf));
 const permit=opts.limit||consumeFreeAiRequest;
 // Diagnostics are opt-in, bounded and never receive credentials or response text.
 const diagnostic=(provider:FreeProvider,stage:DirectDiagnostic['stage'],detail:string,httpStatus?:number)=>{
  try{opts.onDiagnostic?.({provider,stage,reason:detail,...(httpStatus===undefined?{}:{httpStatus})});}catch{}
 };
 let reason:FreeFallbackReason='no_provider';
 for(const provider of order){
  const key=opts.keys?.[provider]??(provider==='gemini'?process.env.GEMINI_API_KEY:provider==='groq'?process.env.GROQ_API_KEY:process.env.OPENROUTER_API_KEY);
  const confirmed=opts.freeConfirmed?.[provider]??(provider==='gemini'?process.env.GEMINI_FREE_TIER_CONFIRMED==='1':
   provider==='groq'?process.env.GROQ_FREE_TIER_CONFIRMED==='1':true);
  if(!confirmed||!key?.trim()){
   diagnostic(provider,'config',!key?.trim()?'missing_key':'free_tier_unconfirmed');
   continue;
  }
  if(!permit()){reason='hourly_limit';diagnostic(provider,'limit','hourly_limit');break;}
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),opts.timeoutMs||38000);
  const model=pickModel(provider);
  try{
   // Free models frequently stop before a long requested consultation is complete.
   // A single bounded corrective retry is allowed only for truncated/short prose.
   // Never retry HTTP failures or accept fabricated chart facts to manufacture success.
   for(let attempt=0;attempt<2;attempt++){
    if(attempt>0){
     if(!permit()){reason='hourly_limit';diagnostic(provider,'limit','hourly_limit');break;}
     console.warn('Direct Jyotish: '+provider+' retrying_incomplete_text');
    }
    const concise=attempt===1;
    const response=await (opts.fetcher||fetch)(urlFor(provider),{
     method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json','Authorization':'Bearer '+key.trim()},
     body:JSON.stringify({model,max_tokens:provider==='groq'?3000:3800,temperature:concise?0.45:0.7,
      ...(provider==='groq'?{reasoning_effort:'low',include_reasoning:false}:{}),
      messages:[{role:'system',content:concise?
       DIRECT_JYOTISH_INSTRUCTION+'\nFor this corrective attempt: produce a COMPLETE, well-ended 450–700 word consultation within the token budget. Prioritize accuracy, D1/D9/D10, verified N4 thematic facts when provided and major/minor dashas over length. Finish your final sentence; do not produce a fragment.':
       DIRECT_JYOTISH_INSTRUCTION},
       {role:'user',content:'Write the requested full consultation in '+(lang==='uk'?'natural Ukrainian':'natural English')+
        '. Here are ONLY verified calculation facts:\n'+facts} ]})
    });
    if(!response.ok){
     reason=response.status===429?'rate_limited':response.status===401||response.status===403?'provider_rejected':
      response.status>=500?'provider_unavailable':'invalid_response';
     diagnostic(provider,'http',reason,response.status);
     redact(reason,provider);break;
    }
    const raw=await response.text();
    if(raw.length>160000){reason='invalid_response';diagnostic(provider,'response','oversized_body');break;}
    let parsed:{model?:string;choices?:Array<{finish_reason?:string;message?:{content?:string|Array<{text?:string}>}}>}|undefined;
    try{parsed=JSON.parse(raw);}catch{reason='invalid_response';diagnostic(provider,'response','not_json');break;}
    const choice=parsed?.choices?.[0];
    const value=choice?.message?.content;
    const rawContent=typeof value==='string'?value:Array.isArray(value)?value.map(v=>v.text||'').join(''):'';
    const content=polishConsultationText(rawContent,lang);
    const basic=acceptDirectJyotishText(content);
    const check=basic.ok?validateN4ConsultationReferences(content,chart):basic;
    // Some providers stop at token budget after a grammatically complete sentence:
    // finish_reason=length must still be treated as incomplete.
    const incomplete=choice?.finish_reason==='length'||!check.ok;
    if(incomplete){
     reason='invalid_response';
     const code=choice?.finish_reason==='length'?'token_limit':check.reason;
     diagnostic(provider,'validation',code);
     console.warn('Direct Jyotish: '+provider+' rejected='+code);
     if(attempt===0&&(code==='too_short'||code==='unfinished'||code==='token_limit'))continue;
     break;
    }
    const review=reviewGeneratedConsultation(content,chart,lang,asOf);
    // Known incorrect lordships and unsupported financial directives are hard failures,
    // not merely dashboard warnings. An offline Reader still remains available.
    if(review.codes.some(code=>code==='potential_house_lord_mismatch'||code==='unsupported_financial_directive')){
     reason='invalid_response';
     diagnostic(provider,'validation','unsupported_or_incorrect_chart_claim');
     break;
    }
    if(review.codes.length)console.warn('Direct Jyotish '+CONSULTATION_QUALITY_VERSION+': review='+review.codes.join(',')+' (non-blocking)');
    try{await opts.onUsage?.({provider,model:parsed?.model||model,outcome:'returned'});}catch{}
    diagnostic(provider,'success','complete');
    return {result:{provider,model:parsed?.model||model,text:content.trim()}};
   }
  }catch(error){
   reason=controller.signal.aborted?'timeout':'network';
   diagnostic(provider,'transport',reason);
   redact(reason,provider);
  }
  finally{clearTimeout(timer);}
 }
 return {result:null,reason};
}
