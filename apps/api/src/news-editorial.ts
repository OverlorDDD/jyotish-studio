/** GalaxiNews translation pipeline v2. No cloud LLM calls or AI summarization.
 * Factual publisher metadata only, never full article bodies or headline speculation.
 */
import type {PrismaService} from './prisma.ts';
import {cleanDescription} from './news-domain.ts';
import {editorialSourceFacts,hasEditorialEvidence} from './news-editorial-coverage.ts';
import {translateNewsText,type TranslationFetch} from './news-translation.ts';

type Draft={id:string;title:string;titleUk?:string|null;summaryUk?:string|null;
 feedDescription:string|null;summary:string|null;summaryKind:string;language:string};
type Output={id:string;titleUk:string;summaryUk:string;summaryEn:string};
export const NEWS_TRANSLATION_MODE='local_nmt_only';
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
 for(const article of items){
  const title=cleanDescription(article.title).slice(0,240);
  if(!title)continue;
  const src=extractSourceTeaser(article);
  const uk=isUkrainian(article.language);
  if(!uk&&!isEnglish(article.language)){
   console.warn('[news-nmt] source language unsupported:',article.language);
   continue;
  }
  try{
   // Do not retranslate already published Ukrainian content.
   const titleUk=article.titleUk?.trim()||(uk?title:await translateNewsText(title,fetcher));
   const summaryUk=article.summaryUk?.trim()||(src?(uk?src:await translateNewsText(src,fetcher)):'');
   outputs.push({id:article.id,titleUk,summaryUk,summaryEn:!uk&&src?src:''});
  }catch(error){
   console.warn('[news-nmt] Local translation unavailable for article',article.id,':',
    error instanceof Error?error.message:String(error));
   // Preserve a valid translated headline even if the second request failed.
   // The incomplete summary remains in queue with backoff; no fabricated fallback.
   if(article.titleUk?.trim())outputs.push({id:article.id,titleUk:article.titleUk.trim(),summaryUk:'',summaryEn:''});
  }
 }
 return outputs;
}
export async function enrichPendingNews(prisma:PrismaService,fetcher:TranslationFetch=fetch){
 if(process.env.NEWS_TRANSLATION_ENABLED==='0')return {processed:0,reason:'translation_disabled'};
 const raw=Number(process.env.NEWS_TRANSLATION_BATCH_LIMIT);
 const limit=Math.min(12,Math.max(1,Number.isFinite(raw)&&raw>0?Math.floor(raw):6));
 const now=new Date();
 const candidates=await prisma.newsArticle.findMany({
  where:{status:'PUBLISHED',
   AND:[
    {OR:[{editorialNextAttemptAt:null},{editorialNextAttemptAt:{lte:now}}]},
    {OR:[{titleUk:null},{titleUk:''},{summaryUk:null},{summaryUk:''}]}
   ]},
  orderBy:[{discoveredAt:'asc'},{id:'asc'}],take:1000,
  select:{id:true,title:true,titleUk:true,feedDescription:true,summary:true,summaryUk:true,summaryKind:true,
   language:true,editorialAttempts:true}
 });
 const rows=candidates.filter(x=>!x.titleUk?.trim()||(!x.summaryUk?.trim()&&hasEditorialEvidence(x))).slice(0,limit);
 if(!rows.length)return {processed:0,reason:'queue_empty_no_grounded_work',
  noEvidenceSkipped:candidates.filter(x=>!x.summaryUk?.trim()&&!hasEditorialEvidence(x)).length};
 const translated=await generateNewsMicrocopy(rows,fetcher);
 let processed=0,failed=0;
 for(const original of rows){
  const output=translated.find(x=>x.id===original.id);
  const existingTitle=Boolean(original.titleUk?.trim());
  const existingTeaser=Boolean(original.summaryUk?.trim());
  const facts=hasEditorialEvidence(original);
  const titleReady=existingTitle||Boolean(output?.titleUk);
  const teaserReady=!facts||existingTeaser||Boolean(output?.summaryUk);
  const success=titleReady&&teaserReady;
  const nextAttempts=original.editorialAttempts+1;
  const update={
   editorialAttempts:nextAttempts,editorialAttemptedAt:now,
   editorialNextAttemptAt:success?null:new Date(now.getTime()+(nextAttempts>=3?24:3)*3600000),
   ...(!existingTitle&&output?.titleUk?{titleUk:output.titleUk}:{}),
   ...(!existingTeaser&&facts&&output?.summaryUk?{
    summaryUk:output.summaryUk,
    ...(output.summaryEn?{summaryEn:output.summaryEn}:{}),
    summaryKind:'machine_translated_excerpt'}:{}),
   ...(success&&!facts?{summaryKind:'no_context'}:{})
  };
  await prisma.newsArticle.updateMany({where:{id:original.id,status:'PUBLISHED'},data:update});
  if(success)processed++;else failed++;
 }
 return {processed,attempted:rows.length,failed,engine:NEWS_TRANSLATION_MODE};
}
