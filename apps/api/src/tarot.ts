import {BadRequestException,Body,Controller,Get,Inject,HttpException,HttpStatus,Post,Param,Req,UnauthorizedException,ForbiddenException} from '@nestjs/common';
import {ApiProperty,ApiTags} from '@nestjs/swagger';
import {IsIn,IsOptional,IsString,MaxLength,IsBoolean} from 'class-validator';
import type {IncomingMessage} from 'node:http';
import {PrismaService} from './prisma.ts';
import {cookieUser,sameOrigin} from './auth.ts';
import {drawCards,describeDraws,TAROT_DECK,SPREADS,type Spread} from './tarot-deck.ts';
import {synthesizeTarot} from './tarot-synthesis.ts';
import {tarotForecast} from './tarot-forecast.ts';
import {generateTarotNarrative} from './tarot-ai.ts';

export class TarotDrawDto {
 @ApiProperty({type:String,enum:['one','three','celtic']})
 @IsString() @IsIn(['one','three','celtic']) spread!:Spread;
 @ApiProperty({type:String,required:false,maxLength:600})
 @IsOptional() @IsString() @MaxLength(600) question?:string;
}
export class TarotAiDto {
 @ApiProperty({type:String,enum:['uk','en']})
 @IsIn(['uk','en']) lang!:'uk'|'en';
 @ApiProperty({type:Boolean,description:'Explicit opt-in to send the question and card meanings to the configured free AI provider'})
 @IsBoolean() consent!:boolean;
}
const FREE_LIMIT=3;
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
  return {version:'rws-v1',total:TAROT_DECK.length,spreads:Object.entries(SPREADS).map(([id,positions])=>({id,cards:positions.length}))};
 }
 @Get('readings')
 async history(@Req()req:IncomingMessage){
  const userId=requireUser(req), start=dayStartUtc(new Date());
  const [used,readings]=await Promise.all([
   this.prisma.tarotReading.count({where:{userId,createdAt:{gte:start}}}),
   this.prisma.tarotReading.findMany({where:{userId},orderBy:{createdAt:'desc'},take:20,
    select:{id:true,createdAt:true,spread:true,question:true,cards:true,aiTextUk:true,aiTextEn:true}})
  ]);
  const entries=readings.map(row=>{
   const spread=row.spread as Spread;
   if(!['one','three','celtic'].includes(spread))return null;
   try{return {id:row.id,createdAt:row.createdAt,spread,question:row.question,cards:describeDraws(row.cards as {id:string;position:number;reversed:boolean}[],spread),synthesis:tarotForecast(row.cards as {id:string;position:number;reversed:boolean}[],spread,row.question),aiText:{uk:row.aiTextUk,en:row.aiTextEn}}}
   catch{return null;}
  }).filter(Boolean);
  return {remaining:Math.max(0,FREE_LIMIT-used),limit:FREE_LIMIT,reset:'UTC midnight',readings:entries};
 }
 @Post('readings/:id/interpret')
 async interpret(@Param('id')id:string,@Body()body:TarotAiDto,@Req()req:IncomingMessage){
  if(!sameOrigin(req))throw new ForbiddenException('Cross-origin tarot request blocked');
  const userId=requireUser(req);
  if(body.consent!==true)throw new BadRequestException('Explicit AI data-sharing consent required');
  if(!/^[0-9a-f-]{36}$/i.test(id))throw new BadRequestException('Invalid reading identifier');
  const row=await this.prisma.tarotReading.findFirst({where:{id,userId},select:{
   id:true,question:true,spread:true,cards:true,aiTextUk:true,aiTextEn:true
  }});
  if(!row)throw new ForbiddenException('This reading does not belong to your account');
  if(!['one','three','celtic'].includes(row.spread))throw new BadRequestException('Invalid saved spread');
  const already=body.lang==='uk'?row.aiTextUk:row.aiTextEn;
  if(already)return {text:already,provider:'cached',cached:true};
  const attempt=await generateTarotNarrative(
   row.cards as {id:string;position:number;reversed:boolean}[],
   row.spread as Spread,row.question,body.lang,
   async event=>{await this.prisma.aiUsage.create({data:{
    provider:event.provider,model:event.model,operation:'tarot_interpretation',
    outcome:event.outcome,promptTokens:event.promptTokens,completionTokens:event.completionTokens,
    totalTokens:event.totalTokens,costUsd:event.costUsd
   }});}
  );
  if(!attempt.result)return {text:null,reason:attempt.reason,provider:'local'};
  await this.prisma.tarotReading.updateMany({where:{id,userId},
   data:body.lang==='uk'?{aiTextUk:attempt.result.text}:{aiTextEn:attempt.result.text}});
  return {text:attempt.result.text,provider:attempt.result.provider,cached:false};
 }
 @Post('readings')
 async draw(@Body()body:TarotDrawDto,@Req()req:IncomingMessage){
  if(!sameOrigin(req))throw new BadRequestException('Cross-origin tarot request blocked');
  const userId=requireUser(req);
  if(!Object.hasOwn(SPREADS,body.spread))throw new BadRequestException('Unsupported tarot spread');
  const now=new Date(),start=dayStartUtc(now),end=new Date(start.getTime()+86400000);
  const question=body.question?.trim()||null;
  if(question&&question.length>600)throw new BadRequestException('Question too long');
  // Lock the account row so parallel requests cannot bypass 3 per UTC day.
  return this.prisma.$transaction(async tx=>{
   const lock=await tx.$queryRaw<Array<{id:string}>>`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
   if(!lock.length)throw new UnauthorizedException('Account no longer exists');
   const used=await tx.tarotReading.count({where:{userId,createdAt:{gte:start,lt:end}}});
   if(used>=FREE_LIMIT)throw new HttpException('Daily free reading limit reached',HttpStatus.TOO_MANY_REQUESTS);
   const drawn=drawCards(body.spread);
   const row=await tx.tarotReading.create({data:{userId,spread:body.spread,question,cards:drawn},
    select:{id:true,createdAt:true}});
   return {...row,spread:body.spread,question,cards:describeDraws(drawn,body.spread),
    synthesis:tarotForecast(drawn,body.spread,question),aiText:{uk:null,en:null},remaining:FREE_LIMIT-used-1,limit:FREE_LIMIT,reset:'UTC midnight'};
  });
 }
}
Reflect.defineMetadata('design:paramtypes',[],TarotController.prototype,'deck');
Reflect.defineMetadata('design:paramtypes',[Object],TarotController.prototype,'history');
Reflect.defineMetadata('design:paramtypes',[TarotDrawDto,Object],TarotController.prototype,'draw');
Reflect.defineMetadata('design:paramtypes',[String,TarotAiDto,Object],TarotController.prototype,'interpret');
