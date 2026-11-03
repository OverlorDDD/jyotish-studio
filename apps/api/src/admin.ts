import {Controller,Get,Header,Patch,Body,Param,Query,Req,Inject,UnauthorizedException,ForbiddenException,BadRequestException} from '@nestjs/common';
import {ApiProperty,ApiTags} from '@nestjs/swagger';
import {IsIn} from 'class-validator';
import type {IncomingMessage} from 'node:http';
import {PrismaService} from './prisma.ts';
import {cookieUser,sameOrigin} from './auth.ts';
import {effectiveSubscription} from './account-policy.ts';
import {readGa4Realtime} from './admin-ga4-realtime.ts';
import {VISITOR_METRICS} from './visitor-analytics.ts';
import {ADMIN_ROLE_USE_CASE,ChangeRoleUseCase,RoleChangeError} from './admin-role-application.ts';

export class ChangeUserRoleDto {
 @ApiProperty({type:String,enum:['MEMBER','EXPERT','SUPPORT','ADMIN']})
 @IsIn(['MEMBER','EXPERT','SUPPORT','ADMIN'])
 role!: 'MEMBER'|'EXPERT'|'SUPPORT'|'ADMIN';
}


/** Admin-only operational aggregates. Never returns users' birth data, prompts or video briefs. */
@ApiTags('Admin')
@Controller('api/v1/admin')
export class AdminController {
 constructor(@Inject(PrismaService) private readonly prisma:PrismaService,
  @Inject(ADMIN_ROLE_USE_CASE)private readonly roleChanges:ChangeRoleUseCase){}
 private async requireAdmin(req:IncomingMessage){
  const userId=cookieUser(req);
  if(!userId)throw new UnauthorizedException('Sign in required');
  const user=await this.prisma.user.findUnique({where:{id:userId},select:{role:true}});
  if(!user||user.role!=='ADMIN')throw new ForbiddenException('Administrator role required');
  return userId;
 }

 @Get('users')
 async users(@Req()req:IncomingMessage,@Query('page')rawPage?:string){
  await this.requireAdmin(req);
  const page=rawPage===undefined?1:Number(rawPage);
  if(!Number.isSafeInteger(page)||page<1||page>10000)throw new BadRequestException('Invalid page');
  const [total,rows]=await Promise.all([
   this.prisma.user.count(),
   this.prisma.user.findMany({orderBy:{createdAt:'desc'},skip:(page-1)*50,take:50,
    select:{id:true,email:true,role:true,createdAt:true,subscriptionTier:true,subscriptionEndsAt:true}})
  ]);
  return {page,total,pageSize:50,users:rows.map(u=>({
   id:u.id,email:u.email,role:u.role,createdAt:u.createdAt,
   subscription:effectiveSubscription(u)
  }))};
 }
 @Get('role-audit')
 async roleAudit(@Req()req:IncomingMessage){
  await this.requireAdmin(req);
  return this.prisma.roleChange.findMany({take:50,orderBy:{createdAt:'desc'},
   select:{id:true,createdAt:true,previousRole:true,newRole:true,
    actor:{select:{email:true}},target:{select:{email:true}}}});
 }
 @Patch('users/:id/role')
 async changeRole(@Param('id')targetId:string,@Body()body:ChangeUserRoleDto,@Req()req:IncomingMessage){
  if(!sameOrigin(req))throw new ForbiddenException('Cross-origin role operation denied');
  const actorId=await this.requireAdmin(req);
  try{return await this.roleChanges.execute(actorId,targetId,body.role);}
  catch(error){
   if(error instanceof RoleChangeError){
    if(error.code==='invalid_id'||error.code==='target_missing')throw new BadRequestException(error.message);
    throw new ForbiddenException(error.message);
   }
   throw error;
  }
 }

