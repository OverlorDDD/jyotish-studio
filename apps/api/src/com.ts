import {BadRequestException,Body,ConflictException,Controller,Delete,ForbiddenException,Get,Header,HttpException,Inject,NotFoundException,Param,Patch,Post,Query,Req,UnauthorizedException} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {IsBoolean,IsIn,IsOptional,IsString,IsUUID,Length,Matches} from 'class-validator';
import type {IncomingMessage} from 'node:http';
import type {Prisma} from '@prisma/client';
import {PrismaService} from './prisma.ts';
import {cookieUser,sameOrigin} from './auth.ts';
import {createKeyedHourlyLimiter} from './ai.ts';
import {authorView,forumModerator,forumPermissions,validateForumText,withinEditWindow,COM_THREAD_LIMIT,COM_REPLY_LIMIT} from './com-policy.ts';

const authorSelect={id:true,role:true,subscriptionTier:true,subscriptionEndsAt:true,
 comProfile:{select:{displayName:true,showPremiumBadge:true}}} as const;
const threadQuota=createKeyedHourlyLimiter(COM_THREAD_LIMIT);
const replyQuota=createKeyedHourlyLimiter(COM_REPLY_LIMIT);
const reportQuota=createKeyedHourlyLimiter(15);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class ComThreadDto{
 @IsString() @Matches(/^[a-z0-9-]{2,48}$/) categorySlug!:string;
 @IsString() @Length(1,2000) title!:string;
 @IsString() @Length(1,200000) body!:string;
}
class ComThreadEditDto{
 @IsOptional() @IsString() @Length(1,2000) title?:string;
 @IsOptional() @IsString() @Length(1,200000) body?:string;
}
class ComPostDto{ @IsString() @Length(1,200000) body!:string; }
class ComProfileDto{
 @IsOptional() @IsString() @Length(3,40) @Matches(/^[\p{L}\p{N} ._-]{3,40}$/u) displayName?:string;
 @IsOptional() @IsBoolean() showPremiumBadge?:boolean;
}
class ComReportDto{
 @IsIn(['thread','post']) target!:'thread'|'post';
 @IsUUID() targetId!:string;
 @IsString() @Length(8,300) reason!:string;
}
class ComModerateThreadDto{
 @IsOptional() @IsIn(['PUBLISHED','HIDDEN']) status?:'PUBLISHED'|'HIDDEN';
 @IsOptional() @IsBoolean() locked?:boolean;
 @IsOptional() @IsBoolean() pinned?:boolean;
 @IsString() @Length(6,300) reason!:string;
}
class ComModeratePostDto{
 @IsIn(['PUBLISHED','HIDDEN']) status!:'PUBLISHED'|'HIDDEN';
 @IsString() @Length(6,300) reason!:string;
}
class ComResolveDto{
 @IsIn(['RESOLVED','DISMISSED']) decision!:'RESOLVED'|'DISMISSED';
 @IsString() @Length(6,300) reason!:string;
}
function safeText(text:string,min:number,max:number){
 try{return validateForumText(text,min,max);}
 catch{throw new BadRequestException('Use plain text, within the length and link limits.');}
}
function paging(raw?:string){
 const page=raw===undefined?1:Number(raw);
 if(!Number.isSafeInteger(page)||page<1||page>40)throw new BadRequestException('Invalid page');
 return {page,skip:(page-1)*20,take:20};
}
function requireUuid(raw:string){
 if(!uuid.test(raw))throw new BadRequestException('Invalid identifier');
 return raw;
}
type Actor={id:string;role:string;subscriptionTier:'FREE'|'PREMIUM';subscriptionEndsAt:Date|null};
@ApiTags('GalaxiCom')
@Controller('api/v1/com')
export class ComController{
 constructor(@Inject(PrismaService)private readonly db:PrismaService){}
 private async actor(req:IncomingMessage,required=true):Promise<Actor|null>{
  const id=cookieUser(req);
  if(!id){if(required)throw new UnauthorizedException('Sign in to participate in GalaxiCom');return null;}
  const user=await this.db.user.findUnique({where:{id},select:{
   id:true,role:true,subscriptionTier:true,subscriptionEndsAt:true}});
  if(!user){if(required)throw new UnauthorizedException('Session no longer valid');return null;}
  return user;
 }
 private mutation(req:IncomingMessage){
  if(!sameOrigin(req))throw new ForbiddenException('Cross-origin forum write denied');
 }
 private async mod(req:IncomingMessage){
  const user=await this.actor(req);
  if(!user||!forumModerator(user.role))throw new ForbiddenException('Moderator access required');
  return user;
 }
 private showThread(row:Prisma.ComThreadGetPayload<{include:{author:{select:typeof authorSelect};category:true;_count:{select:{posts:true}}}}>){
  return {id:row.id,title:row.title,body:row.body,categorySlug:row.categorySlug,
   category:{slug:row.category.slug,titleUk:row.category.titleUk,titleEn:row.category.titleEn},
   author:authorView(row.author),createdAt:row.createdAt,updatedAt:row.updatedAt,
   lastActivityAt:row.lastActivityAt,pinned:row.pinned,locked:row.locked,
   replyCount:row._count.posts};
 }
 @Get('categories') @Header('Cache-Control','public,max-age=120')
 async categories(){
  return {items:await this.db.comCategory.findMany({where:{enabled:true},
   orderBy:[{position:'asc'},{slug:'asc'}],select:{slug:true,titleUk:true,titleEn:true,
    descriptionUk:true,descriptionEn:true}})};
 }
 @Get('me') @Header('Cache-Control','private,no-store')
 async me(@Req()req:IncomingMessage){
  const actor=await this.actor(req,false);
  const profile=actor?await this.db.comProfile.findUnique({where:{userId:actor.id},select:{displayName:true,showPremiumBadge:true}}):null;
  return {signedIn:Boolean(actor),permissions:forumPermissions(actor),
   profile:actor?{id:actor.id,name:profile?.displayName||'Дослідник '+actor.id.slice(0,6),showPremiumBadge:profile?.showPremiumBadge===true}:null};
 }
 @Patch('me') @Header('Cache-Control','private,no-store')
 async updateMe(@Req()req:IncomingMessage,@Body()dto:ComProfileDto){
  this.mutation(req);const actor=(await this.actor(req))!;
  if(dto.displayName===undefined&&dto.showPremiumBadge===undefined)throw new BadRequestException('No changes');
  const displayName=dto.displayName===undefined?undefined:safeText(dto.displayName,3,40);
  if(displayName!==undefined&&/^(admin|support|moderator|galaxiora|адмін|модератор)/i.test(displayName))
   throw new BadRequestException('Reserved display name');
  if(dto.showPremiumBadge===true&&forumPermissions(actor).premiumBadge!==true)
   throw new ForbiddenException('An active premium subscription is required');
  const profile=await this.db.comProfile.upsert({where:{userId:actor.id},
   create:{userId:actor.id,displayName:displayName||null,showPremiumBadge:dto.showPremiumBadge===true},
   update:{...(displayName===undefined?{}:{displayName}),
    ...(dto.showPremiumBadge===undefined?{}:{showPremiumBadge:dto.showPremiumBadge})},
   select:{displayName:true,showPremiumBadge:true}});
  return {name:profile.displayName,showPremiumBadge:profile.showPremiumBadge};
 }
 @Get('threads') @Header('Cache-Control','public,max-age=30')
 async threads(@Query('category')category?:string,@Query('sort')sort='active',
  @Query('q')q='',@Query('page')rawPage?:string){
  const {page,skip,take}=paging(rawPage);
  if(!['active','latest','unanswered'].includes(sort))throw new BadRequestException('Invalid sorting');
  if(q.length>80||q.length===1)throw new BadRequestException('Search requires 2 to 80 characters');
  if(category&&!/^[a-z0-9-]{2,48}$/.test(category))throw new BadRequestException('Invalid category');
  const where:Prisma.ComThreadWhereInput={status:'PUBLISHED',category:{enabled:true},
   ...(category?{categorySlug:category}:{}),
   ...(q?{OR:[{title:{contains:q,mode:'insensitive'}},{body:{contains:q,mode:'insensitive'}}]}:{}),
   ...(sort==='unanswered'?{posts:{none:{status:'PUBLISHED'}}}:{})};
  const order:Prisma.ComThreadOrderByWithRelationInput[]=sort==='latest'?
   [{pinned:'desc'},{createdAt:'desc'}]:[{pinned:'desc'},{lastActivityAt:'desc'}];
  const [total,rows]=await Promise.all([
   this.db.comThread.count({where}),
   this.db.comThread.findMany({where,skip,take,orderBy:order,
    include:{author:{select:authorSelect},category:true,
     _count:{select:{posts:{where:{status:'PUBLISHED'}}}}}})
  ]);
  return {items:rows.map(row=>this.showThread(row)),page,total,pageSize:take};
 }
 @Get('threads/:id') @Header('Cache-Control','public,max-age=30')
 async thread(@Param('id')raw:string){
  const id=requireUuid(raw);
  const row=await this.db.comThread.findFirst({where:{id,status:'PUBLISHED',category:{enabled:true}},
   include:{author:{select:authorSelect},category:true,
    _count:{select:{posts:{where:{status:'PUBLISHED'}}}}}});
  if(!row)throw new NotFoundException('Discussion not found');
  return {thread:this.showThread(row)};
 }
 @Get('threads/:id/posts') @Header('Cache-Control','public,max-age=30')
 async posts(@Param('id')raw:string,@Query('page')rawPage?:string){
  const id=requireUuid(raw),{page,skip,take}=paging(rawPage);
  const exists=await this.db.comThread.findFirst({where:{id,status:'PUBLISHED',category:{enabled:true}},select:{id:true}});
  if(!exists)throw new NotFoundException('Discussion not found');
  const where={threadId:id,status:'PUBLISHED'};
  const [total,rows]=await Promise.all([this.db.comPost.count({where}),
   this.db.comPost.findMany({where,skip,take,orderBy:[{createdAt:'asc'},{id:'asc'}],
    include:{author:{select:authorSelect}}})]);
  return {items:rows.map(row=>({id:row.id,body:row.body,
   createdAt:row.createdAt,updatedAt:row.updatedAt,author:authorView(row.author)})),
   page,total,pageSize:take};
 }
 @Post('threads') @Header('Cache-Control','private,no-store')
 async createThread(@Req()req:IncomingMessage,@Body()dto:ComThreadDto){
  this.mutation(req);const actor=(await this.actor(req))!;
  const title=safeText(dto.title,1,2000),body=safeText(dto.body,1,200000);
  if(!await this.db.comCategory.findFirst({where:{slug:dto.categorySlug,enabled:true}}))
   throw new BadRequestException('Category unavailable');
  if(!threadQuota(actor.id))throw new HttpException('Too many discussions this hour',429);
  const existing=await this.db.comThread.findFirst({where:{authorId:actor.id,title,
   createdAt:{gte:new Date(Date.now()-60000)}},select:{id:true}});
  if(existing)throw new ConflictException('Similar discussion was just posted');
  return this.db.$transaction(async tx=>{
   const thread=await tx.comThread.create({data:{categorySlug:dto.categorySlug,
    authorId:actor.id,title,body},select:{id:true}});
   // The author is automatically subscribed to subsequent replies, with an explicit unfollow control.
   await tx.comFollow.create({data:{userId:actor.id,threadId:thread.id}});
   return {id:thread.id};
  });
 }
 @Patch('threads/:id') @Header('Cache-Control','private,no-store')
 async editThread(@Req()req:IncomingMessage,@Param('id')raw:string,@Body()dto:ComThreadEditDto){
  this.mutation(req);const actor=(await this.actor(req))!,id=requireUuid(raw);
  if(dto.title===undefined&&dto.body===undefined)throw new BadRequestException('Nothing to edit');
  const data={...(dto.title!==undefined?{title:safeText(dto.title,1,2000)}:{}),
   ...(dto.body!==undefined?{body:safeText(dto.body,1,200000)}:{})};
  return this.db.$transaction(async tx=>{
   const row=await tx.comThread.findFirst({where:{id,authorId:actor.id,status:'PUBLISHED',locked:false},
    select:{createdAt:true,updatedAt:true,title:true,body:true}});
   if(!row)throw new NotFoundException('Editable discussion not found');
   if(!withinEditWindow(row.createdAt))throw new ForbiddenException('Editing window ended');
   const changed=await tx.comThread.updateMany({where:{id,authorId:actor.id,status:'PUBLISHED',locked:false,
    updatedAt:row.updatedAt,createdAt:{gte:new Date(Date.now()-30*60000)}},data});
   if(!changed.count)throw new ConflictException('Discussion changed');
   await tx.comThreadRevision.create({data:{threadId:id,title:row.title,body:row.body}});
   return {updated:true};
  });
 }
 @Post('threads/:id/posts') @Header('Cache-Control','private,no-store')
 async reply(@Req()req:IncomingMessage,@Param('id')raw:string,@Body()dto:ComPostDto){
  this.mutation(req);const actor=(await this.actor(req))!,id=requireUuid(raw);
  const body=safeText(dto.body,1,200000);
  if(!replyQuota(actor.id))throw new HttpException('Too many replies this hour',429);
  return this.db.$transaction(async tx=>{
   // Reject exact accidental double-submit (the UI also warns about near-duplicate topics).
   const duplicate=await tx.comPost.findFirst({where:{threadId:id,authorId:actor.id,body,
    createdAt:{gte:new Date(Date.now()-120000)}},select:{id:true}});
   if(duplicate)throw new ConflictException('This reply was just published');
   const changed=await tx.comThread.updateMany({where:{id,status:'PUBLISHED',locked:false,
    category:{enabled:true}},data:{lastActivityAt:new Date()}});
   if(!changed.count)throw new NotFoundException('Discussion closed or unavailable');
   const p=await tx.comPost.create({data:{threadId:id,authorId:actor.id,body},select:{id:true}});
   // MVP fanout cap; C4 introduces a durable queue for large groups.
   const subscribers=await tx.comFollow.findMany({where:{threadId:id,userId:{not:actor.id}},
    select:{userId:true},take:500});
   if(subscribers.length)await tx.comNotification.createMany({data:subscribers.map(x=>({
    userId:x.userId,threadId:id,postId:p.id,kind:'REPLY'})),skipDuplicates:true});
   return {id:p.id};
  });
 }
 @Patch('posts/:id') @Header('Cache-Control','private,no-store')
 async editPost(@Req()req:IncomingMessage,@Param('id')raw:string,@Body()dto:ComPostDto){
  this.mutation(req);const actor=(await this.actor(req))!,id=requireUuid(raw),body=safeText(dto.body,1,200000);
  return this.db.$transaction(async tx=>{
   const row=await tx.comPost.findFirst({where:{id,authorId:actor.id,status:'PUBLISHED',
    thread:{status:'PUBLISHED',locked:false}},select:{createdAt:true,updatedAt:true,body:true}});
   if(!row)throw new NotFoundException('Editable reply not found');
   if(!withinEditWindow(row.createdAt))throw new ForbiddenException('Editing window ended');
   const changed=await tx.comPost.updateMany({where:{id,authorId:actor.id,status:'PUBLISHED',
    updatedAt:row.updatedAt,createdAt:{gte:new Date(Date.now()-30*60000)},
    thread:{status:'PUBLISHED',locked:false}},data:{body}});
   if(!changed.count)throw new ConflictException('Reply changed');
   await tx.comPostRevision.create({data:{postId:id,body:row.body}});
   return {updated:true};
  });
 }
 @Post('reports') @Header('Cache-Control','private,no-store')
 async report(@Req()req:IncomingMessage,@Body()dto:ComReportDto){
  this.mutation(req);const actor=(await this.actor(req))!,id=requireUuid(dto.targetId);
  const reason=safeText(dto.reason,8,300);
  if(!reportQuota(actor.id))throw new HttpException('Too many reports',429);
  if(dto.target==='thread'){
   const row=await this.db.comThread.findFirst({where:{id,status:'PUBLISHED'},select:{id:true}});
   if(!row)throw new NotFoundException('Discussion not found');
  }else{
   const row=await this.db.comPost.findFirst({where:{id,status:'PUBLISHED',thread:{status:'PUBLISHED'}},select:{id:true}});
   if(!row)throw new NotFoundException('Reply not found');
  }
  try{
   await this.db.comReport.create({data:{reporterId:actor.id,reason,
    ...(dto.target==='thread'?{threadId:id}:{postId:id})}});
  }catch(e){
   if(e&&typeof e==='object'&&'code'in e&&e.code==='P2002')return {recorded:true};
   throw e;
  }
  return {recorded:true};
 }
 @Get('mod/reports') @Header('Cache-Control','private,no-store')
 async modQueue(@Req()req:IncomingMessage){
  await this.mod(req);
  const rows=await this.db.comReport.findMany({where:{status:'OPEN'},
   orderBy:{createdAt:'asc'},take:50,include:{thread:{select:{title:true}},post:{select:{body:true}}}});
  return {items:rows.map(row=>({id:row.id,createdAt:row.createdAt,reason:row.reason,
   targetType:row.threadId?'thread':'post',targetId:row.threadId||row.postId,
   excerpt:row.thread?.title||row.post?.body.slice(0,160)||''}))};
 }
 @Patch('mod/threads/:id') @Header('Cache-Control','private,no-store')
 async moderateThread(@Req()req:IncomingMessage,@Param('id')raw:string,@Body()dto:ComModerateThreadDto){
  this.mutation(req);const actor=await this.mod(req),id=requireUuid(raw);
  if(dto.pinned!==undefined&&actor.role!=='ADMIN')throw new ForbiddenException('Only admins can pin');
  if(dto.status===undefined&&dto.locked===undefined&&dto.pinned===undefined)
   throw new BadRequestException('Nothing to moderate');
  const reason=safeText(dto.reason,6,300);
  return this.db.$transaction(async tx=>{
   const updated=await tx.comThread.updateMany({where:{id},data:{
    ...(dto.status!==undefined?{status:dto.status}:{}),
    ...(dto.locked!==undefined?{locked:dto.locked}:{}),
    ...(dto.pinned!==undefined?{pinned:dto.pinned}:{})}});
   if(!updated.count)throw new NotFoundException('Discussion not found');
   await tx.comModerationAction.create({data:{actorId:actor.id,targetType:'THREAD',targetId:id,
    action:'MODIFY',reason}});
   return {updated:true};
  });
 }
 /** Quick deletion is reversible/tombstoned to preserve moderation audit and reports. */
 @Delete('mod/threads/:id') @Header('Cache-Control','private,no-store')
 async deleteThread(@Req()req:IncomingMessage,@Param('id')raw:string){
  this.mutation(req);const actor=await this.mod(req),id=requireUuid(raw);
  return this.db.$transaction(async tx=>{
   const changed=await tx.comThread.updateMany({where:{id,status:{not:'DELETED'}},
    data:{status:'DELETED',locked:true,pinned:false}});
   if(!changed.count)throw new NotFoundException('Discussion unavailable');
   await tx.comModerationAction.create({data:{actorId:actor.id,targetType:'THREAD',targetId:id,
    action:'DELETE',reason:'Moderator confirmed quick deletion'}});
   return {deleted:true};
  });
 }
 @Patch('mod/posts/:id') @Header('Cache-Control','private,no-store')
 async moderatePost(@Req()req:IncomingMessage,@Param('id')raw:string,@Body()dto:ComModeratePostDto){
  this.mutation(req);const actor=await this.mod(req),id=requireUuid(raw),reason=safeText(dto.reason,6,300);
  return this.db.$transaction(async tx=>{
   const updated=await tx.comPost.updateMany({where:{id},data:{status:dto.status}});
   if(!updated.count)throw new NotFoundException('Reply not found');
   await tx.comModerationAction.create({data:{actorId:actor.id,targetType:'POST',targetId:id,
    action:dto.status==='HIDDEN'?'HIDE':'RESTORE',reason}});
   return {updated:true};
  });
 }
 @Patch('mod/reports/:id') @Header('Cache-Control','private,no-store')
 async resolveReport(@Req()req:IncomingMessage,@Param('id')raw:string,@Body()dto:ComResolveDto){
  this.mutation(req);const actor=await this.mod(req),id=requireUuid(raw),reason=safeText(dto.reason,6,300);
  return this.db.$transaction(async tx=>{
   const updated=await tx.comReport.updateMany({where:{id,status:'OPEN'},data:{
    status:dto.decision,reviewedAt:new Date()}});
   if(!updated.count)throw new NotFoundException('Unresolved report not found');
   await tx.comModerationAction.create({data:{actorId:actor.id,targetType:'REPORT',targetId:id,
    action:dto.decision,reason}});
   return {updated:true};
  });
 }
}
for(const [name,args] of [
 ['me',[Object]],['updateMe',[Object,ComProfileDto]],
 ['threads',[String,String,String,String]],['thread',[String]],['posts',[String,String]],
 ['createThread',[Object,ComThreadDto]],['editThread',[Object,String,ComThreadEditDto]],
 ['reply',[Object,String,ComPostDto]],['editPost',[Object,String,ComPostDto]],
 ['report',[Object,ComReportDto]],['modQueue',[Object]],
 ['moderateThread',[Object,String,ComModerateThreadDto]],['deleteThread',[Object,String]],['moderatePost',[Object,String,ComModeratePostDto]],
 ['resolveReport',[Object,String,ComResolveDto]]
] as const)Reflect.defineMetadata('design:paramtypes',args,ComController.prototype,name);
