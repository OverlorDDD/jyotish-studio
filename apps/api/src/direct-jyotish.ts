import {buildN6Brief,inspectN6Response,N6_PROMPT} from './reader-n6.ts';
import type {Reader10Report} from './reader10.ts';
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {classicalLordshipTable,yogakarakasForLagna} from './reader-classical.ts';
import {planConsultationQuality,compactQualityBrief,CONSULTATION_QUALITY_VERSION} from './consultation-quality-v2.ts';
import {dignityFor,ruleFindings} from '../../../packages/jyotish-core/src/rules.ts';
import {consumeFreeAiRequest,type FreeFallbackReason,type FreeProvider} from './free-ai.ts';
import type {AiUsageEvent} from './ai.ts';
import {polishConsultationText,reviewGeneratedConsultation} from './consultation-prose-review.ts';
import {openRouterLimitSource,openRouterLimitClass} from './openrouter-rate-limit.ts';
import {compactN4VargaFacts,verifiedVargaSource} from './reader-varga-n4.ts';
import {compactReaderV7ForAi} from './reader-v7.ts';
import {compactClassicalReaderV8ForAi} from './reader-v8.ts';

/**
 * A fixed, versioned instruction: one cloud call per provider, with a bounded corrective retry for incomplete text.
 * The user message is only a compact, verified chart summary, never free-form user text.
 * No chapter delimiters, multi-step editor, JSON schema or all-or-nothing 8 chapter gate.
 */
