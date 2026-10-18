import {BadRequestException,Body,Controller,ForbiddenException,Inject,Param,Post,Req,UnauthorizedException} from '@nestjs/common';
import {ApiProperty,ApiTags} from '@nestjs/swagger';
import {IsOptional,IsString,Length,MaxLength} from 'class-validator';
import type {IncomingMessage} from 'node:http';
import {PrismaService} from './prisma.ts';
import {cookieUser,sameOrigin} from './auth.ts';

export class ReadingBriefDto{
 @ApiProperty({type:String,minLength:12,maxLength:600})
 @IsString() @Length(12,600) question!:string;
 @ApiProperty({type:String,minLength:20,maxLength:2000})
 @IsString() @Length(20,2000) context!:string;
 @IsOptional() @IsString() @MaxLength(140) timeframe?:string;
}

/** No unauthenticated and no pre-payment brief intake.
 * Checkout must be integrated separately with signed, verified server webhooks. */
@ApiTags('Paid readings')
@Controller('api/v1/reading-orders')
export class ReadingOrdersController{
 constructor(@Inject(PrismaService)private readonly prisma:PrismaService){}
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
