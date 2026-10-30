/** GalaxiNews machine translation adapters: self-hosted Argos or explicit Azure NMT.
 * STRICT: no generative AI, no hidden cloud fallback and no arbitrary URL fetch.
 * Not a summarizer: only translates bounded publisher metadata already present.
 */
import {cleanDescription} from './news-domain.ts';

export const NEWS_TRANSLATOR_DEFAULT='http://127.0.0.1:5100';
export const NEWS_TRANSLATOR_ENGINE='libretranslate-argos';
export type NewsTranslationProvider='local'|'azure';
export function selectedNewsTranslationProvider(env:NodeJS.ProcessEnv=process.env):NewsTranslationProvider{
 const provider=env.NEWS_TRANSLATION_PROVIDER||'local';
 if(provider!=='local'&&provider!=='azure')throw Error('Unsupported NEWS_TRANSLATION_PROVIDER; expected local or azure');
 return provider;
}
export function newsTranslationApproved(env:NodeJS.ProcessEnv=process.env):boolean{
 return env.NEWS_TRANSLATION_QUALITY_APPROVED==='1';
}
export function azureTranslatorCredentials(env:NodeJS.ProcessEnv=process.env){
 const key=env.AZURE_TRANSLATOR_KEY?.trim()||'';
 const region=env.AZURE_TRANSLATOR_REGION?.trim()||'';
 if(!key||!region||!/^[a-zA-Z0-9-]{2,70}$/.test(region))
  throw Error('Azure NMT requires AZURE_TRANSLATOR_KEY and AZURE_TRANSLATOR_REGION; keys never go to the browser');
 return {key,region};
}
const KNOWN_UNSAFE_TRANSLATIONS:RegExp[]=[
 /ведикськ/iu,/окшатра/iu,/тато-розклад/iu,/графік(?:у|ом)? народження/iu,
 /особистого відображення/iu,/телескоп захопив/iu,/до скорпіо/iu,
 /видавництво випустили/iu,/коротке визначення за ліцензією/iu,
 /інструктор йога/iu,/ніжні ранкові дихальні/iu,/зображення юпітеру/iu
];
/** Deterministic red flags are a guard, NOT a proof of editorial quality. */
export function translationQualityWarnings(text:string):string[]{
 return KNOWN_UNSAFE_TRANSLATIONS.filter(re=>re.test(text)).map(re=>re.source);
}
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
 const provider=selectedNewsTranslationProvider(env);
 let response:Response;
 if(provider==='azure'){
  const {key,region}=azureTranslatorCredentials(env);
  response=await fetcher('https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=uk',{
   method:'POST',signal:AbortSignal.timeout(25000),
   headers:{'Content-Type':'application/json; charset=UTF-8',
    'Ocp-Apim-Subscription-Key':key,'Ocp-Apim-Subscription-Region':region},
   body:JSON.stringify([{text:input}])
  });
 }else{
 const base=translationEndpoint(env);
 response=await fetcher(base+'/translate',{
  method:'POST',signal:AbortSignal.timeout(25000),
  headers:{'Content-Type':'application/json'},
  body:JSON.stringify({q:input,source:'en',target:'uk',format:'text'})
 });
 }
 if(!response.ok)throw Error('Machine translator HTTP '+response.status);
 const data=await response.json() as unknown;
 const raw=provider==='azure'
  ?(Array.isArray(data)?data[0]?.translations?.find((x:{to?:string})=>x.to==='uk')?.text:undefined)
  :(data as {translatedText?:unknown})?.translatedText;
 if(typeof raw==='string'&&/<[^>]+>/.test(raw))
  throw Error('Invalid machine translation: HTML is not accepted');
 const output=typeof raw==='string'?normalizeTranslatedNews(raw):'';
 if(!output||output.length>1500||!/[А-Яа-яІіЇїЄєҐґ]/.test(output)||/<[^>]+>/.test(output)||!preserveSourceNumbers(input,output))
  throw Error('Invalid machine translation or lost numerical facts');
 if(translationQualityWarnings(output).length)
  throw Error('Known poor Ukrainian translation: manual review or different NMT model required');
 return output;
}
export async function checkNewsTranslator(fetcher:TranslationFetch=fetch,env:NodeJS.ProcessEnv=process.env){
 const provider=selectedNewsTranslationProvider(env);
 if(provider==='azure'){
  const {region}=azureTranslatorCredentials(env);
  return {available:true,endpoint:'azure-microsoft-translator-fixed-endpoint',source:'en',target:'uk',
   region,engine:'azure-translator-nmt',qualityApproved:newsTranslationApproved(env),
   note:'Configuration only: live credentials and translation must be verified with news:translate:sample.'};
 }
 const base=translationEndpoint(env);
 const response=await fetcher(base+'/languages',{signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('Translator languages endpoint HTTP '+response.status);
 const languages=await response.json() as Array<{code?:string;targets?:string[]}>;
 const en=Array.isArray(languages)?languages.find(x=>x.code==='en'):undefined;
 const available=Boolean(en?.targets?.includes('uk'));
 return {available,endpoint:base,source:'en',target:'uk',engine:NEWS_TRANSLATOR_ENGINE,qualityApproved:newsTranslationApproved(env)};
}
