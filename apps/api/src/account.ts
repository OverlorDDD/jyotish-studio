import {BadRequestException,ConflictException,Controller,Delete,Get,Post,Patch,Header,Query,Param,Body,Req,Res,Inject,HttpException,HttpStatus,ServiceUnavailableException,UnauthorizedException} from '@nestjs/common';
import {ApiProperty,ApiTags} from '@nestjs/swagger';
import {IsEmail,IsIn,IsOptional,IsString,Length,MaxLength,Matches,IsUUID} from 'class-validator';
import type {IncomingMessage,ServerResponse} from 'node:http';
import {PrismaService} from './prisma.ts';
import {BirthDto} from './dto.ts';
import {authReady,passwordHash,passwordMatches,normalizedEmail,sessionToken,cookieUser,setSession,clearSession,sameOrigin} from './auth.ts';
import {createHourlyLimiter,createKeyedHourlyLimiter} from './ai.ts';
import {publicUser} from './account-policy.ts';
import {authAttemptCeiling} from './auth-limit-policy.ts';
import {registrationReady,registrationExpiryMs,registrationCooldownMs,registrationCode,registrationCodeDigest,secureCodeMatches,verifySignupTurnstile,sendSignupVerification,parseRegistrationRequest,parseVerifyRegistrationRequest,parseLoginRequest} from './registration-security.ts';
import {CHART_USE_CASES,SavedChartUseCases,SavedChartError} from './chart-application.ts';

