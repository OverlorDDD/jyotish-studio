import {BadRequestException,Controller,Delete,ForbiddenException,Get,Header,Inject,NotFoundException,Param,Patch,Put,Query,Req,UnauthorizedException} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import type {IncomingMessage} from 'node:http';
import {PrismaService} from './prisma.ts';
import {cookieUser,sameOrigin} from './auth.ts';
import {authorView,forumModerator} from './com-policy.ts';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const checked=(id:string)=>{if(!uuid.test(id))throw new BadRequestException('Invalid ID');return id};
const authorSelect={id:true,role:true,subscriptionTier:true,subscriptionEndsAt:true,
 comProfile:{select:{displayName:true,showPremiumBadge:true}}} as const;

@ApiTags('GalaxiCom')
@Controller('api/v1/com')
export class ComSocialController {
 constructor(@Inject(PrismaService)private readonly db:PrismaService){}
 private async actor(req:IncomingMessage,optional=false){
  const id=cookieUser(req);
  if(!id){if(optional)return null;throw new UnauthorizedException('Sign in required')}
  const u=await this.db.user.findUnique({where:{id},select:{id:true,role:true}});
  if(!u&&!optional)throw new UnauthorizedException('Session expired');
  return u;
 }
 private checkWrite(req:IncomingMessage){if(!sameOrigin(req))throw new ForbiddenException('Cross-origin operation denied')}
 private async publicThread(id:string){
  const t=await this.db.comThread.findFirst({where:{id:checked(id),status:'PUBLISHED',category:{enabled:true}},
   select:{id:true,authorId:true}});
  if(!t)throw new NotFoundException('Topic unavailable');
  return t;
 }
 @Get('threads/:id/activity') @Header('Cache-Control','private,no-store')
 async activity(@Param('id')id:string,@Req()req:IncomingMessage){
  await this.publicThread(id);
  const actor=await this.actor(req,true);
  const posts=await this.db.comPost.findMany({where:{threadId:id,status:'PUBLISHED'},select:{id:true}});
  const ids=posts.map(x=>x.id);
  const [groups,own,followers,follow]=await Promise.all([
   ids.length?this.db.comHelpfulReaction.groupBy({by:['postId'],where:{postId:{in:ids}},_count:{_all:true}}):[],
   actor&&ids.length?this.db.comHelpfulReaction.findMany({where:{userId:actor.id,postId:{in:ids}},select:{postId:true}}):[],
   this.db.comFollow.count({where:{threadId:id}}),
   actor?this.db.comFollow.count({where:{threadId:id,userId:actor.id}}):0
  ]);
  const self=new Set(own.map(x=>x.postId));
  return {following:follow>0,followers,likes:Object.fromEntries(groups.map(x=>[x.postId,{count:x._count._all,liked:self.has(x.postId)}])),
   myLikes:own.map(x=>x.postId)};
 }
 @Put('posts/:id/helpful') @Header('Cache-Control','private,no-store')
 async helpful(@Param('id')id:string,@Req()req:IncomingMessage){
  this.checkWrite(req);const actor=(await this.actor(req))!;
  const post=await this.db.comPost.findFirst({where:{id:checked(id),status:'PUBLISHED',
   thread:{status:'PUBLISHED',category:{enabled:true}}},select:{id:true}});
  if(!post)throw new NotFoundException('Reply unavailable');
  await this.db.comHelpfulReaction.upsert({where:{userId_postId:{userId:actor.id,postId:id}},
   create:{userId:actor.id,postId:id},update:{}});
  return {liked:true};
 }
 @Delete('posts/:id/helpful') @Header('Cache-Control','private,no-store')
 async removeHelpful(@Param('id')id:string,@Req()req:IncomingMessage){
  this.checkWrite(req);const actor=(await this.actor(req))!;
  await this.db.comHelpfulReaction.deleteMany({where:{userId:actor.id,postId:checked(id)}});
  return {liked:false};
 }
 @Put('threads/:id/follow') @Header('Cache-Control','private,no-store')
 async follow(@Param('id')id:string,@Req()req:IncomingMessage){
  this.checkWrite(req);const actor=(await this.actor(req))!;await this.publicThread(id);
  await this.db.comFollow.upsert({where:{userId_threadId:{userId:actor.id,threadId:id}},
   create:{userId:actor.id,threadId:id},update:{}});
  return {following:true};
 }
 @Delete('threads/:id/follow') @Header('Cache-Control','private,no-store')
 async unfollow(@Param('id')id:string,@Req()req:IncomingMessage){
  this.checkWrite(req);const actor=(await this.actor(req))!;
  await this.db.comFollow.deleteMany({where:{userId:actor.id,threadId:checked(id)}});
  return {following:false};
 }
 @Get('notifications') @Header('Cache-Control','private,no-store')
 async notifications(@Req()req:IncomingMessage,@Query('page')raw='1'){
  const actor=(await this.actor(req))!;
  const page=Number(raw);
  if(!Number.isSafeInteger(page)||page<1||page>50)throw new BadRequestException('Invalid page');
  const where={userId:actor.id,thread:{status:'PUBLISHED',category:{enabled:true}},
   post:{status:'PUBLISHED'}};
  const [total,unread,rows]=await Promise.all([
   this.db.comNotification.count({where}),
   this.db.comNotification.count({where:{...where,readAt:null}}),
   this.db.comNotification.findMany({where,orderBy:{createdAt:'desc'},
    skip:(page-1)*25,take:25,select:{id:true,kind:true,threadId:true,
     postId:true,createdAt:true,readAt:true,thread:{select:{title:true}}}})
  ]);
  return {items:rows.map(x=>({id:x.id,kind:x.kind,threadId:x.threadId,postId:x.postId,
   title:x.thread.title,createdAt:x.createdAt,read:x.readAt!==null})),page,total,unread};
 }
 @Patch('notifications/:id/read') @Header('Cache-Control','private,no-store')
 async readOne(@Param('id')id:string,@Req()req:IncomingMessage){
  this.checkWrite(req);const actor=(await this.actor(req))!;
  const changed=await this.db.comNotification.updateMany({where:{id:checked(id),userId:actor.id,readAt:null},data:{readAt:new Date()}});
  return {updated:changed.count};
 }
 @Patch('notifications/read-all') @Header('Cache-Control','private,no-store')
 async readAll(@Req()req:IncomingMessage){
  this.checkWrite(req);const actor=(await this.actor(req))!;
  const count=await this.db.comNotification.updateMany({where:{userId:actor.id,readAt:null},data:{readAt:new Date()}});
  return {updated:count.count};
 }
 @Get('profiles/:id') @Header('Cache-Control','public,max-age=30')
 async publicProfile(@Param('id')id:string){
  const u=await this.db.user.findUnique({where:{id:checked(id)},select:authorSelect});
  if(!u)throw new NotFoundException('Member not found');
  const threadWhere={authorId:id,status:'PUBLISHED',category:{enabled:true}};
  const postWhere={authorId:id,status:'PUBLISHED',thread:{status:'PUBLISHED',category:{enabled:true}}};
  const [threads,posts,threadCount,replyCount]=await Promise.all([
   this.db.comThread.findMany({where:threadWhere,select:{id:true,title:true,createdAt:true},
    orderBy:{createdAt:'desc'},take:12}),
   this.db.comPost.findMany({where:postWhere,select:{id:true,threadId:true,createdAt:true,thread:{select:{title:true}}},
    },orderBy:{createdAt:'desc'},take:12}),
   this.db.comThread.count({where:threadWhere}),this.db.comPost.count({where:postWhere})
  ]);
  return {member:authorView(u),threadCount,replyCount,threads,replies:posts.map(p=>({
   id:p.id,threadId:p.threadId,title:p.thread.title,createdAt:p.createdAt}))};
 }
 @Get('threads/:id/revisions') @Header('Cache-Control','private,no-store')
 async threadRevisions(@Param('id')id:string,@Req()req:IncomingMessage){
  const actor=(await this.actor(req))!;
  const t=await this.db.comThread.findFirst({where:{id:checked(id)},select:{authorId:true}});
  if(!t||t.authorId!==actor.id&&!forumModerator(actor.role))throw new NotFoundException('History unavailable');
  return {items:await this.db.comThreadRevision.findMany({where:{threadId:id},
   select:{id:true,title:true,body:true,editedAt:true},orderBy:{editedAt:'desc'},take:25})};
 }
 @Get('posts/:id/revisions') @Header('Cache-Control','private,no-store')
 async postRevisions(@Param('id')id:string,@Req()req:IncomingMessage){
  const actor=(await this.actor(req))!;
  const p=await this.db.comPost.findFirst({where:{id:checked(id)},select:{authorId:true}});
  if(!p||p.authorId!==actor.id&&!forumModerator(actor.role))throw new NotFoundException('History unavailable');
  return {items:await this.db.comPostRevision.findMany({where:{postId:id},
   select:{id:true,body:true,editedAt:true},orderBy:{editedAt:'desc'},take:25})};
 }
 @Get('duplicates') @Header('Cache-Control','private,no-store')
 async duplicates(@Query('title')raw=''){
  if(raw.length<8||raw.length>2000)throw new BadRequestException('Invalid title');
  const words=raw.toLowerCase().match(/[\p{L}\p{N}]{4,}/gu)||[];
  const unique=[...new Set(words)].slice(0,5);
  if(unique.length<2)return {items:[]};
  const options=await this.db.comThread.findMany({where:{status:'PUBLISHED',
   category:{enabled:true},OR:unique.map(word=>({title:{contains:word,mode:'insensitive'}}))},
   select:{id:true,title:true},orderBy:{lastActivityAt:'desc'},take:40});
  const scored=options.map(row=>({row,hits:unique.filter(w=>row.title.toLowerCase().includes(w)).length}))
   .filter(x=>x.hits>=2).sort((a,b)=>b.hits-a.hits).slice(0,5);
  return {items:scored.map(x=>x.row)};
 }
}
for(const [name,args] of [
 ['activity',[String,Object]],['helpful',[String,Object]],['removeHelpful',[String,Object]],
 ['follow',[String,Object]],['unfollow',[String,Object]],['notifications',[Object,String]],
 ['readOne',[String,Object]],['readAll',[Object]],['publicProfile',[String]],
 ['threadRevisions',[String,Object]],['postRevisions',[String,Object]],['duplicates',[String]]
] as const)Reflect.defineMetadata('design:paramtypes',args,ComSocialController.prototype,name);
