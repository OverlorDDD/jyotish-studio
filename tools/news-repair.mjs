/** One-time, non-destructive GalaxiNews archive recovery; no records are deleted. */
import {PrismaClient} from '@prisma/client';
import {probeLocalNewsFrontend} from './news-local-probe.mjs';
import {enrichPendingNews} from '../apps/api/src/news-editorial.ts';
import {publisherDomain,safeImageUrl} from '../apps/api/src/news-domain.ts';
import {metadataHosts,fetchArticleMetadata} from '../apps/api/src/news-metadata.ts';

const repair=process.argv.includes('--repair');
if(process.argv.includes('--help')){
 console.log('Usage: npm run news:doctor (read-only) or npm run news:repair (safe metadata + translation backfill).');
 console.log('Requires database, at least one configured editorial provider for translation; article-body scraping is never performed.');
 process.exit(0);
}
const prisma=new PrismaClient();
async function statistics(){
 const base={status:'PUBLISHED'};
 const [total,untranslated,noTeasers,noCovers,contextMissing,attempted]=await Promise.all([
  prisma.newsArticle.count({where:base}),
  prisma.newsArticle.count({where:{...base,titleUk:null}}),
  prisma.newsArticle.count({where:{...base,summaryUk:null}}),
  prisma.newsArticle.count({where:{...base,imageUrl:null}}),
  prisma.newsArticle.count({where:{...base,feedDescription:null}}),
  prisma.newsArticle.count({where:{...base,editorialAttempts:{gt:0}}})
 ]);
 console.log('[GalaxiNews] articles:',total,'untranslated:',untranslated,'without Ukrainian teaser:',noTeasers,
  'without image:',noCovers,'without source description:',contextMissing,'attempted:',attempted);
 return untranslated+noTeasers;
}
async function metadataRecovery(){
 const hosts=metadataHosts();
 const rows=await prisma.newsArticle.findMany({
  where:{status:'PUBLISHED',OR:[{metadataCheckedAt:null},{feedDescription:null},{imageUrl:null}]},
  orderBy:{discoveredAt:'asc'},take:350,
  select:{id:true,url:true,feedDescription:true,imageUrl:true,metadataCheckedAt:true}
 });
 let checked=0,added=0;
 for(const row of rows){
  if(checked>=28)break;
  const domain=publisherDomain(row.url);
  if(!domain||(!hosts.has(domain)&&!hosts.has('www.'+domain)))continue;
  if(row.metadataCheckedAt&&!process.argv.includes('--retry-metadata'))continue;
  checked++;
  const data=await fetchArticleMetadata(row.url);
  const desc=!row.feedDescription&&data.description?data.description.slice(0,1100):null;
  const cover=!row.imageUrl&&data.imageUrl?safeImageUrl(data.imageUrl,'',domain,false):null;
  await prisma.newsArticle.updateMany({where:{id:row.id},data:{
   metadataCheckedAt:new Date(),
   ...(desc?{feedDescription:desc,summaryKind:'needs_editorial',editorialAttempts:0,editorialNextAttemptAt:null}:{}),
   ...(cover?{imageUrl:cover,imageCredit:data.imageCredit||domain}:{})
  }});
  if(desc||cover)added++;
 }
 console.log('[GalaxiNews] metadata checked:',checked,'with usable updates:',added,
  '(only approved publisher domains; no copyright override)');
}
async function verifyRunningFrontend(){
 const result=await probeLocalNewsFrontend();
 if(result.available){
  console.log('[GalaxiNews] frontend:',result.current?'CURRENT v1.5 (tabs search)':
   'OLD OR UNEXPECTED bundle (missing v1.5 markup / search), at '+result.url);
  if(!result.current)console.log('[GalaxiNews] Check branch, stop older Next processes, then restart npm run dev:full.');
 }else{
  console.warn('[GalaxiNews] frontend not reachable at 127.0.0.1:3000 or localhost:3000.');
  console.warn('[GalaxiNews] Details:',result.attempts.join(' | '));
  console.warn('[GalaxiNews] This probe does NOT prove the website is outdated. Check Next startup and retry after /uk/news compiles.');
 }
}

try{
 await prisma.$connect();
 console.log('[GalaxiNews] AI providers:',{
  groq:Boolean(process.env.GROQ_API_KEY),
  gemini:Boolean(process.env.GEMINI_API_KEY),
  openrouter:Boolean(process.env.OPENROUTER_API_KEY),
  editorialEnabled:process.env.NEWS_EDITORIAL_AI_ENABLED!=='0'
 });
 await statistics();
 await verifyRunningFrontend();
 if(repair){
  await metadataRecovery();
  const configured=Boolean(process.env.GROQ_API_KEY||process.env.GEMINI_API_KEY||process.env.OPENROUTER_API_KEY);
  if(!configured||process.env.NEWS_EDITORIAL_AI_ENABLED==='0'){
   console.warn('[GalaxiNews] Ukrainian localization skipped: editorial AI provider is missing or disabled in root .env.');
  }else{
   let total=0;
   for(let i=0;i<6;i++){
    const result=await enrichPendingNews(prisma);
    console.log('[GalaxiNews] editorial batch',i+1,JSON.stringify(result));
    total+=result.processed||0;
    if(result.reason||!(result.processed||0))break;
   }
   console.log('[GalaxiNews] translated archive entries this run:',total);
  }
  await statistics();
 }
}catch(e){
 console.error('[GalaxiNews] repair failed:',e instanceof Error?e.message:String(e));
 process.exitCode=1;
}finally{await prisma.$disconnect();}
