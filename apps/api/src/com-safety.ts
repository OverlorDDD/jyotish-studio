import {BadRequestException,Body,ConflictException,Controller,ForbiddenException,Get,Header,Inject,NotFoundException,Param,Patch,Post,Query,Req,UnauthorizedException} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {IsIn,IsString,IsUUID,Length} from 'class-validator';
import type {IncomingMessage} from 'node:http';
import {PrismaService} from './prisma.ts';
import {cookieUser,sameOrigin} from './auth.ts';
import {forumModerator} from './com-policy.ts';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
class ComAppealDto{
 @IsIn(['THREAD','POST']) targetType!:'THREAD'|'POST';
 @IsUUID() targetId!:string;
 @IsString() @Length(12,1000) reason!:string;
}
class ComDecisionDto{
 @IsIn(['ACCEPTED','REJECTED']) decision!:'ACCEPTED'|'REJECTED';
 @IsString() @Length(12,1000) reason!:string;
}
class ComPrivacyDto{
 @IsIn(['ERASE_FORUM']) kind!:'ERASE_FORUM';
}
class ComPrivacyDecisionDto{
 @IsIn(['REVIEW','PUBLIC_REDACT']) action!:'REVIEW'|'PUBLIC_REDACT';
 @IsString() @Length(12,500) reason!:string;
}
@ApiTags('GalaxiCom Safety')
@Controller('api/v1/com')
export class ComSafetyController{
 constructor(@Inject(PrismaService)private readonly db:PrismaService){}
 private async actor(req:IncomingMessage){
  const uid=cookieUser(req);
  if(!uid)throw new UnauthorizedException('Sign in required');
  const actor=await this.db.user.findUnique({where:{id:uid},select:{id:true,role:true}});
  if(!actor)throw new UnauthorizedException('Session expired');
  return actor;
 }
 private writing(req:IncomingMessage){if(!sameOrigin(req))throw new ForbiddenException('Cross-origin action denied')}
 private async staff(req:IncomingMessage,adminOnly=false){
  const actor=await this.actor(req);
  if(adminOnly?actor.role!=='ADMIN':!forumModerator(actor.role))throw new ForbiddenException('Staff access required');
  return actor;
 }
 @Post('appeals') @Header('Cache-Control','private,no-store')
 async appeal(@Req()req:IncomingMessage,@Body()dto:ComAppealDto){
  this.writing(req);const actor=await this.actor(req);
  const id=dto.targetId;
  if(!uuid.test(id))throw new BadRequestException('Invalid appeal target');
  const target=dto.targetType==='THREAD'?
   await this.db.comThread.findFirst({where:{id,authorId:actor.id,status:{in:['HIDDEN','DELETED']}},select:{id:true}}):
   await this.db.comPost.findFirst({where:{id,authorId:actor.id,status:'HIDDEN'},select:{id:true}});
  if(!target)throw new NotFoundException('No eligible moderated contribution owned by you');
  const action=await this.db.comModerationAction.findFirst({where:{targetType:dto.targetType,targetId:id,
   action:{in:['DELETE','HIDE','MODIFY']}},orderBy:{createdAt:'desc'},select:{id:true,actorId:true,createdAt:true}});
  if(!action)throw new NotFoundException('Moderation decision unavailable');
  if(Date.now()-action.createdAt.getTime()>30*86400000)throw new ConflictException('Appeal window expired');
  try{
   const row=await this.db.comAppeal.create({data:{authorId:actor.id,
    targetType:dto.targetType,targetId:id,moderationActionId:action.id,reason:dto.reason.trim()},
    select:{id:true,status:true}});
   return row;
  }catch(e){
   if(e&&typeof e==='object'&&'code'in e&&e.code==='P2002')throw new ConflictException('Appeal already submitted');
   throw e;
  }
 }
 @Get('appeals/eligible') @Header('Cache-Control','private,no-store')
 async eligibleAppeals(@Req()req:IncomingMessage){
  const actor=await this.actor(req);
  const [topics,replies]=await Promise.all([
   this.db.comThread.findMany({where:{authorId:actor.id,status:{in:['HIDDEN','DELETED']}},
    select:{id:true,title:true},orderBy:{createdAt:'desc'},take:30}),
   this.db.comPost.findMany({where:{authorId:actor.id,status:'HIDDEN'},
    select:{id:true,threadId:true},orderBy:{createdAt:'desc'},take:30})
  ]);
  return {items:[...topics.map(x=>({type:'THREAD',id:x.id,label:x.title.slice(0,120)})),
   ...replies.map(x=>({type:'POST',id:x.id,label:'Reply in topic '+x.threadId}))]};
 }
 @Get('appeals/mine') @Header('Cache-Control','private,no-store')
 async ownAppeals(@Req()req:IncomingMessage){
  const actor=await this.actor(req);
  return {items:await this.db.comAppeal.findMany({where:{authorId:actor.id},
   orderBy:{createdAt:'desc'},take:50,
   select:{id:true,targetType:true,targetId:true,reason:true,status:true,decisionReason:true,createdAt:true,reviewedAt:true}})};
 }
 @Get('mod/appeals') @Header('Cache-Control','private,no-store')
 async appealsQueue(@Req()req:IncomingMessage){
  await this.staff(req);
  const rows=await this.db.comAppeal.findMany({where:{status:'OPEN'},orderBy:{createdAt:'asc'},
   take:50,select:{id:true,targetType:true,targetId:true,reason:true,createdAt:true,
    author:{select:{comProfile:{select:{displayName:true}}}},action:{select:{actorId:true,action:true}}}});
  return {items:rows.map(x=>({id:x.id,targetType:x.targetType,targetId:x.targetId,reason:x.reason,
   createdAt:x.createdAt,authorName:x.author.comProfile?.displayName||'Member',
   action:x.action.action,reviewerConflict:x.action.actorId}))};
 }
 @Patch('mod/appeals/:id') @Header('Cache-Control','private,no-store')
 async decideAppeal(@Req()req:IncomingMessage,@Param('id')id:string,@Body()dto:ComDecisionDto){
  this.writing(req);const actor=await this.staff(req);
  if(!uuid.test(id))throw new BadRequestException('Invalid appeal ID');
  return this.db.$transaction(async tx=>{
   const entry=await tx.comAppeal.findFirst({where:{id,status:'OPEN'},
    include:{action:{select:{actorId:true}}}});
   if(!entry)throw new NotFoundException('Appeal unavailable');
   if(entry.action.actorId===actor.id)throw new ForbiddenException('The original moderator cannot review their own action');
   const update=await tx.comAppeal.updateMany({where:{id,status:'OPEN'},data:{
    status:dto.decision,decisionReason:dto.reason.trim(),reviewerId:actor.id,reviewedAt:new Date()}});
   if(!update.count)throw new ConflictException('Already reviewed');
   if(dto.decision==='ACCEPTED'){
    if(entry.targetType==='THREAD'){
     await tx.comThread.updateMany({where:{id:entry.targetId,status:{in:['DELETED','HIDDEN']}},
      data:{status:'PUBLISHED',locked:false,pinned:false}});
    }else{
     await tx.comPost.updateMany({where:{id:entry.targetId,status:'HIDDEN'},data:{status:'PUBLISHED'}});
    }
   }
   await tx.comModerationAction.create({data:{actorId:actor.id,targetType:'APPEAL',targetId:id,
    action:'APPEAL_'+dto.decision,reason:dto.reason.trim().slice(0,300)}});
   return {status:dto.decision};
  });
 }
 @Get('privacy/export') @Header('Cache-Control','private,no-store')
 async exportOwn(@Req()req:IncomingMessage,@Query('page')raw='1'){
  const actor=await this.actor(req),page=Number(raw);
  if(!Number.isSafeInteger(page)||page<1||page>1000)throw new BadRequestException('Invalid page');
  const [profile,threads,posts,appeals,reports]=await Promise.all([
   this.db.comProfile.findUnique({where:{userId:actor.id},select:{displayName:true,showPremiumBadge:true,createdAt:true}}),
   this.db.comThread.findMany({where:{authorId:actor.id},orderBy:{createdAt:'asc'},
    skip:(page-1)*100,take:100,select:{id:true,title:true,body:true,status:true,createdAt:true,updatedAt:true}}),
   this.db.comPost.findMany({where:{authorId:actor.id},orderBy:{createdAt:'asc'},
    skip:(page-1)*100,take:100,select:{id:true,threadId:true,body:true,status:true,createdAt:true,updatedAt:true}}),
   this.db.comAppeal.findMany({where:{authorId:actor.id},orderBy:{createdAt:'asc'},
    skip:(page-1)*100,take:100,select:{id:true,targetType:true,targetId:true,reason:true,status:true,decisionReason:true}}),
   this.db.comReport.findMany({where:{reporterId:actor.id},orderBy:{createdAt:'asc'},
    skip:(page-1)*100,take:100,select:{id:true,threadId:true,postId:true,reason:true,status:true,createdAt:true}})
  ]);
  return {page,hasMore:[threads,posts,appeals,reports].some(x=>x.length===100),
   profile,threads,posts,appeals,reports,scope:'GalaxiCom only, not full account export'};
 }
 @Post('privacy/requests') @Header('Cache-Control','private,no-store')
 async requestPrivacy(@Req()req:IncomingMessage,@Body()dto:ComPrivacyDto){
  this.writing(req);const actor=await this.actor(req);
  const old=await this.db.comPrivacyRequest.findFirst({where:{userId:actor.id,status:{in:['OPEN','IN_REVIEW']}},
   select:{id:true,status:true}});
  if(old)return old;
  return this.db.comPrivacyRequest.create({data:{userId:actor.id,kind:dto.kind},select:{id:true,status:true}});
 }
 @Get('privacy/requests') @Header('Cache-Control','private,no-store')
 async myPrivacy(@Req()req:IncomingMessage){
  const actor=await this.actor(req);
  return {items:await this.db.comPrivacyRequest.findMany({where:{userId:actor.id},
   orderBy:{createdAt:'desc'},take:30,select:{id:true,kind:true,status:true,createdAt:true,reviewedAt:true}})};
 }
 @Get('mod/privacy') @Header('Cache-Control','private,no-store')
 async privacyQueue(@Req()req:IncomingMessage){
  await this.staff(req,true);
  return {items:await this.db.comPrivacyRequest.findMany({where:{status:{in:['OPEN','IN_REVIEW']}},
   orderBy:{createdAt:'asc'},take:50,select:{id:true,userId:true,status:true,createdAt:true}})};
 }
 @Patch('mod/privacy/:id') @Header('Cache-Control','private,no-store')
 async reviewPrivacy(@Req()req:IncomingMessage,@Param('id')id:string,@Body()dto:ComPrivacyDecisionDto){
  this.writing(req);const actor=await this.staff(req,true);
  if(!uuid.test(id))throw new BadRequestException('Invalid request ID');
  return this.db.$transaction(async tx=>{
   const target=await tx.comPrivacyRequest.findFirst({where:{id,status:{in:['OPEN','IN_REVIEW']}},select:{id:true,userId:true}});
   if(!target)throw new NotFoundException('Request unavailable');
   if(dto.action==='PUBLIC_REDACT'){
    const pending=await tx.comReport.count({where:{status:'OPEN',OR:[
     {thread:{authorId:target.userId}},{post:{authorId:target.userId}}
    ]}});
    if(pending)throw new ConflictException('Resolve pending abuse reports before public redaction');
    await tx.comThreadRevision.deleteMany({where:{thread:{authorId:target.userId}}});
    await tx.comPostRevision.deleteMany({where:{post:{authorId:target.userId}}});
    await tx.comThread.updateMany({where:{authorId:target.userId},data:{
     title:'[Content removed by privacy request]',body:'[Content removed]',status:'DELETED',locked:true,pinned:false}});
    await tx.comPost.updateMany({where:{authorId:target.userId},data:{body:'[Content removed]',status:'HIDDEN'}});
    await tx.comProfile.deleteMany({where:{userId:target.userId}});
    await tx.comHelpfulReaction.deleteMany({where:{userId:target.userId}});
    await tx.comFollow.deleteMany({where:{userId:target.userId}});
    await tx.comNotification.deleteMany({where:{userId:target.userId}});
   }
   const status=dto.action==='PUBLIC_REDACT'?'PUBLIC_REDACTED':'IN_REVIEW';
   await tx.comPrivacyRequest.update({where:{id},data:{status,reviewerId:actor.id,reviewedAt:new Date(),
    reason:dto.reason.trim()}});
   await tx.comModerationAction.create({data:{actorId:actor.id,targetType:'PRIVACY',targetId:id,
    action:dto.action,reason:dto.reason.trim().slice(0,300)}});
   return {status,notice:status==='PUBLIC_REDACTED'?
    'Public forum content removed; audit records and backups require separate retention review':'Request under human review'};
  });
 }
 @Get('mod/security') @Header('Cache-Control','private,no-store')
 async safetyStatus(@Req()req:IncomingMessage){
  await this.staff(req,true);
  const [appeals,privacy,queueFailed,queuePending]=await Promise.all([
   this.db.comAppeal.count({where:{status:'OPEN'}}),
   this.db.comPrivacyRequest.count({where:{status:{in:['OPEN','IN_REVIEW']}}}),
   this.db.comNotificationFanout.count({where:{status:'FAILED'}}),
   this.db.comNotificationFanout.count({where:{status:'PENDING'}})
  ]);
  return {appeals,privacy,queueFailed,queuePending};
 }
}
for(const [name,args] of [
 ['appeal',[Object,ComAppealDto]],['eligibleAppeals',[Object]],['ownAppeals',[Object]],
 ['appealsQueue',[Object]],['decideAppeal',[Object,String,ComDecisionDto]],
 ['exportOwn',[Object,String]],['requestPrivacy',[Object,ComPrivacyDto]],
 ['myPrivacy',[Object]],['privacyQueue',[Object]],['reviewPrivacy',[Object,String,ComPrivacyDecisionDto]],
 ['safetyStatus',[Object]]
] as const)Reflect.defineMetadata('design:paramtypes',args,ComSafetyController.prototype,name);
