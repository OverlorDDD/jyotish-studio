/** A9.2 small private continuity API. No AI transport and no anonymous storage. */
import {
 BadRequestException,Body,Controller,Delete,Get,HttpException,HttpStatus,Param,Post,Put,Req,UnauthorizedException,
} from '@nestjs/common';
import {ApiProperty,ApiTags} from '@nestjs/swagger';
import {IsIn,IsString,Length,MaxLength} from 'class-validator';
import type {IncomingMessage} from 'node:http';
import {PrismaService} from './prisma.ts';
import {cookieUser,sameOrigin} from './auth.ts';

export const PRACTICE_SLUGS=['gentle-breath','desk-mobility','five-senses','evening-unwind'] as const;
export type JournalKind='TAROT'|'CHART'|'PRACTICE';
export const JOURNAL_KINDS=['TAROT','CHART','PRACTICE'] as const;
const MAX_ENTRIES=60;
const MAX_COMPLETIONS=60;

export class JournalNoteDto {
 @ApiProperty({enum:JOURNAL_KINDS}) @IsString() @IsIn(JOURNAL_KINDS) kind!:JournalKind;
 @ApiProperty({maxLength:120}) @IsString() @Length(1,120) referenceId!:string;
 @ApiProperty({minLength:1,maxLength:2000}) @IsString() @Length(1,2000) note!:string;
}
export class PracticeCompleteDto {
 @ApiProperty({enum:PRACTICE_SLUGS}) @IsString() @IsIn(PRACTICE_SLUGS) practiceSlug!:string;
}
export function journalText(value:string){
 const result=value.trim();
 if(!result||result.length>2000)throw new BadRequestException('A journal note must contain 1–2000 characters.');
 return result;
}
function signedIn(req:IncomingMessage){
 const id=cookieUser(req);
 if(!id)throw new UnauthorizedException('Sign in to use your private journal.');
 return id;
}
function ensureOrigin(req:IncomingMessage){
 if(!sameOrigin(req))throw new BadRequestException('Cross-origin private journal request rejected.');
}
/** An arbitrary UUID from another user must never be used to create cross-account references. */
export async function canLinkJournal(prisma:PrismaService,userId:string,kind:JournalKind,ref:string){
 if(kind==='PRACTICE')return (PRACTICE_SLUGS as readonly string[]).includes(ref);
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref))return false;
 if(kind==='TAROT')return (await prisma.tarotReading.count({where:{id:ref,userId}}))===1;
 if(kind==='CHART')return (await prisma.chart.count({where:{id:ref,ownerId:userId}}))===1;
 return false;
}

@ApiTags('Personal Journal')
@Controller('api/v1/personal')
export class PersonalJournalController{
 constructor(private readonly prisma:PrismaService){}
 @Get('journal')
 list(@Req()req:IncomingMessage){
  const ownerId=signedIn(req);
  return this.prisma.personalJournalEntry.findMany({
   where:{ownerId},select:{id:true,kind:true,referenceId:true,note:true,createdAt:true,updatedAt:true},
   orderBy:{updatedAt:'desc'},take:MAX_ENTRIES
  });
 }
 @Put('journal')
 async upsert(@Body()body:JournalNoteDto,@Req()req:IncomingMessage){
  ensureOrigin(req);const ownerId=signedIn(req);
  if(!JOURNAL_KINDS.includes(body.kind)||typeof body.referenceId!=='string'||body.referenceId.length>120)
   throw new BadRequestException('Unknown journal reference.');
  const note=journalText(body.note);
  if(!await canLinkJournal(this.prisma,ownerId,body.kind,body.referenceId))
   throw new BadRequestException('Unknown or inaccessible journal reference.');
  const existing=await this.prisma.personalJournalEntry.count({where:{ownerId}});
  const match=await this.prisma.personalJournalEntry.findUnique({
   where:{ownerId_kind_referenceId:{ownerId,kind:body.kind,referenceId:body.referenceId}},select:{id:true}
  });
  if(!match&&existing>=MAX_ENTRIES)throw new HttpException('Journal limit reached. Delete an older note first.',HttpStatus.TOO_MANY_REQUESTS);
  return this.prisma.personalJournalEntry.upsert({
   where:{ownerId_kind_referenceId:{ownerId,kind:body.kind,referenceId:body.referenceId}},
   create:{ownerId,kind:body.kind,referenceId:body.referenceId,note},
   update:{note},
   select:{id:true,kind:true,referenceId:true,note:true,createdAt:true,updatedAt:true}
  });
 }
 @Delete('journal/:id')
 async remove(@Param('id')id:string,@Req()req:IncomingMessage){
  ensureOrigin(req);const ownerId=signedIn(req);
  const deleted=await this.prisma.personalJournalEntry.deleteMany({where:{id,ownerId}});
  return {deleted:deleted.count===1};
 }
 @Get('practices')
 practices(@Req()req:IncomingMessage){
  const userId=signedIn(req);
  return this.prisma.practiceCompletion.findMany({
   where:{userId},select:{id:true,practiceSlug:true,completedAt:true},
   orderBy:{completedAt:'desc'},take:MAX_COMPLETIONS
  });
 }
 @Post('practices')
 async complete(@Body()body:PracticeCompleteDto,@Req()req:IncomingMessage){
  ensureOrigin(req);const userId=signedIn(req);
  if(!(PRACTICE_SLUGS as readonly string[]).includes(body.practiceSlug))
   throw new BadRequestException('Unknown practice.');
  const latest=await this.prisma.practiceCompletion.findFirst({
   where:{userId,practiceSlug:body.practiceSlug},orderBy:{completedAt:'desc'},select:{completedAt:true}
  });
  // Explicit completion is idempotent for quick repeated clicks/retries.
  if(latest&&Date.now()-latest.completedAt.getTime()<30000)return {idempotent:true,completedAt:latest.completedAt};
  const entry=await this.prisma.practiceCompletion.create({data:{userId,practiceSlug:body.practiceSlug},
   select:{id:true,practiceSlug:true,completedAt:true}});
  return {...entry,idempotent:false};
 }
}
Reflect.defineMetadata('design:paramtypes',[Object],PersonalJournalController.prototype,'list');
Reflect.defineMetadata('design:paramtypes',[JournalNoteDto,Object],PersonalJournalController.prototype,'upsert');
Reflect.defineMetadata('design:paramtypes',[String,Object],PersonalJournalController.prototype,'remove');
Reflect.defineMetadata('design:paramtypes',[Object],PersonalJournalController.prototype,'practices');
Reflect.defineMetadata('design:paramtypes',[PracticeCompleteDto,Object],PersonalJournalController.prototype,'complete');
