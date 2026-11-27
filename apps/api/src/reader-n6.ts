/** N6 additive adapter: original Reader 10 rules and presentation remain the baseline. */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {buildReader10,type Reader10Report,type Reader10Chapter} from './reader10.ts';
import {buildReader10Facts,PLANETS,aspectedHouses} from './reader10-facts.ts';
export const N6_VERSION='n6-reader-v1' as const;
type Lang='uk'|'en';
export {timingChapter} from './reader-n6-timing.ts';
import {timingChapter} from './reader-n6-timing.ts';
import {verifiedVargaSource} from './reader-varga-n4.ts';
import {buildVargaIntelligence} from './reader-n63-vargas.ts';
import {PLANET_NAME,SIGN_NAME} from './reader10-texts.ts';
export const N6_QUALITY_VERSION='n6-quality-4' as const;
export function buildN6Reader(chart:CalculatedChart,lang:Lang,asOf:string,exactTime:boolean):Reader10Report|null{
 const base=buildReader10(exactTime?chart:{...chart,n4D60:undefined} as CalculatedChart,lang);
 if(!base)return null;
 return {...base,chapters:[...base.chapters.slice(0,-1),timingChapter(chart,lang,asOf),base.chapters[base.chapters.length-1]]};
}
type Evidence={id:string;text:string};
type BriefChapter={id:string;lead:string;paragraphs:string[];evidence:Evidence[];required:string[];minWords:number;minParagraphs:number};
export type N6Brief={version:typeof N6_VERSION;language:Lang;chapters:BriefChapter[];context:Evidence[]};
export function buildN6Brief(reader:Reader10Report,chart?:CalculatedChart,asOf?:string):N6Brief{
 const context:Evidence[]=[];
 const uk=reader.language==='uk';
 const allowD60=Boolean(reader.chapters.find(c=>c.id==='path')?.details?.paragraphs.some(p=>/D60\s*\(/.test(p)));
 const analysis=chart?buildVargaIntelligence(chart,reader.language,allowD60,asOf):null;
 // Shared chart-specific patterns, only from the same source-bound calculation.
 // Never send birth input, degrees of birth, coordinates, name or place.
 if(chart&&verifiedVargaSource(chart)){
  const f=buildReader10Facts(chart),all=PLANETS.map(n=>f.planets[n]);
  const label=(p:typeof all[number])=>PLANET_NAME[p.name][reader.language];
  const description=(p:typeof all[number])=>label(p)+', '+SIGN_NAME[p.sign-1][reader.language]+', '+(uk?p.house+'-й дім':'house '+p.house)+(p.rules.length?(uk?', управитель домів ':', rules houses ')+p.rules.join('/'):'')+(p.dignity==='exalted'?(uk?', екзальтація':', exalted'):p.dignity==='debilitated'?(uk?', падіння':', debilitated'):p.dignity==='own'?(uk?', власний знак':', own sign'):'');
  const clusters=Array.from({length:12},(_,i)=>all.filter(p=>p.house===i+1)).filter(g=>g.length>=2).sort((a,b)=>b.length-a.length);
  for(const g of clusters.slice(0,3)){
   context.push({id:'shared.cluster'+g[0].house,text:(uk?'D1: концентрація в одному цілознаковому домі (не обов’язково тісне з’єднання): ':'D1 concentration (same whole-sign house, not necessarily close): ')+g.map(description).join('; ')+'.'});
   const pairs=g.flatMap((a,i)=>g.slice(i+1).map(b=>({a,b,d:Math.abs(a.degrees-b.degrees)}))).sort((a,b)=>a.d-b.d).filter(p=>p.d<=8).slice(0,3);
   for(const q of pairs)context.push({id:'shared.pair'+q.a.name+q.b.name,text:(uk?'D1: близькість у знаку ':'D1 same-sign proximity ')+label(q.a)+' / '+label(q.b)+' '+q.d.toFixed(2)+'°'+(uk?'; редакційний поріг близькості, не підтвердження йоги чи спалення.':'; editorial proximity threshold only, not a certified yoga or combustion.')});
  }
  context.push({id:'shared.d1Factors',text:(uk?'D1: усі грахи, їх управління й класичні аспекти на доми: ':'D1: all grahas, lordships and classical aspects to houses: ')+all.map(p=>description(p)+(uk?', аспекти на доми ':', aspects houses ')+(aspectedHouses(p.name,p.house).join('/')||'—')).join('; ')+'.'});
  context.push({id:'shared.lagnaChain',text:(uk?'D1: ланцюжок диспозиторів управителя лагни: ':'D1 lagna lord dispositor sequence: ')+f.lagnaLordChain.map(n=>description(f.planets[n])).join(' -> ')+'.'});
  const major=all.filter(p=>p.rules.some(h=>[1,2,4,5,7,9,10].includes(h)));
  context.push({id:'shared.lordships',text:(uk?'D1: тематичні управителі: ':'D1 thematic rulers: ')+major.map(description).join('; ')+'.'});
  if(f.yogakaraka)context.push({id:'shared.yogakaraka',text:(uk?'D1: йога-карака: ':'D1 yogakaraka: ')+description(f.yogakaraka)+'.'});
  if(f.aspectsOnMoon.length)context.push({id:'shared.moonAspects',text:(uk?'D1: класичні цілознакові аспекти на Місяць: ':'D1 classical whole-sign aspects on Moon: ')+f.aspectsOnMoon.map(description).join('; ')+'.'});
 }
 if(analysis)context.push(...analysis.patterns);
 return {version:N6_VERSION,language:reader.language,context,chapters:reader.chapters.map(c=>{
  const evidence:Evidence[]=(c.details?.paragraphs||[]).flatMap(text=>text.split(/\s+(?=D(?:2|3|4|7|9|10|12|16|20|24|27|30|40|45|60)\s*\()/u)).map((text,i)=>({id:c.id+'.'+i,text:c.id==='timing'?text.replace(/\b\d{4}-\d{2}-\d{2}\b/g,'[period boundary]'):text})).filter(e=>!/^D60\s*\(/.test(e.text));
  if(!evidence.length){
   if(c.id==='summary'&&context.length){
    for(const item of context.filter(e=>['shared.lagnaChain','shared.lordships','shared.moonAspects','shared.yogakaraka'].includes(e.id)||e.id.startsWith('shared.cluster')))evidence.push({id:'summary.'+evidence.length,text:item.text});
   }
   if(!evidence.length)evidence.push({id:c.id+'.reader',text:uk?'Немає окремих підтверджених фактів цього розділу. Не вигадуйте їх.':'No separate verified facts for this chapter. Do not invent them.'});
  }
  const richTiming=c.id==='timing'&&Boolean(c.details)&&evidence.length>=5;
  const core=evidence.slice(0,richTiming?5:2);
  const dominant=context.find(e=>e.id.startsWith('shared.cluster'));
  if(dominant&&['self','path'].includes(c.id))core.push(dominant);
  if(c.id==='summary'&&dominant&&!core.some(e=>e.text===dominant.text))core.push(dominant);
  for(const division of c.id==='work'?[10,24]:c.id==='love'?[9,7]:c.id==='money'?[2,16]:c.id==='home'?[4,12]:c.id==='path'?[20,3]:[]){
   const item=evidence.find(e=>e.text.includes('D'+division+' ('));if(item&&!core.includes(item))core.push(item);
  }
  const thematic=analysis?.byArea[c.id as keyof typeof analysis.byArea]||[];
  evidence.push(...thematic,...(c.id==='timing'?analysis?.timing||[]:[]),...(c.id==='path'&&analysis?.d60?[analysis.d60]:[]));
  // One new thematic comparison is mandatory for each relevant life chapter; the rest remain available.
  // Do not make optional D60 or unavailable timing a gate for an otherwise valid report.
  const primary={money:2,work:10,love:9,home:4,path:20} as const;
  if(c.id in primary){const item=thematic.find(e=>e.id===c.id+'.v'+primary[c.id as keyof typeof primary]);if(item)core.push(item);}
  return {id:c.id,lead:c.lead,paragraphs:c.paragraphs,evidence,required:core.map(e=>e.id),minWords:richTiming?85:c.id==='summary'||!c.details?20:30,minParagraphs:richTiming?3:2};
 })};
}
export const N6_PROMPT='You are an expert Parashari Jyotish interpreter and careful Ukrainian/English editor. Return ONLY JSON {"chapters":[{"id":"self","lead":"A complete sentence.","paragraphs":[{"text":"A complete paragraph.","evidenceIds":["self.0","self.1"]}]}]}. Include all eight supplied chapter IDs exactly once in order. Each chapter uses its listed required evidence IDs across its paragraphs, plus any useful optional local evidence or shared context. Other chapters’ local IDs are not allowed. Shared facts must be used only where they actually explain the topic. Do not calculate or invent facts. Write an original consultation from the supplied evidence, not a placement-by-placement paraphrase. Start each chapter with its most distinctive conclusion. Explain how two or more relevant indicators reinforce or constrain each other and what that interaction could look like in daily life. Use the strongest verified concentration and dispositor links where relevant, without treating a shared whole-sign house as a close conjunction. Assess functional lordships and dignity in context; a favorable aspect does not cancel every challenge. Do not turn a placement into a fixed profession, guaranteed marriage, wealth or family history. Use concrete, chart-specific everyday situations as possibilities, not biography. In money distinguish earning opportunities from retention and effort; in work connect abilities, work conditions and skills; in love explain needs and reciprocal responsibilities rather than asserting facts about a partner; in home distinguish security from professional ambition. In path reconcile opportunity with sustained effort. The summary must connect the dominant pattern, its main tension and a concrete practical focus, not repeat headings or generic praise. Use divisional evidence as a modifier of the natal theme, not an independent prediction. Each thematic .v evidence was selected from all nine grahas, not merely the first planet. Explain the strongest relationship or contrast between those placements and D1; a repeated sign across vargas is correlated evidence, not independent confirmation. For Hora use only Sun/Moon categories, never ordinary sign dignity or houses. For conditional D60 use only supplied sign comparisons, never houses, ascendant or karma claims. Do not invent a conclusion for every chart; integrate relevant supporting vargas without enumerating them. Analyze partnership and creativity, career and education, resources and comfort, home and family, spiritual practice and resilience through the corresponding supplied chart evidence. Do not treat editorial strength labels as classical guarantees. In timing, distinguish the long cycle from the current shorter cycle, synthesize both rulers’ actual D1 houses and lordships, discuss the specific interaction and aspects or verified D9/D10 evidence when relevant, and end with a realistic low-risk practical focus. For a supplied timing chapter with minimum 85 words write 3–4 paragraphs and aim for 100–140 words. If a period is unavailable, do not infer it. For other chapters write 2–3 paragraphs with a distinctive lead. Aim for 520–700 words total. Plain natural language: use no digits in lead or paragraph text. Describe divisional evidence by its life theme, never by its technical label. Put the exact evidence IDs only in evidenceIds arrays, never inline. Do not use raw dates, technical jargon, Markdown, links or HTML in prose; the server renders technical facts separately. D60 only as a supplied provisional sign comparison, never a boundary warning as evidence for personality. No guaranteed outcomes, invented biography, past lives, medical or investment directives. Avoid empty praise, repeated stock phrases and automatic fatalism. Proofread Ukrainian case agreement. Only the JSON object, no commentary.';
/** Evidence-only input for both providers. Local prose remains in memory for comparison, never in the prompt. */
export function n6ProviderPayload(brief:N6Brief,_compact:boolean):string{
 return JSON.stringify({...brief,chapters:brief.chapters.map(({lead,paragraphs,...chapter})=>chapter)});
}
export const N6_COMPACT_PROMPT='Return 400–520 words total. Keep the current life period at 85–110 words when required; use three concise paragraphs there. Prioritize the required IDs and the strongest shared connections over repeating all optional facts. The full JSON object must finish.';
type Draft={id:string;lead:string;paragraphs:{text:string;evidenceIds:string[]}[]};
/** Only harmless typography is normalized. Technical claims, digits, markup,
 * unsupported planets and evidence violations are never normalized away. */
function prose(x:unknown,max:number,technical?:ReadonlySet<number>):{text:string;reason:string}{
 if(typeof x!=='string')return {text:'',reason:'plain_type'};
 let text=x.trim().replace(/\s+/gu,' ');
 if(text.length<15||text.length>max)return {text:'',reason:'plain_length'};
 if(technical){
  // Numerical typography is not a factual error. Allow ordinary numerals and
  // chart references present in this chapter's verified evidence. Do not allow
  // an unavailable divisional chart, inline source IDs, exact dates or invented
  // numerical precision. This is not a semantic fact checker.
  for(const m of text.matchAll(/(?<![\p{L}\p{N}])(?:D|Д)[ -]?(\d{1,3})(?![\p{L}\p{N}])/giu)){
   if(!technical.has(Number(m[1])))return {text:'',reason:'plain_unknown_division'};
  }
  if(!technical.has(60)&&/Shashtia?msha|Shashtiamsa|Шаштіамш|Шаштьямш/iu.test(text))return {text:'',reason:'plain_unknown_division'};
  if(/\b(?:19|20)\d{2}\b|\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b|\d\s*[%°′″]|(?:[$€₴]\s*\d)|\b(?:self|money|work|love|home|path|timing|summary|shared)\.(?:v?\d+|[a-z][a-z0-9]*)\b/iu.test(text))return {text:'',reason:'plain_numeric_claim'};
 }else if(/[\p{N}]/u.test(text))return {text:'',reason:'plain_digits'};
 if(/[<>#\x60\[\]{}*]|https?:/iu.test(text))return {text:'',reason:'plain_markup'};
 if(/\b(?:Pluto|Uranus|Neptune|Chiron|Lilith)\b|Плутон|Уран|Нептун|Хірон|Ліліт/iu.test(text))return {text:'',reason:'plain_unsupported_planet'};
 if(!/[.!?…]["”»’)]?$/u.test(text)){
  // A complete JSON string with missing terminal punctuation is not truncated
  // transport. The caller still rejects finish_reason=length unconditionally.
  if(/\p{L}["”»’)]?$/u.test(text)&&text.length<max)text=text.replace(/(["”»’)]?)$/u,'.$1');
  else return {text:'',reason:'plain_ending'};
 }
 return {text,reason:'ok'};
}
/** Detect near-verbatim reuse even if the model merges or splits paragraphs. */
function copiedProse(original:Reader10Chapter,lead:string,paragraphs:string[]):boolean{
 const tokens=(s:string)=>s.toLowerCase().match(/[\p{L}]+/gu)||[];
 const old=tokens([original.lead,...original.paragraphs].join(' ')),next=tokens([lead,...paragraphs].join(' '));
 if(old.length<25||next.length<25)return false;
 const grams=(w:string[])=>w.slice(0,-4).map((_,i)=>w.slice(i,i+5).join(' '));
 const known=new Set(grams(old)),candidate=grams(next);
 return candidate.filter(g=>known.has(g)).length/candidate.length>=0.72;
}
type Validation={reader:Reader10Report|null;reason:string;chapter?:Reader10Chapter['id']};
function decode(raw:string):{chapters:unknown[]}|null{
 if(raw.length>36000)return null;
 try{
  const trimmed=raw.trim().replace(/^\uFEFF/,'');
  const fenced=trimmed.match(/^\x60{3}(?:json)?\s*([\s\S]*?)\s*\x60{3}$/i);
  const x=JSON.parse(fenced?fenced[1]:trimmed) as {chapters?:unknown}|null;
  return Array.isArray(x?.chapters)?{chapters:x.chapters}:null;
 }catch{return null;}
}
export function inspectN6Response(raw:string,reader:Reader10Report,brief:N6Brief,repairProbe=false,groqPresentation=false):Validation{
 let chapter:Reader10Chapter['id']|undefined;
 const fail=(reason:string):Validation=>({reader:null,reason,...(chapter?{chapter}:{})});
 if(raw.length>36000)return fail('oversized');
 const x=decode(raw);
 if(!x)return fail('json_syntax');
 const chapters=x.chapters;
 if(!Array.isArray(chapters)||chapters.length!==reader.chapters.length)return fail('chapter_count');
 const seen=new Set<string>(),result:Reader10Chapter[]=[];
 let modified=0;
 const words=(s:string)=>s.trim().split(/\s+/u).length;
 const norm=(s:string)=>s.toLowerCase().replace(/\s+/g,' ').trim();
 for(let i=0;i<reader.chapters.length;i++){
  const original=reader.chapters[i],c=chapters[i] as Draft|null,spec=brief.chapters[i];
  chapter=original.id;
  const allowed=new Set([...spec.evidence,...brief.context].map(e=>e.id));
  const technical=groqPresentation?new Set([...spec.evidence,...brief.context].flatMap(e=>[...e.text.matchAll(/\bD(\d{1,3})\b/g)].map(m=>Number(m[1])))):undefined;
  if(technical&&!spec.evidence.some(e=>e.id==='path.v60'))technical.delete(60);
  if(!c||c.id!==original.id)return fail('chapter_order');
  const lead=prose(c.lead,350,technical);if(lead.reason!=='ok')return fail(lead.reason);
  if(!Array.isArray(c.paragraphs)||c.paragraphs.length<spec.minParagraphs||c.paragraphs.length>(spec.minParagraphs===3?4:3))return fail('chapter_shape');
  const normalizedLead=norm(lead.text);if(seen.has(normalizedLead))return fail('repeated_text');seen.add(normalizedLead);
  const all=new Set<string>(),paragraphs:string[]=[];
  for(const p of c.paragraphs){
   const checked=prose(p?.text,1300,technical);if(checked.reason!=='ok')return fail(checked.reason);
   paragraphs.push(checked.text);
   if(!Array.isArray(p.evidenceIds)||!p.evidenceIds.length||p.evidenceIds.some(id=>typeof id!=='string'||!allowed.has(id)))return fail('unknown_evidence');
   for(const id of p.evidenceIds)all.add(id);
   const normalized=norm(checked.text);if(seen.has(normalized))return fail('repeated_text');seen.add(normalized);
  }
  if(spec.required.some(id=>!all.has(id)))return fail('missing_required_evidence');
  if(words([lead.text,...paragraphs].join(' '))<spec.minWords)return fail('thin_chapter');
  // Reject a verbatim classical copy: never label unmodified local prose as an AI enhancement.
  const changed=norm(lead.text)!==norm(original.lead)||norm(paragraphs.join('\n'))!==norm(original.paragraphs.join('\n'));
  if(copiedProse(original,lead.text,paragraphs))return fail('near_copy');
  if(changed)modified++;
  if(!changed&&spec.minParagraphs===3)return fail('unchanged_timing');
  const shared=[...new Set([...brief.context.filter(e=>all.has(e.id)),...spec.evidence.filter(e=>all.has(e.id)&&(original.id==='summary'&&!original.details||/\.v\d+$/.test(e.id)))].map(e=>e.text))];
  const details=shared.length?{paragraphs:[...(original.details?.paragraphs||[]),...shared],basis:original.details?.basis||(reader.language==='uk'?'Основа: перевірені спільні закономірності D1.':'Basis: verified shared D1 patterns.'),links:original.details?.links||[]}:original.details;
  result.push({...original,details,lead:lead.text,paragraphs,evidenceIds:c.paragraphs.map(p=>p.evidenceIds)});
 }
 chapter=undefined;
 if(!repairProbe&&modified<Math.ceil(reader.chapters.length/2))return fail('unchanged_classic');
 return {reader:{...reader,chapters:result},reason:'ok'};
}
export function parseN6Response(raw:string,reader:Reader10Report,brief:N6Brief):Reader10Report|null{
 return inspectN6Response(raw,reader,brief).reader;
}

export type N6Repair={brief:N6Brief;original:unknown[];ids:Reader10Chapter['id'][];issues:string[]};
export type N6RepairDecision={repair:N6Repair|null;reason:'ready'|'invalid_document'|'chapter_order'|'no_local_failure'|'cross_document_failure'};
/** Repair the failed chapters in one bounded request. No rejected prose
 * is sent back to any provider. The combined result must pass the full gate. */
export function inspectN6Repair(raw:string,reader:Reader10Report,brief:N6Brief,groqPresentation=false):N6RepairDecision{
 const x=decode(raw);
 if(!x||x.chapters.length!==reader.chapters.length)return {repair:null,reason:'invalid_document'};
 const ids:Reader10Chapter['id'][]=[],issues:string[]=[];
 const accepted:unknown[]=[],acceptedOriginal:Reader10Chapter[]=[],acceptedSpecs:BriefChapter[]=[];
 for(let i=0;i<reader.chapters.length;i++){
  const c=reader.chapters[i],draft=x.chapters[i] as Draft|null;
  if(!draft||draft.id!==c.id)return {repair:null,reason:'chapter_order'};
  const check=inspectN6Response(JSON.stringify({chapters:[...accepted,draft]}),{...reader,chapters:[...acceptedOriginal,c]},{...brief,chapters:[...acceptedSpecs,brief.chapters[i]]},true,groqPresentation);
  if(check.reader){accepted.push(draft);acceptedOriginal.push(c);acceptedSpecs.push(brief.chapters[i]);continue;}
  // Regenerate the entire invalid chapter from trusted input, including when
  // the model hallucinated an evidence ID. Never send or accept its bad prose.
  // Up to all eight chapters may need correction: the retry count, time and
  // output tokens, not an arbitrary three-chapter cutoff, bound this work.
  ids.push(c.id);issues.push(c.id+':'+check.reason);
 }
 if(!ids.length){
  const whole=inspectN6Response(raw,reader,brief,false,groqPresentation);
  if(whole.reader)return {repair:null,reason:'no_local_failure'};
  // All chapters individually valid but the document is too close to classic.
  return {repair:null,reason:'cross_document_failure'};
 }
 return {repair:{brief:{...brief,chapters:brief.chapters.filter(c=>ids.includes(c.id as Reader10Chapter['id']))},original:x.chapters,ids,issues},reason:'ready'};
}
export function planN6Repair(raw:string,reader:Reader10Report,brief:N6Brief):N6Repair|null{
 return inspectN6Repair(raw,reader,brief).repair;
}
export function mergeN6Repair(raw:string,repair:N6Repair):string|null{
 const x=decode(raw);
 if(!x||x.chapters.length!==repair.ids.length||x.chapters.some((c,i)=>(c as Draft|null)?.id!==repair.ids[i]))return null;
 const updated=new Map(repair.ids.map((id,i)=>[id,x.chapters[i]]));
 return JSON.stringify({chapters:repair.original.map(c=>updated.get((c as Draft).id as Reader10Chapter['id'])??c)});
}
export const N6_REPAIR_PROMPT='Return ONLY JSON {"chapters":[{"id":"requested chapter id","lead":"A complete sentence.","paragraphs":[{"text":"A complete paragraph.","evidenceIds":["provided evidence id"]}]}]}. Return only the requested chapters in the supplied order. Use their required evidence IDs, minimum words and paragraph counts. Do not invent or recalculate facts. Write original analysis from the verified local and shared evidence, never reuse classical wording or list isolated factors; explain how competing factors interact, describe an everyday implication, and do not promise wealth, marriage, career success or other outcomes, and retain the distinct long and short current periods if timing is requested. Use three concise paragraphs and 85–110 words for rich timing. Other chapters use two or three paragraphs. Use ordinary prose: no digits at all in lead or text, no chart labels or evidence citations in prose, no dates, links, Markdown, HTML or unsupported planets. Describe a chart factor by its life theme rather than writing its technical label. Put the exact evidence IDs only in evidenceIds arrays. Never copy their labels or technical notation into prose. End all prose with punctuation. No guaranteed events, fabricated biography, medical or investment directives. Do not return other chapters.';

/** Use an English fact representation for Groq's smaller token budget when
 * source IDs and required sets match exactly. Output language is unchanged.
 * The local original-language brief remains the validation/proof authority. */
export function groqN6Brief(brief:N6Brief,chart:CalculatedChart,asOf:string):N6Brief{
 if(brief.language==='en')return brief;
 const exact=brief.chapters.some(c=>c.evidence.some(e=>e.id==='path.v60'));
 const english=buildN6Reader(chart,'en',asOf,exact);
 if(!english)return brief;
 const alternate=buildN6Brief(english,chart,asOf);
 const same=(a:string[],b:string[])=>a.length===b.length&&a.every((x,i)=>x===b[i]);
 if(!same(brief.context.map(e=>e.id),alternate.context.map(e=>e.id))||
  !same(brief.chapters.map(c=>c.id),alternate.chapters.map(c=>c.id)))return brief;
 for(let i=0;i<brief.chapters.length;i++){
  const a=brief.chapters[i],b=alternate.chapters[i];
  if(!same(a.evidence.map(e=>e.id),b.evidence.map(e=>e.id))||!same(a.required,b.required)||a.minWords!==b.minWords||a.minParagraphs!==b.minParagraphs)return brief;
 }
 return {...alternate,language:brief.language};
}
/** Retain every thematic and required evidence ID, but remove duplicate text
 * where the same exact fact already appears in the shared context. */
export function groqN6Payload(brief:N6Brief):string{
 const shared=new Map(brief.context.map(e=>[e.text,e.id]));
 return JSON.stringify({...brief,chapters:brief.chapters.map(({lead,paragraphs,...c})=>({...c,evidence:c.evidence.map(e=>{
  const ref=shared.get(e.text);return ref?{id:e.id,text:'Same verified fact as '+ref}:e;
 })}))});
}
export const N631_GROQ_PROMPT='Return only JSON {"chapters":[{"id":"requested id","lead":"Complete sentence.","paragraphs":[{"text":"Complete paragraph.","evidenceIds":["provided id"]}]}]}. Output in the requested language, not the language of the facts. All requested chapters in order; include every required ID in that chapter, no invented IDs. Shared evidence can be cited where relevant. Write original, specific synthesis, not a list of placements: connect natal factors to thematic vargas, explain support and tension, and give a concrete everyday implication. D1 is primary; repeated signs are correlated, not independent proof. Hora is Sun/Moon categories only. D60 conditional sign comparison only if supplied, never D60 houses, lagna or karma. No invented biography, event guarantees, medical or investment advice. Ordinary numerals and verified D-chart labels are allowed if useful; prefer natural language, no inline evidence IDs, raw dates, degrees, percentages, money amounts, Markdown or HTML. Use exactly two paragraphs per ordinary chapter and three for rich timing, separate from lead. Honor supplied minimum words; rich timing 85–110 words, distinct long and short rulers and their interaction. Full report 400–520 words; for a subset write only those chapters. End every sentence and finish the JSON.';
