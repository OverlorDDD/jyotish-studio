import {Inject,Injectable,OnModuleDestroy,OnModuleInit} from '@nestjs/common';
import {createHash,randomUUID} from 'node:crypto';
import {PrismaService} from './prisma.ts';
import {classifyWithReason,parseXml,publisherDomain,safeImageUrl,type Candidate,type Topic} from './news-domain.ts';
import {GDELT_QUERIES,RSS_SOURCES} from './news-sources.ts';
import {enrichPendingNews} from './news-editorial.ts';
import {fetchArticleMetadata,metadataHosts} from './news-metadata.ts';
import {sourceCooldownMs,gdeltCircuitFailure} from './news-source-health.ts';
import {publishAstronomicalNews} from './news-astronomy.ts';
import {enrichOpenNewsPhotos} from './news-open-media.ts';
/** Local development with an existing .env and no NEWS_* flag must not
 * silently stop news. CI/test and production remain explicitly opted in.
 */
export function newsIngestionEnabled(env=process.env,args=process.argv){
 if(env.NEWS_INGESTION_ENABLED==='0')return false;
 if(env.NEWS_INGESTION_ENABLED==='1')return true;
 return env.NODE_ENV!=='production'&&env.NODE_ENV!=='test'&&
  args.some(v=>/[\\/]src[\\/]main\.ts$|^src[\\/]main\.ts$/.test(v));
}
const PERIOD_MS=15*60*1000,LEASE_MS=12*60*1000;
type Job={key:string;run:()=>Promise<Candidate[]>;hint:Topic;allowSnippet:boolean;isGdelt:boolean};
const sleep=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
async function read(url:string,accept:string,timeoutMs=9000){
 const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(timeoutMs),
  headers:{Accept:accept,'User-Agent':'GalaxioraNewsDiscovery/1.1 (metadata only)'}});
 if(!r.ok)throw Error('HTTP '+r.status);
 if(Number(r.headers.get('content-length')||0)>1500000)throw Error('Feed too large');
 const type=r.headers.get('content-type')||'';
 if(!/xml|rss|atom|json|text|octet-stream/i.test(type))throw Error('Unexpected content type');
 const text=await r.text();if(text.length>1500000)throw Error('Feed too large');
 return text;
}
function gdelt(raw:unknown):Candidate[]{
 const list=(raw as {articles?:unknown})?.articles;
 if(!Array.isArray(list))return [];
 return list.slice(0,150).flatMap(v=>{
  if(!v||typeof v!=='object')return [];
  const x=v as Record<string,unknown>;
  if(typeof x.url!=='string'||typeof x.title!=='string'||typeof x.seendate!=='string')return [];
  const when=new Date(x.seendate.replace(/^(\d{4})(\d\d)(\d\d)T(\d\d)(\d\d)(\d\d)Z$/,'$1-$2-$3T$4:$5:$6Z'));
  // GDELT seendate is detection time rather than confirmed original publication time.
  return Number.isFinite(when.getTime())?[{url:x.url,title:x.title,publishedAt:when,
   publishedAccuracy:'observed' as const,source:typeof x.domain==='string'?x.domain:'GDELT indexed',
   language:typeof x.language==='string'?x.language:'unknown',
   imageUrl:typeof x.socialimage==='string'?x.socialimage:undefined,imageCredit:typeof x.domain==='string'?x.domain:'Publisher'}]:[];
 });
}
@Injectable()
export class NewsIngestionService implements OnModuleInit,OnModuleDestroy{
 private timer?:ReturnType<typeof setInterval>;
 private editorialTimer?:ReturnType<typeof setInterval>;
 private running=false;
 private nextAstronomyAt=0;
 private sourceRetryUntil=new Map<string,number>();
 private sourceFailures=new Map<string,number>();
 private gdeltRetryUntil=0;
 constructor(@Inject(PrismaService)private readonly prisma:PrismaService){}
 onModuleInit(){
  if(!newsIngestionEnabled())return;
  this.timer=setInterval(()=>{void this.refresh().catch(e=>console.warn('[news] scheduled scan',String(e)));},PERIOD_MS);
  this.timer.unref?.();
  this.editorialTimer=setInterval(()=>{void this.runEditorial();},5*60*1000);
  this.editorialTimer.unref?.();
  const initial=setTimeout(()=>{void this.refresh().catch(e=>console.warn('[news] initial scan',String(e)));},15000);
  initial.unref?.();
  const editorialInitial=setTimeout(()=>void this.runEditorial(),25000);
  editorialInitial.unref?.();
 }
 onModuleDestroy(){if(this.timer)clearInterval(this.timer);if(this.editorialTimer)clearInterval(this.editorialTimer);}
 private jobs(backfill:boolean):Job[]{
  const rss:Job[]=RSS_SOURCES.map(s=>({key:s.key,hint:s.hint,allowSnippet:s.allowSnippet,isGdelt:false,
   run:()=>read(s.url,'application/rss+xml,application/atom+xml,application/xml,text/xml').then(x=>parseXml(x,s.name))}));
  const gdeltJobs:Job[]=GDELT_QUERIES.map(([key,query,topic])=>({
   key:'gdelt-'+key,hint:topic,isGdelt:true,allowSnippet:false,
   run:async()=>{
    const u=new URL('https://api.gdeltproject.org/api/v2/doc/doc');
    u.searchParams.set('query','('+query+')');u.searchParams.set('mode','artlist');
    u.searchParams.set('format','json');u.searchParams.set('maxrecords',backfill?'75':'40');
    u.searchParams.set('timespan',backfill?'2weeks':'3d');u.searchParams.set('sort','datedesc');
    const raw=await read(u.toString(),'application/json',14000);
    try{return gdelt(JSON.parse(raw));}
    catch{throw new Error('GDELT returned non-JSON text or an incomplete response');}
   }
  }));
  return [...rss,...gdeltJobs];
 }
 async refresh(options:{backfill?:boolean}={}){
  if(this.running)return {skipped:true,reason:'local_cycle_running'};
  this.running=true;
  const token=randomUUID(),start=new Date();
  try{
   await this.prisma.newsIngestionLease.upsert({where:{id:'world'},
    create:{id:'world',token:'unclaimed',expiresAt:new Date(0)},update:{}});
   const lease=await this.prisma.newsIngestionLease.updateMany({
    where:{id:'world',expiresAt:{lte:start}},
    data:{token,expiresAt:new Date(start.getTime()+LEASE_MS)}});
   if(!lease.count)return {skipped:true,reason:'database_lease_held'};
   let sources=0,added=0,duplicatesAll=0,rejectedAll=0,errorsAll=0;
   const domainPolicies=new Map<string,string>();
   try{
    const previous=await this.prisma.newsSourceScan.count();
    const backfill=options.backfill===true||previous===0;
    // A verified, original Galaxiora astronomy digest, at most daily. This
    // operates independently of failing external RSS/GDELT publishers.
    if(Date.now()>=this.nextAstronomyAt){
     this.nextAstronomyAt=Date.now()+24*60*60*1000;
     try{
      const original=await publishAstronomicalNews(this.prisma);
      if(original.created)console.log('[news] first-party Swiss astronomy:',original.created,'new stories');
      added+=original.created;
     }catch(e){console.warn('[news] astronomy digest:',String(e).slice(0,180));}
    }

    // Restore actual licensed photos for older cards before unreliable RSS
    // sources run. Commons metadata provides explicit artist and CC terms.
    // Publisher photos still require their own independent reuse grant.
    try{
     const photos=await enrichOpenNewsPhotos(this.prisma);
     if(photos.checked)console.log('[news] open photos: checked',photos.checked,'restored',photos.filled);
    }catch(e){console.warn('[news] licensed image recovery:',String(e).slice(0,180));}
    for(const job of this.jobs(backfill)){
     const began=Date.now(),reasonCounts:Record<string,number>={};
     let candidates=0,accepted=0,duplicates=0,rejected=0,errors=0,status='ok',failure:string|null=null;
     sources++;
     const retryAt=Math.max(this.sourceRetryUntil.get(job.key)||0,job.isGdelt?this.gdeltRetryUntil:0);
     if(retryAt>Date.now()){
      status='cooldown';failure='Retry after '+new Date(retryAt).toISOString();
     }else try{
      const items=await job.run();candidates=items.length;
      if(!items.length)status='empty';
      for(const item of items){
       const {article:c,reason}=classifyWithReason({...item,hint:job.hint,allowSnippet:job.allowSnippet});
       if(!c){rejected++;reasonCounts[reason]=(reasonCounts[reason]||0)+1;continue;}
       const domain=publisherDomain(c.url);
       if(!domain){rejected++;reasonCounts.invalid_publisher=(reasonCounts.invalid_publisher||0)+1;continue;}
       let state=domainPolicies.get(domain);
       if(!state){
        const found=await this.prisma.newsDiscoveredSource.findUnique({where:{domain},select:{status:true}});
        state=found?.status||'DISCOVERED';domainPolicies.set(domain,state);
       }
       if(state==='BLOCKED'){rejected++;reasonCounts.blocked_source=(reasonCounts.blocked_source||0)+1;continue;}
       const urlHash=createHash('sha256').update(c.url).digest('hex');
       try{
        const inserted=await this.prisma.newsArticle.createMany({data:[{
         urlHash,url:c.url,title:c.title,source:c.source,language:c.language,topic:c.topic,
         tags:c.tags,score:c.score,summary:c.summary||null,
         feedDescription:item.description?.slice(0,1200)||null,
         imageUrl:c.imageUrl||null,imageCredit:c.imageCredit||null,
         summaryUk:null,summaryEn:null,
         summaryKind:c.summaryKind,publishedAccuracy:c.publishedAccuracy||'published',publishedAt:c.publishedAt
        }],skipDuplicates:true});
        if(inserted.count){
         accepted++;added++;
         await this.prisma.newsDiscoveredSource.upsert({where:{domain},
          create:{domain,lastTitle:c.title.slice(0,240),articleCount:1},
          update:{lastSeenAt:new Date(),lastTitle:c.title.slice(0,240),articleCount:{increment:1}}});
        }
        else{
         duplicates++;duplicatesAll++;
         // Can enrich old rows, but do not change their visibility/moderation.
         // New publisher metadata can enhance existing legacy rows and trigger translation.
         const prior=await this.prisma.newsArticle.findUnique({where:{urlHash},
          select:{feedDescription:true,summaryKind:true}});
         const received=item.description?.slice(0,1200)||'';
         const isNewContext=received.length>45&&received!==prior?.feedDescription;
         await this.prisma.newsArticle.updateMany({where:{urlHash},data:{
          lastSeenAt:new Date(),
          ...(isNewContext?{feedDescription:received,summaryKind:'needs_editorial',
           editorialNextAttemptAt:null,editorialAttempts:0}:{}),
          ...(c.imageUrl?{imageUrl:c.imageUrl,imageCredit:c.imageCredit}:{}),
          ...(c.summaryKind==='source_excerpt'&&prior?.summaryKind!=='ai_editorial'?
           {summary:c.summary,summaryKind:'source_excerpt'}:{})
         }});
        }
       }catch(e){errors++;console.warn('[news] item rejected',String(e));}
      }
      this.sourceFailures.delete(job.key);
      this.sourceRetryUntil.delete(job.key);
      if(job.isGdelt)this.gdeltRetryUntil=0;
     }catch(e){status='error';failure=String(e).slice(0,300);errors++;
      const failures=(this.sourceFailures.get(job.key)||0)+1;
      this.sourceFailures.set(job.key,failures);
      const retryAt=Date.now()+sourceCooldownMs(failure,failures);
      this.sourceRetryUntil.set(job.key,retryAt);
      if(job.isGdelt&&gdeltCircuitFailure(failure))this.gdeltRetryUntil=Math.max(this.gdeltRetryUntil,retryAt);
      console.warn('[news] source '+job.key+': '+failure+'; retry after '+new Date(retryAt).toISOString());
     }
     rejectedAll+=rejected;errorsAll+=errors;
     await this.prisma.newsSourceScan.create({data:{sourceKey:job.key,scanToken:token,
      status,candidates,accepted,duplicates,rejected,errors,rejectionReasons:reasonCounts,
      failure,durationMs:Date.now()-began}}).catch(e=>console.warn('[news] audit',String(e)));
     if(job.isGdelt&&status!=='cooldown'&&this.gdeltRetryUntil<=Date.now())await sleep(6500);
    }
    await this.prisma.newsScan.create({data:{sources,accepted:added,errors:errorsAll}});
    await this.enrichMetadata().catch(e=>console.warn('[news] metadata lookup failed',String(e)));
    await this.runEditorial();
    return {sources,newArticles:added,duplicates:duplicatesAll,rejected:rejectedAll,errors:errorsAll,backfill};
   }finally{
    await this.prisma.newsIngestionLease.updateMany({where:{id:'world',token},
     data:{token:'unclaimed',expiresAt:new Date(0)}});
   }
  }finally{this.running=false;}
 }
 private editorialRunning=false;
 private async runEditorial(){
  if(this.editorialRunning)return;
  this.editorialRunning=true;
  try{
   const result=await enrichPendingNews(this.prisma);
   console.log('[news] localization:',result.processed,'updated');
  }catch(e){console.warn('[news] editorial:',String(e));}
  finally{this.editorialRunning=false;}
 }
 private async enrichMetadata(){
  const trusted=await this.prisma.newsDiscoveredSource.findMany({where:{status:'TRUSTED'},select:{domain:true}});
  const extra=trusted.map(x=>x.domain);
  const approved=metadataHosts(extra),rows=await this.prisma.newsArticle.findMany({
   where:{status:'PUBLISHED',OR:[{metadataCheckedAt:null},
    {metadataCheckedAt:{lt:new Date(Date.now()-7*24*3600000)},feedDescription:null}]},
   orderBy:{publishedAt:'desc'},take:600,
   select:{id:true,url:true,feedDescription:true,imageUrl:true,imageCredit:true}
  });
  let checked=0,filled=0;
  for(const row of rows){
   if(checked>=18)break;
   const domain=publisherDomain(row.url);
   if(!domain)continue;
   if(!approved.has(domain)&&!approved.has('www.'+domain))continue;
   checked++;
   const meta=await fetchArticleMetadata(row.url,fetch,extra);
   const externalImage=meta.imageUrl?safeImageUrl(meta.imageUrl,'',domain,false):null;
   await this.prisma.newsArticle.updateMany({where:{id:row.id,status:'PUBLISHED'},data:{
    metadataCheckedAt:new Date(),
    ...(!row.feedDescription&&meta.description?{feedDescription:meta.description,summaryKind:'needs_editorial',editorialNextAttemptAt:null,editorialAttempts:0}:{}),
    ...(!row.imageUrl&&externalImage?{imageUrl:externalImage,imageCredit:meta.imageCredit||domain}:{})
   }});
   if(meta.description||externalImage)filled++;
  }
  if(checked)console.log('[news] metadata:',checked,'checked',filled,'with metadata');
 }

}
