import {BadRequestException,ConflictException,Controller,Delete,Get,Post,Param,Body,Req,Res,Inject,HttpException,HttpStatus,ServiceUnavailableException,UnauthorizedException} from '@nestjs/common';
import {ApiProperty,ApiTags} from '@nestjs/swagger';
import {IsEmail,IsIn,IsOptional,IsString,Length,MaxLength,Matches,IsUUID} from 'class-validator';
import type {IncomingMessage,ServerResponse} from 'node:http';
import {PrismaService} from './prisma.ts';
import {BirthDto} from './dto.ts';
import {authReady,passwordHash,passwordMatches,normalizedEmail,sessionToken,cookieUser,setSession,clearSession,sameOrigin} from './auth.ts';
import {createHourlyLimiter,createKeyedHourlyLimiter} from './ai.ts';
import {publicUser} from './account-policy.ts';
import {CHART_USE_CASES,SavedChartUseCases,SavedChartError} from './chart-application.ts';

export class CredentialsDto{
 @ApiProperty({type:String,example:'you@example.com'}) @IsEmail() @MaxLength(150) email!:string;
 @ApiProperty({type:String,minLength:12}) @IsString() @Length(12,128) password!:string;
}
export class SaveChartDto extends BirthDto{
 @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) asOf?:string;
 @IsOptional() @IsIn(['uk','en']) language?:'uk'|'en';
 @IsOptional() @IsIn(['local','openrouter','ollama','gemini','groq']) aiProvider?:'local'|'openrouter'|'ollama'|'gemini'|'groq';
 @IsOptional() @IsString() @MaxLength(32000) aiText?:string;
 @IsOptional() @IsString() @MaxLength(120) aiModel?:string;
}
/** Notes never leave Galaxiora; linking requires proof of ownership. */
export class JournalEntryDto{
 @IsIn(['TAROT','JYOTISH','PRACTICE','REFLECTION']) kind!:'TAROT'|'JYOTISH'|'PRACTICE'|'REFLECTION';
 @IsOptional() @IsUUID() sourceId?:string;
 @IsString() @Length(1,120) title!:string;
 @IsString() @Length(1,2000) body!:string;
}
const allowJournalWrites=createKeyedHourlyLimiter(45);
const allowAuthAttempt=createHourlyLimiter(60);
const allowAuthByEmail=createKeyedHourlyLimiter(12);
const allowSaves=createHourlyLimiter(90);
function checkRequest(req:IncomingMessage){
 if(!sameOrigin(req))throw new BadRequestException('Cross-origin account operation blocked');
}
function requireSetup(){
 if(!authReady())throw new ServiceUnavailableException('Registration is not configured yet. Set AUTH_SECRET in the server environment.');
}
function currentUser(req:IncomingMessage){
 const id=cookieUser(req);
 if(!id)throw new UnauthorizedException('Sign in to save and view your personal chart history.');
 return id;
}

@ApiTags('Accounts')
@Controller('api/v1/account')
export class AccountController{
 constructor(@Inject(PrismaService)private readonly prisma:PrismaService,
  @Inject(CHART_USE_CASES)private readonly chartsService:SavedChartUseCases){}

 @Post('register')
 async register(@Body() body:CredentialsDto,@Req() req:IncomingMessage,@Res({passthrough:true})res:ServerResponse){
  checkRequest(req);requireSetup();
  if(!allowAuthAttempt()||!allowAuthByEmail(normalizedEmail(body.email)))throw new HttpException('Too many login or registration attempts. Try again later.',HttpStatus.TOO_MANY_REQUESTS);
  const email=normalizedEmail(body.email);
  if(await this.prisma.user.findUnique({where:{email}}))throw new ConflictException('This email is already registered.');
  const hash=await passwordHash(body.password);
  let user:{id:string;email:string;role:string;subscriptionTier:'FREE'|'PREMIUM';subscriptionEndsAt:Date|null};
  try{user=await this.prisma.user.create({data:{email,passwordHash:hash},select:{id:true,email:true,role:true,subscriptionTier:true,subscriptionEndsAt:true}});}
  catch(error){
   if(typeof error==='object'&&error&&'code' in error&&error.code==='P2002')throw new ConflictException('This email is already registered.');
   throw error;
  }
  setSession(res,req,sessionToken(user.id));
  return {user:publicUser(user)};
 }

 @Post('login')
 async login(@Body() body:CredentialsDto,@Req()req:IncomingMessage,@Res({passthrough:true})res:ServerResponse){
  checkRequest(req);requireSetup();
  if(!allowAuthAttempt()||!allowAuthByEmail(normalizedEmail(body.email)))throw new HttpException('Too many login or registration attempts. Try again later.',HttpStatus.TOO_MANY_REQUESTS);
  const user=await this.prisma.user.findUnique({where:{email:normalizedEmail(body.email)}});
  if(!user||!await passwordMatches(body.password,user.passwordHash))
   throw new UnauthorizedException('Invalid email or password.');
  setSession(res,req,sessionToken(user.id));
  return {user:publicUser(user)};
 }

