import {BadRequestException,Body,Controller,ForbiddenException,Get,Inject,Param,Post,Req,UnauthorizedException,ConflictException,NotFoundException} from '@nestjs/common';
import {ApiProperty,ApiTags} from '@nestjs/swagger';
import {IsArray,IsBoolean,IsInt,IsIn,IsString,Min} from 'class-validator';
import type {IncomingMessage} from 'node:http';
import {PrismaService} from './prisma.ts';
import {cookieUser,sameOrigin} from './auth.ts';
import {validateExpertApplication,reviewExpert,ExpertProfileError} from './expert-policy.ts';

class ExpertApplicationDto{
 @ApiProperty({type:String}) @IsString() displayName!:string;
 @ApiProperty({type:String}) @IsString() bioUk!:string;
 @ApiProperty({type:String}) @IsString() bioEn!:string;
 @ApiProperty({type:[String],enum:['jyotish','tarot','yoga','meditation'],isArray:true})
 @IsArray() @IsIn(['jyotish','tarot','yoga','meditation'],{each:true}) specialties!:string[];
 @ApiProperty({type:Boolean}) @IsBoolean() consent!:boolean;
}
class ExpertReviewDto{
 @ApiProperty({type:String,enum:['verify','reject','suspend']}) @IsIn(['verify','reject','suspend']) action!:'verify'|'reject'|'suspend';
 @ApiProperty({type:Number}) @IsInt() @Min(1) expectedRevision!:number;
}
const safe=(row:{id:string;displayName:string;bioUk:string;bioEn:string;specialties:string[]})=>({
 id:row.id,displayName:row.displayName,bioUk:row.bioUk,bioEn:row.bioEn,specialties:row.specialties});
function report(e:unknown):never{
 if(e instanceof ExpertProfileError){
  if(e.code==='permission')throw new ForbiddenException(e.message);
  if(e.code==='conflict')throw new ConflictException(e.message);
  throw new BadRequestException(e.message);
 }
 throw e;
}
@ApiTags('Experts')
@Controller('api/v1/experts')
export class ExpertsController{
 constructor(@Inject(PrismaService)private readonly prisma:PrismaService){}
 private id(req:IncomingMessage){const id=cookieUser(req);if(!id)throw new UnauthorizedException('Sign in required');return id;}
 private write(req:IncomingMessage){if(!sameOrigin(req))throw new ForbiddenException('Cross-origin operation blocked');}
 @Get()
 async publicCatalog(){
  const profiles=await this.prisma.expertProfile.findMany({where:{reviewStatus:'VERIFIED',user:{role:'EXPERT'}},
   take:50,orderBy:{reviewedAt:'desc'},select:{id:true,displayName:true,bioUk:true,bioEn:true,specialties:true}});
  return {profiles:profiles.map(safe),bookingsEnabled:false};
 }
 @Get('me')
 async mine(@Req()req:IncomingMessage){
  const id=this.id(req);
  return this.prisma.expertProfile.findUnique({where:{userId:id},select:{
   id:true,displayName:true,bioUk:true,bioEn:true,specialties:true,reviewStatus:true,
   revision:true,createdAt:true,updatedAt:true}}); 
 }
 @Post('apply')
 async apply(@Req()req:IncomingMessage,@Body()body:ExpertApplicationDto){
  this.write(req);
  const id=this.id(req),user=await this.prisma.user.findUnique({where:{id},select:{role:true}});
  if(user?.role!=='EXPERT')throw new ForbiddenException('Expert role is required before applying');
  let input:ReturnType<typeof validateExpertApplication>;
  try{input=validateExpertApplication(body);}catch(e){report(e);}
  try{
   const existing=await this.prisma.expertProfile.findUnique({where:{userId:id},select:{revision:true,reviewStatus:true}});
   if(!existing){
    try{return await this.prisma.expertProfile.create({data:{userId:id,...input,consentAt:new Date()},
     select:{id:true,reviewStatus:true,revision:true}});}
    catch(e){if((e as {code?:string}).code==='P2002')throw new ConflictException('Application already exists');throw e;}
   }
   if(existing.reviewStatus!=='REJECTED'&&existing.reviewStatus!=='SUSPENDED')
    throw new ConflictException('Current application cannot be replaced while pending or verified');
   const update=await this.prisma.expertProfile.updateMany({where:{userId:id,revision:existing.revision,
     reviewStatus:{in:['REJECTED','SUSPENDED']}},
    data:{...input,reviewStatus:'SUBMITTED',revision:{increment:1},consentAt:new Date(),reviewedAt:null,reviewerId:null}});
   if(update.count!==1)throw new ConflictException('Application changed; refresh');
   return this.prisma.expertProfile.findUnique({where:{userId:id},select:{id:true,reviewStatus:true,revision:true}});
  }catch(e){report(e);}
 }
 @Get('admin/applications')
 async adminList(@Req()req:IncomingMessage){
  const id=this.id(req),user=await this.prisma.user.findUnique({where:{id},select:{role:true}});
  if(user?.role!=='ADMIN')throw new ForbiddenException('ADMIN required');
  return this.prisma.expertProfile.findMany({take:100,orderBy:{updatedAt:'desc'},
   select:{id:true,userId:true,displayName:true,bioUk:true,bioEn:true,specialties:true,
    reviewStatus:true,revision:true,updatedAt:true,user:{select:{email:true,role:true}}}});
 }
 @Post('admin/applications/:id/review')
 async review(@Param('id')id:string,@Req()req:IncomingMessage,@Body()body:ExpertReviewDto){
  this.write(req);
  const reviewer=this.id(req),admin=await this.prisma.user.findUnique({where:{id:reviewer},select:{role:true}});
  if(admin?.role!=='ADMIN')throw new ForbiddenException('ADMIN required');
  const current=await this.prisma.expertProfile.findUnique({where:{id},select:{userId:true,reviewStatus:true,revision:true}});
  if(!current)throw new NotFoundException('Application not found');
  if(current.userId===reviewer)throw new ForbiddenException('Cannot verify your own profile');
  if(current.revision!==body.expectedRevision)throw new ConflictException('Outdated review');
  let next:string;
  try{next=reviewExpert(admin.role,body.action,current.reviewStatus);}catch(e){report(e);}
  const changed=await this.prisma.expertProfile.updateMany({where:{id,revision:current.revision,reviewStatus:current.reviewStatus},
   data:{reviewStatus:next as 'SUBMITTED'|'VERIFIED'|'REJECTED'|'SUSPENDED',
    reviewerId:reviewer,reviewedAt:new Date(),revision:{increment:1}}});
  if(changed.count!==1)throw new ConflictException('Another review changed this application');
  return {status:next,approved:next==='VERIFIED'};
 }
}
for(const [name,types] of [
 ['publicCatalog',[]],['mine',[Object]],['apply',[Object,ExpertApplicationDto]],
 ['adminList',[Object]],['review',[String,Object,ExpertReviewDto]]
] as const)Reflect.defineMetadata('design:paramtypes',types,ExpertsController.prototype,name);