// Legacy Markdown contract version. The unified Reader is independently keyed by N6_VERSION.
export const DIRECT_JYOTISH_VERSION='direct-v3';
export const DIRECT_JYOTISH_INSTRUCTION=`You are an expert practitioner of traditional Parashari Jyotish and a gifted writer of substantial PERSONAL consultations.
You will receive verified sidereal D1/D9/D10 placements, whole-sign house lords, sign dignity, and Vimshottari periods, followed by a VERIFIED N4 VARGA FACT LIST for 12 additional thematic divisions and a machine-derived PRIORITY BRIEF with evidence IDs. The available 15 source-bound charts are D1, D2, D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30, D40 and D45. D60 is method-only and not a certified individual reading.
You will also receive source-anchored Classical Reader 8 interpretation prompts distinguishing historical rules from modern extensions. They are hypotheses to communicate understandably, never facts observed about the person's life.
Your sole task is to INTERPRET these exact facts into an original, beautifully written, coherent second-person consultation in the requested language.
Lead with a memorable, evidence-backed whole-life conclusion (actual ascendant lord, Moon and D9/D10 connections), not generic motivational questions, the same four lead-in phrases or a 15-item checklist. Vary rhythm naturally; every recommendation must address the particular domain and real computed tension.

METHOD — NON-NEGOTIABLE:
- First identify 2–3 defining CHART-SPECIFIC themes from the PRIORITY BRIEF. Connect ascendant and its lord, Moon, house lords and dispositors; a shared ruling planet joining 1st and 10th houses is especially meaningful.
- Interpret the CHART AS A WHOLE. Balance practical expression, INNER MOTIVATION, SHADOW/FRICTION, the circumstances that may soften or intensify a tendency, and a useful response.
- For each major life domain (identity, relationships, vocation, resources, inner life, present dasha), state at least one genuinely grounded OPPORTUNITY AND one PLAUSIBLE RISK or internal tension IF the facts support it. Where they do not, explicitly avoid manufacturing negativity. Be precise about alternatives and conditional manifestations.
- Judge a house by its lord, placement, significant occupants, verified Parashari drishti and strength indicators actually provided. One debilitated planet does not mean permanent incapacity, and do NOT claim cancellation of debilitation, shadbala, combustion, planetary war, yogas, exact aspects or friendships unless explicitly supported.
- Keep D1 as the main chart and integrate the verified 14 other thematic divisions where relevant to their OWN life spheres. Domain map: resources D2; initiative/siblings D3; home/property D4; children/creative legacy D7; partnership D9; career D10; family roots D12; comfort D16; spiritual practice D20; education D24; resilience D27; obstacles D30; inherited/family themes D40; values/transmitted legacy D45. D1, D9 and D10 form the foundation. If a thematic factor is missing or weak, explain the uncertainty rather than invent certainty. Every supplied verified division should INFORM the appropriate area of the overall reading; link its actual supplied indicator to D1 rather than merely name its code. Group closely related divisions in natural paragraphs, never turn the consultation into a mechanical 15-item inventory. Put chart abbreviations in brief parentheses only where they clarify evidence.
- N4 varga meanings are topic-specific traditional lenses, NOT independent new natal skies, shadbala scores, medical/fertility diagnoses, quantitative ratings or guaranteed life outcomes. One placement cannot alone prove a strength, weakness or event; explain tradeoffs when D1 and varga differ.
- Do NOT construct an N4 D-chart yourself, invent its grahas, special ascendants, divisions, lordships, conjunctions or strengths. Only the given focus-ruler sign/house, the separately provided second comparison graha sign/house, and the lagna sign may be used for each new division. D1 house lordship is NOT automatically the same as a Dn house lordship.
- D60 is a conditional sign-only appendix, NOT a certified individual house chart. If AND ONLY IF the input contains explicit D60 provisional SIGN-ONLY facts bound to D1, you MAY give one short, explicitly provisional comparison of those exact D60 planetary signs with D1. DO NOT claim D60 houses, lagna, natal accuracy to seconds, karma, past-life history, medical facts, personal destiny, or deterministic traits. D60 never drives the main synthesis. If no conditional D60 facts are provided, omit D60 entirely.
- When D9 and D10 are provided, explicitly analyze AT LEAST ONE VERIFIED placement from EACH of D9 and D10 with a meaningful comparison to D1 (D9 relationships, D10 career). ALSO make room for other verified divisional perspectives: D2/D4/D16 on material life; D3/D7/D12 on close ties and lineage; D20/D24/D45 on purpose and study; D27/D30/D40 on resilience and inherited tensions. Use ONLY the separately provided focus-ruler and comparison-planet evidence for additional vargas. Do not merely say charts were considered, list labels without interpretation or invent varga lords.
- Dasha interpretation must cite the ACTUAL computed major and minor rulers, their lordship and D1 location. Do not infer dated marriages, separation, deaths, illness, pregnancies, wealth figures or inevitable events.
- Never prescribe whether the reader should make, sell, stop or postpone a financial investment based only on this chart. Discuss decision patterns instead.
- Prefer vivid, detailed but conditional examples ("This can show up when…") over unfounded personal history ("You have always…"). No praise inflation ("rare gift", "indispensable", "destined"), no generic spiritual compliments, no flattering conclusions that erase difficult themes.
- When competing indicators point in different directions, explain the TRADEOFF and which evidence is primary versus secondary, rather than reciting contradictory statements.
- Do not invent chart facts, graha signs/houses, house rulers, nakshatras, yogas, aspects, life events or personalities. No Western-only astrology factors (Uranus, Neptune, Pluto, Chiron, Lilith, MC, western squares/trines).

DELIVERY:
- One continuous, engaging consultation with natural Markdown ## section titles organized by real life domains: identity and strengths; relationships and family; vocation and education; money, home and comfort; inner life and resilience; present periods and a practical synthesis. This is NOT an inventory of 15 charts, and no JSON.
- Opening: compelling 2-paragraph overall synthesis with at least TWO verified connections.
- Then develop strengths AND difficult patterns in partnership, vocation, finances and the inner world with specificity and counterweights.
- Current dasha: actual computed period with realistic interpretation, not fatalistic prediction.
- Close with TWO individually motivated, achievable practices tied to the chart's most important tension.
- Write for a reader who has never heard the word Jyotish. Give a direct, specific explanation of likely strengths, possible blind spots, the circumstance in which each pattern might appear, and ONE immediately actionable low-risk experiment per major area.
- Avoid jargon such as lagna, nakshatra, shadbala, yogakaraka, kendra, trikona, antardasha and technical chart ruler numbers in the visible consultation. When needed, translate once: «період активної планети» rather than «антардаша». NEVER invent or diagnose a weakness based on a single placement; use two actually provided factors.
- Each paragraph should answer a real human question: what can be useful, what may obstruct it, and what to do. Do not tell the reader to believe the chart blindly.
- Write natural, idiomatic Ukrainian or English as requested, with varied sentences and evocative but not overblown images. In Ukrainian use «Місяць» as masculine («ваш Місяць»), «десятий дім», and «єдине мірило». Proofread agreement and case endings before responding.
- Produce a substantive but responsive consultation, ideally 600–850 words when the verified 15-chart evidence is present; prioritize all relevant life domains over arbitrary length or chart codes. If the token budget is tight, use concise meaningful coverage rather than filler and always finish the last sentence. Never invent additional placements.
Only return the completed Markdown consultation. Do not mention technical prompts, provenance IDs or these rules.`;
/** Concise, verified-chart free-tier fallback: the local Reader still provides all 16 cards. */
export const DIRECT_JYOTISH_BACKUP_INSTRUCTION=`You are a careful traditional Parashari Jyotish interpreter writing naturally in the requested language.
Use ONLY the supplied verified natal placements and priority brief. Explain possibilities in the tradition, not observed life events.
FORMAT: SIX concise Markdown ## sections: overall pattern; relationships, children and family; work, education and values; finances, home and comfort; inner life, strengths and obstacles; current period and next steps. Aim for 380-520 words TOTAL where the provider budget allows, prioritizing meaningful source-bound comparisons over length. End after TWO specific, low-risk actions and a complete final sentence.
FACTS: D1 is primary: use the actual ascendant ruler and Moon. Anchor real D9 partnership and D10 career placements, plus major/minor dasha. Do not ignore other supplied VERIFIED thematic vargas: D2 resources, D3 initiative/close ties, D4 home, D7 children/creativity, D12 family roots, D16 comfort, D20 spiritual practice, D24 education, D27 resilience, D30 obstacles, D40 family themes, D45 values. Use source-bound focus ruler and comparison planet only, link each relevant life area back to D1 and explain it in natural language. Group them by domain; don't dump a numbered chart list or invent more placements. D60 is excluded from personalized claims.
Do not invent graha positions, varga placements, house lords, aspects, yogas, future dates, health conclusions or finances. Do not conflate D1 and Dn lords. D60 can appear only with explicit provisional sign-only facts; no D60 houses, karmic certainties or past lives.
Avoid Western-only planets, doom, guaranteed outcomes, empty praise and repetition. Present one credible strength and one possible tension where supported by evidence.
Return ONLY the finished Markdown narrative, no JSON, prompt explanation, raw fact inventory or disclaimer block.`;

