/** Safely inspect or (explicitly) run bilingual UK/EN publisher-excerpt backfill.
 * No article-body scraping, no LLM, no invented summaries. Read-only by default.
 * Worker enforces database lease and per-month Azure character reservation.
 */
import {existsSync} from 'node:fs';
import {PrismaClient} from '@prisma/client';
import {excerptSource,teaserLocaleReady,teaserNeedsWork} from '../apps/api/src/news-teaser-nmt.ts';
import {enrichPendingNews} from '../apps/api/src/news-editorial.ts';
import {newsScopeApproved,newsTranslationScope,selectedNewsTranslationProvider} from '../apps/api/src/news-translation.ts';
if(existsSync('.env'))process.loadEnvFile('.env');
const apply=process.argv.includes('--apply');
const db=new PrismaClient();
try{
 const rows=await db.newsArticle.findMany({where:{status:'PUBLISHED'},take:10000,
  orderBy:{discoveredAt:'desc'},
  select:{id:true,title:true,titleUk:true,titleEn:true,language:true,feedDescription:true,summary:true,
   summaryKind:true,summaryUk:true,summaryEn:true,editorialAttempts:true,editorialNextAttemptAt:true}});
 const supported=rows.filter(r=>Boolean(excerptSource(r)));
 const missingUk=supported.filter(r=>!teaserLocaleReady(r,'uk'));
 const missingEn=supported.filter(r=>!teaserLocaleReady(r,'en'));
 const pending=supported.filter(teaserNeedsWork);
 console.log(JSON.stringify({stage:'source-backed-bilingual-excerpts',
  mode:apply?'APPLY':'DRY_RUN',total:rows.length,sourceBacked:supported.length,
  noPublisherEvidence:rows.length-supported.length,missingUk:missingUk.length,missingEn:missingEn.length,
  eligible:pending.filter(r=>r.editorialAttempts<6&&
   (!r.editorialNextAttemptAt||new Date(r.editorialNextAttemptAt)<=new Date())).length,
  samples:pending.slice(0,12).map(r=>({id:r.id,language:r.language,
   needsUk:!teaserLocaleReady(r,'uk'),needsEn:!teaserLocaleReady(r,'en')}))},null,2));
 if(!apply){
  console.log('READ ONLY. Full scope must pass real Azure bilingual samples and DB backup before --apply.');
 }else{
  if(process.env.NEWS_TRANSLATION_ENABLED!=='1'||newsTranslationScope()!=='full'||
   !newsScopeApproved()||selectedNewsTranslationProvider()!=='azure')
   throw Error('Full bilingual NMT is not explicitly approved in the server .env');
  for(let i=0;i<4;i++){
   const result=await enrichPendingNews(db);
   console.log('[GalaxiNews] bilingual excerpt backfill',i+1,JSON.stringify(result));
   if(('reason' in result&&result.reason)||!result.processed)break;
  }
  console.log('No publisher content deleted. Check news:quality:full and Azure budget.');
 }
}catch(error){
 console.error('Full bilingual excerpt repair BLOCKED:',error instanceof Error?error.message:String(error));
 process.exitCode=2;
}finally{await db.$disconnect()}
