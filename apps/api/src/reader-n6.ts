/** N6 additive adapter: original Reader 10 rules and presentation remain the baseline. */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {buildReader10,type Reader10Report,type Reader10Chapter} from './reader10.ts';
import {buildReader10Facts,PLANETS} from './reader10-facts.ts';
export const N6_VERSION='n6-reader-v1' as const;
type Lang='uk'|'en';
export {timingChapter} from './reader-n6-timing.ts';
import {timingChapter} from './reader-n6-timing.ts';
import {verifiedVargaSource} from './reader-varga-n4.ts';
import {PLANET_NAME,SIGN_NAME} from './reader10-texts.ts';
export const N6_QUALITY_VERSION='n6-quality-2' as const;
export function buildN6Reader(chart:CalculatedChart,lang:Lang,asOf:string,exactTime:boolean):Reader10Report|null{
 const base=buildReader10(exactTime?chart:{...chart,n4D60:undefined} as CalculatedChart,lang);
 if(!base)return null;
 return {...base,chapters:[...base.chapters.slice(0,-1),timingChapter(chart,lang,asOf),base.chapters[base.chapters.length-1]]};
}
type Evidence={id:string;text:string};
type BriefChapter={id:string;lead:string;paragraphs:string[];evidence:Evidence[];required:string[];minWords:number;minParagraphs:number};
export type N6Brief={version:typeof N6_VERSION;language:Lang;chapters:BriefChapter[];context:Evidence[]};
export function buildN6Brief(reader:Reader10Report,chart?:CalculatedChart):N6Brief{
 const context:Evidence[]=[];
 const uk=reader.language==='uk';
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
  context.push({id:'shared.lagnaChain',text:(uk?'D1: ланцюжок диспозиторів управителя лагни: ':'D1 lagna lord dispositor sequence: ')+f.lagnaLordChain.map(n=>description(f.planets[n])).join(' -> ')+'.'});
  const major=all.filter(p=>p.rules.some(h=>[1,2,4,5,7,9,10].includes(h)));
  context.push({id:'shared.lordships',text:(uk?'D1: тематичні управителі: ':'D1 thematic rulers: ')+major.map(description).join('; ')+'.'});
  if(f.yogakaraka)context.push({id:'shared.yogakaraka',text:(uk?'D1: йога-карака: ':'D1 yogakaraka: ')+description(f.yogakaraka)+'.'});
  if(f.aspectsOnMoon.length)context.push({id:'shared.moonAspects',text:(uk?'D1: класичні цілознакові аспекти на Місяць: ':'D1 classical whole-sign aspects on Moon: ')+f.aspectsOnMoon.map(description).join('; ')+'.'});
 }
 return {version:N6_VERSION,language:reader.language,context,chapters:reader.chapters.map(c=>{
  const evidence:Evidence[]=(c.details?.paragraphs||[]).flatMap(text=>text.split(/\s+(?=D(?:2|3|4|7|9|10|12|16|20|24|27|30|40|45|60)\s*\()/u)).map((text,i)=>({id:c.id+'.'+i,text:c.id==='timing'?text.replace(/\b\d{4}-\d{2}-\d{2}\b/g,'[period boundary]'):text}));
  if(!evidence.length)evidence.push({id:c.id+'.reader',text:[c.lead,...c.paragraphs].join(' ')});
  const richTiming=c.id==='timing'&&Boolean(c.details)&&evidence.length>=5;
  const core=evidence.slice(0,richTiming?5:2);
  for(const division of c.id==='work'?[10,24]:c.id==='love'?[9,7]:[]){
   const item=evidence.find(e=>e.text.includes('D'+division+' ('));if(item&&!core.includes(item))core.push(item);
  }
  return {id:c.id,lead:c.lead,paragraphs:c.paragraphs,evidence,required:core.map(e=>e.id),minWords:richTiming?85:c.id==='summary'||!c.details?20:30,minParagraphs:richTiming?3:2};
 })};
}
export const N6_PROMPT='You are an expert Parashari Jyotish interpreter and careful Ukrainian/English editor. Return ONLY JSON {"chapters":[{"id":"self","lead":"A complete sentence.","paragraphs":[{"text":"A complete paragraph.","evidenceIds":["self.0","self.1"]}]}]}. Include all eight supplied chapter IDs exactly once in order. Each chapter uses its listed required evidence IDs across its paragraphs, plus any useful optional local evidence or shared context. Other chapters’ local IDs are not allowed. Shared facts must be used only where they actually explain the topic. Do not calculate or invent facts. The supplied classical prose is a starting point, not text to copy. Explain how several indicators reinforce or constrain each other; identify a distinctive cross-domain pattern in the opening and return to its implications in the summary. Analyze D9/D7 and D10/D24 meaningfully; use D2/D16, D4/D12/D40/D45 and D20/D3/D27/D30 where supported. In timing, distinguish the long cycle from the current shorter cycle, synthesize both rulers’ actual D1 houses and lordships, discuss the specific interaction and aspects or verified D9/D10 evidence when relevant, and end with a realistic low-risk practical focus. For a supplied timing chapter with minimum 85 words write 3–4 paragraphs and aim for 100–140 words. If a period is unavailable, do not infer it. For other chapters write 2–3 paragraphs with a distinctive lead. Aim for 520–700 words total. Plain natural language, no raw dates, digits, technical jargon, Markdown, links or HTML; the server renders technical facts separately. D60 only as a supplied provisional sign comparison, never a boundary warning as evidence for personality. No guaranteed outcomes, invented biography, past lives, medical or investment directives. Avoid empty praise, repeated stock phrases and automatic fatalism. Proofread Ukrainian case agreement. Only the JSON object, no commentary.';
/** The backup gets the same evidence and required IDs, not a second copy of every local paragraph. */
export function n6ProviderPayload(brief:N6Brief,compact:boolean):string{
 if(!compact)return JSON.stringify(brief);
 return JSON.stringify({...brief,chapters:brief.chapters.map(({paragraphs,...chapter})=>({...chapter,
  ...(chapter.id==='self'?{styleExample:paragraphs[0]}:{})}))});
}
export const N6_COMPACT_PROMPT='Return 400–520 words total. Keep the current life period at 85–110 words when required; use three concise paragraphs there. Prioritize the required IDs and the strongest shared connections over repeating all optional facts. The full JSON object must finish.';
type Draft={id:string;lead:string;paragraphs:{text:string;evidenceIds:string[]}[]};
/** Only harmless typography is normalized. Technical claims, digits, markup,
 * unsupported planets and evidence violations are never normalized away. */
