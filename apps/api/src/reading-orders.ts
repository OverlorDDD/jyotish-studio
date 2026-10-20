import {BadRequestException,Body,Controller,ForbiddenException,Inject,Param,Post,Get,Delete,Req,UnauthorizedException,HttpException,HttpStatus} from '@nestjs/common';
import {ApiProperty,ApiTags} from '@nestjs/swagger';
import {IsOptional,IsString,Length,MaxLength,IsBoolean,IsIn} from 'class-validator';
import type {IncomingMessage} from 'node:http';
import {PrismaService} from './prisma.ts';
import {cookieUser,sameOrigin} from './auth.ts';
import {createHourlyLimiter} from './ai.ts';

export class ReadingBriefDto{
 @ApiProperty({type:String,minLength:12,maxLength:600})
 @IsString() @Length(12,600) question!:string;
 @ApiProperty({type:String,minLength:20,maxLength:2000})
 @IsString() @Length(20,2000) context!:string;
 @IsOptional() @IsString() @MaxLength(140) timeframe?:string;
}

export class NewReadingDraftDto {
 @ApiProperty({type:String,enum:['relationships','career','growth','decision','other']})
 @IsString() @IsIn(['relationships','career','growth','decision','other']) topic!:string;
 @ApiProperty({type:String,minLength:12,maxLength:600})
 @IsString() @Length(12,600) question!:string;
 @ApiProperty({type:String,minLength:20,maxLength:2000})
 @IsString() @Length(20,2000) context!:string;
 @ApiProperty({type:String,required:false})
 @IsOptional() @IsString() @MaxLength(140) timeframe?:string;
 @ApiProperty({type:Boolean,description:'Explicit consent to temporarily store personal precheckout draft'})
 @IsBoolean() privacyConsent!:boolean;
}
const allowDraft=createHourlyLimiter(80);

/** Drafts may be submitted before checkout but are NEVER work orders.
 * The expert never receives a draft until a separate verified payment workflow.
 * No checkout integration is enabled yet. */
@ApiTags('Paid readings')
@Controller('api/v1/reading-orders')
export class ReadingOrdersController{
 constructor(@Inject(PrismaService)private readonly prisma:PrismaService){}
 @Post('drafts')
 async saveDraft(@Body()body:NewReadingDraftDto,@Req()req:IncomingMessage){
  if(!sameOrigin(req))throw new ForbiddenException('Cross-origin request denied');
  const customerId=cookieUser(req);
  if(!customerId)throw new UnauthorizedException('Sign in to save a reading request');
  if(body.privacyConsent!==true)throw new BadRequestException('Consent required to save a private draft');
  if(!allowDraft())throw new HttpException('Too many reading drafts',HttpStatus.TOO_MANY_REQUESTS);
  const question=body.question.trim(),context=body.context.trim();
  if(question.length<12||context.length<20)throw new BadRequestException('Please provide a question and context');
  const now=new Date(),dayAgo=new Date(now.getTime()-24*60*60*1000);
  const recent=await this.prisma.readingDraft.count({where:{customerId,createdAt:{gte:dayAgo}}});
  if(recent>=5)throw new HttpException('Daily limit for reading drafts reached',HttpStatus.TOO_MANY_REQUESTS);
  const draft=await this.prisma.readingDraft.create({data:{
   customerId,topic:body.topic,question,context,timeframe:body.timeframe?.trim()||null,
   consentAt:now,expiresAt:new Date(now.getTime()+7*24*60*60*1000)
  },select:{id:true,createdAt:true,expiresAt:true}});
  return {...draft,status:'AWAITING_CHECKOUT',checkoutAvailable:false};
 }
 @Get('drafts')
 async myDrafts(@Req()req:IncomingMessage){
  const customerId=cookieUser(req);
  if(!customerId)throw new UnauthorizedException('Sign in required');
  return this.prisma.readingDraft.findMany({
   where:{customerId,expiresAt:{gt:new Date()}},orderBy:{createdAt:'desc'},take:10,
   select:{id:true,createdAt:true,expiresAt:true,topic:true,question:true,context:true,timeframe:true}
  });
 }
 /** Client can inspect its order status without exposing payment IDs, expert files, or other customers. */
 @Get('my-orders')
 async myOrders(@Req()req:IncomingMessage){
  const customerId=cookieUser(req);
  if(!customerId)throw new UnauthorizedException('Sign in required');
  const orders=await this.prisma.readingOrder.findMany({where:{customerId},orderBy:{createdAt:'desc'},take:30,
   select:{id:true,status:true,offerCode:true,createdAt:true,updatedAt:true,completedAt:true,
    paymentVerifiedAt:true,expertId:true}});
  return {orders:orders.map(o=>({
   id:o.id,status:o.status,offerCode:o.offerCode,createdAt:o.createdAt,updatedAt:o.updatedAt,
   completedAt:o.completedAt,hasVerifiedPayment:Boolean(o.paymentVerifiedAt),hasAssignedExpert:Boolean(o.expertId)
  })),checkoutAvailable:false};
 }
 /** ADMIN desk must never see private pre-checkout drafts.
  * Only server-verified paid orders enter an operational queue; no client-provided paid flag.
  */
 @Get('admin/queue')
 async paidQueue(@Req()req:IncomingMessage){
  const actor=cookieUser(req);
  if(!actor)throw new UnauthorizedException('Sign in required');
  const staff=await this.prisma.user.findUnique({where:{id:actor},select:{role:true}});
  if(staff?.role!=='ADMIN')throw new ForbiddenException('ADMIN required');
  const orders=await this.prisma.readingOrder.findMany({
   where:{paymentVerifiedAt:{not:null},providerPaymentId:{not:null},status:{not:'AWAITING_PAYMENT'}},
   orderBy:{updatedAt:'desc'},take:100,
   select:{id:true,status:true,question:true,context:true,expertId:true,createdAt:true,updatedAt:true,
    paymentVerifiedAt:true,completedAt:true}
  });
  return {orders,checkoutAvailable:false};
 }
 @Delete('drafts/:id')
 async deleteDraft(@Param('id')id:string,@Req()req:IncomingMessage){
  if(!sameOrigin(req))throw new ForbiddenException('Cross-origin request denied');
  const customerId=cookieUser(req);
  if(!customerId)throw new UnauthorizedException('Sign in required');
  const result=await this.prisma.readingDraft.deleteMany({where:{id,customerId}});
  return {deleted:result.count===1};
 }

