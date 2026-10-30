/** Display and pipeline guards for bilingual news titles.
 * No network, no language-identification claims. Script tests guard display;
 * Azure performs source-language identification during translation. */
export type NewsTitleLocale='uk'|'en';
const DEVANAGARI=/[\u0900-\u097F]/u;
const CYRILLIC=/[\u0400-\u052F]/u;
const LATIN=/[A-Za-z]/;
const ROMAN_HINDI=/\b(?:kal ka rashifal|aaj ka rashifal|rashifal 26|kundli ka)\b/i;
/** Mechanical editorial warning signals, not a substitute for human review.
 * Reject only verified nonsense and ungrammatical dates, leaving source titles
 * intact for correction; never guess the original publisher's intended meaning. */
const UK_BAD_DAY_MONTH=/(?:^|[^\p{L}\d])(?:0?[1-9]|[12]\d|3[01])\s+(?:січень|лютий|березень|квітень|травень|червень|липень|серпень|вересень|жовтень|листопад|грудень)(?![\p{L}])/iu;
export function headlineEditorialWarnings(value:string,locale:NewsTitleLocale):string[]{
 const out:string[]=[];
 if(locale==='uk'){
  if(UK_BAD_DAY_MONTH.test(value))out.push('incorrect Ukrainian month case after day number');
  if(/повн(?:ий|ого)\s+плід\s+місяця/iu.test(value))out.push('literal mistranslation of lunar effects');
 }else if(/\bfull fruit of the moon\b/i.test(value)){
  out.push('literal mistranslation of lunar effects');
 }
 return out;
}

export function hasDevanagari(value:string):boolean{return DEVANAGARI.test(value)}
export function isLocalizedNewsTitle(value:string|null|undefined,locale:NewsTitleLocale):boolean{
 const text=value?.trim()||'';
 if(!text||text.length>300||DEVANAGARI.test(text)||ROMAN_HINDI.test(text)||
  headlineEditorialWarnings(text,locale).length)return false;
 return locale==='uk'?CYRILLIC.test(text):LATIN.test(text)&&!CYRILLIC.test(text);
}
export function headlineNeedsTranslation(title:string|null|undefined,locale:NewsTitleLocale):boolean{
 return !isLocalizedNewsTitle(title,locale);
}
/** Split spans at transitions into/out of Devanagari. Allow separate Azure
 * auto-detection of Hindi and Latin-script portions of one RSS title.
 * The split never interprets or guesses an article's contents. */
export function headlineScriptSegments(source:string):string[]{
 const value=source.trim();
 if(!DEVANAGARI.test(value))return value?[value]:[];
 const tokens=value.match(/[\u0900-\u097F][\u0900-\u097F\p{M}\s,।:;?!()0-9-]*|[^\u0900-\u097F]+/gu)||[];
 return tokens.map(t=>t.trim()).filter(Boolean);
}
export function publicTitleForLocale(row:{title:string;titleUk?:string|null;titleEn?:string|null},
 locale:NewsTitleLocale):string|null{
 const translated=locale==='uk'?row.titleUk:row.titleEn;
 if(isLocalizedNewsTitle(translated,locale))return translated!.trim();
 // Native English sources can be used without spending on redundant NMT.
 if(locale==='en'&&isLocalizedNewsTitle(row.title,'en'))return row.title.trim();
 return null;
}