 @Get('me')
 async me(@Req()req:IncomingMessage){
  const id=cookieUser(req);
  if(!id)return {user:null};
  const user=await this.prisma.user.findUnique({where:{id},select:{id:true,email:true,role:true,subscriptionTier:true,subscriptionEndsAt:true}});
  return {user:user?publicUser(user):null};
 }

 @Post('logout')
 logout(@Req()req:IncomingMessage,@Res({passthrough:true})res:ServerResponse){
  checkRequest(req);
  clearSession(res,req);
  return {user:null};
 }

 @Get('journal')
 async journal(@Req()req:IncomingMessage){
  const userId=currentUser(req);
  return {entries:await this.prisma.personalJournalEntry.findMany({
   where:{userId},orderBy:[{createdAt:'desc'},{id:'desc'}],take:100,
   select:{id:true,kind:true,sourceId:true,title:true,body:true,createdAt:true,updatedAt:true}
  })};
 }
 @Post('journal')
 async addJournal(@Body()body:JournalEntryDto,@Req()req:IncomingMessage){
  checkRequest(req);
  const userId=currentUser(req);
  if(!allowJournalWrites(userId))throw new HttpException('Too many journal updates',HttpStatus.TOO_MANY_REQUESTS);
  const title=body.title?.trim(),content=body.body?.trim();
  if(!title||!content||title.length>120||content.length>2000)throw new BadRequestException('Invalid journal entry');
  if(body.sourceId){
   if(body.kind==='TAROT'){
    const owned=await this.prisma.tarotReading.findFirst({where:{id:body.sourceId,userId},select:{id:true}});
    if(!owned)throw new BadRequestException('Linked tarot reading not found');
   }else if(body.kind==='JYOTISH'){
    const owned=await this.prisma.chart.findFirst({where:{id:body.sourceId,ownerId:userId},select:{id:true}});
    if(!owned)throw new BadRequestException('Linked natal chart not found');
   }else throw new BadRequestException('Only existing Tarot and Jyotish readings may be linked');
  }
  return this.prisma.personalJournalEntry.create({
   data:{userId,kind:body.kind,title,body:content,sourceId:body.sourceId||null},
   select:{id:true,kind:true,sourceId:true,title:true,body:true,createdAt:true,updatedAt:true}
  });
 }
 @Delete('journal/:id')
 async removeJournal(@Param('id')entryId:string,@Req()req:IncomingMessage){
  checkRequest(req);
  const userId=currentUser(req);
  const deleted=await this.prisma.personalJournalEntry.deleteMany({where:{id:entryId,userId}});
  if(deleted.count!==1)throw new UnauthorizedException('Journal entry not found');
  return {deleted:true};
 }
 @Get('charts')
 charts(@Req()req:IncomingMessage){
  return this.chartsService.list(currentUser(req));
 }
 @Post('charts')
 async saveChart(@Body()body:SaveChartDto,@Req()req:IncomingMessage){
  checkRequest(req);
  const ownerId=currentUser(req);
  if(!allowSaves())throw new HttpException('Too many saved charts. Try again later.',HttpStatus.TOO_MANY_REQUESTS);
  try{return await this.chartsService.save(ownerId,body);}
  catch(error){if(error instanceof SavedChartError)throw new BadRequestException(error.message);throw error;}
 }
 @Get('charts/:id')
 async getChart(@Param('id')chartId:string,@Req()req:IncomingMessage){
  try{return await this.chartsService.detail(currentUser(req),chartId);}
  catch(error){if(error instanceof SavedChartError)throw new UnauthorizedException(error.message);throw error;}
 }
 @Delete('charts/:id')
 async deleteChart(@Param('id')chartId:string,@Req()req:IncomingMessage){
  checkRequest(req);
  try{return await this.chartsService.remove(currentUser(req),chartId);}
  catch(error){if(error instanceof SavedChartError)throw new UnauthorizedException(error.message);throw error;}
 }
}
for(const [method,types]of [
 ['register',[CredentialsDto,Object,Object]],
 ['login',[CredentialsDto,Object,Object]],
 ['me',[Object]],
 ['logout',[Object,Object]],
 ['journal',[Object]],
 ['addJournal',[JournalEntryDto,Object]],
 ['removeJournal',[String,Object]],
 ['charts',[Object]],
 ['saveChart',[SaveChartDto,Object]],
 ['getChart',[String,Object]],
 ['deleteChart',[String,Object]]
] as const)Reflect.defineMetadata('design:paramtypes',types,AccountController.prototype,method);
