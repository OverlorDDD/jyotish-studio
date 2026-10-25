import {Injectable,OnModuleDestroy,OnModuleInit} from '@nestjs/common';
import {createHash,randomUUID} from 'node:crypto';
import {PrismaService} from './prisma.ts';
import {classify,parseXml,type Candidate} from './news-domain.ts';
const RSS=[
 ['The Astrology Podcast','https://theastrologypodcast.com/feed/'],
 ['Biddy Tarot','https://www.biddytarot.com/feed/'],
 ['Yoga Journal','https://www.yogajournal.com/feed/']
] as const;
const GDELT=[
 '"Vedic astrology" OR Jyotish','"tarot cards" OR "tarot reading"',
 '"yoga practice" OR "yoga philosophy"','"vedic tradition" OR "Bhagavad Gita"',
 '"astrology" AND "natal chart"'
] as const;
async function load(url:string,accept:string){
 const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(10000),
  headers:{Accept:accept,'User-Agent':'GalaxioraNewsDiscovery/1.0'}});
 if(!r.ok)throw Error('HTTP '+r.status);
 const size=Number(r.headers.get('content-length')||0);
 if(size>1500000)throw Error('Feed too large');
 const text=await r.text();if(text.length>1500000)throw Error('Feed too large');
 return text;
}
function gdelt(raw:unknown):Candidate[]{
 const articles=(raw as {articles?:unknown})?.articles;
 if(!Array.isArray(articles))return [];
 return articles.slice(0,60).flatMap(v=>{
  if(!v||typeof v!=='object')return [];
  const x=v as Record<string,unknown>;
  if(typeof x.url!=='string'||typeof x.title!=='string'||typeof x.seendate!=='string')return [];
  const date=new Date(x.seendate.replace(/^(\d{4})(\d\d)(\d\d)T(\d\d)(\d\d)(\d\d)Z$/,'$1-$2-$3T$4:$5:$6Z'));
  return Number.isFinite(date.getTime())?[{url:x.url,title:x.title,publishedAt:date,
   source:typeof x.domain==='string'?x.domain:'GDELT-indexed publisher',
   language:typeof x.language==='string'?x.language:'unknown'}]:[];
 });
}
const sleep=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
@Injectable()
export class NewsIngestionService implements OnModuleInit,OnModuleDestroy{
 private timer?:ReturnType<typeof setInterval>;
 private running=false;
 constructor(private readonly prisma:PrismaService){}
 onModuleInit(){
  if(process.env.NEWS_INGESTION_ENABLED!=='1')return;
  this.timer=setInterval(()=>{void this.refresh().catch(e=>console.warn('[news]',e));},15*60*1000);
  this.timer.unref?.();
  const initial=setTimeout(()=>{void this.refresh().catch(e=>console.warn('[news]',e));},15000);
  initial.unref?.();
 }
 onModuleDestroy(){if(this.timer)clearInterval(this.timer);}
 async refresh(){
  if(this.running)return {skipped:true};
  this.running=true;
  const now=new Date(),token=randomUUID();
  try{
   await this.prisma.newsIngestionLease.upsert({
    where:{id:'world'},create:{id:'world',token:'unclaimed',expiresAt:new Date(0)},update:{}});
   const lease=await this.prisma.newsIngestionLease.updateMany({
    where:{id:'world',expiresAt:{lte:now}},
    data:{token,expiresAt:new Date(now.getTime()+12*60*1000)}});
   if(!lease.count)return {skipped:true};
   let sources=0,accepted=0,errors=0;
   try{
    const jobs=[
     ...RSS.map(([name,url])=>({name,run:()=>load(url,'application/rss+xml, application/atom+xml, text/xml').then(xml=>parseXml(xml,name))})),
     ...GDELT.map((query,i)=>({name:'GDELT '+(i+1),run:async()=>{
      const u=new URL('https://api.gdeltproject.org/api/v2/doc/doc');
      u.searchParams.set('query','('+query+')');u.searchParams.set('mode','artlist');
      u.searchParams.set('format','json');u.searchParams.set('maxrecords','50');u.searchParams.set('timespan','7d');
      return gdelt(JSON.parse(await load(u.toString(),'application/json')));
     }}))
    ];
    for(const job of jobs){
     sources++;
     try{
      for(const item of await job.run()){
       const c=classify(item);if(!c)continue;
       const urlHash=createHash('sha256').update(c.url).digest('hex');
       try{
        await this.prisma.newsArticle.upsert({where:{urlHash},
         create:{urlHash,url:c.url,title:c.title,source:c.source,language:c.language,
          topic:c.topic,tags:c.tags,publishedAt:c.publishedAt,score:c.score},
         update:{lastSeenAt:new Date()}});
        accepted++;
       }catch(e){errors++;console.warn('[news] invalid article',String(e));}
      }
     }catch(e){errors++;console.warn('[news] source '+job.name,String(e));}
     if(job.name.startsWith('GDELT'))await sleep(5200);
    }
    await this.prisma.newsScan.create({data:{sources,accepted,errors}});
    return {sources,accepted,errors};
   }finally{
    await this.prisma.newsIngestionLease.updateMany({where:{id:'world',token},
     data:{token:'unclaimed',expiresAt:new Date(0)}});
   }
  }finally{this.running=false;}
 }
}
