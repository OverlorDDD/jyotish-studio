/** Manual, controlled requeue after a FIXED NMT adapter and reviewed quality QA.
 * Dry-run by default; no Azure calls; never rewrites publisher titles or translations.
 */
import {existsSync} from 'node:fs';
import {PrismaClient} from '@prisma/client';
import {isLocalizedNewsTitle} from '../apps/api/src/news-localization.ts';
import {MAX_NEWS_TRANSLATION_ATTEMPTS} from '../apps/api/src/news-editorial.ts';
if(existsSync('.env'))process.loadEnvFile('.env');
const apply=process.argv.includes('--apply'),limit=30;
const db=new PrismaClient();
try{
 const candidates=await db.newsArticle.findMany({
  where:{status:'PUBLISHED',editorialAttempts:{gte:MAX_NEWS_TRANSLATION_ATTEMPTS},
   editorialNextAttemptAt:{not:null}},
  orderBy:[{editorialAttemptedAt:'desc'},{id:'asc'}],take:400,
  select:{id:true,title:true,titleUk:true,titleEn:true,editorialAttempts:true}
 });
 const needsEnglish=row=>!isLocalizedNewsTitle(row.titleEn,'en')&&!isLocalizedNewsTitle(row.title,'en');
 const pending=candidates.filter(row=>!isLocalizedNewsTitle(row.titleUk,'uk')||
  needsEnglish(row)).slice(0,limit);
 console.log(JSON.stringify({stage:'news-nmt-quarantine',mode:apply?'APPLY':'DRY_RUN',
  candidates:candidates.length,selected:pending.length,cap:limit,
  samples:pending.slice(0,12).map(row=>({id:row.id,attempts:row.editorialAttempts,
   needsUk:!isLocalizedNewsTitle(row.titleUk,'uk'),
   needsEn:needsEnglish(row)}))},null,2));
 if(apply){
  if(process.env.NEWS_TRANSLATION_ENABLED!=='1'||
    process.env.NEWS_TRANSLATION_CONTENT_SCOPE!=='headlines'||
    process.env.NEWS_TRANSLATION_HEADLINES_APPROVED!=='1')
   throw Error('Cannot requeue without approved headline-only NMT');
  let reset=0;
  for(const row of pending){
   const changed=await db.newsArticle.updateMany({
    where:{id:row.id,status:'PUBLISHED',editorialAttempts:{gte:MAX_NEWS_TRANSLATION_ATTEMPTS}},
    data:{editorialAttempts:0,editorialNextAttemptAt:null}
   });
   reset+=changed.count;
  }
  console.log('Requeued:',reset,'(only retry fields changed, no story or localized text overwritten)');
 }else console.log('Dry run only. AFTER verified live multilingual QA, pass --apply to requeue up to 30.');
}catch(e){console.error('NMT requeue stopped:',e instanceof Error?e.message:String(e));process.exitCode=2}
finally{await db.$disconnect()}
