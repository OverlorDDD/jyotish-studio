/** Bounded, source-grounded UK/EN publisher teaser NMT (NOT full article copying).
 * Uses fixed Azure NMT v3 endpoint. No LLM and no user-provided URL endpoints.
 */
import {cleanDescription} from './news-domain.ts';
import {hasEditorialEvidence} from './news-editorial-coverage.ts';
import {headlineNmtPlan,headlineNmtBudgetCharacters,unwrapAzureHeadline,
 validateTranslatedHeadline,correctKnownHindiIdiom,correctUkrainianDateCase} from './news-headline-nmt-plan.ts';
import type {NewsTitleLocale} from './news-localization.ts';
import {azureTranslatorCredentials,selectedNewsTranslationProvider,normalizeTranslatedNews,
 improveNewsTerminology,translationQualityWarnings,type TranslationFetch} from './news-translation.ts';

export const MAX_SOURCE_TEASER_CHARS=280;
const DEV=/[\u0900-\u097F]/u;
const ROMAN_HINDI=/\b(?:kal ka rashifal|aaj ka rashifal|kundli ka)\b/i;
export function validNewsTeaser(text:string|null|undefined,locale:NewsTitleLocale):boolean{
 const value=text?.trim()||'';
 if(value.length<12||value.length>700||DEV.test(value)||ROMAN_HINDI.test(value)||
  /<[^>]*>/.test(value)||translationQualityWarnings(value).length)return false;
 return locale==='uk'?/[\u0400-\u052F]/u.test(value):
  /[A-Za-z]/.test(value)&&!/[\u0400-\u052F]/u.test(value);
}
export function sourceTeaserForLocale(source:string,language:string,locale:NewsTitleLocale):string|null{
 // RSS language metadata is a hint, but never claim transliterated Hindi as English.
 // A source in the requested language may be reused only after script-quality checks.
 const lang=language.toLowerCase();
 if(locale==='en'&&!/^en(?:$|[-_])/.test(lang))return null;
 if(locale==='uk'&&!/^(?:uk|ua)(?:$|[-_])/.test(lang))return null;
 return validNewsTeaser(source,locale)?source:null;
}
export function teaserNmtCharacterCost(source:string,target:NewsTitleLocale):number{
 if(source.length>MAX_SOURCE_TEASER_CHARS)throw Error('Publisher excerpt is too long');
 return headlineNmtBudgetCharacters(source,target);
}
export async function translateLocalizedTeaser(source:string,target:NewsTitleLocale,
 fetcher:TranslationFetch=fetch,env:NodeJS.ProcessEnv=process.env):Promise<string>{
 const value=cleanDescription(source);
 if(!value||value.length>MAX_SOURCE_TEASER_CHARS)
  throw Error('Invalid publisher-supplied excerpt length');
 if(selectedNewsTranslationProvider(env)!=='azure')
  throw Error('Bilingual excerpts require Azure NMT');
 const {key,region}=azureTranslatorCredentials(env);
 const units=headlineNmtPlan(value,target);
 const output:string[]=[];
 for(const unit of units){
  const url='https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to='+target+
   (unit.from?'&from='+unit.from:'')+(unit.textType==='html'?'&textType=html':'');
  const response=await fetcher(url,{method:'POST',signal:AbortSignal.timeout(25000),
   headers:{'Content-Type':'application/json; charset=UTF-8',
    'Ocp-Apim-Subscription-Key':key,
    ...(region?{'Ocp-Apim-Subscription-Region':region}:{})},
   body:JSON.stringify([{text:unit.text}])});
  if(!response.ok)throw Error('Azure excerpt HTTP '+response.status);
  const result=await response.json() as unknown;
  const raw=Array.isArray(result)?result[0]?.translations?.find((x:{to?:string})=>x.to===target)?.text:undefined;
  if(typeof raw!=='string')throw Error('Missing Azure '+target+' excerpt result');
  const unpacked=unwrapAzureHeadline(raw);
  let translated=normalizeTranslatedNews(target==='uk'?
   improveNewsTerminology(unit.source,unpacked):unpacked);
  translated=correctKnownHindiIdiom(unit.source,translated,target);
  if(target==='uk')translated=correctUkrainianDateCase(translated);
  validateTranslatedHeadline(unit.source,translated,target);
  output.push(translated);
 }
 let combined=output.join(' ').replace(/\s+([,.;:!?])/g,'$1').replace(/\s+/g,' ').trim();
 combined=correctKnownHindiIdiom(value,combined,target);
 if(target==='uk')combined=correctUkrainianDateCase(combined);
 validateTranslatedHeadline(value,combined,target);
 if(!validNewsTeaser(combined,target))throw Error('Unverified bilingual '+target+' publisher excerpt');
 return combined;
}
export type BilingualTeaserRow={feedDescription:string|null;summary:string|null;summaryKind:string;
 language:string;summaryUk?:string|null;summaryEn?:string|null};
export function excerptSource(row:BilingualTeaserRow):string{
 if(!hasEditorialEvidence(row))return '';
 // Require real publisher-supplied evidence. No title-derived summary.
 // Split long existing RSS descriptions to short factual excerpt.
 const text=cleanDescription(row.feedDescription||
  (row.summaryKind==='source_excerpt'?row.summary:'')||'');
 if(text.length<45)return '';
 const cut=text.slice(0,MAX_SOURCE_TEASER_CHARS);
 const trimmed=cut.length<text.length?cut.replace(/\s+\S*$/,''):cut;
 return cleanDescription(trimmed);
}
export function teaserLocaleReady(row:BilingualTeaserRow,locale:NewsTitleLocale):boolean{
 const stored=locale==='uk'?row.summaryUk:row.summaryEn;
 if(validNewsTeaser(stored,locale))return true;
 const source=excerptSource(row);
 return Boolean(source&&sourceTeaserForLocale(source,row.language,locale));
}
export function teaserNeedsWork(row:BilingualTeaserRow):boolean{
 const source=excerptSource(row);
 return Boolean(source&&(!teaserLocaleReady(row,'uk')||!teaserLocaleReady(row,'en')));
}
