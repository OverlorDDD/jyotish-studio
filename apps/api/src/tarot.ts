import {BadRequestException,Body,Controller,Get,Inject,HttpException,HttpStatus,Post,Req,UnauthorizedException} from '@nestjs/common';
import {ApiProperty,ApiTags} from '@nestjs/swagger';
import {IsBoolean,IsIn,IsOptional,IsString,MaxLength} from 'class-validator';
import {Prisma} from '@prisma/client';
import type {IncomingMessage} from 'node:http';
import {PrismaService} from './prisma.ts';
import {cookieUser,sameOrigin} from './auth.ts';
import {drawCards,describeDraws,TAROT_DECK,SPREADS,type Spread} from './tarot-deck.ts';
import {synthesizeTarot} from './tarot-synthesis.ts';
import {readerReading} from './tarot-reader.ts';
import {createHumanAiTarot,tarotAiConfig} from './tarot-ai.ts';
import {createHourlyLimiter} from './ai.ts';

export class TarotDrawDto {
 @ApiProperty({type:String,enum:['one','three','celtic']})
 @IsString() @IsIn(['one','three','celtic']) spread!:Spread;
 @ApiProperty({type:String,required:false,maxLength:600})
 @IsOptional() @IsString() @MaxLength(600) question?:string;
 @ApiProperty({type:String,enum:['uk','en'],required:false})
 @IsOptional() @IsIn(['uk','en']) language?:'uk'|'en';
 @ApiProperty({type:Boolean,required:false,description:'Consent to send question and card facts to external AI'})
 @IsOptional() @IsBoolean() aiConsent?:boolean;
}
const FREE_LIMIT=3;
const ADMIN_LIMIT=100;
const limitFor=(role:string)=>role==='ADMIN'?ADMIN_LIMIT:FREE_LIMIT;
const allowTarotAi=createHourlyLimiter(12);
function requireUser(req:IncomingMessage){
 const userId=cookieUser(req);
 if(!userId)throw new UnauthorizedException('Sign in to save and draw your free tarot readings.');
 return userId;
}
function dayStartUtc(date:Date){
 return new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate()));
}
@ApiTags('Tarot')
@Controller('api/v1/tarot')
export class TarotController {
 constructor(@Inject(PrismaService)private readonly prisma:PrismaService){}
 @Get('deck')
 deck(){
  return {version:'rws-v1',aiAvailable:tarotAiConfig().enabled,total:TAROT_DECK.length,spreads:Object.entries(SPREADS).map(([id,positions])=>({id,cards:positions.length}))};
 }
 @Get('readings')
 async history(@Req()req:IncomingMessage){
  const userId=requireUser(req), start=dayStartUtc(new Date());
  const [user,used,readings]=await Promise.all([
   this.prisma.user.findUnique({where:{id:userId},select:{role:true}}),
   this.prisma.tarotReading.count({where:{userId,createdAt:{gte:start}}}),
   this.prisma.tarotReading.findMany({where:{userId},orderBy:{createdAt:'desc'},take:20,
    select:{id:true,createdAt:true,spread:true,question:true,cards:true,narrative:true,narrativeLang:true,narrativeModel:true}})
  ]);
  const entries=readings.map(row=>{
   const spread=row.spread as Spread;
   if(!['one','three','celtic'].includes(spread))return null;
   try{
    const cards=row.cards as {id:string;position:number;reversed:boolean}[];
    return {id:row.id,createdAt:row.createdAt,spread,question:row.question,cards:describeDraws(cards,spread),
     synthesis:synthesizeTarot(cards,spread,row.question),
     reader:{uk:readerReading(cards,spread,row.question,'uk'),en:readerReading(cards,spread,row.question,'en')},
     aiReading:row.narrative&&row.narrativeLang&&row.narrativeModel?{
      language:row.narrativeLang,model:row.narrativeModel,reading:row.narrative
     }:null};
   }
   catch{return null;}
  }).filter(Boolean);
  const limit=limitFor(user?.role||'MEMBER');
  return {remaining:Math.max(0,limit-used),limit,reset:'UTC midnight',aiAvailable:tarotAiConfig().enabled,readings:entries};
 }
 @Post('readings')
 async draw(@Body()body:TarotDrawDto,@Req()req:IncomingMessage){
  if(!sameOrigin(req))throw new BadRequestException('Cross-origin tarot request blocked');
  const userId=requireUser(req);
  if(!Object.hasOwn(SPREADS,body.spread))throw new BadRequestException('Unsupported tarot spread');
  const now=new Date(),start=dayStartUtc(now),end=new Date(start.getTime()+86400000);
  const question=body.question?.trim()||null;
  if(question&&question.length>600)throw new BadRequestException('Question too long');
  // Lock user row in transaction to avoid bypassing the role-specific daily limit.
  const base=await this.prisma.$transaction(async tx=>{
   const lock=await tx.$queryRaw<Array<{id:string}>>`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
   if(!lock.length)throw new UnauthorizedException('Account no longer exists');
   const user=await tx.user.findUnique({where:{id:userId},select:{role:true}});
   const limit=limitFor(user?.role||'MEMBER');
   const used=await tx.tarotReading.count({where:{userId,createdAt:{gte:start,lt:end}}});
   if(used>=limit)throw new HttpException('Daily tarot limit reached',HttpStatus.TOO_MANY_REQUESTS);
   const drawn=drawCards(body.spread);
   const row=await tx.tarotReading.create({data:{userId,spread:body.spread,question,cards:drawn},select:{id:true,createdAt:true}});
   return {row,drawn,limit,remaining:limit-used-1,role:user?.role||'MEMBER'};
  });
  const reader={
   uk:readerReading(base.drawn,body.spread,question,'uk'),
   en:readerReading(base.drawn,body.spread,question,'en')
  };
  let aiReading:null|{language:'uk'|'en';model:string;reading:typeof reader.uk}=null;
  const language=body.language||'uk';
  if(body.aiConsent===true&&tarotAiConfig().enabled&&allowTarotAi()){
   const todayAi=await this.prisma.tarotReading.count({where:{userId,createdAt:{gte:start},narrativeModel:{not:null}}});
   const aiDailyLimit=base.role==='ADMIN'?10:2;
   if(todayAi<aiDailyLimit){
    try{
     const completion=await createHumanAiTarot(base.drawn,body.spread,question,language,{
      onUsage:async event=>{
       try{await this.prisma.aiUsage.create({data:{
        provider:event.provider,model:event.model,operation:'tarot_reading',outcome:event.outcome,
        promptTokens:event.promptTokens,completionTokens:event.completionTokens,
        totalTokens:event.totalTokens,costUsd:event.costUsd
       }});}catch{console.warn('Tarot AI usage logging failed');}
      }
     });
     await this.prisma.tarotReading.update({where:{id:base.row.id},data:{
      narrative:completion.reading as unknown as Prisma.InputJsonValue,
      narrativeLang:language,narrativeModel:completion.model
     }});
     aiReading={language,model:completion.model,reading:completion.reading};
    }catch{
     console.warn('Tarot AI unavailable; local human-style interpretation returned');
    }
   }
  }
  return {...base.row,spread:body.spread,question,cards:describeDraws(base.drawn,body.spread),
   synthesis:synthesizeTarot(base.drawn,body.spread,question),reader,aiReading,
   remaining:base.remaining,limit:base.limit,reset:'UTC midnight'};
 }
}
Reflect.defineMetadata('design:paramtypes',[],TarotController.prototype,'deck');
Reflect.defineMetadata('design:paramtypes',[Object],TarotController.prototype,'history');
Reflect.defineMetadata('design:paramtypes',[TarotDrawDto,Object],TarotController.prototype,'draw');
