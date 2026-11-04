import {BadRequestException,Body,ConflictException,Controller,Delete,ForbiddenException,Get,Header,Inject,NotFoundException,Param,Patch,Put,Query,Req,UnauthorizedException} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {IsIn,IsOptional,IsString,Length} from 'class-validator';
import type {IncomingMessage} from 'node:http';
import {PrismaService} from './prisma.ts';
import {cookieUser,sameOrigin} from './auth.ts';
import {effectiveSubscription} from './account-policy.ts';
import {validateForumText} from './com-policy.ts';
import {bookmarkCapacity,reputationLevel,visibleGrowthProfile} from './com-growth-policy.ts';

const uuid=/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
const checked=(id:string)=>{if(!uuid.test(id))throw new BadRequestException('Invalid identifier');return id};
class GrowthProfileDto{
 @IsOptional() @IsString() @Length(0,280) signature?:string;
 @IsOptional() @IsIn(['default','gold','violet','teal']) accent?:'default'|'gold'|'violet'|'teal';
}
@ApiTags('GalaxiCom Growth')
@Controller('api/v1/com/growth')
export class ComGrowthController{
 constructor(@Inject(PrismaService)private readonly db:PrismaService){}
 private async actor(req:IncomingMessage){
  const id=cookieUser(req);
  if(!id)throw new UnauthorizedException('Sign in');
  const user=await this.db.user.findUnique({where:{id},
   select:{id:true,role:true,subscriptionTier:true,subscriptionEndsAt:true}});
  if(!user)throw new UnauthorizedException('Session expired');
  return user;
 }
 private write(req:IncomingMessage){if(!sameOrigin(req))throw new ForbiddenException('Cross-origin write denied')}
 private premium(user:{subscriptionTier:'FREE'|'PREMIUM';subscriptionEndsAt:Date|null}){
  return effectiveSubscription(user)==='PREMIUM';
 }
 @Get('featured') @Header('Cache-Control','no-store')
 async featured(){
  // Fast candidate shortlist. Engagement is not editorial endorsement and never includes hidden content.
  const rows=await this.db.comThread.findMany({where:{status:'PUBLISHED',category:{enabled:true},
   lastActivityAt:{gte:new Date(Date.now()-30*86400000)}},
   orderBy:{lastActivityAt:'desc'},take:50,
   select:{id:true,title:true,categorySlug:true,lastActivityAt:true,
    _count:{select:{posts:{where:{status:'PUBLISHED'}}}}}});
  const ranked=rows.map(x=>({id:x.id,title:x.title,category:x.categorySlug,
   replies:x._count.posts,activity:x.lastActivityAt,
   score:Math.min(20,x._count.posts)*3+(Date.now()-x.lastActivityAt.getTime()<7*86400000?2:0)}))
   .sort((a,b)=>b.score-a.score||b.activity.getTime()-a.activity.getTime())
   .slice(0,6).map(({score,...item})=>item);
  return {items:ranked,method:'PUBLIC_30_DAY_ENGAGEMENT',editorialEndorsement:false};
 }
 @Get('bookmarks') @Header('Cache-Control','private,no-store')
 async bookmarks(@Req()req:IncomingMessage,@Query('page')raw='1'){
  const user=await this.actor(req),page=Number(raw);
  if(!Number.isSafeInteger(page)||page<1||page>20)throw new BadRequestException('Invalid page');
  const where={userId:user.id,thread:{status:'PUBLISHED',category:{enabled:true}}};
  const [total,rows]=await Promise.all([
   this.db.comBookmark.count({where}),
   this.db.comBookmark.findMany({where,orderBy:{createdAt:'desc'},skip:(page-1)*20,take:20,
    select:{threadId:true,createdAt:true,thread:{select:{title:true,categorySlug:true}}}})
  ]);
  return {items:rows.map(x=>({id:x.threadId,title:x.thread.title,category:x.thread.categorySlug,
   createdAt:x.createdAt})),total,page,max:bookmarkCapacity(this.premium(user))};
 }
 @Get('bookmarks/:id') @Header('Cache-Control','private,no-store')
 async isBookmarked(@Req()req:IncomingMessage,@Param('id')id:string){
  const actor=await this.actor(req);
  return {saved:!!await this.db.comBookmark.findUnique({where:{userId_threadId:{userId:actor.id,threadId:checked(id)}}})};
 }
 @Put('bookmarks/:id') @Header('Cache-Control','private,no-store')
 async save(@Req()req:IncomingMessage,@Param('id')id:string){
  this.write(req);const actor=await this.actor(req);checked(id);
  const target=await this.db.comThread.findFirst({where:{id,status:'PUBLISHED',category:{enabled:true}},select:{id:true}});
  if(!target)throw new NotFoundException('Published topic unavailable');
  try{return await this.db.$transaction(async tx=>{
    const old=await tx.comBookmark.findUnique({where:{userId_threadId:{userId:actor.id,threadId:id}}});
    if(old)return {saved:true};
    const total=await tx.comBookmark.count({where:{userId:actor.id,thread:{status:'PUBLISHED',category:{enabled:true}}}});
    if(total>=bookmarkCapacity(this.premium(actor)))throw new ForbiddenException('Bookmark allowance reached');
    await tx.comBookmark.create({data:{userId:actor.id,threadId:id}});
    return {saved:true};
   },{isolationLevel:'Serializable'});
  }catch(e){
   if(e&&typeof e==='object'&&'code'in e&&e.code==='P2034')
    throw new ConflictException('Concurrent bookmark update; retry');
   throw e;
  }
 }
 @Delete('bookmarks/:id') @Header('Cache-Control','private,no-store')
 async remove(@Req()req:IncomingMessage,@Param('id')id:string){
  this.write(req);const actor=await this.actor(req);
  await this.db.comBookmark.deleteMany({where:{userId:actor.id,threadId:checked(id)}});
  return {saved:false};
 }
 @Get('members/:id') @Header('Cache-Control','no-store')
 async member(@Param('id')id:string){
  const member=await this.db.user.findUnique({where:{id:checked(id)},select:{
   id:true,subscriptionTier:true,subscriptionEndsAt:true,
   comProfile:{select:{signature:true,accent:true}}}});
  if(!member)throw new NotFoundException('Member unavailable');
  const helpful=await this.db.comHelpfulReaction.count({where:{userId:{not:id},
   post:{authorId:id,status:'PUBLISHED',thread:{status:'PUBLISHED',category:{enabled:true}}}}});
  const profile=visibleGrowthProfile({signature:member.comProfile?.signature||null,
   accent:member.comProfile?.accent||'default'},this.premium(member));
  return {...profile,helpful,reputation:reputationLevel(helpful)};
 }
 @Patch('profile') @Header('Cache-Control','private,no-store')
 async profile(@Req()req:IncomingMessage,@Body()dto:GrowthProfileDto){
  this.write(req);const actor=await this.actor(req);
  if(dto.signature===undefined&&dto.accent===undefined)throw new BadRequestException('Nothing to change');
  const premium=this.premium(actor);
  let signature:string|undefined;
  if(dto.signature!==undefined){
   try{signature=dto.signature.trim()?validateForumText(dto.signature,1,premium?280:80):'';}
   catch{throw new BadRequestException('Signature exceeds allowance or contains unsupported markup');}
  }
  if(dto.accent&&dto.accent!=='default'&&!premium)throw new ForbiddenException('Active PREMIUM required for a custom accent');
  const row=await this.db.comProfile.upsert({where:{userId:actor.id},
   create:{userId:actor.id,signature:signature||null,accent:dto.accent||'default'},
   update:{...(signature!==undefined?{signature:signature||null}:{}),
    ...(dto.accent!==undefined?{accent:dto.accent}:{})},
   select:{signature:true,accent:true}});
  return visibleGrowthProfile(row,premium);
 }
}
for(const [name,args] of [
 ['featured',[]],['bookmarks',[Object,String]],['isBookmarked',[Object,String]],
 ['save',[Object,String]],['remove',[Object,String]],['member',[String]],['profile',[Object,GrowthProfileDto]]
] as const)Reflect.defineMetadata('design:paramtypes',args,ComGrowthController.prototype,name);