 @Post(':id/brief')
 async submitBrief(@Param('id')id:string,@Body()body:ReadingBriefDto,@Req()req:IncomingMessage){
  if(!sameOrigin(req))throw new ForbiddenException('Cross-origin request denied');
  const customerId=cookieUser(req);
  if(!customerId)throw new UnauthorizedException('Sign in before booking');
  if(!/^[0-9a-f-]{36}$/i.test(id))throw new BadRequestException('Invalid order identifier');
  if(body.question.trim().length<12||body.context.trim().length<20)throw new BadRequestException('Provide a clear question and context');
  // Atomic conditional update blocks replay, unauthorised users, and unpaid orders.
  const changed=await this.prisma.readingOrder.updateMany({
   where:{id,customerId,status:'PAID',paymentVerifiedAt:{not:null},providerPaymentId:{not:null},question:null,context:null},
   data:{question:body.question.trim(),context:[body.context.trim(),body.timeframe?.trim()?'Timeframe: '+body.timeframe.trim():null].filter(Boolean).join('\n\n'),status:'BRIEF_SUBMITTED'}
  });
  if(changed.count!==1)throw new ForbiddenException('Verified payment required, or brief already submitted');
  return {submitted:true,status:'BRIEF_SUBMITTED'};
 }
}
Reflect.defineMetadata('design:paramtypes',[String,ReadingBriefDto,Object],ReadingOrdersController.prototype,'submitBrief');

Reflect.defineMetadata('design:paramtypes',[NewReadingDraftDto,Object],ReadingOrdersController.prototype,'saveDraft');
Reflect.defineMetadata('design:paramtypes',[Object],ReadingOrdersController.prototype,'myDrafts');
Reflect.defineMetadata('design:paramtypes',[String,Object],ReadingOrdersController.prototype,'deleteDraft');
Reflect.defineMetadata('design:paramtypes',[Object],ReadingOrdersController.prototype,'myOrders');
Reflect.defineMetadata('design:paramtypes',[Object],ReadingOrdersController.prototype,'paidQueue');
