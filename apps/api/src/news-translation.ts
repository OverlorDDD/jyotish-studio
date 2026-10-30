/** Offline-first GalaxiNews machine translation adapter (LibreTranslate / Argos).
 * STRICT: no generative AI, no hidden cloud fallback and no arbitrary URL fetch.
 * Not a summarizer: only translates bounded publisher metadata already present.
 */
import {cleanDescription} from './news-domain.ts';

export const NEWS_TRANSLATOR_DEFAULT='http://127.0.0.1:5100';
export const NEWS_TRANSLATOR_ENGINE='libretranslate-argos';
export type TranslationFetch=typeof fetch;
const SAFE_HOSTS=new Set(['localhost','127.0.0.1','[::1]','translator','libretranslate']);
const terms:[RegExp,string][]=[
 [/джйотиш/gi,'Джйотіш'],[/джиотиш/gi,'Джйотіш'],
 [/навамша/gi,'Навамша'],[/даша/gi,'даша'],
 [/накшатра/gi,'накшатра'],[/пранаяма/gi,'пранаяма'],
 [/вімшоттарі/gi,'Вімшоттарі'],[/раху/gi,'Раху'],[/кету/gi,'Кету']
];
export function normalizeTranslatedNews(text:string):string{
 let value=cleanDescription(text).replace(/[ \t]{2,}/g,' ').trim();
 for(const [match,replacement] of terms)value=value.replace(match,replacement);
 return value;
}
export function translationEndpoint(env:NodeJS.ProcessEnv=process.env):string{
 const raw=env.NEWS_TRANSLATION_URL||NEWS_TRANSLATOR_DEFAULT;
 let url:URL;
 try{url=new URL(raw);}catch{throw Error('NEWS_TRANSLATION_URL is invalid');}
 if(url.protocol!=='http:'||!SAFE_HOSTS.has(url.hostname.toLowerCase())||
  url.username||url.password||url.search||url.hash||
  (url.pathname!=='/'&&url.pathname!==''))
  throw Error('Translator must be an internal HTTP service, not an arbitrary remote URL');
 return url.origin;
}
export function preserveSourceNumbers(source:string,translated:string):boolean{
 const numbers=(v:string)=>(v.match(/\d+(?:[.,]\d+)*/g)||[]).sort().join('|');
 return numbers(source)===numbers(translated);
}
export async function translateNewsText(text:string,fetcher:TranslationFetch=fetch,env:NodeJS.ProcessEnv=process.env):Promise<string>{
 const input=cleanDescription(text);
 if(!input||input.length>1000)throw Error('Translator input must contain 1-1000 sanitized characters');
 const base=translationEndpoint(env);
 const response=await fetcher(base+'/translate',{
  method:'POST',signal:AbortSignal.timeout(25000),
  headers:{'Content-Type':'application/json'},
  body:JSON.stringify({q:input,source:'en',target:'uk',format:'text'})
 });
 if(!response.ok)throw Error('Local translator HTTP '+response.status);
 const data=await response.json() as {translatedText?:unknown};
 const output=typeof data.translatedText==='string'?normalizeTranslatedNews(data.translatedText):'';
 if(!output||output.length>1500||/<[^>]+>/.test(output)||!preserveSourceNumbers(input,output))
  throw Error('Invalid local translation or lost numerical facts');
 return output;
}
export async function checkNewsTranslator(fetcher:TranslationFetch=fetch,env:NodeJS.ProcessEnv=process.env){
 const base=translationEndpoint(env);
 const response=await fetcher(base+'/languages',{signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('Translator languages endpoint HTTP '+response.status);
 const languages=await response.json() as Array<{code?:string;targets?:string[]}>;
 const en=Array.isArray(languages)&&languages.find(x=>x.code==='en');
 const available=Boolean(en?.targets?.includes('uk'));
 return {available,endpoint:base,source:'en',target:'uk',engine:NEWS_TRANSLATOR_ENGINE};
}
