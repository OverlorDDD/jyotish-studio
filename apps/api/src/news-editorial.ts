/** GalaxiNews translation pipeline v2. No cloud LLM calls or AI summarization.
 * Factual publisher metadata only, never full article bodies or headline speculation.
 */
import type {PrismaService} from './prisma.ts';
import {cleanDescription} from './news-domain.ts';
import {editorialSourceFacts,hasEditorialEvidence} from './news-editorial-coverage.ts';
import {checkNewsTranslator,newsScopeApproved,newsTranslationScope,selectedNewsTranslationProvider,translateNewsText,translateLocalizedHeadline,type TranslationFetch} from './news-translation.ts';
import {reserveAzureNewsCharacters,NewsTranslationBudgetExceeded} from './news-translation-budget.ts';
import {isLocalizedNewsTitle} from './news-localization.ts';
import {headlineNmtBudgetCharacters} from './news-headline-nmt-plan.ts';
import {headlineNeedsWork,NEWS_HEADLINE_RETRY_LIMIT} from './news-headline-backlog.ts';
import {excerptSource,teaserNeedsWork,teaserLocaleReady,teaserNmtCharacterCost,
 sourceTeaserForLocale,validNewsTeaser,translateLocalizedTeaser} from './news-teaser-nmt.ts';

type Draft={id:string;title:string;titleUk?:string|null;titleEn?:string|null;summaryUk?:string|null;summaryEn?:string|null;
 feedDescription:string|null;summary:string|null;summaryKind:string;language:string};
type Output={id:string;titleUk:string;titleEn?:string;summaryUk:string;summaryEn:string};
export const NEWS_TRANSLATION_MODE='local_nmt_only';
/** Stop repeated billed attempts on permanently untranslatable publisher titles. */
export const MAX_NEWS_TRANSLATION_ATTEMPTS=NEWS_HEADLINE_RETRY_LIMIT;
const MAX_TEASER_SOURCE=280;

/** Translate a concise publisher-supplied RSS description, not a generated synopsis.
 * The original attribution/link stays in the public news card. A missing usable
 * source description is a TITLE-ONLY card, not license to invent an abstract.
 */
export function extractSourceTeaser(article:Draft):string{
 if(!hasEditorialEvidence(article))return '';
 const source=editorialSourceFacts(article);
 const cut=source.slice(0,MAX_TEASER_SOURCE);
 // Avoid cutting in the middle of a word whenever possible.
 const trimmed=cut.length<source.length?cut.replace(/\s+\S*$/,''):cut;
 return cleanDescription(trimmed);
}
const isUkrainian=(language:string)=>/^(?:uk|ua)(?:$|[-_])/i.test(language);
const isEnglish=(language:string)=>/^(?:en)(?:$|[-_])/i.test(language);

/** Kept under the former exported name to avoid disrupting scheduler callers.
 * fetcher injection is for tests, not a fallback. No GROQ/GEMINI/OPENROUTER keys.
 */
