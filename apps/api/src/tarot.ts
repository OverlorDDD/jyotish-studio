import {BadRequestException,Body,Controller,Get,Inject,HttpException,HttpStatus,Post,Req,UnauthorizedException} from '@nestjs/common';
import {ApiProperty,ApiTags} from '@nestjs/swagger';
import {IsIn,IsOptional,IsString,MaxLength} from 'class-validator';
import type {IncomingMessage} from 'node:http';
import {PrismaService} from './prisma.ts';
import {cookieUser,sameOrigin} from './auth.ts';
import {drawCards,describeDraws,TAROT_DECK,SPREADS,type Spread} from './tarot-deck.ts';
import {synthesizeTarot} from './tarot-synthesis.ts';

export class TarotDrawDto {
 @ApiProperty({type:String,enum:['one','three','celtic']})
 @IsString() @IsIn(['one','three','celtic']) spread!:Spread;
 @ApiProperty({type:String,required:false,maxLength:600})
 @IsOptional() @IsString() @MaxLength(600) question?:string;
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
    select:{id:true,createdAt:true,spread:true,question:true,cards:true}})
  ]);
  const entries=readings.map(row=>{
   const spread=row.spread as Spread;
   if(!['one','three','celtic'].includes(spread))return null;
   try{return {id:row.id,createdAt:row.createdAt,spread,question:row.question,cards:describeDraws(row.cards as {id:string;position:number;reversed:boolean}[],spread),synthesis:synthesizeTarot(row.cards as {id:string;position:number;reversed:boolean}[],spread,row.question)}}
   catch{return null;}
  }).filter(Boolean);
  return {remaining:Math.max(0,FREE_LIMIT-used),limit:FREE_LIMIT,reset:'UTC midnight',readings:entries};
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
    synthesis:synthesizeTarot(drawn,body.spread,question),remaining:FREE_LIMIT-used-1,limit:FREE_LIMIT,reset:'UTC midnight'};
  });
 }
}
Reflect.defineMetadata('design:paramtypes',[],TarotController.prototype,'deck');
Reflect.defineMetadata('design:paramtypes',[Object],TarotController.prototype,'history');
Reflect.defineMetadata('design:paramtypes',[TarotDrawDto,Object],TarotController.prototype,'draw');
