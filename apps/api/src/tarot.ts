/** Thin HTTP adapter. Business rules, quotas, persistence and AI live behind use cases. */
import {BadRequestException,Body,Controller,Get,Inject,HttpException,HttpStatus,Post,Req,UnauthorizedException} from '@nestjs/common';
import {ApiProperty,ApiTags} from '@nestjs/swagger';
import {IsBoolean,IsIn,IsOptional,IsString,MaxLength} from 'class-validator';
import type {IncomingMessage} from 'node:http';
import type {Spread} from './tarot-deck.ts';
import {cookieUser,sameOrigin} from './auth.ts';
import {TarotDomainError} from './tarot-domain.ts';
import {TarotUseCases} from './tarot-application.ts';

export const TAROT_USE_CASES='TAROT_USE_CASES';
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
 @Post('readings')
 async draw(@Body()body:TarotDrawDto,@Req()req:IncomingMessage){
  if(!sameOrigin(req))throw new BadRequestException('Cross-origin tarot request blocked');
  const userId=requireUser(req);
  try{return await this.tarot.draw({userId,...body});}
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
