import {BadRequestException,ConflictException,Controller,Delete,Get,Post,Param,Body,Req,Res,Inject,HttpException,HttpStatus,ServiceUnavailableException,UnauthorizedException} from '@nestjs/common';
import {ApiProperty,ApiTags} from '@nestjs/swagger';
import {IsEmail,IsIn,IsOptional,IsString,Length,MaxLength,Matches} from 'class-validator';
import type {IncomingMessage,ServerResponse} from 'node:http';
import {PrismaService} from './prisma.ts';
import {BirthDto} from './dto.ts';
import {authReady,passwordHash,passwordMatches,normalizedEmail,sessionToken,cookieUser,setSession,clearSession,sameOrigin} from './auth.ts';
import {createHourlyLimiter,createKeyedHourlyLimiter} from './ai.ts';
import {runCalculation} from './logic.ts';
import {buildDetailedReport} from './report.ts';

export class CredentialsDto{
 @ApiProperty({type:String,example:'you@example.com'}) @IsEmail() @MaxLength(150) email!:string;
 @ApiProperty({type:String,minLength:12}) @IsString() @Length(12,128) password!:string;
}
export class SaveChartDto extends BirthDto{
 @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) asOf?:string;
 @IsOptional() @IsIn(['uk','en']) language?:'uk'|'en';
 @IsOptional() @IsIn(['local','openrouter','ollama']) aiProvider?:'local'|'openrouter'|'ollama';
 @IsOptional() @IsString() @MaxLength(12000) aiText?:string;
 @IsOptional() @IsString() @MaxLength(120) aiModel?:string;
}
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
const publicUser=(user:{id:string;email:string;role:string;subscriptionTier:'FREE'|'PREMIUM';subscriptionEndsAt:Date|null})=>({
 id:user.id,email:user.email,role:user.role,
 subscription:{
  tier:user.subscriptionTier==='PREMIUM'&&user.subscriptionEndsAt&&user.subscriptionEndsAt.getTime()>Date.now()?'PREMIUM':'FREE',
  currentPeriodEnd:user.subscriptionEndsAt?.toISOString()||null
 }
});

@ApiTags('Accounts')
@Controller('api/v1/account')
export class AccountController{
 constructor(@Inject(PrismaService)private readonly prisma:PrismaService){}

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

 @Get('charts')
 async charts(@Req()req:IncomingMessage){
  const id=currentUser(req);
  const rows=await this.prisma.chart.findMany({where:{ownerId:id},orderBy:{createdAt:'desc'},select:{id:true,createdAt:true,input:true,result:true,savedReport:true},take:100});
  return rows.map(row=>{
   const result=row.result as {ascendant?:{signName?:string};d1?:unknown[]};
   const input=row.input as {date?:string;place?:string};
   const report=row.savedReport as {language?:string}|null;
   return {id:row.id,createdAt:row.createdAt,place:input.place||'',date:input.date||'',ascendant:result.ascendant?.signName||'',hasReport:Boolean(report)};
  });
 }

 @Post('charts')
 async saveChart(@Body()body:SaveChartDto,@Req()req:IncomingMessage){
  checkRequest(req);
  const id=currentUser(req);
  if(!allowSaves())throw new HttpException('Too many saved charts. Try again later.',HttpStatus.TOO_MANY_REQUESTS);
  const count=await this.prisma.chart.count({where:{ownerId:id}});
  if(count>=100)throw new BadRequestException('Your account has reached its 100-chart limit. Delete an old chart first.');
  let chart:Awaited<ReturnType<typeof runCalculation>>;
  try{chart=await runCalculation(body);}
  catch(error){throw new BadRequestException(error instanceof Error?error.message:'Invalid birth data');}
  const language=body.language||'uk';
  const snapshot=buildDetailedReport(chart,language,body.asOf||new Date().toISOString().slice(0,10));
  const ai=body.aiProvider&&body.aiProvider!=='local'&&body.aiText?
   {provider:body.aiProvider,model:body.aiModel||'',text:body.aiText}:
   {provider:'local',text:'',fallbackReason:'local_only'};
  const row=await this.prisma.chart.create({data:{
   ownerId:id,
   input:JSON.parse(JSON.stringify(chart.input)),
   result:JSON.parse(JSON.stringify(chart)),
   savedReport:JSON.parse(JSON.stringify({...snapshot,ai}))
  }});
  return {id:row.id,createdAt:row.createdAt};
 }

 @Get('charts/:id')
 async getChart(@Param('id')chartId:string,@Req()req:IncomingMessage){
  const ownerId=currentUser(req);
  const row=await this.prisma.chart.findFirst({where:{id:chartId,ownerId},select:{id:true,createdAt:true,result:true,savedReport:true}});
  if(!row)throw new UnauthorizedException('This chart is not available in your account.');
  return {id:row.id,createdAt:row.createdAt,chart:{id:row.id,...(row.result as object)},report:row.savedReport};
 }

 @Delete('charts/:id')
 async deleteChart(@Param('id')chartId:string,@Req()req:IncomingMessage){
  checkRequest(req);
  const ownerId=currentUser(req);
  const result=await this.prisma.chart.deleteMany({where:{id:chartId,ownerId}});
  if(!result.count)throw new UnauthorizedException('This chart is not available in your account.');
  return {deleted:true};
 }
}
for(const [method,types]of [
 ['register',[CredentialsDto,Object,Object]],
 ['login',[CredentialsDto,Object,Object]],
 ['me',[Object]],
 ['logout',[Object,Object]],
 ['charts',[Object]],
 ['saveChart',[SaveChartDto,Object]],
 ['getChart',[String,Object]],
 ['deleteChart',[String,Object]]
] as const)Reflect.defineMetadata('design:paramtypes',types,AccountController.prototype,method);
