import {BadRequestException,Body,Controller,Get,Header,Inject,Param,Patch,Query,Req,UnauthorizedException,ForbiddenException} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {IsIn} from 'class-validator';
import type {IncomingMessage} from 'node:http';
import {PrismaService} from './prisma.ts';
import {cookieUser,sameOrigin} from './auth.ts';
import {TOPICS,TOPIC_LABELS,rank} from './news-domain.ts';
import {NewsIngestionService} from './news-ingestion.ts';
class ModerateDto{@IsIn(['PUBLISHED','HIDDEN'])status!:'PUBLISHED'|'HIDDEN';}
@ApiTags('GalaxiNews World')
@Controller('api/v1/news')
export class NewsController {
 constructor(@Inject(PrismaService)private readonly prisma:PrismaService,
  @Inject(NewsIngestionService)private readonly ingestion:NewsIngestionService){}
 @Get('topics') @Header('Cache-Control','public,max-age=300')
 topics(){return TOPIC_LABELS;}
 @Get('feed') @Header('Cache-Control','public,max-age=60')
 async feed(@Query('topic')topic='all',@Query('tag')tag='',@Query('limit')limit='24',@Query('page')page='1'){
  if(topic!=='all'&&!TOPICS.includes(topic as typeof TOPICS[number])||
   tag&&!TOPICS.includes(tag as typeof TOPICS[number]))throw new BadRequestException('Invalid category');
  if(!/^\d{1,2}$/.test(limit)||Number(limit)<1||Number(limit)>48||
   !/^\d{1,3}$/.test(page)||Number(page)<1||Number(page)>20)throw new BadRequestException('Invalid pagination');
  const articles=await this.prisma.newsArticle.findMany({
   where:{status:'PUBLISHED',...(topic!=='all'?{topic}:{}),...(tag?{tags:{has:tag}}:{})},
   take:500,orderBy:{publishedAt:'desc'},select:{
    id:true,url:true,title:true,source:true,language:true,topic:true,tags:true,publishedAt:true,score:true}
  });
  const ranked=articles.map(a=>({...a,relevance:rank(a.score,a.publishedAt)}))
   .sort((a,b)=>b.relevance-a.relevance||b.publishedAt.getTime()-a.publishedAt.getTime());
  const size=Number(limit),offset=(Number(page)-1)*size;
  const lastScan=await this.prisma.newsScan.findFirst({orderBy:{createdAt:'desc'},
   select:{createdAt:true,sources:true,accepted:true,errors:true}});
  return {items:ranked.slice(offset,offset+size).map(({score,...r})=>r),
   total:ranked.length,page:Number(page),limit:size,lastScan,intervalMinutes:15,personalized:false};
 }
 @Patch('admin/:id/status') @Header('Cache-Control','private,no-store')
 async moderate(@Req()req:IncomingMessage,@Param('id')id:string,@Body()body:ModerateDto){
  if(!sameOrigin(req))throw new ForbiddenException('Cross-origin update denied');
  const uid=cookieUser(req);if(!uid)throw new UnauthorizedException();
  const user=await this.prisma.user.findUnique({where:{id:uid},select:{role:true}});
  if(user?.role!=='ADMIN')throw new ForbiddenException('Admin only');
  const result=await this.prisma.newsArticle.updateMany({where:{id},data:{status:body.status}});
  return {updated:result.count};
 }
 @Get('admin/health') @Header('Cache-Control','private,no-store')
 async health(@Req()req:IncomingMessage){
  const uid=cookieUser(req);if(!uid)throw new UnauthorizedException();
  const user=await this.prisma.user.findUnique({where:{id:uid},select:{role:true}});
  if(user?.role!=='ADMIN')throw new ForbiddenException();
  return {enabled:process.env.NEWS_INGESTION_ENABLED==='1',
   last:await this.prisma.newsScan.findFirst({orderBy:{createdAt:'desc'}})};
 }
}
for(const [method,types] of [
 ['feed',[String,String,String,String]],
 ['moderate',[Object,String,ModerateDto]],
 ['health',[Object]]
] as const){Reflect.defineMetadata('design:paramtypes',types,NewsController.prototype,method);}
