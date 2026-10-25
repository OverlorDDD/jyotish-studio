import {Inject,Injectable,OnModuleDestroy,OnModuleInit} from '@nestjs/common';
import {createHash,randomUUID} from 'node:crypto';
import {PrismaService} from './prisma.ts';
import {classifyWithReason,parseXml,type Candidate,type Topic} from './news-domain.ts';
import {GDELT_QUERIES,RSS_SOURCES} from './news-sources.ts';
const PERIOD_MS=15*60*1000,LEASE_MS=12*60*1000;
type Job={key:string;run:()=>Promise<Candidate[]>;hint:Topic;allowSnippet:boolean;isGdelt:boolean};
const sleep=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
async function read(url:string,accept:string){
 const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(9000),
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
   language:typeof x.language==='string'?x.language:'unknown'}]:[];
 });
}
@Injectable()
export class NewsIngestionService implements OnModuleInit,OnModuleDestroy{
 private timer?:ReturnType<typeof setInterval>;
 private running=false;
 constructor(@Inject(PrismaService)private readonly prisma:PrismaService){}
 onModuleInit(){
  if(process.env.NEWS_INGESTION_ENABLED!=='1')return;
  this.timer=setInterval(()=>{void this.refresh().catch(e=>console.warn('[news] scheduled scan',String(e)));},PERIOD_MS);
  this.timer.unref?.();
  const initial=setTimeout(()=>{void this.refresh().catch(e=>console.warn('[news] initial scan',String(e)));},15000);
  initial.unref?.();
 }
 onModuleDestroy(){if(this.timer)clearInterval(this.timer);}
 private jobs(backfill:boolean):Job[]{
  const rss:Job[]=RSS_SOURCES.map(s=>({key:s.key,hint:s.hint,allowSnippet:s.allowSnippet,isGdelt:false,
   run:()=>read(s.url,'application/rss+xml,application/atom+xml,application/xml,text/xml').then(x=>parseXml(x,s.name))}));
  const gdeltJobs:Job[]=GDELT_QUERIES.map(([key,query,topic])=>({
   key:'gdelt-'+key,hint:topic,isGdelt:true,allowSnippet:false,
   run:async()=>{
    const u=new URL('https://api.gdeltproject.org/api/v2/doc/doc');
    u.searchParams.set('query','('+query+')');u.searchParams.set('mode','artlist');
    u.searchParams.set('format','json');u.searchParams.set('maxrecords',backfill?'150':'60');
    u.searchParams.set('timespan',backfill?'2months':'7d');u.searchParams.set('sort','datedesc');
    return gdelt(JSON.parse(await read(u.toString(),'application/json')));
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
   try{
    const previous=await this.prisma.newsScan.count();
    const backfill=options.backfill===true||previous===0;
    for(const job of this.jobs(backfill)){
     const began=Date.now(),reasonCounts:Record<string,number>={};
     let candidates=0,accepted=0,duplicates=0,rejected=0,errors=0,status='ok',failure:string|null=null;
     sources++;
     try{
      const items=await job.run();candidates=items.length;
      if(!items.length)status='empty';
      for(const item of items){
       const {article:c,reason}=classifyWithReason({...item,hint:job.hint,allowSnippet:job.allowSnippet});
       if(!c){rejected++;reasonCounts[reason]=(reasonCounts[reason]||0)+1;continue;}
       const urlHash=createHash('sha256').update(c.url).digest('hex');
       try{
        const inserted=await this.prisma.newsArticle.createMany({data:[{
         urlHash,url:c.url,title:c.title,source:c.source,language:c.language,topic:c.topic,
         tags:c.tags,score:c.score,summary:c.summary.slice(0,500),
         summaryUk:c.ukFallback||null,summaryEn:c.enFallback||null,
         summaryKind:c.summaryKind,publishedAccuracy:c.publishedAccuracy||'published',publishedAt:c.publishedAt
        }],skipDuplicates:true});
        if(inserted.count){accepted++;added++;}
        else{
         duplicates++;duplicatesAll++;
         // Can enrich old rows, but do not change their visibility/moderation.
         if(c.summaryKind==='source_excerpt')await this.prisma.newsArticle.updateMany({
          where:{urlHash,summaryKind:'title_context'},data:{summary:c.summary.slice(0,500),
           summaryKind:'source_excerpt',lastSeenAt:new Date()}
         });
        }
       }catch(e){errors++;console.warn('[news] item rejected',String(e));}
      }
     }catch(e){status='error';failure=String(e).slice(0,300);errors++;
      console.warn('[news] source '+job.key+': '+failure);}
     rejectedAll+=rejected;errorsAll+=errors;
     await this.prisma.newsSourceScan.create({data:{sourceKey:job.key,scanToken:token,
      status,candidates,accepted,duplicates,rejected,errors,rejectionReasons:reasonCounts,
      failure,durationMs:Date.now()-began}}).catch(e=>console.warn('[news] audit',String(e)));
     if(job.isGdelt)await sleep(6500);
    }
    await this.prisma.newsScan.create({data:{sources,accepted:added,errors:errorsAll}});
    return {sources,newArticles:added,duplicates:duplicatesAll,rejected:rejectedAll,errors:errorsAll,backfill};
   }finally{
    await this.prisma.newsIngestionLease.updateMany({where:{id:'world',token},
     data:{token:'unclaimed',expiresAt:new Date(0)}});
   }
  }finally{this.running=false;}
 }
}
