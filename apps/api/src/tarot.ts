/** Thin HTTP adapter. Business rules, quotas, persistence and AI live behind use cases. */
import {BadRequestException,Body,Controller,Get,Header,Inject,HttpException,HttpStatus,Post,Req,UnauthorizedException} from '@nestjs/common';
import {createHourlyLimiter} from './ai.ts';
import {ApiProperty,ApiTags} from '@nestjs/swagger';
import {IsBoolean,IsIn,IsOptional,IsString,Matches,MaxLength} from 'class-validator';
import type {IncomingMessage} from 'node:http';
import type {Spread} from './tarot-deck.ts';
import {cookieUser,sameOrigin} from './auth.ts';
import {TarotDomainError} from './tarot-domain.ts';
import {TarotUseCases} from './tarot-application.ts';

export const TAROT_USE_CASES='TAROT_USE_CASES';
export const TAROT_SPREAD_IDS=['one','three','celtic','yesno','love','work','week'];
/** Guests: no account, nothing stored. The browser keeps its own 3-a-day counter;
 * this process-wide hourly cap only protects the server from abuse. */
const allowGuestReading=createHourlyLimiter(900);
export class TarotGuestDrawDto {
 @ApiProperty({type:String,enum:TAROT_SPREAD_IDS})
 @IsString() @IsIn(TAROT_SPREAD_IDS) spread!:Spread;
 @ApiProperty({type:String,required:false,maxLength:600})
 @IsOptional() @IsString() @MaxLength(600) question?:string;
}
export class TarotDrawDto {
 @ApiProperty({type:String,enum:TAROT_SPREAD_IDS})
 @IsString() @IsIn(TAROT_SPREAD_IDS) spread!:Spread;
 @ApiProperty({type:String,required:false,maxLength:600})
 @IsOptional() @IsString() @MaxLength(600) question?:string;
 @ApiProperty({type:String,enum:['uk','en'],required:false})
 @IsOptional() @IsIn(['uk','en']) language?:'uk'|'en';
 @ApiProperty({type:Boolean,required:false,description:'Consent to send question and card facts to external AI'})
 @IsOptional() @IsBoolean() aiConsent?:boolean;
}
export class TarotDailyDto {
 @ApiProperty({type:String,description:'Local calendar day YYYY-MM-DD'})
 @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) date!:string;
 @ApiProperty({type:String,maxLength:40})
 @IsString() @MaxLength(40) id!:string;
 @ApiProperty({type:Boolean})
 @IsBoolean() reversed!:boolean;
}
function requireUser(req:IncomingMessage){
 const userId=cookieUser(req);
 if(!userId)throw new UnauthorizedException('Sign in to save and draw your free tarot readings.');
 return userId;
}
@ApiTags('Tarot')
@Controller('api/v1/tarot')
export class TarotController{
 constructor(@Inject(TAROT_USE_CASES)private readonly tarot:TarotUseCases){}
 @Get('deck')
 deck(){return this.tarot.deck();}
 @Get('readings')
 history(@Req()req:IncomingMessage){return this.tarot.history(requireUser(req));}
 @Get('journey') @Header('Cache-Control','private, no-store')
 journey(@Req()req:IncomingMessage){return this.tarot.journey(requireUser(req));}
 @Post('journey/daily')
 async saveDaily(@Body()body:TarotDailyDto,@Req()req:IncomingMessage){
  if(!sameOrigin(req))throw new BadRequestException('Cross-origin tarot request blocked');
  const userId=requireUser(req);
  try{return await this.tarot.saveDaily(userId,{date:body.date,id:body.id,reversed:body.reversed});}
  catch(error){
   if(error instanceof TarotDomainError){
    if(error.code==='account_missing')throw new UnauthorizedException(error.message);
    throw new BadRequestException(error.message);
   }
   throw error;
  }
 }
 @Post('public-readings')
 guestDraw(@Body()body:TarotGuestDrawDto,@Req()req:IncomingMessage){
  if(!sameOrigin(req))throw new BadRequestException('Cross-origin tarot request blocked');
  if(!allowGuestReading())throw new HttpException('Too many guest readings right now',HttpStatus.TOO_MANY_REQUESTS);
  try{return this.tarot.guestDraw({spread:body.spread,question:body.question});}
  catch(error){
   if(error instanceof TarotDomainError)throw new BadRequestException(error.message);
   throw error;
  }
 }
 @Post('readings')
 async draw(@Body()body:TarotDrawDto,@Req()req:IncomingMessage){
  if(!sameOrigin(req))throw new BadRequestException('Cross-origin tarot request blocked');
  const userId=requireUser(req);
  try{return await this.tarot.draw({userId,spread:body.spread,question:body.question,language:body.language,aiConsent:body.aiConsent});}
  catch(error){
   if(error instanceof TarotDomainError){
    if(error.code==='daily_limit')throw new HttpException(error.message,HttpStatus.TOO_MANY_REQUESTS);
    if(error.code==='account_missing')throw new UnauthorizedException(error.message);
    throw new BadRequestException(error.message);
   }
   throw error;
  }
 }
}
// Runtime reflection for tsx (not emitted by esbuild).
Reflect.defineMetadata('design:paramtypes',[],TarotController.prototype,'deck');
Reflect.defineMetadata('design:paramtypes',[Object],TarotController.prototype,'history');
Reflect.defineMetadata('design:paramtypes',[TarotDrawDto,Object],TarotController.prototype,'draw');
Reflect.defineMetadata('design:paramtypes',[TarotGuestDrawDto,Object],TarotController.prototype,'guestDraw');
Reflect.defineMetadata('design:paramtypes',[Object],TarotController.prototype,'journey');
Reflect.defineMetadata('design:paramtypes',[TarotDailyDto,Object],TarotController.prototype,'saveDaily');
