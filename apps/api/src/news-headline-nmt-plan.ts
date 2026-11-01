/** Deterministic plan for Azure NMT v3; each unit is sent ONCE per target.
 * Protect numbers in mixed-script titles with Azure's documented notranslate span.
 * Never use model generation or guess an unsupported language.
 */
import {headlineScriptSegments,type NewsTitleLocale} from './news-localization.ts';
import {cleanDescription} from './news-domain.ts';
const DIGITS=/\d+(?:[.,]\d+)*/g;
const DEV_DIGITS=/[\u0966-\u096F]/g;
const DEV=/[\u0900-\u097F]/u;
const HINDI_WORDS=/(?:कल|राशि|ज्योतिष|कुंडली|चंद्रमा|ग्रह|पूर्णिमा|रहेंगे|अक्टूबर|भाव|क्या|आपकी)/u;
export type NmtHeadlineUnit={text:string;source:string;from:string|null;textType:'plain'|'html'};
const romanizedHindi=[
 [/\bkal ka rashifal\b/gi,'Horoscope for tomorrow'],
 [/\baaj ka rashifal\b/gi,'Horoscope for today'],
 [/\bkundli ka\b/gi,'of the birth chart']
] as const;
export function normalizeRomanizedHindi(text:string):string{
 let result=text;
 for(const [pattern,replacement] of romanizedHindi)result=result.replace(pattern,replacement);
 return result;
}
export function sourceNumbers(text:string):string[]{
 return (text.replace(DEV_DIGITS,d=>String(d.charCodeAt(0)-0x0966)).match(DIGITS)||[]).sort();
}
const escapeHtml=(text:string)=>text.replace(/&/g,'&amp;').replace(/</g,'&lt;')
 .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
/** Escape RSS text and wrap ORIGINAL numeric tokens; never match digits inside HTML entities. */
export function protectNumericFactsHtml(text:string):string{
 let html='',cursor=0;
 for(const match of text.matchAll(DIGITS)){
  const offset=match.index??cursor;
  html+=escapeHtml(text.slice(cursor,offset))+
   '<span class="notranslate">'+match[0]+'</span>';
  cursor=offset+match[0].length;
 }
 return '<div>'+html+escapeHtml(text.slice(cursor))+'</div>';
}
export function headlineNmtPlan(source:string,target:NewsTitleLocale):NmtHeadlineUnit[]{
 if(target!=='uk'&&target!=='en')throw Error('Unsupported headline locale');
 const title=cleanDescription(source);
 if(!title||title.length>300)throw Error('Invalid publisher headline size');
 const isMixed=DEV.test(title)&&/[A-Za-z]/.test(title);
 const spans=isMixed?headlineScriptSegments(title):[title];
 if(spans.length>12)throw Error('Headline script fragmentation limit exceeded');
 return spans.map(original=>{
  const romanized=/(?:\bkal ka rashifal\b|\baaj ka rashifal\b|\bkundli ka\b)/i.test(original);
  const from=DEV.test(original)?(HINDI_WORDS.test(original)?'hi':null):romanized?'en':null;
  const normalized=normalizeRomanizedHindi(original);
  const protectedNumbers=isMixed&&/\d/.test(normalized);
  const text=protectedNumbers?protectNumericFactsHtml(normalized):normalized;
  return {text,source:original,from,textType:protectedNumbers?'html':'plain'};
 });
}
export function headlineNmtBudgetCharacters(source:string,target:NewsTitleLocale):number{
 return headlineNmtPlan(source,target).reduce((sum,part)=>sum+part.text.length,0);
}
export function unwrapAzureHeadline(raw:string):string{
 // Reject remote HTML except the minimal tags present in our request.
 const withoutTags=raw.replace(/<\/?div\s*>/gi,'')
  .replace(/<span\s+class=["']notranslate["']\s*>/gi,'').replace(/<\/span\s*>/gi,'');
 if(/<[^>]*>/.test(withoutTags))throw Error('Azure response contained unexpected HTML');
 const decoded=withoutTags.replace(/&(?:amp|lt|gt|quot|#39|apos);/gi,
  entity=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'",'&apos;':"'"} as Record<string,string>)[entity.toLowerCase()]||entity);
 if(/<[^>]*>/.test(decoded))throw Error('Azure response contained encoded HTML');
 return decoded;
}
const UK_MONTH_GENITIVE:Record<string,string>={
 'січень':'січня','лютий':'лютого','березень':'березня','квітень':'квітня',
 'травень':'травня','червень':'червня','липень':'липня','серпень':'серпня',
 'вересень':'вересня','жовтень':'жовтня','листопад':'листопада','грудень':'грудня'
};
/** Correct objective Ukrainian month inflection without changing any source date or numeral. */
export function correctUkrainianDateCase(value:string):string{
 return value.replace(/(^|[^\p{L}\d])((?:0?[1-9]|[12]\d|3[01]))(\s+)(січень|лютий|березень|квітень|травень|червень|липень|серпень|вересень|жовтень|листопад|грудень)(?![\p{L}])/giu,
  (_,prefix:string,day:string,space:string,month:string)=>
   prefix+day+space+UK_MONTH_GENITIVE[month.toLowerCase()]);
}
export function correctKnownHindiIdiom(source:string,value:string,target:NewsTitleLocale):string{
 // A factual gloss limited to this exact SOURCE phrase; not a generic rewriting.
 if(!/चंद्रमा का पूरा फल/u.test(source))return value;
 if(target==='en')return value.replace(/(?:the\s+)?full\s+fruit\s+of\s+the\s+moon/gi,'the full influence of the Moon');
 return value.replace(/повн(?:ий|ого)\s+плід\s+місяця/giu,'повний вплив Місяця');
}
export function validateTranslatedHeadline(source:string,translated:string,target:NewsTitleLocale):void{
 if(DEV.test(translated))throw Error('Untranslated Devanagari remained in '+target+' headline');
 const original=sourceNumbers(source),actual=sourceNumbers(translated);
 if(original.join('|')!==actual.join('|'))throw Error('Changed or lost numeric facts in '+target+' headline');
}
