import {BadRequestException,Body,Controller,ForbiddenException,Get,Inject,Param,Patch,Post,Req,UnauthorizedException} from '@nestjs/common';
import {ApiProperty,ApiTags} from '@nestjs/swagger';
import {IsBoolean,IsEmail,IsInt,IsOptional,IsString,Length,Max,Min} from 'class-validator';
import type {IncomingMessage} from 'node:http';
import {PrismaService} from './prisma.ts';
import {cookieUser,sameOrigin} from './auth.ts';

export class CreateExpertDto {
 @ApiProperty({type:String})
 @IsEmail() email!:string;
 @ApiProperty({type:String,minLength:2,maxLength:90})
 @IsString() @Length(2,90) displayName!:string;
 @ApiProperty({type:String,minLength:25,maxLength:3000})
 @IsString() @Length(25,3000) bioUk!:string;
 @ApiProperty({type:String,minLength:25,maxLength:3000})
 @IsString() @Length(25,3000) bioEn!:string;
}
export class ExpertVisibilityDto {
 @ApiProperty({type:Boolean})
 @IsBoolean() isPublished!:boolean;
}
export class ExpertServiceDto {
 @ApiProperty({type:String,minLength:4,maxLength:130})
 @IsString() @Length(4,130) titleUk!:string;
 @ApiProperty({type:String,minLength:4,maxLength:130})
 @IsString() @Length(4,130) titleEn!:string;
 @ApiProperty({type:String,minLength:30,maxLength:3000})
 @IsString() @Length(30,3000) descriptionUk!:string;
 @ApiProperty({type:String,minLength:30,maxLength:3000})
 @IsString() @Length(30,3000) descriptionEn!:string;
 @ApiProperty({type:Number,minimum:100,maximum:10000000})
 @IsInt() @Min(100) @Max(10000000) priceMinor!:number;
 @ApiProperty({type:Number,minimum:1,maximum:90})
 @IsInt() @Min(1) @Max(90) deliveryDays!:number;
}
@ApiTags('Experts')
@Controller('api/v1')
export class ExpertCatalogController {
 constructor(@Inject(PrismaService)private readonly db:PrismaService){}
 private async admin(req:IncomingMessage){
  const id=cookieUser(req);
  if(!id)throw new UnauthorizedException('Login required');
  if(!sameOrigin(req))throw new ForbiddenException('Cross-origin write blocked');
  const user=await this.db.user.findUnique({where:{id},select:{role:true}});
  if(user?.role!=='ADMIN')throw new ForbiddenException('Administrator required');
 }
 @Get('experts')
 async publicCatalog(){
  const profiles=await this.db.expertProfile.findMany({
   where:{isPublished:true,user:{role:'EXPERT'}},
   select:{id:true,displayName:true,bioUk:true,bioEn:true,offers:{where:{isPublished:true},
    select:{id:true,titleUk:true,titleEn:true,descriptionUk:true,descriptionEn:true,priceMinor:true,currency:true,deliveryDays:true}}},
   orderBy:{createdAt:'asc'},take:30
  });
  return {profiles,checkoutAvailable:false};
 }
 @Get('admin/experts')
 async adminCatalog(@Req()req:IncomingMessage){
  await this.admin(req);
  return this.db.expertProfile.findMany({
   orderBy:{createdAt:'desc'},take:100,
   select:{id:true,displayName:true,isPublished:true,bioUk:true,bioEn:true,
    user:{select:{id:true,email:true,role:true}},
    offers:{select:{id:true,titleUk:true,titleEn:true,priceMinor:true,currency:true,deliveryDays:true,isPublished:true}}}
  });
 }
 @Post('admin/experts')
 async createProfile(@Req()req:IncomingMessage,@Body()dto:CreateExpertDto){
  await this.admin(req);
  const user=await this.db.user.findUnique({where:{email:dto.email.trim().toLowerCase()},select:{id:true,role:true}});
  if(user?.role!=='EXPERT')throw new BadRequestException('Grant EXPERT role to this registered account before profile creation');
  const exists=await this.db.expertProfile.findUnique({where:{userId:user.id}});
  if(exists)throw new BadRequestException('This expert already has a profile');
  return this.db.expertProfile.create({data:{userId:user.id,displayName:dto.displayName.trim(),
   bioUk:dto.bioUk.trim(),bioEn:dto.bioEn.trim(),isPublished:false},
   select:{id:true,isPublished:true}});
 }
 @Patch('admin/experts/:id/visibility')
 async profileVisibility(@Req()req:IncomingMessage,@Param('id')id:string,@Body()dto:ExpertVisibilityDto){
  await this.admin(req);
  const current=await this.db.expertProfile.findUnique({where:{id},select:{id:true,user:{select:{role:true}}}});
  if(!current)throw new BadRequestException('Unknown profile');
  if(dto.isPublished&&current.user.role!=='EXPERT')throw new ForbiddenException('Only EXPERT users can be published');
  return this.db.expertProfile.update({where:{id},data:{isPublished:dto.isPublished},select:{id:true,isPublished:true}});
 }
 @Post('admin/experts/:id/offers')
 async createOffer(@Req()req:IncomingMessage,@Param('id')expertId:string,@Body()dto:ExpertServiceDto){
  await this.admin(req);
  const profile=await this.db.expertProfile.findUnique({where:{id:expertId},select:{id:true,user:{select:{role:true}}}});
  if(!profile||profile.user.role!=='EXPERT')throw new BadRequestException('Expert profile not verified');
  return this.db.expertOffering.create({data:{expertId,titleUk:dto.titleUk.trim(),titleEn:dto.titleEn.trim(),
    descriptionUk:dto.descriptionUk.trim(),descriptionEn:dto.descriptionEn.trim(),
    priceMinor:dto.priceMinor,currency:'USD',deliveryDays:dto.deliveryDays,isPublished:false},
    select:{id:true,isPublished:true}});
 }
 @Patch('admin/offers/:id/visibility')
 async offerVisibility(@Req()req:IncomingMessage,@Param('id')id:string,@Body()dto:ExpertVisibilityDto){
  await this.admin(req);
  const offer=await this.db.expertOffering.findUnique({where:{id},select:{id:true,expert:{select:{user:{select:{role:true}}}}}});
  if(!offer)throw new BadRequestException('Unknown offer');
  if(dto.isPublished&&offer.expert.user.role!=='EXPERT')throw new ForbiddenException('Expert role required');
  return this.db.expertOffering.update({where:{id},data:{isPublished:dto.isPublished},select:{id:true,isPublished:true}});
 }
}
Reflect.defineMetadata('design:paramtypes',[],ExpertCatalogController.prototype,'publicCatalog');
Reflect.defineMetadata('design:paramtypes',[Object],ExpertCatalogController.prototype,'adminCatalog');
Reflect.defineMetadata('design:paramtypes',[Object,CreateExpertDto],ExpertCatalogController.prototype,'createProfile');
Reflect.defineMetadata('design:paramtypes',[Object,String,ExpertVisibilityDto],ExpertCatalogController.prototype,'profileVisibility');
Reflect.defineMetadata('design:paramtypes',[Object,String,ExpertServiceDto],ExpertCatalogController.prototype,'createOffer');
Reflect.defineMetadata('design:paramtypes',[Object,String,ExpertVisibilityDto],ExpertCatalogController.prototype,'offerVisibility');