export class CredentialsDto{
 @ApiProperty({type:String,example:'you@example.com'}) @IsEmail() @MaxLength(150) email!:string;
 @ApiProperty({type:String,minLength:12}) @IsString() @Length(12,128) password!:string;
}
export class RegistrationDto extends CredentialsDto{
 @IsString() @MaxLength(2048) turnstileToken!:string;
}
export class VerifyRegistrationDto {
 @IsEmail() @MaxLength(150) email!:string;
 @IsString() @Matches(/^[0-9]{6}$/) code!:string;
}
// Registration/login bodies are validated explicitly at runtime because tsx/esbuild
// does not emit the design:paramtypes metadata required by ValidationPipe.
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
export class JournalEditDto {
 @IsOptional() @IsString() @Length(1,120) title?:string;
 @IsOptional() @IsString() @Length(1,2000) body?:string;
}
const allowJournalWrites=createKeyedHourlyLimiter(45);
const allowAuthAttempt=createHourlyLimiter(authAttemptCeiling(process.env));
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
 async register(@Body() untrusted:unknown,@Req() req:IncomingMessage){
  checkRequest(req);requireSetup();
  const body=parseRegistrationRequest(untrusted);
  if(!registrationReady())throw new ServiceUnavailableException('Public signup requires verified email and anti-bot setup');
  const email=normalizedEmail(body.email);
  if(!allowAuthAttempt()||!allowAuthByEmail(email))
   throw new HttpException('Too many attempts. Try again later.',HttpStatus.TOO_MANY_REQUESTS);
  if(await this.prisma.user.findUnique({where:{email},select:{id:true}}))
   throw new ConflictException('This email is already registered.');
  const prior=await this.prisma.pendingRegistration.findUnique({where:{email}});
  if(prior&&prior.sentAt.getTime()+registrationCooldownMs>Date.now())
   throw new HttpException('Please wait before requesting another email.',HttpStatus.TOO_MANY_REQUESTS);
  await verifySignupTurnstile(body.turnstileToken);
  const code=registrationCode(),digest=registrationCodeDigest(email,code);
  const now=new Date(),password=await passwordHash(body.password);
  await this.prisma.pendingRegistration.upsert({where:{email},
   create:{email,passwordHash:password,codeDigest:digest,
    sentAt:now,expiresAt:new Date(now.getTime()+registrationExpiryMs),attempts:0},
   update:{passwordHash:password,codeDigest:digest,
    sentAt:now,expiresAt:new Date(now.getTime()+registrationExpiryMs),attempts:0}
  });
  try{await sendSignupVerification(email,code)}
  catch(error){
   await this.prisma.pendingRegistration.deleteMany({where:{email,codeDigest:digest}}).catch(()=>{});
   throw error;
  }
  // Critically: no session, no User row, and no user privileges before email proof.
  return {verificationRequired:true,expiresInSeconds:900};
 }

 @Post('register/verify')
 async verifyRegistration(@Body() untrusted:unknown,
  @Req() req:IncomingMessage,@Res({passthrough:true})res:ServerResponse){
  checkRequest(req);requireSetup();
  const body=parseVerifyRegistrationRequest(untrusted);
  if(!registrationReady())throw new ServiceUnavailableException('Registration verification is unavailable');
  const email=normalizedEmail(body.email);
  if(!allowAuthAttempt()||!allowAuthByEmail(email))
   throw new HttpException('Too many attempts. Try again later.',HttpStatus.TOO_MANY_REQUESTS);
  const now=new Date();
  // Database-enforced attempt ceiling persists across service restarts.
  const claimed=await this.prisma.pendingRegistration.updateMany({
   where:{email,expiresAt:{gt:now},attempts:{lt:5}},
   data:{attempts:{increment:1}}
  });
  if(claimed.count!==1)throw new BadRequestException('Invalid or expired verification code');
  const pending=await this.prisma.pendingRegistration.findUnique({where:{email}});
  if(!pending||!secureCodeMatches(pending.codeDigest,registrationCodeDigest(email,body.code)))
   throw new BadRequestException('Invalid or expired verification code');
  let user:{id:string;email:string;role:string;subscriptionTier:'FREE'|'PREMIUM';subscriptionEndsAt:Date|null};
  try{
   user=await this.prisma.$transaction(async tx=>{
    const consumed=await tx.pendingRegistration.deleteMany({
     where:{email,codeDigest:pending.codeDigest,expiresAt:{gt:now},attempts:{lte:5}}
    });
    if(consumed.count!==1)throw new BadRequestException('Invalid or expired verification code');
    return tx.user.create({data:{email,passwordHash:pending.passwordHash},
     select:{id:true,email:true,role:true,subscriptionTier:true,subscriptionEndsAt:true}});
   });
  }catch(error){
   if(typeof error==='object'&&error&&'code' in error&&error.code==='P2002')
    throw new ConflictException('This email is already registered.');
   throw error;
  }
  setSession(res,req,sessionToken(user.id));
  return {user:publicUser(user)};
 }

 @Post('login')
 async login(@Body() untrusted:unknown,@Req()req:IncomingMessage,@Res({passthrough:true})res:ServerResponse){
  checkRequest(req);requireSetup();
  const body=parseLoginRequest(untrusted);
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
 @Get('journal/pages')
 @Header('Cache-Control','private, no-store')
 async journalPages(@Req()req:IncomingMessage,@Query('cursor')cursor?:string,@Query('kind')kind?:string){
  const userId=currentUser(req);
  if(cursor&&!/^[a-z0-9-]{10,60}$/i.test(cursor))throw new BadRequestException('Invalid journal cursor');
  if(kind&&!['TAROT','JYOTISH','PRACTICE','REFLECTION'].includes(kind))throw new BadRequestException('Invalid journal category');
  if(cursor){
   const owned=await this.prisma.personalJournalEntry.findFirst({where:{id:cursor,userId},select:{id:true}});
   if(!owned)throw new UnauthorizedException('Journal cursor not in your account');
  }
  const rows=await this.prisma.personalJournalEntry.findMany({
   where:{userId,...(kind?{kind}:{})},orderBy:[{createdAt:'desc'},{id:'desc'}],take:51,
   ...(cursor?{cursor:{id:cursor},skip:1}:{}),
   select:{id:true,kind:true,sourceId:true,title:true,body:true,createdAt:true,updatedAt:true}
  });
  const entries=rows.slice(0,50);
  return {entries,nextCursor:rows.length>50?entries[entries.length-1]?.id:null};
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
 @Patch('journal/:id')
 @Header('Cache-Control','private, no-store')
 async updateJournal(@Param('id')entryId:string,@Body()body:JournalEditDto,@Req()req:IncomingMessage){
  checkRequest(req);const userId=currentUser(req);
  if(!allowJournalWrites(userId))throw new HttpException('Too many journal updates',HttpStatus.TOO_MANY_REQUESTS);
  const title=body.title?.trim(),text=body.body?.trim();
  if(title===undefined&&text===undefined)throw new BadRequestException('Provide title or body');
  if(title!==undefined&&!title)throw new BadRequestException('Empty title');
  if(text!==undefined&&!text)throw new BadRequestException('Empty body');
  const updated=await this.prisma.personalJournalEntry.updateMany({
   where:{id:entryId,userId},data:{...(title!==undefined?{title}:{}),...(text!==undefined?{body:text}:{})}
  });
  if(updated.count!==1)throw new UnauthorizedException('Entry not in your account');
  return this.prisma.personalJournalEntry.findFirst({where:{id:entryId,userId},
   select:{id:true,kind:true,sourceId:true,title:true,body:true,createdAt:true,updatedAt:true}});
 }
 @Get('journal/export')
 @Header('Cache-Control','private, no-store')
 async exportJournal(@Req()req:IncomingMessage,@Query('cursor')cursor?:string){
  const userId=currentUser(req);
  if(cursor&&!/^[a-z0-9-]{10,60}$/i.test(cursor))throw new BadRequestException('Invalid cursor');
  if(cursor){
   const ownCursor=await this.prisma.personalJournalEntry.findFirst({where:{id:cursor,userId},select:{id:true}});
   if(!ownCursor)throw new UnauthorizedException('Invalid journal export cursor');
  }
  const page=await this.prisma.personalJournalEntry.findMany({
   where:{userId},orderBy:[{createdAt:'asc'},{id:'asc'}],take:501,
   ...(cursor?{cursor:{id:cursor},skip:1}:{}),
   select:{id:true,kind:true,sourceId:true,title:true,body:true,createdAt:true,updatedAt:true}
  });
  const entries=page.slice(0,500);
  return {format:'galaxiora-journal-v1',entries,nextCursor:page.length>500?entries[entries.length-1]?.id:null};
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
 ['journalPages',[Object,String,String]],
 ['updateJournal',[String,JournalEditDto,Object]],
 ['exportJournal',[Object,String]],
 ['addJournal',[JournalEntryDto,Object]],
 ['removeJournal',[String,Object]],
 ['charts',[Object]],
 ['saveChart',[SaveChartDto,Object]],
 ['getChart',[String,Object]],
 ['deleteChart',[String,Object]]
] as const)Reflect.defineMetadata('design:paramtypes',types,AccountController.prototype,method);
