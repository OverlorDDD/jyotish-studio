/** Controlled, non-destructive bilingual title repair.
 * Existing articles, attribution, sources, images and reactions are preserved.
 * All external Azure requests are accounted for by the shared PostgreSQL
 * reservation limit. Never turn on full description AI publication.
 */
import {existsSync} from 'node:fs';
import {PrismaClient} from '@prisma/client';
import {enrichPendingNews} from '../apps/api/src/news-editorial.ts';
import {newsScopeApproved,selectedNewsTranslationProvider} from '../apps/api/src/news-translation.ts';
if(existsSync('.env'))process.loadEnvFile('.env');
const db=new PrismaClient();
try{
 if(process.env.NEWS_TRANSLATION_ENABLED!=='1'||process.env.NEWS_TRANSLATION_CONTENT_SCOPE!=='headlines'||
  !newsScopeApproved()||selectedNewsTranslationProvider()!=='azure')
  throw Error('Backfill requires explicitly approved Azure headline-only translation');
 const cap=40;
 let completed=0,attempted=0;
 for(let i=0;i<cap;i++){
  const result=await enrichPendingNews(db);
  console.log('[GalaxiNews] bilingual title batch',i+1,JSON.stringify(result));
  completed+=result.processed||0;attempted+=result.attempted||0;
  if(result.reason||!(result.processed||0))break;
 }
 console.log(JSON.stringify({stage:'bilingual-headline-backfill',processed:completed,attempted,
  note:'No original news, images or articles deleted. Failed records retain retry cooldown. Review news:quality:headlines and news:azure:budget.'}));
}catch(error){console.error('BLOCKED: bilingual title repair:',error instanceof Error?error.message:String(error));process.exitCode=2}
finally{await db.$disconnect()}