export async function generateNewsMicrocopy(items:Draft[],fetcher:TranslationFetch=fetch):Promise<Output[]>{
 if(process.env.NEWS_TRANSLATION_ENABLED==='0'||!items.length)return [];
 const outputs:Output[]=[];
 const scope=newsTranslationScope();
 for(const article of items){
  const title=cleanDescription(article.title).slice(0,240);
  if(!title)continue;
  if(scope==='headlines'){
   let titleUk=isLocalizedNewsTitle(article.titleUk,'uk')?article.titleUk!.trim():'';
   let titleEn=isLocalizedNewsTitle(article.titleEn,'en')?article.titleEn!.trim():'';
   const canReuseEnglish=isLocalizedNewsTitle(title,'en');
   try{
    if(!titleUk)titleUk=await translateLocalizedHeadline(title,'uk',fetcher);
    if(!titleEn&&!canReuseEnglish)titleEn=await translateLocalizedHeadline(title,'en',fetcher);
    outputs.push({id:article.id,titleUk,titleEn,summaryUk:article.summaryUk?.trim()||'',
     summaryEn:''});
   }catch(error){
    console.warn('[news-nmt] Unverified bilingual headline',article.id,error instanceof Error?error.message:String(error));
    if(titleUk||titleEn)outputs.push({id:article.id,titleUk,titleEn,
     summaryUk:article.summaryUk?.trim()||'',summaryEn:''});
   }
   continue;
  }
  // FULL mode: never use EN-only legacy translation for Hindi/mixed RSS.
  // Translate validated publisher-supplied bounded excerpt, not article body.
  const sourceExcerpt=excerptSource(article);
  let titleUk=isLocalizedNewsTitle(article.titleUk,'uk')?article.titleUk!.trim():'';
  let titleEn=isLocalizedNewsTitle(article.titleEn,'en')?article.titleEn!.trim():'';
  let summaryUk=validNewsTeaser(article.summaryUk,'uk')?article.summaryUk!.trim():'';
  let summaryEn=validNewsTeaser(article.summaryEn,'en')?article.summaryEn!.trim():'';
  const sourceEnglish=isLocalizedNewsTitle(title,'en');
  const sourceUkrainian=isUkrainian(article.language)&&isLocalizedNewsTitle(title,'uk');
  // Each locale is independent: preserve valid UK even if EN fails, and vice versa.
  if(!titleUk){
   if(sourceUkrainian)titleUk=title;
   else try{titleUk=await translateLocalizedHeadline(title,'uk',fetcher);}
   catch(error){console.warn('[news-nmt] UK title pending',article.id,String(error));}
  }
  if(!titleEn&&!sourceEnglish){
   try{titleEn=await translateLocalizedHeadline(title,'en',fetcher);}
   catch(error){console.warn('[news-nmt] EN title pending',article.id,String(error));}
  }
  if(sourceExcerpt){
   if(!summaryUk){
    summaryUk=sourceTeaserForLocale(sourceExcerpt,article.language,'uk')||'';
    if(!summaryUk)try{summaryUk=await translateLocalizedTeaser(sourceExcerpt,'uk',fetcher);}
    catch(error){console.warn('[news-nmt] UK excerpt pending',article.id,String(error));}
   }
   if(!summaryEn){
    summaryEn=sourceTeaserForLocale(sourceExcerpt,article.language,'en')||'';
    if(!summaryEn)try{summaryEn=await translateLocalizedTeaser(sourceExcerpt,'en',fetcher);}
    catch(error){console.warn('[news-nmt] EN excerpt pending',article.id,String(error));}
   }
  }
  outputs.push({id:article.id,titleUk,titleEn,summaryUk,summaryEn});
 }
 return outputs;
}
export async function enrichPendingNews(prisma:PrismaService,fetcher:TranslationFetch=fetch){
 if(process.env.NEWS_TRANSLATION_ENABLED==='0')return {processed:0,reason:'translation_disabled'};
 // No machine translations are persisted until the selected EN->UK engine
 // passes REAL examples and the site owner explicitly accepts the quality.
 if(!newsScopeApproved())return {processed:0,reason:'translation_quality_not_approved',scope:newsTranslationScope()};
 // An offline or not-yet-installed EN→UK model must not consume the retry
 // budget for the whole archive. Nothing is written until readiness is proven.
 try{
  const ready=await checkNewsTranslator(fetcher);
  if(!ready.available)return {processed:0,reason:'local_en_uk_model_missing'};
 }catch(error){
  return {processed:0,reason:'local_translator_unavailable',
   detail:error instanceof Error?error.message:String(error)};
 }
 const raw=Number(process.env.NEWS_TRANSLATION_BATCH_LIMIT);
 const limit=Math.min(12,Math.max(1,Number.isFinite(raw)&&raw>0?Math.floor(raw):6));
 const now=new Date();
 const scope=newsTranslationScope();
 const candidates=await prisma.newsArticle.findMany({
  where:{status:'PUBLISHED',
   AND:[
    {OR:[{editorialNextAttemptAt:null},{editorialNextAttemptAt:{lte:now}}]},
    {editorialAttempts:{lt:MAX_NEWS_TRANSLATION_ATTEMPTS}},
    scope==='headlines'?{}:
     {OR:[{titleUk:null},{titleUk:''},{titleEn:null},{titleEn:''},{summaryUk:null},{summaryUk:''},{summaryEn:null},{summaryEn:''}]}
   ]},
  orderBy:[{discoveredAt:'asc'},{id:'asc'}],take:scope==='headlines'?10000:1000,
  select:{id:true,title:true,titleUk:true,titleEn:true,feedDescription:true,summary:true,summaryUk:true,summaryEn:true,summaryKind:true,
   language:true,editorialAttempts:true}
 });
 const rows=candidates.filter(x=>scope==='headlines'
  ?headlineNeedsWork(x)
  :(headlineNeedsWork(x)||teaserNeedsWork(x))).slice(0,limit);
 if(!rows.length)return {processed:0,
  reason:scope==='headlines'?'queue_empty_headlines':'queue_empty_no_grounded_work',
  noEvidenceSkipped:scope==='full'?candidates.filter(x=>!x.summaryUk?.trim()&&!hasEditorialEvidence(x)).length:0};
 // Reserve the *entire* scheduled Azure batch up front, before any paid
 // network call. This avoids partial batches after a quota stop and keeps
 // the cap consistent across concurrent API workers / process restarts.
 if(selectedNewsTranslationProvider()==='azure'){
  const estimated=rows.reduce((sum,row)=>{
   const title=cleanDescription(row.title).slice(0,240);
   if(scope==='headlines')
    return sum+(!isLocalizedNewsTitle(row.titleUk,'uk')?headlineNmtBudgetCharacters(title,'uk'):0)
     +(!isLocalizedNewsTitle(row.titleEn,'en')&&!isLocalizedNewsTitle(title,'en')?
       headlineNmtBudgetCharacters(title,'en'):0);
   const source=excerptSource(row);
   return sum+(!isLocalizedNewsTitle(row.titleUk,'uk')&&!isUkrainian(row.language)?
    headlineNmtBudgetCharacters(title,'uk'):0)
    +(!isLocalizedNewsTitle(row.titleEn,'en')&&!isLocalizedNewsTitle(title,'en')?
      headlineNmtBudgetCharacters(title,'en'):0)
    +(source&&!teaserLocaleReady(row,'uk')?teaserNmtCharacterCost(source,'uk'):0)
    +(source&&!teaserLocaleReady(row,'en')?teaserNmtCharacterCost(source,'en'):0);
  },0);
  try{await reserveAzureNewsCharacters(prisma,estimated,now);}
  catch(error){
   if(error instanceof NewsTranslationBudgetExceeded)
    return {processed:0,reason:'azure_monthly_budget_exhausted',
     month:error.period,monthlyLimit:error.limit};
   throw error;
  }
 }
 const translated=await generateNewsMicrocopy(rows,fetcher);
 let processed=0,failed=0;
 for(const original of rows){
  const output=translated.find(x=>x.id===original.id);
  const existingTitle=isLocalizedNewsTitle(original.titleUk,'uk');
  const existingEnglish=isLocalizedNewsTitle(original.titleEn,'en')||isLocalizedNewsTitle(original.title,'en');
  const facts=Boolean(excerptSource(original));
  const existingTeaserUk=validNewsTeaser(original.summaryUk,'uk');
  const existingTeaserEn=validNewsTeaser(original.summaryEn,'en');
  const titleReady=existingTitle||isLocalizedNewsTitle(output?.titleUk,'uk');
  const englishReady=existingEnglish||isLocalizedNewsTitle(output?.titleEn,'en');
  const teaserReady=scope==='headlines'||!facts||
   ((existingTeaserUk||validNewsTeaser(output?.summaryUk,'uk')||
      Boolean(sourceTeaserForLocale(excerptSource(original),original.language,'uk'))) &&
    (existingTeaserEn||validNewsTeaser(output?.summaryEn,'en')||
      Boolean(sourceTeaserForLocale(excerptSource(original),original.language,'en'))));
  const success=titleReady&&englishReady&&teaserReady;
  const nextAttempts=original.editorialAttempts+1;
  const update={
   editorialAttempts:nextAttempts,editorialAttemptedAt:now,
   editorialNextAttemptAt:success?null:new Date(now.getTime()+
    (nextAttempts>=3?24:3)*3600000),
   ...(!existingTitle&&isLocalizedNewsTitle(output?.titleUk,'uk')?{titleUk:output!.titleUk}:{}),
   ...(!existingEnglish&&isLocalizedNewsTitle(output?.titleEn,'en')?
    {titleEn:output!.titleEn}:{}),
   ...(scope==='full'&&facts&&!existingTeaserUk&&validNewsTeaser(output?.summaryUk,'uk')?
    {summaryUk:output!.summaryUk}:{}),
   ...(scope==='full'&&facts&&!existingTeaserEn&&validNewsTeaser(output?.summaryEn,'en')?
    {summaryEn:output!.summaryEn}:{}),
   // Retain 'source_excerpt' kind if the only legal source evidence is summary.
   ...(scope==='full'&&facts&&original.feedDescription&&
      (validNewsTeaser(output?.summaryUk,'uk')||validNewsTeaser(output?.summaryEn,'en'))?
    {summaryKind:'machine_translated_excerpt'}:{})
  };
  await prisma.newsArticle.updateMany({where:{id:original.id,status:'PUBLISHED'},data:update});
  if(success)processed++;else failed++;
 }
 return {processed,attempted:rows.length,failed,scope,
  engine:selectedNewsTranslationProvider()==='azure'?'azure_nmt_only':NEWS_TRANSLATION_MODE};
}
