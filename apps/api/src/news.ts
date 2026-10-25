import {BadRequestException,Body,Controller,Get,Header,Inject,Param,Patch,Post,Query,Req,UnauthorizedException,ForbiddenException} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {IsIn} from 'class-validator';
import type {IncomingMessage} from 'node:http';
import {PrismaService} from './prisma.ts';
import {cookieUser,sameOrigin} from './auth.ts';
import {TOPICS,TOPIC_LABELS,rank,diversify} from './news-domain.ts';
import {NewsIngestionService} from './news-ingestion.ts';
import {RSS_SOURCES,GDELT_QUERIES} from './news-sources.ts';
class ModerateDto{@IsIn(['PUBLISHED','HIDDEN'])status!:'PUBLISHED'|'HIDDEN';}
@ApiTags('GalaxiNews World')
@Controller('api/v1/news')
export class NewsController {
 constructor(@Inject(PrismaService)private readonly prisma:PrismaService,
  @Inject(NewsIngestionService)private readonly ingestion:NewsIngestionService){}
 private async admin(req:IncomingMessage,mutation=false){
  if(mutation&&!sameOrigin(req))throw new ForbiddenException('Cross-origin update denied');
  const uid=cookieUser(req);if(!uid)throw new UnauthorizedException();
  const user=await this.prisma.user.findUnique({where:{id:uid},select:{role:true}});
  if(user?.role!=='ADMIN')throw new ForbiddenException('Admin only');
 }
 @Get('topics') @Header('Cache-Control','public,max-age=300')
 topics(){return TOPIC_LABELS;}
 @Get('feed') @Header('Cache-Control','public,max-age=60')
 async feed(@Query('topic')topic='all',@Query('tag')tag='',@Query('limit')limit='24',
  @Query('page')page='1',@Query('sort')sort='relevance',@Query('tags')tags=''){
  if(topic!=='all'&&!TOPICS.includes(topic as typeof TOPICS[number])||
   tag&&!TOPICS.includes(tag as typeof TOPICS[number]))throw new BadRequestException('Invalid category');
  if(!/^\d{1,2}$/.test(limit)||Number(limit)<1||Number(limit)>48||
   !/^\d{1,3}$/.test(page)||Number(page)<1||Number(page)>20)throw new BadRequestException('Invalid pagination');
  if(!['relevance','latest'].includes(sort))throw new BadRequestException('Invalid sort');
  const selectedTags=tags?tags.split(','):[];
  if(selectedTags.length>8||selectedTags.some(x=>!TOPICS.includes(x as typeof TOPICS[number])))
   throw new BadRequestException('Invalid tags');
  const articles=await this.prisma.newsArticle.findMany({
   where:{status:'PUBLISHED',...(topic!=='all'?{topic}:{}),...(tag?{tags:{has:tag}}:selectedTags.length?{tags:{hasSome:selectedTags}}:{})},
   take:600,orderBy:{publishedAt:'desc'},select:{
    id:true,url:true,title:true,source:true,language:true,topic:true,tags:true,publishedAt:true,
    publishedAccuracy:true,score:true,summary:true,summaryKind:true,summaryUk:true,summaryEn:true,
    titleUk:true,imageUrl:true,imageCredit:true
   }
  });
  const ordered=articles.map(a=>({...a,relevance:rank(a.score,a.publishedAt)}))
   .sort((a,b)=>sort==='latest'?b.publishedAt.getTime()-a.publishedAt.getTime():
    b.relevance-a.relevance||b.publishedAt.getTime()-a.publishedAt.getTime());
  const ranked=sort==='relevance'&&topic==='all'&&!tag?diversify(ordered,3):ordered;
  const size=Number(limit),offset=(Number(page)-1)*size;
  const lastScan=await this.prisma.newsScan.findFirst({orderBy:{createdAt:'desc'},
   select:{createdAt:true,sources:true,accepted:true,errors:true}});
  return {items:ranked.slice(offset,offset+size).map(({score,...rest})=>rest),
   total:ranked.length,page:Number(page),limit:size,lastScan,intervalMinutes:15,
   personalized:false,sort};
 }
 @Get('status') @Header('Cache-Control','public,max-age=120')
 async status(){
  const [last,articles,sources,topics]=await Promise.all([
   this.prisma.newsScan.findFirst({orderBy:{createdAt:'desc'},select:{createdAt:true,sources:true,accepted:true,errors:true}}),
   this.prisma.newsArticle.count({where:{status:'PUBLISHED'}}),
   this.prisma.newsArticle.groupBy({by:['source'],where:{status:'PUBLISHED'},_count:{_all:true}}),
   this.prisma.newsArticle.groupBy({by:['topic'],where:{status:'PUBLISHED'},_count:{_all:true}})
  ]);
  return {lastScan:last,articleCount:articles,activePublishers:sources.length,
   byTopic:topics.map(t=>({topic:t.topic,count:t._count._all})),intervalMinutes:15,
   running:process.env.NEWS_INGESTION_ENABLED==='1'};
 }
 @Patch('admin/:id/status') @Header('Cache-Control','private,no-store')
 async moderate(@Req()req:IncomingMessage,@Param('id')id:string,@Body()body:ModerateDto){
  await this.admin(req,true);
  const result=await this.prisma.newsArticle.updateMany({where:{id},data:{status:body.status}});
  return {updated:result.count};
 }
 @Get('admin/health') @Header('Cache-Control','private,no-store')
 async health(@Req()req:IncomingMessage){
  await this.admin(req);
  const [last,scans,articleCount,byTopic,byPublisher]=await Promise.all([
   this.prisma.newsScan.findFirst({orderBy:{createdAt:'desc'}}),
   this.prisma.newsSourceScan.findMany({orderBy:{createdAt:'desc'},take:120}),
   this.prisma.newsArticle.count({where:{status:'PUBLISHED'}}),
   this.prisma.newsArticle.groupBy({by:['topic'],where:{status:'PUBLISHED'},_count:{_all:true}}),
   this.prisma.newsArticle.groupBy({by:['source'],where:{status:'PUBLISHED'},_count:{_all:true}})
  ]);
  const seen=new Set<string>(),latest:typeof scans=[];
  for(const row of scans){if(!seen.has(row.sourceKey)){seen.add(row.sourceKey);latest.push(row);}}
  return {enabled:process.env.NEWS_INGESTION_ENABLED==='1',last,
   registeredSources:RSS_SOURCES.length+GDELT_QUERIES.length,
   articleCount,publishers:byPublisher.length,
   byTopic:byTopic.map(t=>({topic:t.topic,count:t._count._all})),
   sources:latest,history:scans.slice(0,40)};
 }
 @Post('admin/refresh') @Header('Cache-Control','private,no-store')
 async refresh(@Req()req:IncomingMessage,@Query('backfill')backfill='false'){
  await this.admin(req,true);
  if(!['true','false'].includes(backfill))throw new BadRequestException('Invalid backfill');
  void this.ingestion.refresh({backfill:backfill==='true'})
   .catch(e=>console.warn('[news] manual refresh:',String(e)));
  return {requested:true,completed:false,details:'Inspect /api/v1/news/admin/health for actual results'};
 }
}
for(const [method,types] of [
 ['feed',[String,String,String,String,String,String]],
 ['moderate',[Object,String,ModerateDto]],
 ['health',[Object]],
 ['refresh',[Object,String]]
] as const){Reflect.defineMetadata('design:paramtypes',types,NewsController.prototype,method);}