function prose(x:unknown,max:number):{text:string;reason:string}{
 if(typeof x!=='string')return {text:'',reason:'plain_type'};
 let text=x.trim().replace(/\s+/gu,' ');
 if(text.length<15||text.length>max)return {text:'',reason:'plain_length'};
 if(/[\p{N}]/u.test(text))return {text:'',reason:'plain_digits'};
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
export function inspectN6Response(raw:string,reader:Reader10Report,brief:N6Brief,repairProbe=false):Validation{
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
  if(!c||c.id!==original.id)return fail('chapter_order');
  const lead=prose(c.lead,350);if(lead.reason!=='ok')return fail(lead.reason);
  if(!Array.isArray(c.paragraphs)||c.paragraphs.length<spec.minParagraphs||c.paragraphs.length>(spec.minParagraphs===3?4:3))return fail('chapter_shape');
  const normalizedLead=norm(lead.text);if(seen.has(normalizedLead))return fail('repeated_text');seen.add(normalizedLead);
  const all=new Set<string>(),paragraphs:string[]=[];
  for(const p of c.paragraphs){
   const checked=prose(p?.text,1300);if(checked.reason!=='ok')return fail(checked.reason);
   paragraphs.push(checked.text);
   if(!Array.isArray(p.evidenceIds)||!p.evidenceIds.length||p.evidenceIds.some(id=>typeof id!=='string'||!allowed.has(id)))return fail('unknown_evidence');
   for(const id of p.evidenceIds)all.add(id);
   const normalized=norm(checked.text);if(seen.has(normalized))return fail('repeated_text');seen.add(normalized);
  }
  if(spec.required.some(id=>!all.has(id)))return fail('missing_required_evidence');
  if(words([lead.text,...paragraphs].join(' '))<spec.minWords)return fail('thin_chapter');
  // Reject a verbatim classical copy: never label unmodified local prose as an AI enhancement.
  const changed=norm(lead.text)!==norm(original.lead)||norm(paragraphs.join('\n'))!==norm(original.paragraphs.join('\n'));
  if(changed)modified++;
  if(!changed&&spec.minParagraphs===3)return fail('unchanged_timing');
  const shared=brief.context.filter(e=>all.has(e.id)).map(e=>e.text);
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
/** Repair a bounded subset, not a second full consultation. No rejected prose
 * is sent back to any provider. The combined result must pass the full gate. */
export function planN6Repair(raw:string,reader:Reader10Report,brief:N6Brief):N6Repair|null{
 const x=decode(raw);
 if(!x||x.chapters.length!==reader.chapters.length)return null;
 const ids:Reader10Chapter['id'][]=[],issues:string[]=[];
 for(let i=0;i<reader.chapters.length;i++){
  const c=reader.chapters[i],draft=x.chapters[i] as Draft|null;
  if(!draft||draft.id!==c.id)return null;
  const check=inspectN6Response(JSON.stringify({chapters:[draft]}),{...reader,chapters:[c]},{...brief,chapters:[brief.chapters[i]]},true);
  if(check.reader)continue;
  if(!['plain_length','plain_digits','plain_markup','plain_ending','chapter_shape','thin_chapter','missing_required_evidence','unchanged_timing','repeated_text'].includes(check.reason))return null;
  ids.push(c.id);issues.push(c.id+':'+check.reason);
 }
 if(!ids.length||ids.length>3)return null;
 return {brief:{...brief,chapters:brief.chapters.filter(c=>ids.includes(c.id as Reader10Chapter['id']))},original:x.chapters,ids,issues};
}
export function mergeN6Repair(raw:string,repair:N6Repair):string|null{
 const x=decode(raw);
 if(!x||x.chapters.length!==repair.ids.length||x.chapters.some((c,i)=>(c as Draft|null)?.id!==repair.ids[i]))return null;
 const updated=new Map(repair.ids.map((id,i)=>[id,x.chapters[i]]));
 return JSON.stringify({chapters:repair.original.map(c=>updated.get((c as Draft).id as Reader10Chapter['id'])??c)});
}
export const N6_REPAIR_PROMPT='Return ONLY JSON {"chapters":[{"id":"requested chapter id","lead":"A complete sentence.","paragraphs":[{"text":"A complete paragraph.","evidenceIds":["provided evidence id"]}]}]}. Return only the requested chapters in the supplied order. Use their required evidence IDs, minimum words and paragraph counts. Do not invent or recalculate facts. Interpret the supplied verified local and shared evidence in natural language, synthesize competing factors, and retain the distinct long and short current periods if timing is requested. Use three concise paragraphs and 85–110 words for rich timing. Other chapters use two or three paragraphs. Spell numbers as words; no digits, chart codes, dates, links, Markdown, HTML or unsupported planets in the lead and text. Use digits only inside the supplied evidence IDs, exactly as given. End all prose with punctuation. No guaranteed events, fabricated biography, medical or investment directives. Do not return other chapters.';
