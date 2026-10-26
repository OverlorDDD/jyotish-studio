import {BadRequestException,Body,ConflictException,Controller,Delete,Get,Header,HttpException,Inject,NotFoundException,Param,Patch,Post,Put,Query,Req,UnauthorizedException,ForbiddenException} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {ArrayMaxSize,IsArray,IsBoolean,IsIn} from 'class-validator';
import type {IncomingMessage} from 'node:http';
import {PrismaService} from './prisma.ts';
import {cookieUser,sameOrigin} from './auth.ts';
import {TOPICS,TOPIC_LABELS,INTEREST_TAGS,EXTRA_INTEREST_LABELS,rank,diversify} from './news-domain.ts';
import {NewsIngestionService} from './news-ingestion.ts';
import {rankPersonalNews} from './news-relevance.ts';
import {createKeyedHourlyLimiter} from './ai.ts';
import {RSS_SOURCES,GDELT_QUERIES} from './news-sources.ts';
class ModerateDto{@IsIn(['PUBLISHED','HIDDEN'])status!:'PUBLISHED'|'HIDDEN';}
class SourcePolicyDto{@IsIn(['DISCOVERED','BLOCKED','TRUSTED'])status!:'DISCOVERED'|'BLOCKED'|'TRUSTED';}
class NewsVoteDto{@IsIn(['YES','NO'])vote!:'YES'|'NO';}
class NewsSettingDto{@IsBoolean()enabled!:boolean;}
const reactionLimiter=createKeyedHourlyLimiter(150);
class NewsInterestsDto{
 @IsArray() @ArrayMaxSize(12) @IsIn(INTEREST_TAGS,{each:true})
 tags!:string[];
}
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
 topics(){return {...TOPIC_LABELS,...EXTRA_INTEREST_LABELS};}
 @Get('feed') @Header('Cache-Control','private,no-store')
 async feed(@Query('topic')topic='all',@Query('tag')tag='',@Query('limit')limit='24',
  @Query('page')page='1',@Query('sort')sort='relevance',@Query('tags')tags='',@Query('q')q='',@Req()req:IncomingMessage){
  if(topic!=='all'&&!TOPICS.includes(topic as typeof TOPICS[number])||
   tag&&!INTEREST_TAGS.includes(tag as typeof INTEREST_TAGS[number]))throw new BadRequestException('Invalid category');
  if(!/^\d{1,2}$/.test(limit)||Number(limit)<1||Number(limit)>48||
   !/^\d{1,3}$/.test(page)||Number(page)<1||Number(page)>20)throw new BadRequestException('Invalid pagination');
  if(!['relevance','latest','personal'].includes(sort))throw new BadRequestException('Invalid sort');
  const selectedTags=tags?tags.split(','):[];
  if(selectedTags.length>INTEREST_TAGS.length||selectedTags.some(x=>!INTEREST_TAGS.includes(x as typeof INTEREST_TAGS[number])))
   throw new BadRequestException('Invalid tags');
  const search=q.trim().replace(/[\u0000-\u001F]/g,' ');
  if(search.length>80)throw new BadRequestException('Search query too long');
  const find=search.length>=2?{OR:[
   {title:{contains:search,mode:'insensitive' as const}},
   {titleUk:{contains:search,mode:'insensitive' as const}},
   {summaryUk:{contains:search,mode:'insensitive' as const}},
   {summaryEn:{contains:search,mode:'insensitive' as const}},
   {feedDescription:{contains:search,mode:'insensitive' as const}},
   {source:{contains:search,mode:'insensitive' as const}}
  ]}:{};
  const uid=sort==='personal'?cookieUser(req):null;
  if(sort==='personal'&&!uid)throw new UnauthorizedException('Sign in for personal recommendations');
  const articles=await this.prisma.newsArticle.findMany({
   where:{status:'PUBLISHED',...find,...(topic!=='all'?{topic}:{}),...(sort==='personal'?{}:tag?{tags:{has:tag}}:selectedTags.length?{tags:{hasSome:selectedTags}}:{})},
   take:600,orderBy:{publishedAt:'desc'},select:{
    id:true,url:true,title:true,source:true,language:true,topic:true,tags:true,publishedAt:true,
    publishedAccuracy:true,score:true,summary:true,summaryKind:true,summaryUk:true,summaryEn:true,
    titleUk:true,imageUrl:true,imageCredit:true
   }
  });
  const ordered=articles.map(a=>({...a,relevance:rank(a.score,a.publishedAt)}))
   .sort((a,b)=>sort==='latest'?b.publishedAt.getTime()-a.publishedAt.getTime():
    b.relevance-a.relevance||b.publishedAt.getTime()-a.publishedAt.getTime());
  let ranked=sort==='relevance'&&topic==='all'&&!tag?diversify(ordered,3):ordered;
  let personalEnabled=sort==='personal';
  if(sort==='personal'&&uid){
   const [profile,history]=await Promise.all([
    this.prisma.personalProfile.findUnique({where:{userId:uid},select:{newsTopics:true,newsPersonalizationEnabled:true}}),
    this.prisma.newsReaction.findMany({where:{userId:uid},orderBy:{updatedAt:'desc'},take:1000,
     select:{articleId:true,vote:true,article:{select:{topic:true,tags:true,title:true,titleUk:true}}}})
   ]);
   const chosen=selectedTags.length?selectedTags:
    (profile?.newsTopics||[]).filter(x=>(INTEREST_TAGS as readonly string[]).includes(x));
   if(profile?.newsPersonalizationEnabled===false){
    personalEnabled=false;
    ranked=diversify(ordered,3); // opt-out: no reaction-driven recommendations
   }else{
    ranked=rankPersonalNews(ordered,chosen,history) as typeof ordered;
   }
  }
  const size=Number(limit),offset=(Number(page)-1)*size;
  const [lastScan,articleCount]=await Promise.all([
   this.prisma.newsScan.findFirst({orderBy:{createdAt:'desc'},select:{createdAt:true,sources:true,accepted:true,errors:true}}),
   this.prisma.newsArticle.count({where:{status:'PUBLISHED'}})
  ]);
  return {items:ranked.slice(offset,offset+size).map(({score,...rest})=>rest),
   total:ranked.length,articleCount,page:Number(page),limit:size,lastScan,
   personalized:personalEnabled,sort};
 }
 /** P2: one reversible opinion per article, persisted only by explicit user action. */
 private async reactionOwner(req:IncomingMessage,mutation=false){
  if(mutation&&!sameOrigin(req))throw new ForbiddenException('Cross-origin feedback update denied');
  const uid=cookieUser(req);
  if(!uid)throw new UnauthorizedException('Sign in to synchronize news reactions');
  const exists=await this.prisma.user.findUnique({where:{id:uid},select:{id:true}});
  if(!exists)throw new UnauthorizedException('Session invalid');
  return uid;
 }
 @Get('reactions') @Header('Cache-Control','private,no-store')
 async getReactions(@Req()req:IncomingMessage){
  const userId=await this.reactionOwner(req);
  const [rows,total]=await Promise.all([
   this.prisma.newsReaction.findMany({where:{userId},
    orderBy:{updatedAt:'desc'},take:1000,
    select:{articleId:true,vote:true,updatedAt:true,
     article:{select:{title:true,titleUk:true,url:true,source:true,topic:true,publishedAt:true}}}}),
   this.prisma.newsReaction.count({where:{userId}})
  ]);
  return {items:rows,total};
 }
 @Put('reactions/:articleId') @Header('Cache-Control','private,no-store')
 async putReaction(@Req()req:IncomingMessage,@Param('articleId')articleId:string,@Body()data:NewsVoteDto){
  const userId=await this.reactionOwner(req,true);
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(articleId))
   throw new BadRequestException('Invalid article identifier');
  if(!['YES','NO'].includes(data?.vote))throw new BadRequestException('Invalid reaction');
  const article=await this.prisma.newsArticle.findFirst({where:{id:articleId,status:'PUBLISHED'},select:{id:true}});
  if(!article)throw new NotFoundException('Article unavailable');
  const personal=await this.prisma.personalProfile.findUnique({where:{userId},
   select:{newsPersonalizationEnabled:true}});
  if(personal?.newsPersonalizationEnabled===false)
   throw new ConflictException('Enable news personalization before recording reactions');
  if(!reactionLimiter(userId))throw new HttpException('Reaction limit reached; retry later',429);
  const entry=await this.prisma.newsReaction.upsert({
   where:{userId_articleId:{userId,articleId}},
   create:{userId,articleId,vote:data.vote},update:{vote:data.vote},
   select:{articleId:true,vote:true,updatedAt:true}
  });
  return entry;
 }
 @Delete('reactions/:articleId') @Header('Cache-Control','private,no-store')
 async undoReaction(@Req()req:IncomingMessage,@Param('articleId')articleId:string){
  const userId=await this.reactionOwner(req,true);
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(articleId))
   throw new BadRequestException('Invalid article identifier');
  const deleted=await this.prisma.newsReaction.deleteMany({where:{userId,articleId}});
  return {deleted:deleted.count};
 }
 @Delete('reactions') @Header('Cache-Control','private,no-store')
 async clearReactions(@Req()req:IncomingMessage){
  const userId=await this.reactionOwner(req,true);
  const deleted=await this.prisma.newsReaction.deleteMany({where:{userId}});
  return {deleted:deleted.count};
 }


 /** P4: one explicit privacy switch: turning this off stops personal ranking and future votes. */
 @Put('settings') @Header('Cache-Control','private,no-store')
 async saveSettings(@Req()req:IncomingMessage,@Body()data:NewsSettingDto){
  const userId=await this.reactionOwner(req,true);
  if(typeof data?.enabled!=='boolean')throw new BadRequestException('Expected enabled boolean');
  const row=await this.prisma.personalProfile.upsert({
   where:{userId},create:{userId,newsPersonalizationEnabled:data.enabled},
   update:{newsPersonalizationEnabled:data.enabled},
   select:{newsPersonalizationEnabled:true,updatedAt:true}
  });
  return {enabled:row.newsPersonalizationEnabled,updatedAt:row.updatedAt};
 }
 /** P4: export only explicit News interests + reactions, never the Personal journal or birth data. */
 @Get('privacy/export') @Header('Cache-Control','private,no-store')
 async exportNewsData(@Req()req:IncomingMessage){
  const userId=await this.reactionOwner(req);
  const [profile,total,reactions]=await Promise.all([
   this.prisma.personalProfile.findUnique({where:{userId},
    select:{newsTopics:true,newsPersonalizationEnabled:true}}),
   this.prisma.newsReaction.count({where:{userId}}),
   this.prisma.newsReaction.findMany({where:{userId},orderBy:{updatedAt:'desc'},take:10000,
    select:{articleId:true,vote:true,createdAt:true,updatedAt:true,
     article:{select:{title:true,titleUk:true,source:true,url:true,topic:true}}}})
  ]);
  return {format:'galaxiora-news-interests-v1',exportedAt:new Date().toISOString(),
   interests:(profile?.newsTopics||[]).filter(t=>(INTEREST_TAGS as readonly string[]).includes(t)),
   enabled:profile?.newsPersonalizationEnabled!==false,
   reactions,total,complete:reactions.length===total};
 }
 /** P4: deliberately scoped to NEWS settings, retaining Personal charts and unrelated interests. */
 @Delete('privacy/reset') @Header('Cache-Control','private,no-store')
 async resetNewsData(@Req()req:IncomingMessage){
  const userId=await this.reactionOwner(req,true);
  return this.prisma.$transaction(async tx=>{
   const saved=await tx.personalProfile.findUnique({where:{userId},select:{newsTopics:true}});
   const legacy=(saved?.newsTopics||[]).filter(tag=>
    !(INTEREST_TAGS as readonly string[]).includes(tag));
   const deleted=await tx.newsReaction.deleteMany({where:{userId}});
   await tx.personalProfile.upsert({where:{userId},
    create:{userId,newsTopics:legacy,newsPersonalizationEnabled:true},
    update:{newsTopics:legacy,newsPersonalizationEnabled:true}});
   return {deleted:deleted.count,tags:[],enabled:true};
  });
 }

 /** Phase P1: account-scoped interests; public World never requires a login. */
 @Get('interests') @Header('Cache-Control','private,no-store')
 async getInterests(@Req()req:IncomingMessage){
  const userId=cookieUser(req);
  if(!userId)throw new UnauthorizedException('Sign in to synchronize news interests');
  const user=await this.prisma.user.findUnique({where:{id:userId},select:{id:true}});
  if(!user)throw new UnauthorizedException('Session is no longer valid');
  const data=await this.prisma.personalProfile.findUnique({
   where:{userId},select:{newsTopics:true,newsPersonalizationEnabled:true,updatedAt:true}
  });
  return {tags:(data?.newsTopics||[]).filter(tag=>(INTEREST_TAGS as readonly string[]).includes(tag)),
   enabled:data?.newsPersonalizationEnabled!==false,
   updatedAt:data?.updatedAt||null};
 }
 @Put('interests') @Header('Cache-Control','private,no-store')
 async saveInterests(@Req()req:IncomingMessage,@Body()dto:NewsInterestsDto){
  if(!sameOrigin(req))throw new ForbiddenException('Cross-origin news preferences update denied');
  const userId=cookieUser(req);
  if(!userId)throw new UnauthorizedException('Sign in to save news interests');
  const user=await this.prisma.user.findUnique({where:{id:userId},select:{id:true}});
  if(!user)throw new UnauthorizedException('Session is no longer valid');
  if(!Array.isArray(dto?.tags)||dto.tags.length>12||new Set(dto.tags).size!==dto.tags.length||
     dto.tags.some(tag=>!(INTEREST_TAGS as readonly string[]).includes(tag))){
   throw new BadRequestException('Choose up to 12 distinct valid interests');
  }
  // Keep legacy Personal interests such as "academy" instead of silently deleting them.
  const saved=await this.prisma.personalProfile.findUnique({
   where:{userId},select:{newsTopics:true}
  });
  const legacy=(saved?.newsTopics||[]).filter(tag=>!(INTEREST_TAGS as readonly string[]).includes(tag));
  const newsTopics=[...legacy,...dto.tags];
  const result=await this.prisma.personalProfile.upsert({
   where:{userId},create:{userId,newsTopics},update:{newsTopics},
   select:{updatedAt:true}
  });
  return {tags:dto.tags,updatedAt:result.updatedAt};
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
  const [last,scans,articleCount,byTopic,byPublisher,untranslated,unsummarized,unillustrated,publishers]=await Promise.all([
   this.prisma.newsScan.findFirst({orderBy:{createdAt:'desc'}}),
   this.prisma.newsSourceScan.findMany({orderBy:{createdAt:'desc'},take:120}),
   this.prisma.newsArticle.count({where:{status:'PUBLISHED'}}),
   this.prisma.newsArticle.groupBy({by:['topic'],where:{status:'PUBLISHED'},_count:{_all:true}}),
   this.prisma.newsArticle.groupBy({by:['source'],where:{status:'PUBLISHED'},_count:{_all:true}}),
   this.prisma.newsArticle.count({where:{status:'PUBLISHED',titleUk:null}}),
   this.prisma.newsArticle.count({where:{status:'PUBLISHED',summaryUk:null}}),
   this.prisma.newsArticle.count({where:{status:'PUBLISHED',imageUrl:null}}),
   this.prisma.newsDiscoveredSource.findMany({orderBy:{articleCount:'desc'},take:100})
  ]);
  const seen=new Set<string>(),latest:typeof scans=[];
  for(const row of scans){if(!seen.has(row.sourceKey)){seen.add(row.sourceKey);latest.push(row);}}
  return {enabled:process.env.NEWS_INGESTION_ENABLED==='1',last,
   registeredSources:RSS_SOURCES.length+GDELT_QUERIES.length,
   editorialAiConfigured:Boolean(process.env.GROQ_API_KEY||process.env.GEMINI_API_KEY||process.env.OPENROUTER_API_KEY)
    &&process.env.NEWS_EDITORIAL_AI_ENABLED!=='0',
   articleCount,publishers:byPublisher.length,untranslated,unsummarized,unillustrated,discoveredSources:publishers,
   byTopic:byTopic.map(t=>({topic:t.topic,count:t._count._all})),
   sources:latest,history:scans.slice(0,40)};
 }
 @Patch('admin/sources/:domain') @Header('Cache-Control','private,no-store')
 async sourcePolicy(@Req()req:IncomingMessage,@Param('domain')domain:string,@Body()body:SourcePolicyDto){
  await this.admin(req,true);
  if(!/^[a-z0-9][a-z0-9.-]{2,190}$/.test(domain))throw new BadRequestException('Invalid domain');
  const changed=await this.prisma.newsDiscoveredSource.updateMany({where:{domain},data:{status:body.status}});
  if(body.status==='BLOCKED')await this.prisma.newsArticle.updateMany({
   where:{status:'PUBLISHED',OR:[{url:{startsWith:'https://'+domain+'/'}},{url:{startsWith:'https://www.'+domain+'/'}}]},data:{status:'HIDDEN'}});
  return {updated:changed.count};
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
 ['feed',[String,String,String,String,String,String,String,String,Object]],
 ['getReactions',[Object]],
 ['putReaction',[Object,String,NewsVoteDto]],
 ['undoReaction',[Object,String]],
 ['clearReactions',[Object]],
 ['saveSettings',[Object,NewsSettingDto]],
 ['exportNewsData',[Object]],
 ['resetNewsData',[Object]],
 ['moderate',[Object,String,ModerateDto]],
 ['health',[Object]],
 ['refresh',[Object,String]],
 ['sourcePolicy',[Object,String,SourcePolicyDto]],
 ['getInterests',[Object]],
 ['saveInterests',[Object,NewsInterestsDto]]
] as const){Reflect.defineMetadata('design:paramtypes',types,NewsController.prototype,method);}