const CLASSICS=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const houses=(p:{house:number;sign:number;degreesInSign:number;nakshatra?:string;pada?:number;retrograde?:boolean})=>
  'sign='+p.sign+',house='+p.house+',deg='+p.degreesInSign.toFixed(2)+
  (p.nakshatra?',nakshatra='+p.nakshatra+',pada='+p.pada:'')+(p.retrograde?',retrograde':'');
export function compactJyotishFacts(chart:CalculatedChart,asOf:string,includeClassical=true):string{
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
  ...(includeClassical?[compactClassicalReaderV8ForAi(chart,asOf)]:[]),
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
 /** Opt-in bounded improvement; full API route enables it for Groq only. */
 qualityRetry?:boolean;
 reader10?:Reader10Report;
 /** Optional safe, machine-readable diagnostics for local troubleshooting. */
 onDiagnostic?:(diagnostic:DirectDiagnostic)=>void;
};
type Result={provider:FreeProvider;model:string;text:string;reader10?:Reader10Report};
const PROVIDERS=new Set<FreeProvider>(['gemini','groq','openrouter']);
/** Production order is intentionally Gemini-first. A stale FREE_AI_ORDER must
 * never accidentally omit another already-configured free fallback; credential
 * and explicit free-tier eligibility checks still gate every actual request.
 * Tests may override order with DirectOptions.order to isolate a provider. */
export function productionDirectAiOrder(configured=process.env.FREE_AI_ORDER):FreeProvider[]{
 const requested=(configured||'').split(',').map(s=>s.trim().toLowerCase())
  .filter((s):s is FreeProvider=>PROVIDERS.has(s as FreeProvider));
 return [...new Set<FreeProvider>(['gemini',...requested.filter(p=>p!=='gemini'),'groq','openrouter'])];
}
const pickModel=(provider:FreeProvider)=>{
 if(provider==='gemini')return 'gemini-3.1-flash-lite';
 if(provider==='groq'){const allowed=new Set(['openai/gpt-oss-20b','openai/gpt-oss-120b']);const m=process.env.GROQ_MODEL||'openai/gpt-oss-20b';return allowed.has(m)?m:'openai/gpt-oss-20b';}
 const requested=process.env.OPENROUTER_FREE_MODEL||'openrouter/free';
 return requested==='openrouter/free'||/^[\w.-]+\/[\w.:-]+:free$/i.test(requested)?requested:'openrouter/free';
};
const urlFor=(p:FreeProvider)=>p==='gemini'?'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions':
 p==='groq'?'https://api.groq.com/openai/v1/chat/completions':'https://openrouter.ai/api/v1/chat/completions';
