import {BadRequestException,Body,ConflictException,Controller,Delete,ForbiddenException,Get,Header,Inject,NotFoundException,Param,Post,Query,Req,UnauthorizedException} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {IsIn,IsString,IsUUID,Matches} from 'class-validator';
import type {IncomingMessage} from 'node:http';
import {PrismaService} from './prisma.ts';
import {cookieUser,sameOrigin} from './auth.ts';
import {academyBySlug} from '../../web/lib/academy-content.ts';
import {yogaBySlug} from '../../web/lib/yoga-content.ts';
import {communitySource,discussionCategory,isApprovedContentLink,type CommunitySourceKind} from './com-context-policy.ts';

class LinkDto{
 @IsIn(['ACADEMY','YOGA']) kind!:'ACADEMY'|'YOGA';
 @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) slug!:string;
 @IsUUID() threadId!:string;
}
const uuid=/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
@ApiTags('GalaxiCom')
@Controller('api/v1/com/context')
export class ComContextController{
 constructor(@Inject(PrismaService)private readonly db:PrismaService){}
 private async published(kind:CommunitySourceKind,slug:string){
  // A trusted static lesson/practice or a *published* CMS document, never DRAFT/APPROVED-only.
  if(kind==='ACADEMY'&&academyBySlug(slug))return {topic:academyBySlug(slug)!.topic};
  if(kind==='YOGA'&&yogaBySlug(slug))return {topic:'practice'};
  const item=await this.db.editorialEntry.findUnique({where:{kind_slug:{kind,slug}},
   select:{status:true,topic:true}});
  return item?.status==='PUBLISHED'?{topic:item.topic}:null;
 }
 private async staff(req:IncomingMessage){
  const userId=cookieUser(req);
  if(!userId)throw new UnauthorizedException('Sign in required');
  const user=await this.db.user.findUnique({where:{id:userId},select:{role:true}});
  if(!user||!isApprovedContentLink(user.role))throw new ForbiddenException('Admin editorial approval required');
  if(!sameOrigin(req))throw new ForbiddenException('Cross-origin context edit denied');
  return userId;
 }
 @Get()
 @Header('Cache-Control','no-store')
 async index(@Query('kind')rawKind:string,@Query('slug')rawSlug:string){
  let kind:CommunitySourceKind,slug:string;
  try{({kind,slug}=communitySource(rawKind,rawSlug));}
  catch{throw new BadRequestException('Invalid public material');}
  const src=await this.published(kind,slug);
  if(!src)throw new NotFoundException('Published material unavailable');
  const records=await this.db.comContextLink.findMany({
   where:{sourceKind:kind,sourceSlug:slug,thread:{status:'PUBLISHED',category:{enabled:true}}},
   orderBy:{approvedAt:'desc'},take:8,select:{id:true,approvedAt:true,
    thread:{select:{id:true,title:true,lastActivityAt:true,
     _count:{select:{posts:{where:{status:'PUBLISHED'}}}}}}}});
  return {source:{kind,slug,category:discussionCategory(kind,src.topic)},
   items:records.map(r=>({id:r.id,threadId:r.thread.id,title:r.thread.title,approvedAt:r.approvedAt,
    lastActivityAt:r.thread.lastActivityAt,replies:r.thread._count.posts}))};
 }
 @Get('threads/:id')
 @Header('Cache-Control','no-store')
 async sourceOfThread(@Param('id')id:string){
  if(!uuid.test(id))throw new BadRequestException('Invalid topic ID');
  const thread=await this.db.comThread.findFirst({where:{id,status:'PUBLISHED',category:{enabled:true}},
   select:{id:true}});
  if(!thread)throw new NotFoundException('Published forum topic unavailable');
  const links=await this.db.comContextLink.findMany({where:{threadId:id},orderBy:{approvedAt:'desc'},
   take:12,select:{sourceKind:true,sourceSlug:true}});
  const items=[];
  for(const link of links){
   if(link.sourceKind!=='ACADEMY'&&link.sourceKind!=='YOGA')continue;
   const src=await this.published(link.sourceKind,link.sourceSlug);
   if(!src)continue;
   const staticTitle=link.sourceKind==='ACADEMY'?academyBySlug(link.sourceSlug)?.title:yogaBySlug(link.sourceSlug)?.title;
   let title=staticTitle;
   if(!title){
    const doc=await this.db.editorialEntry.findUnique({where:{kind_slug:{kind:link.sourceKind,slug:link.sourceSlug}},
     select:{status:true,document:true}});
    if(doc?.status!=='PUBLISHED')continue;
    const raw=doc.document as {title?:{uk?:unknown;en?:unknown}};
    if(typeof raw?.title?.uk!=='string'||typeof raw?.title?.en!=='string')continue;
    title={uk:raw.title.uk,en:raw.title.en};
   }
   items.push({kind:link.sourceKind,slug:link.sourceSlug,titleUk:title.uk,titleEn:title.en});
  }
  return {items};
 }
 @Post('links')
 @Header('Cache-Control','private,no-store')
 async create(@Req()req:IncomingMessage,@Body()dto:LinkDto){
  const actor=await this.staff(req);
  let src;
  try{src=communitySource(dto.kind,dto.slug);}catch{throw new BadRequestException('Unsupported public source');}
  if(!uuid.test(dto.threadId))throw new BadRequestException('Invalid topic ID');
  const published=await this.published(src.kind,src.slug);
  if(!published)throw new BadRequestException('Only published lessons or practices may be linked');
  const thread=await this.db.comThread.findFirst({where:{id:dto.threadId,status:'PUBLISHED',
   category:{enabled:true}},select:{id:true}});
  if(!thread)throw new NotFoundException('Published forum topic not found');
  try{
   return await this.db.$transaction(async tx=>{
    const link=await tx.comContextLink.create({data:{sourceKind:src.kind,
     sourceSlug:src.slug,threadId:dto.threadId,approvedById:actor},select:{id:true}});
    await tx.comModerationAction.create({data:{actorId:actor,action:'APPROVE_LINK',
     targetType:'CONTEXT',targetId:link.id,reason:'Approved public material to topic connection'}});
    return link;
   });
  }catch(err){
   if(err&&typeof err==='object'&&'code'in err&&err.code==='P2002')throw new ConflictException('Topic already linked');
   throw err;
  }
 }
 @Delete('links/:id')
 @Header('Cache-Control','private,no-store')
 async unlink(@Req()req:IncomingMessage,@Param('id')id:string){
  const actor=await this.staff(req);
  if(!uuid.test(id))throw new BadRequestException('Invalid link ID');
  return this.db.$transaction(async tx=>{
   const change=await tx.comContextLink.deleteMany({where:{id}});
   if(!change.count)throw new NotFoundException('Connection not found');
   await tx.comModerationAction.create({data:{actorId:actor,action:'UNLINK',
    targetType:'CONTEXT',targetId:id,reason:'Admin withdrew public context association'}});
   return {removed:true};
  });
 }
}
for(const [name,args] of [['index',[String,String]],['sourceOfThread',[String]],['create',[Object,LinkDto]],['unlink',[Object,String]]] as const)
 Reflect.defineMetadata('design:paramtypes',args,ComContextController.prototype,name);
