import {Body,Controller,Get,Post,Patch,Param,Query,Req,Inject,ForbiddenException,UnauthorizedException,ConflictException,BadRequestException,NotFoundException} from '@nestjs/common';
import {ApiTags,ApiProperty} from '@nestjs/swagger';
import {IsIn,IsObject,IsString,IsInt,Min,MaxLength} from 'class-validator';
import type {IncomingMessage} from 'node:http';
import {PrismaService} from './prisma.ts';
import {cookieUser,sameOrigin} from './auth.ts';
import {EDITORIAL_USE_CASES,EditorialUseCases} from './editorial-application.ts';
import {EditorialError,EDITORIAL_TOPICS,type EditorialRole,type EditorialAction} from './editorial-policy.ts';

export class EditorialCreateDto{
 @ApiProperty({type:String,enum:['ACADEMY','YOGA']}) @IsIn(['ACADEMY','YOGA']) kind!: 'ACADEMY'|'YOGA';
 @ApiProperty({type:String}) @IsString() @MaxLength(80) slug!:string;
 @ApiProperty({type:String}) @IsString() topic!:string;
 @ApiProperty({type:Object}) @IsObject() document!:object;
}
export class EditorialEditDto{
 @ApiProperty({type:Number}) @IsInt() @Min(1) expectedRevision!:number;
 @ApiProperty({type:String}) @IsString() topic!:string;
 @ApiProperty({type:Object}) @IsObject() document!:object;
}
export class EditorialTransitionDto{
 @ApiProperty({type:Number}) @IsInt() @Min(1) expectedRevision!:number;
 @ApiProperty({type:String,enum:['submit','approve','reject','publish','archive','reopen']})
 @IsIn(['submit','approve','reject','publish','archive','reopen']) action!:EditorialAction;
}
function handle(err:unknown):never{
 if(err instanceof EditorialError){
  if(err.code==='permission')throw new ForbiddenException(err.message);
  if(err.code==='conflict')throw new ConflictException(err.message);
  if(err.code==='missing')throw new NotFoundException(err.message);
  throw new BadRequestException(err.message);
 }
 throw err;
}
@ApiTags('Editorial')
@Controller('api/v1/editorial')
export class EditorialController{
 constructor(@Inject(PrismaService)private readonly prisma:PrismaService,
  @Inject(EDITORIAL_USE_CASES)private readonly editor:EditorialUseCases){}
 private async staff(req:IncomingMessage):Promise<{id:string;role:EditorialRole}>{
  const id=cookieUser(req);
  if(!id)throw new UnauthorizedException('Sign in required');
  const u=await this.prisma.user.findUnique({where:{id},select:{role:true}});
  if(!u||!['ADMIN','SUPPORT'].includes(u.role))throw new ForbiddenException('Editorial staff role required');
  return {id,role:u.role};
 }
 private writing(req:IncomingMessage){
  if(!sameOrigin(req))throw new ForbiddenException('Cross-origin editorial writes denied');
 }
 @Get('entries')
 async entries(@Req()req:IncomingMessage){const user=await this.staff(req);return this.editor.list(user.role);}
 @Get('entries/:id/history')
 async history(@Param('id')id:string,@Req()req:IncomingMessage){
  const user=await this.staff(req);try{return await this.editor.history(user.role,id);}catch(err){handle(err);}
 }
 @Post('entries')
 async create(@Body()body:EditorialCreateDto,@Req()req:IncomingMessage){
  this.writing(req);const user=await this.staff(req);
  try{return await this.editor.create(user.id,user.role,body.kind,body.slug,body.topic,body.document);}
  catch(err){handle(err);}
 }
 @Patch('entries/:id')
 async edit(@Param('id')id:string,@Body()body:EditorialEditDto,@Req()req:IncomingMessage){
  this.writing(req);const user=await this.staff(req);
  try{return await this.editor.edit(user.id,user.role,id,body.expectedRevision,body.topic,body.document);}
  catch(err){handle(err);}
 }
 @Post('entries/:id/transition')
 async transition(@Param('id')id:string,@Body()body:EditorialTransitionDto,@Req()req:IncomingMessage){
  this.writing(req);const user=await this.staff(req);
  try{return await this.editor.transition(user.id,user.role,id,body.expectedRevision,body.action);}
  catch(err){handle(err);}
 }
}
@ApiTags('Content')
@Controller('api/v1/content')
export class PublicContentController{
 constructor(@Inject(PrismaService)private readonly prisma:PrismaService){}
 @Get()
 async index(@Query('kind')kind?:string){
  if(kind!==undefined&&!['ACADEMY','YOGA'].includes(kind))throw new BadRequestException('Invalid kind');
  const entries=await this.prisma.editorialEntry.findMany({
   where:{status:'PUBLISHED',...(kind?{kind:kind as 'ACADEMY'|'YOGA'}:{})},
   orderBy:{publishedAt:'desc'},take:100,
   select:{slug:true,kind:true,topic:true,document:true,publishedAt:true}
  });
  return entries;
 }
 @Get(':kind/:slug')
 async detail(@Param('kind')kind:string,@Param('slug')slug:string){
  if(!['ACADEMY','YOGA'].includes(kind))throw new NotFoundException();
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>80)throw new NotFoundException();
  const entry=await this.prisma.editorialEntry.findUnique({
   where:{kind_slug:{kind:kind as 'ACADEMY'|'YOGA',slug}},
   select:{status:true,kind:true,slug:true,topic:true,document:true,publishedAt:true}
  });
  if(!entry||entry.status!=='PUBLISHED')throw new NotFoundException();
  return {kind:entry.kind,slug:entry.slug,topic:entry.topic,document:entry.document,publishedAt:entry.publishedAt};
 }
}
/** Tsx runtime metadata for decorated NestJS DTO/controller methods. */
for(const [name,types]of [
 ['entries',[Object]],
 ['history',[String,Object]],
 ['create',[EditorialCreateDto,Object]],
 ['edit',[String,EditorialEditDto,Object]],
 ['transition',[String,EditorialTransitionDto,Object]]
] as const)Reflect.defineMetadata('design:paramtypes',types,EditorialController.prototype,name);
Reflect.defineMetadata('design:paramtypes',[String],PublicContentController.prototype,'index');
Reflect.defineMetadata('design:paramtypes',[String,String],PublicContentController.prototype,'detail');
