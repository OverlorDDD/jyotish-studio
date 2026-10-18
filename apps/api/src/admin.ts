import {Controller,Get,Patch,Body,Param,Query,Req,Inject,UnauthorizedException,ForbiddenException,BadRequestException} from '@nestjs/common';
import {ApiProperty,ApiTags} from '@nestjs/swagger';
import {IsIn} from 'class-validator';
import type {IncomingMessage} from 'node:http';
import {PrismaService} from './prisma.ts';
import {cookieUser,sameOrigin} from './auth.ts';

export class ChangeUserRoleDto {
 @ApiProperty({type:String,enum:['MEMBER','EXPERT','SUPPORT','ADMIN']})
 @IsIn(['MEMBER','EXPERT','SUPPORT','ADMIN'])
 role!: 'MEMBER'|'EXPERT'|'SUPPORT'|'ADMIN';
}


/** Admin-only operational aggregates. Never returns users' birth data, prompts or video briefs. */
@ApiTags('Admin')
@Controller('api/v1/admin')
export class AdminController {
 constructor(@Inject(PrismaService) private readonly prisma:PrismaService){}
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
   subscription:u.subscriptionTier==='PREMIUM'&&u.subscriptionEndsAt&&u.subscriptionEndsAt.getTime()>Date.now()?'PREMIUM':'FREE'
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
  if(actorId===targetId)throw new ForbiddenException('You cannot change your own role');
  if(!/^[0-9a-f-]{36}$/i.test(targetId))throw new BadRequestException('Invalid user id');
  // Revalidate ADMIN inside a serialized transaction, do not trust client role.
  return this.prisma.$transaction(async tx=>{
   const actor=await tx.user.findUnique({where:{id:actorId},select:{role:true}});
   if(actor?.role!=='ADMIN')throw new ForbiddenException('Administrator role required');
   const target=await tx.user.findUnique({where:{id:targetId},select:{role:true}});
   if(!target)throw new BadRequestException('User not found');
   if(target.role===body.role)return {changed:false,role:target.role};
   if(target.role==='ADMIN'){
    const admins=await tx.user.count({where:{role:'ADMIN'}});
    if(admins<=1)throw new ForbiddenException('Cannot remove the last administrator');
   }
   const result=await tx.user.update({where:{id:targetId},data:{role:body.role},select:{role:true}});
   await tx.roleChange.create({data:{actorId,targetId,previousRole:target.role,newRole:body.role}});
   return {changed:true,role:result.role};
  },{isolationLevel:'Serializable'});
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
 @Get('overview')
 async overview(@Req()req:IncomingMessage){
  await this.requireAdmin(req);
  const start=new Date(Date.now()-30*24*60*60*1000);
  const [users,charts,orders,usage,providers,subscribers,unpaidDrafts]=await Promise.all([
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
   this.prisma.readingDraft.count({where:{expiresAt:{gt:new Date()}}})
  ]);
  return {
   windowDays:30,users,charts,subscribers,freeMembers:users-subscribers,unpaidDrafts,
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
Reflect.defineMetadata('design:paramtypes',[Object],AdminController.prototype,'overview');
Reflect.defineMetadata('design:paramtypes',[Object],AdminController.prototype,'orders');
Reflect.defineMetadata('design:paramtypes',[Object,String],AdminController.prototype,'users');
Reflect.defineMetadata('design:paramtypes',[Object],AdminController.prototype,'roleAudit');
Reflect.defineMetadata('design:paramtypes',[String,ChangeUserRoleDto,Object],AdminController.prototype,'changeRole');
