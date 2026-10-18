import {Controller,Get,Req,Inject,UnauthorizedException,ForbiddenException} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import type {IncomingMessage} from 'node:http';
import {PrismaService} from './prisma.ts';
import {cookieUser} from './auth.ts';

/** Admin-only operational aggregates. Never returns users' birth data, prompts or video briefs. */
@ApiTags('Admin')
@Controller('api/v1/admin')
export class AdminController {
 constructor(@Inject(PrismaService) private readonly prisma:PrismaService){}
 @Get('overview')
 async overview(@Req()req:IncomingMessage){
  const userId=cookieUser(req);
  if(!userId)throw new UnauthorizedException('Sign in required');
  const user=await this.prisma.user.findUnique({where:{id:userId},select:{role:true}});
  if(!user||user.role!=='ADMIN')throw new ForbiddenException('Administrator role required');
  const start=new Date(Date.now()-30*24*60*60*1000);
  const [users,charts,orders,usage,providers]=await Promise.all([
   this.prisma.user.count(),
   this.prisma.chart.count(),
   this.prisma.readingOrder.groupBy({by:['status'],_count:{_all:true}}),
   this.prisma.aiUsage.aggregate({
    where:{createdAt:{gte:start}},
    _count:{_all:true},
    _sum:{promptTokens:true,completionTokens:true,totalTokens:true,costUsd:true}
   }),
   this.prisma.aiUsage.groupBy({
    by:['provider','model'],where:{createdAt:{gte:start}},
    _count:{_all:true},_sum:{promptTokens:true,completionTokens:true,totalTokens:true,costUsd:true}
   })
  ]);
  return {
   windowDays:30,users,charts,
   orders:orders.map(row=>({status:row.status,count:row._count._all})),
   ai:{
    requests:usage._count._all,
    promptTokensReported:usage._sum.promptTokens??0,
    completionTokensReported:usage._sum.completionTokens??0,
    totalTokensReported:usage._sum.totalTokens??0,
    // Not all providers report tokens or price: zero is NOT an accurate cost estimate.
    costUsdReported:usage._sum.costUsd,
    byProvider:providers.map(row=>({
     provider:row.provider,model:row.model,requests:row._count._all,
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