const redact=(reason:FreeFallbackReason,provider:FreeProvider)=>console.warn('Direct Jyotish: '+provider+' '+reason);
/** Provider-side 429s count toward OpenRouter's free usage allowance.
 * Never retry a 429 in the same consultation; suppress repeated attempts
 * across subsequent requests in this API worker for a bounded period. */
let openRouterCooldownUntil=0;
const openRouterModelCooldownUntil=new Map<string,number>();
export function openRouterRetryAfterMs(headers:Pick<Headers,'get'>,now=Date.now()):number{
 const raw=(headers.get('retry-after')||'').trim();
 const seconds=/^\d+(?:\.\d+)?$/.test(raw)?Number(raw):NaN;
 const date=raw&&!Number.isFinite(seconds)?Date.parse(raw):NaN;
 const requested=Number.isFinite(seconds)?seconds*1000:Number.isFinite(date)?date-now:0;
 return Math.min(30*60_000,Math.max(60_000,Math.ceil(requested)));
}
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
 const order=opts.order??productionDirectAiOrder().filter(provider=>
  provider!=='openrouter'||process.env.GALAXIORA_NATAL_OPENROUTER_DISABLED!=='1');
 const n6=opts.reader10?buildN6Brief(opts.reader10,chart):null;
 const priority=n6?null:planConsultationQuality(chart,asOf);
 const hasVerifiedVargas=Boolean(verifiedVargaSource(chart));
 const facts=n6?'':compactJyotishFacts(chart,asOf)+'\n\n'+compactQualityBrief(priority!);
 // The short free backup needs exact D1/D9/D10 and N4 evidence, not the 6.5 KB
 // Reader-8 literary exemplars already included in the deterministic report.
 const backupFacts=n6?'':compactJyotishFacts(chart,asOf,false)+'\n\n'+compactQualityBrief(priority!,3600);
 const permit=opts.limit||consumeFreeAiRequest;
 // Diagnostics are opt-in, bounded and never receive credentials or response text.
 const diagnostic=(provider:FreeProvider,stage:DirectDiagnostic['stage'],detail:string,httpStatus?:number)=>{
  try{opts.onDiagnostic?.({provider,stage,reason:detail,...(httpStatus===undefined?{}:{httpStatus})});}catch{}
  if(n6&&!opts.fetcher)console.info('N6_AI '+provider+' '+stage+' '+detail+(httpStatus===undefined?'':' status='+httpStatus));
 };
 // One bounded public request: preserve time for Gemini then the two backups.
 // Each corrective retry has its OWN timeout; do not reuse a stale AbortSignal.
 // Leave time for the deterministic report to reach the 180s web proxy.
 const deadline=Date.now()+150000;
 let reason:FreeFallbackReason='no_provider';
 providerLoop: for(const [index,provider] of order.entries()){
  const key=opts.keys?.[provider]??(provider==='gemini'?process.env.GEMINI_API_KEY:provider==='groq'?process.env.GROQ_API_KEY:process.env.OPENROUTER_API_KEY);
  const confirmed=opts.freeConfirmed?.[provider]??(provider==='gemini'?process.env.GEMINI_FREE_TIER_CONFIRMED==='1':
   provider==='groq'?process.env.GROQ_FREE_TIER_CONFIRMED==='1':true);
  if(!confirmed||!key?.trim()){
   diagnostic(provider,'config',!key?.trim()?'missing_key':'free_tier_unconfirmed');
   continue;
  }
  if(provider==='openrouter'&&!opts.fetcher&&
   (Date.now()<openRouterCooldownUntil||
    Date.now()<(openRouterModelCooldownUntil.get(pickModel(provider))||0))){
   reason='rate_limited';diagnostic(provider,'limit','provider_cooldown');continue;
  }
  if(!permit()){reason='hourly_limit';diagnostic(provider,'limit','hourly_limit');break;}
  let controller:AbortController|null=null;
  let timer:ReturnType<typeof setTimeout>|undefined;
  const model=pickModel(provider);
  let bestVerified:{result:Result;missing:number}|null=null;
  try{
   let correctiveReason='';
   // If a factually valid free response is thin on D9/D10, keep it as a safe
   // fallback while attempting one richer rewrite. A failed quality retry must
   // not turn an already accepted response into a local-Reader failure.
   // Free models frequently stop before a long requested consultation is complete.
   // Allow one bounded retry for selected incomplete responses.
   // Never retry HTTP failures or accept fabricated chart facts to manufacture success.
   for(let attempt=0;attempt<2;attempt++){
    if(attempt>0){
     // Keep a usable window for each remaining provider before spending a retry.
     if(deadline-Date.now()<=10000+30000*(order.length-index-1))break;
     if(!permit()){reason='hourly_limit';diagnostic(provider,'limit','hourly_limit');break;}
     console.warn('Direct Jyotish: '+provider+' retrying_incomplete_text');
    }
    if(timer!==undefined){clearTimeout(timer);timer=undefined;}
    const left=deadline-Date.now();
    if(left<=1500){
     reason='timeout';diagnostic(provider,'transport','total_budget_exhausted');
     break providerLoop;
    }
    controller=new AbortController();
    const providerTimeout=provider==='gemini'?65000:42000;
    const reservedForFallback=30000*(order.length-index-1);
    const timeout=Math.min(Math.max(1500,left-reservedForFallback),opts.timeoutMs??providerTimeout,attempt===1?25000:providerTimeout);
    timer=setTimeout(()=>controller?.abort(),timeout);
    const concise=attempt===1;
    const backup=provider!=='gemini'||concise;
    // Groq's reasoning budget is included in the completion token allocation.
    // Keep reserve tokens for an actual response instead of ordering 650 words.
    const maxCompletion=n6?(provider==='groq'?5000:5200):provider==='groq'?(concise?2800:3600):
      provider==='openrouter'?3400:(concise?2400:3400);
    const instructions=(concise?
      DIRECT_JYOTISH_BACKUP_INSTRUCTION+'\nFor this corrective attempt: only 200-280 words, but finish all five sections and keep two verified additional varga references when provided. End with a complete last sentence.':
      provider==='openrouter'?
       DIRECT_JYOTISH_BACKUP_INSTRUCTION.replace('380-520 words TOTAL','260-320 words TOTAL')+
        '\nGive the finished prose immediately. Use short sections and place the two additional divisions near the beginning.':
       backup?DIRECT_JYOTISH_BACKUP_INSTRUCTION:DIRECT_JYOTISH_INSTRUCTION)+
      (hasVerifiedVargas?'\nAcross the thematic sections, use the evidence for multiple relevant verified divisions beyond D1/D9/D10 (D2, D3, D4, D7, D12, D16, D20, D24, D27, D30, D40, D45). First explicitly connect at least TWO different supplied new divisions using their D-codes to their actual D1 themes, then synthesize further supplied divisions by life area as token budget allows. Do not use D60 as an individual chart and never invent a Dn placement.':'')+
      (correctiveReason==='unsupported_divisional_chart'?
       '\nCORRECTION: Your prior draft referred to an unverified D-chart. Discard that draft. Never mention D60 or any division not explicitly present in the supplied verified facts. Only the supplied verified D-codes are permitted; do not invent other charts.':'')+
      (correctiveReason==='missing_n4_cross_varga_synthesis'?
       '\nCORRECTION: The previous draft omitted the required source-bound N4 comparison. Cite exactly two different additional verified D-codes appearing in the provided facts and connect them to D1; do not invent placements.':'')+
      (correctiveReason==='missing_d9_d10_analysis'?
       '\nCORRECTION: The previous version omitted real D9 and/or D10 interpretation. In the relationship section, interpret one VERIFIED D9 graha, its sign and house from the facts. In the career section, interpret one VERIFIED D10 graha, its sign and house. Do not merely list D9 and D10 codes or invent placements. Retain the two additional verified N4 divisions and end in a complete sentence.':'');
    const response=await (opts.fetcher||fetch)(urlFor(provider),{
     method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json','Authorization':'Bearer '+key.trim()},
     body:JSON.stringify({model,
      ...(provider==='groq'?{max_completion_tokens:maxCompletion,reasoning_effort:'low',include_reasoning:false}:{max_tokens:maxCompletion}),
      // This opt-in free endpoint can otherwise spend the completion budget on reasoning.
      ...(provider==='openrouter'&&model==='nvidia/nemotron-3.5-lightning:free'?{reasoning:{enabled:false}}:{}),
      temperature:n6?0.35:concise?0.45:0.6,
      ...(n6&&provider==='groq'?{response_format:{type:'json_object'}}:{}),
      messages:[{role:'system',content:n6?N6_PROMPT+(correctiveReason?'\nPrevious response failed '+correctiveReason+'. Produce the complete valid JSON with every required ID and no extra text.':''):instructions},
       {role:'user',content:'Write the requested full consultation in '+(lang==='uk'?'natural Ukrainian':'natural English')+
        '. Here are ONLY verified calculation facts:\n'+(n6?JSON.stringify(n6):backup?backupFacts:facts)} ]})
    });
    if(!response.ok){
     if(provider==='openrouter'&&response.status===429){
      let source:ReturnType<typeof openRouterLimitSource>='unknown';
      try{source=openRouterLimitSource(await response.json());}
      catch{/* Only documented safe enum; no raw body or credentials logged. */}
      diagnostic(provider,'limit',openRouterLimitClass(source));
      if(!opts.fetcher){
       const delay=openRouterRetryAfterMs(response.headers);
       if(source==='upstream_provider_shared_pool')
        openRouterModelCooldownUntil.set(model,Date.now()+delay);
       else if(source==='openrouter_free_tier_daily'){
        const now=Date.now(),today=new Date(now);
        openRouterCooldownUntil=Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),today.getUTCDate()+1)+3000;
       }else openRouterCooldownUntil=Date.now()+delay;
      }
     }
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
    if(n6&&opts.reader10){
     const checked=choice?.finish_reason==='length'?{reader:null,reason:'token_limit'}:inspectN6Response(rawContent,opts.reader10,n6);
     const reader10=checked.reader;
     if(!reader10){reason='invalid_response';const code='n6_'+checked.reason;diagnostic(provider,'validation',code);
      if(attempt===0&&['json_syntax','token_limit','chapter_count','chapter_shape'].includes(checked.reason)&&deadline-Date.now()>45000+reservedForFallback){correctiveReason=code;continue;}
      break;
     }
     const text=reader10.chapters.map(c=>[c.lead,...c.paragraphs].join('\n')).join('\n\n');
     try{await opts.onUsage?.({provider,model:parsed?.model||model,outcome:'returned'});}catch{}
     diagnostic(provider,'success','n6_complete');
     return {result:{provider,model:parsed?.model||model,text,reader10}};
    }
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
     const recoverable=code==='too_short'||code==='unfinished'||
      ((provider==='gemini'||provider==='groq')&&code==='missing_n4_cross_varga_synthesis')||
      (provider==='groq'&&code==='unsupported_divisional_chart')||
      (provider==='openrouter'&&code==='token_limit');
     if(attempt===0&&recoverable){correctiveReason=code;continue;}
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
    const candidate:Result={provider,model:parsed?.model||model,text:content.trim()};
    const missing=['missing_d9_analysis','missing_d10_analysis'].filter(code=>review.codes.includes(code)).length;
    if(opts.qualityRetry===true&&provider==='groq'&&missing>0&&attempt===0&&deadline-Date.now()>45000){
     bestVerified={result:candidate,missing};
     correctiveReason='missing_d9_d10_analysis';
     diagnostic(provider,'validation','missing_d9_d10_analysis');
     continue;
    }
    const selected=bestVerified&&bestVerified.missing<missing?bestVerified.result:candidate;
    try{await opts.onUsage?.({provider,model:selected.model,outcome:'returned'});}catch{}
    diagnostic(provider,'success',selected===candidate?'complete':'complete_quality_fallback');
    return {result:selected};
   }
  }catch(error){
   reason=controller?.signal.aborted?'timeout':'network';
   diagnostic(provider,'transport',reason);
   redact(reason,provider);
  }
  finally{if(timer!==undefined)clearTimeout(timer);}
  // A corrective request may fail its validation or hit the free quota.
  // Retain the strictly source-verified first answer rather than losing AI.
  if(bestVerified){
   try{await opts.onUsage?.({provider,model:bestVerified.result.model,outcome:'returned'});}catch{}
   diagnostic(provider,'success','complete_quality_fallback');
   return {result:bestVerified.result};
  }
 }
 return {result:null,reason};
}