 /** Only explicit expert submissions are visible to staff.
  * Old owner-private questions are excluded by expertSubmittedAt:null. */
 @Get('expert-requests')
 async expertRequests(@Req()req:IncomingMessage){
  await this.requireAdmin(req);
  const [unread,total,items]=await Promise.all([
   this.prisma.tarotQuestion.count({where:{expertSubmittedAt:{not:null},expertReviewedAt:null}}),
   this.prisma.tarotQuestion.count({where:{expertSubmittedAt:{not:null}}}),
   this.prisma.tarotQuestion.findMany({where:{expertSubmittedAt:{not:null}},
    take:100,orderBy:{expertSubmittedAt:'desc'},
    select:{id:true,createdAt:true,expertSubmittedAt:true,expertReviewedAt:true,
     topic:true,question:true,context:true,timeframe:true,
     user:{select:{email:true}}}})
  ]);
  return {unread,total,items};
 }
 @Patch('expert-requests/:id/review')
 async reviewExpertRequest(@Param('id')id:string,@Req()req:IncomingMessage){
  if(!sameOrigin(req))throw new ForbiddenException('Cross-origin review denied');
  await this.requireAdmin(req);
  const changed=await this.prisma.tarotQuestion.updateMany({
   where:{id,expertSubmittedAt:{not:null},expertReviewedAt:null},
   data:{expertReviewedAt:new Date()}
  });
  if(changed.count!==1)throw new BadRequestException('Request not found or already reviewed');
  return {reviewed:true};
 }
 @Get('orders')
 async orders(@Req()req:IncomingMessage){
  await this.requireAdmin(req);
  // Admin can monitor the complete order state without exposing private briefing text on overview.
  return this.prisma.readingOrder.findMany({take:100,orderBy:{createdAt:'desc'},select:{
    id:true,createdAt:true,updatedAt:true,status:true,offerCode:true,currency:true,amountMinor:true,
    paymentVerifiedAt:true,expertId:true,customerId:true,completedAt:true,
    question:true,context:true,deliveryFileKey:true
  }});
 }
 /** No browser-side GA4 key: Data API permission is checked server-side,
  * after this existing admin auth gate. Not a count of registered accounts. */
 @Get('traffic/realtime') @Header('Cache-Control','private,no-store')
 async trafficRealtime(@Req()req:IncomingMessage){
  await this.requireAdmin(req);
  return readGa4Realtime();
 }
 @Get('traffic/visitor-analytics') @Header('Cache-Control','private,no-store')
 async visitorAnalytics(@Req()req:IncomingMessage){
  await this.requireAdmin(req);
  const since=new Date();since.setUTCDate(since.getUTCDate()-6);since.setUTCHours(0,0,0,0);
  const rows=await this.prisma.visitorAggregate.findMany({
   where:{day:{gte:since}},select:{day:true,section:true,metric:true,count:true}
  });
  const totals=Object.fromEntries(VISITOR_METRICS.map(m=>[m,0])) as Record<string,number>;
  for(const row of rows)if(row.metric in totals)totals[row.metric]+=row.count;
  return {status:'ok',source:'server_aggregate',period:'last_7_utc_dates',generatedAt:new Date().toISOString(),
   totals,bySection:rows.filter(r=>r.metric==='public_html_request').reduce((out,r)=>{
    out[r.section]=(out[r.section]||0)+r.count;return out;
   },{} as Record<string,number>),
   caveat:'HTML request candidates, not unique visitors or GA4 sessions; user-agent bot filtering and middleware counts are approximate. Cached, redirected, or JS-only interactions may differ.'};
 }
 @Get('overview') @Header('Cache-Control','private,no-store')
 async overview(@Req()req:IncomingMessage){
  await this.requireAdmin(req);
  const now=new Date(),start=new Date(now.getTime()-30*24*60*60*1000);
  const weekStart=new Date(now.getTime()-7*24*60*60*1000);
  const [users,charts,orders,usage,providers,subscribers,unpaidDrafts,tarotReadings,expertRequestsUnread,newUsers7d,newCharts7d,newOrders7d,editorialPipeline]=await Promise.all([
   this.prisma.user.count(),
   this.prisma.chart.count(),
   this.prisma.readingOrder.groupBy({by:['status'],_count:{_all:true}}),
   this.prisma.aiUsage.aggregate({
    where:{createdAt:{gte:start}},
    _count:{_all:true,totalTokens:true},
    _sum:{promptTokens:true,completionTokens:true,totalTokens:true,costUsd:true}
   }),
   this.prisma.aiUsage.groupBy({
    by:['provider','model'],where:{createdAt:{gte:start}},
    _count:{_all:true,totalTokens:true},_sum:{promptTokens:true,completionTokens:true,totalTokens:true,costUsd:true}
   }),
   this.prisma.user.count({where:{subscriptionTier:'PREMIUM',subscriptionEndsAt:{gt:new Date()}}}),
   this.prisma.readingDraft.count({where:{expiresAt:{gt:new Date()}}}),
   this.prisma.tarotReading.count(),
   this.prisma.tarotQuestion.count({where:{expertSubmittedAt:{not:null},expertReviewedAt:null}}),
   this.prisma.user.count({where:{createdAt:{gte:weekStart}}}),
   this.prisma.chart.count({where:{createdAt:{gte:weekStart}}}),
   this.prisma.readingOrder.count({where:{createdAt:{gte:weekStart}}}),
   this.prisma.editorialEntry.groupBy({by:['status'],_count:{_all:true}})
  ]);
  return {
   generatedAt:now.toISOString(),windowDays:30,users,charts,subscribers,freeMembers:users-subscribers,
   newUsers7d,newCharts7d,newOrders7d,
   editorialPipeline:editorialPipeline.map(e=>({status:e.status,count:e._count._all})),unpaidDrafts,tarotReadings,expertRequestsUnread,
   orders:orders.map(row=>({status:row.status,count:row._count._all})),
   ai:{
    requests:usage._count._all,
    requestsWithTokenUsage:usage._count.totalTokens,
    promptTokensReported:usage._sum.promptTokens??0,
    completionTokensReported:usage._sum.completionTokens??0,
    totalTokensReported:usage._sum.totalTokens??0,
    // Not all providers report tokens or price: zero is NOT an accurate cost estimate.
    costUsdReported:usage._sum.costUsd,
    byProvider:providers.map(row=>({
     provider:row.provider,model:row.model,requests:row._count._all,
     requestsWithTokenUsage:row._count.totalTokens,
     promptTokensReported:row._sum.promptTokens??0,
     completionTokensReported:row._sum.completionTokens??0,
     totalTokensReported:row._sum.totalTokens??0,
     costUsdReported:row._sum.costUsd
    }))
   }
  };
 }
}
Reflect.defineMetadata('design:paramtypes',[Object],AdminController.prototype,'trafficRealtime');
Reflect.defineMetadata('design:paramtypes',[Object],AdminController.prototype,'overview');
Reflect.defineMetadata('design:paramtypes',[Object],AdminController.prototype,'orders');
Reflect.defineMetadata('design:paramtypes',[Object,String],AdminController.prototype,'users');
Reflect.defineMetadata('design:paramtypes',[Object],AdminController.prototype,'roleAudit');
Reflect.defineMetadata('design:paramtypes',[String,ChangeUserRoleDto,Object],AdminController.prototype,'changeRole');

Reflect.defineMetadata('design:paramtypes',[Object],AdminController.prototype,'expertRequests');
Reflect.defineMetadata('design:paramtypes',[String,Object],AdminController.prototype,'reviewExpertRequest');

Reflect.defineMetadata('design:paramtypes',[Object],AdminController.prototype,'visitorAnalytics');
