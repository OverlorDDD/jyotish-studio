/** One-time, non-destructive GalaxiNews archive recovery; no records are deleted. */
import {PrismaClient} from '@prisma/client';
import {spawnSync} from 'node:child_process';
import {probeLocalNewsFrontend} from './news-local-probe.mjs';
import {enrichPendingNews} from '../apps/api/src/news-editorial.ts';
import {checkNewsTranslator,selectedNewsTranslationProvider,newsScopeApproved,newsTranslationScope} from '../apps/api/src/news-translation.ts';
import {publisherDomain,safeImageUrl} from '../apps/api/src/news-domain.ts';
import {metadataHosts,fetchArticleMetadata} from '../apps/api/src/news-metadata.ts';
import {rank,diversify} from '../apps/api/src/news-domain.ts';
import {enrichOpenNewsPhotos} from '../apps/api/src/news-open-media.ts';

const repair=process.argv.includes('--repair');
if(process.argv.includes('--help')){
 console.log('Usage: npm run news:doctor (read-only) or npm run news:repair (safe metadata + translation backfill).');
 console.log('Requires PostgreSQL and a reviewed machine translator; does not synthesize article descriptions.');
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
 const rows=await prisma.newsArticle.findMany({where:base,
  select:{imageUrl:true,imageLicense:true,imageLicenseUrl:true,source:true}});
 const blockedImageUrls=rows.filter(r=>r.imageUrl&&
  !safeImageUrl(r.imageUrl,r.imageLicenseUrl||r.imageLicense||'',r.source,false)).length;
 console.log('[GalaxiNews] articles:',total,'untranslated:',untranslated,'without Ukrainian teaser:',noTeasers,
  'without image URL:',noCovers,'image URLs hidden by licence check:',blockedImageUrls,
  'visibly licensed photos:',total-noCovers-blockedImageUrls,
  'without source description:',contextMissing,'attempted:',attempted);
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
  console.log('[GalaxiNews] frontend:',result.current?'CURRENT v1.8 (tabs search)':
   'OLD OR UNEXPECTED bundle (missing v1.5 markup / search), at '+result.url);
  if(!result.current)console.log('[GalaxiNews] HTML details: search/count/tags/oldCopy:',result.hasSearch,result.hasCount,result.hasTags,result.obsoleteCopy);
  console.log('[GalaxiNews] Open http://127.0.0.1:3000/uk/news?revision=v1.8 in a NEW private browser window.');
 }else{
  console.warn('[GalaxiNews] frontend not reachable at 127.0.0.1:3000 or localhost:3000.');
  console.warn('[GalaxiNews] Details:',result.attempts.join(' | '));
  console.warn('[GalaxiNews] This probe does NOT prove the website is outdated. Check Next startup and retry after /uk/news compiles.');
 }
}

try{
 const branch=spawnSync('git',['branch','--show-current'],{encoding:'utf8',timeout:2500});
 const sha=spawnSync('git',['rev-parse','--short','HEAD'],{encoding:'utf8',timeout:2500});
 console.log('[GalaxiNews] local checkout:',(branch.stdout||'?').trim(),(sha.stdout||'?').trim());
 await prisma.$connect();
 console.log('[GalaxiNews] NMT provider:',selectedNewsTranslationProvider(),'scope:',newsTranslationScope(),'enabled:',process.env.NEWS_TRANSLATION_ENABLED!=='0','approved:',newsScopeApproved());
 if(process.env.NEWS_TRANSLATION_ENABLED!=='0'){
  try{console.log('[GalaxiNews] translator:',await checkNewsTranslator());}
  catch(error){console.warn('[GalaxiNews] local translator unavailable:',error instanceof Error?error.message:String(error));}
 }
 await statistics();
 const [recentScans,recentArticles]=await Promise.all([
  prisma.newsScan.findMany({orderBy:{createdAt:'desc'},take:6,select:{createdAt:true,accepted:true,sources:true,errors:true}}),
  prisma.newsArticle.findMany({where:{status:'PUBLISHED'},take:600,
   orderBy:{publishedAt:'desc'},select:{id:true,title:true,titleUk:true,source:true,publishedAt:true,score:true}})
 ]);
 const relevance=diversify([...recentArticles].sort((a,b)=>rank(b.score,b.publishedAt)-rank(a.score,a.publishedAt)||
  b.publishedAt.getTime()-a.publishedAt.getTime()),3);
 const lead=relevance[0],newest=recentArticles[0];
 console.log('[GalaxiNews] featured story:',lead?JSON.stringify({
  id:lead.id,title:lead.titleUk||lead.title,source:lead.source,publishedAt:lead.publishedAt
 }):'none');
 console.log('[GalaxiNews] most recently published:',newest?JSON.stringify({
  id:newest.id,title:newest.titleUk||newest.title,source:newest.source,publishedAt:newest.publishedAt
 }):'none');
 console.log('[GalaxiNews] recent scans:',recentScans.map(scan=>({
  at:scan.createdAt,added:scan.accepted,sources:scan.sources,errors:scan.errors
 })));
 const scans=await prisma.newsSourceScan.findMany({orderBy:{createdAt:'desc'},take:100,
  select:{sourceKey:true,status:true,failure:true,createdAt:true}});
 const latest=new Map();
 for(const s of scans)if(!latest.has(s.sourceKey))latest.set(s.sourceKey,s);
 const counters={ok:0,empty:0,error:0,cooldown:0,other:0};
 for(const s of latest.values()){
  if(Object.hasOwn(counters,s.status))counters[s.status]++;
  else counters.other++;
 }
 console.log('[GalaxiNews] latest source states:',counters);
 const failures=[...latest.values()].filter(s=>s.status==='error').slice(0,6);
 if(failures.length)console.log('[GalaxiNews] recent failed sources:',
  failures.map(s=>s.sourceKey+' ('+(s.failure||'unknown').slice(0,95)+')').join('; '));
 await verifyRunningFrontend();
 if(repair){
  // Restore rights-checked photo alternatives before slow editorial LLM calls.
  // Bounded batches: keep the repair command safe under limited upstream access.
  for(let batch=0;batch<4;batch++){
   const images=await enrichOpenNewsPhotos(prisma);
   console.log('[GalaxiNews] Commons photo recovery',batch+1,
    'checked:',images.checked,'restored:',images.filled);
   if(images.checked===0||images.filled===0)break;
  }
  await metadataRecovery();
  if(process.env.NEWS_TRANSLATION_ENABLED==='0'){
   console.warn('[GalaxiNews] Local NMT translation is disabled; no LLM fallback will occur.');
  }else{
   let total=0;
   for(let i=0;i<6;i++){
    const result=await enrichPendingNews(prisma);
    console.log('[GalaxiNews] NMT batch',i+1,JSON.stringify(result));
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
