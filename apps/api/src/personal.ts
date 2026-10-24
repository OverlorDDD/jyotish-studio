import {BadRequestException,Body,ConflictException,Controller,Delete,Get,Header,Inject,Patch,Post,Put,Query,Req,UnauthorizedException} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {ArrayMaxSize,IsArray,IsIn,IsInt,IsOptional,IsString,IsUUID,Max,Min} from 'class-validator';
import type {IncomingMessage} from 'node:http';
import {PrismaService} from './prisma.ts';
import {cookieUser,sameOrigin} from './auth.ts';
import {createKeyedHourlyLimiter} from './ai.ts';
import {calendarDays,dailyTransit,localToday,validLocalDay,validTimeZone} from './personal-transits.ts';

type ChartResult={verification?:{status?:string};ascendant?:{sign?:number;signName?:string};
 d1?:{name:string;sign:number}[];dasha?:{lord:string;start:string;end:string;antardashas?:{lord:string;start:string;end:string}[]}[]};
const TOPICS=['astronomy','jyotish','tarot','yoga','vedic-traditions','academy'] as const;
const PRACTICES=['box','equal','extended'] as const;
const calendarLimiter=createKeyedHourlyLimiter(20);
function owner(req:IncomingMessage){const id=cookieUser(req);if(!id)throw new UnauthorizedException('Sign in to your Personal space');return id;}
function mutation(req:IncomingMessage){if(!sameOrigin(req))throw new BadRequestException('Cross-origin personal update denied');return owner(req);}
function chartFacts(row:{id:string;createdAt:Date;input:unknown;result:unknown}|null){
 if(!row)return null;
 const result=row.result as ChartResult;
 const verified=result?.verification?.status==='verified_internal';
 const input=(row.input||{}) as {date?:string;place?:string};
 const moon=Array.isArray(result?.d1)?result.d1.find(x=>x.name==='Moon'):null;
 const asc=result?.ascendant;
 return {id:row.id,createdAt:row.createdAt,date:input.date||'',place:input.place||'',
  verified,lagnaSign:verified&&Number.isInteger(asc?.sign)?asc!.sign:null,
  lagnaName:asc?.signName||'',moonSign:verified&&Number.isInteger(moon?.sign)?moon!.sign:null,
  dasha:verified&&Array.isArray(result?.dasha)?result.dasha:[]};
}
export class PersonalProfileDto{
 @IsOptional() @IsString() currentTimeZone?:string;
 @IsOptional() @IsIn(['uk','en']) preferredLocale?:'uk'|'en';
 @IsOptional() @IsArray() @ArrayMaxSize(6) @IsIn(TOPICS,{each:true}) newsTopics?:string[];
}
export class PrimaryChartDto{
 @IsOptional() @IsUUID() chartId?:string|null;
}
export class CompletedPracticeDto{
 @IsUUID() eventId!:string;
 @IsIn(PRACTICES) practiceId!:'box'|'equal'|'extended';
 @IsInt() @Min(20) @Max(3600) durationSeconds!:number;
}
@ApiTags('Galaxiora Personal')
@Controller('api/v1/personal')
export class PersonalController{
 constructor(@Inject(PrismaService)private readonly prisma:PrismaService){}
 private async profile(uid:string){
  const [record,rows]=await Promise.all([
   this.prisma.personalProfile.findUnique({where:{userId:uid}}),
   this.prisma.chart.findMany({where:{ownerId:uid},select:{id:true,createdAt:true,input:true,result:true},orderBy:{createdAt:'desc'},take:100})
  ]);
  const charts=rows.map(chartFacts).filter((x):x is NonNullable<typeof x>=>Boolean(x));
  const selected=charts.find(x=>x.id===record?.primaryChartId)||null;
  return {profile:{primaryChartId:selected?.id||null,currentTimeZone:record?.currentTimeZone||'UTC',
   preferredLocale:record?.preferredLocale||'uk',newsTopics:record?.newsTopics||[]},
   charts:charts.map(({dasha,...c})=>c),suggestedChartId:!record?.primaryChartId&&charts.length===1?charts[0].id:null,
   selected,staleSelectedChart:Boolean(record?.primaryChartId&&!selected)};
 }
 @Get('profile') @Header('Cache-Control','private, no-store')
 async getProfile(@Req()req:IncomingMessage){return this.profile(owner(req));}
 @Patch('profile') @Header('Cache-Control','private, no-store')
 async updateProfile(@Req()req:IncomingMessage,@Body()dto:PersonalProfileDto){
  const uid=mutation(req);
  if(dto.currentTimeZone!==undefined&&!validTimeZone(dto.currentTimeZone))throw new BadRequestException('Use a valid IANA time zone');
  if(dto.newsTopics&&new Set(dto.newsTopics).size!==dto.newsTopics.length)throw new BadRequestException('Duplicate news interests');
  const fields={...(dto.currentTimeZone!==undefined?{currentTimeZone:dto.currentTimeZone}:{}),
   ...(dto.preferredLocale!==undefined?{preferredLocale:dto.preferredLocale}:{}),
   ...(dto.newsTopics!==undefined?{newsTopics:dto.newsTopics}:{})};
  await this.prisma.personalProfile.upsert({where:{userId:uid},create:{userId:uid,...fields},update:fields});
  return this.profile(uid);
 }
 @Put('primary-chart') @Header('Cache-Control','private, no-store')
 async setPrimaryChart(@Req()req:IncomingMessage,@Body()body:PrimaryChartDto){
  const uid=mutation(req),id=body.chartId??null;
  if(id!==null&&typeof id!=='string')throw new BadRequestException('Invalid natal chart identifier');
  await this.prisma.$transaction(async tx=>{
   if(id){
    const owned=await tx.chart.findFirst({where:{id,ownerId:uid},select:{id:true}});
    if(!owned)throw new BadRequestException('Choose a saved natal chart that belongs to your account');
   }
   await tx.personalProfile.upsert({where:{userId:uid},create:{userId:uid,primaryChartId:id},update:{primaryChartId:id}});
  });
  return this.profile(uid);
 }
 @Get('overview') @Header('Cache-Control','private, no-store')
 async overview(@Req()req:IncomingMessage){
  const uid=owner(req),profile=await this.profile(uid);
  const [tarot,journal,questions,practices]=await Promise.all([
   this.prisma.tarotReading.findMany({where:{userId:uid},orderBy:{createdAt:'desc'},take:3,
    select:{id:true,createdAt:true,spread:true,question:true,cards:true}}),
   this.prisma.personalJournalEntry.findMany({where:{userId:uid},orderBy:{createdAt:'desc'},take:3,
    select:{id:true,kind:true,title:true,createdAt:true}}),
   this.prisma.tarotQuestion.count({where:{userId:uid}}),
   this.prisma.personalPracticeSession.findMany({where:{userId:uid},orderBy:{completedAt:'desc'},take:5,
    select:{id:true,practiceId:true,durationSeconds:true,completedAt:true}})
  ]);
  const today=localToday(profile.profile.currentTimeZone);
  const chart=profile.selected;
  const active=chart?.verified?chart.dasha.find(d=>Date.parse(d.start)<=Date.now()&&Date.now()<Date.parse(d.end)):null;
  const sub=active?.antardashas?.find(x=>Date.parse(x.start)<=Date.now()&&Date.now()<Date.parse(x.end));
  let transit:null|Awaited<ReturnType<typeof dailyTransit>>=null;
  let transitStatus:'available'|'no_verified_chart'|'ephemeris_unavailable'='no_verified_chart';
  if(chart?.verified&&chart.lagnaSign&&chart.moonSign){
   try{transit=await dailyTransit(today,profile.profile.currentTimeZone,chart.lagnaSign,chart.moonSign);transitStatus='available';}
   catch{transitStatus='ephemeris_unavailable';}
  }
  return {...profile,today,activeDasha:active?{lord:active.lord,start:active.start,end:active.end,antardasha:sub||null}:null,
   transit,transitStatus,recentTarot:tarot,recentJournal:journal,privateQuestions:questions,
   recentPractices:practices,horoscope:{status:'planned_after_launch',personal:true},
   news:{status:'planned_after_launch',topics:profile.profile.newsTopics,usesPrivateJournal:false}};
 }
 @Get('transits') @Header('Cache-Control','private, no-store')
 async transits(@Req()req:IncomingMessage,@Query('date')date?:string){
  const uid=owner(req),p=await this.profile(uid),c=p.selected;
  if(!c?.verified||!c.lagnaSign||!c.moonSign)return {status:'no_verified_chart',transit:null};
  const day=date||localToday(p.profile.currentTimeZone);
  if(!validLocalDay(day))throw new BadRequestException('Invalid YYYY-MM-DD');
  return {status:'available',transit:await dailyTransit(day,p.profile.currentTimeZone,c.lagnaSign,c.moonSign)};
 }
 @Get('calendar') @Header('Cache-Control','private, no-store')
 async calendar(@Req()req:IncomingMessage,@Query('days')days='7',@Query('from')from?:string){
  const uid=owner(req);
  if(!['7','30'].includes(days))throw new BadRequestException('Use 7 or 30 days');
  if(!calendarLimiter(uid))throw new BadRequestException('Too many calendar requests');
  const p=await this.profile(uid),c=p.selected;
  const start=from||localToday(p.profile.currentTimeZone);
  if(!validLocalDay(start))throw new BadRequestException('Invalid YYYY-MM-DD');
  const dates=calendarDays(start,days==='30'?30:7);
  if(!c?.verified||!c.lagnaSign||!c.moonSign)return {status:'no_verified_chart',dates,days:[],method:null};
  const out:Awaited<ReturnType<typeof dailyTransit>>[]=[];
  for(let i=0;i<dates.length;i+=3){
   out.push(...await Promise.all(dates.slice(i,i+3).map(day=>dailyTransit(day,p.profile.currentTimeZone,c.lagnaSign!,c.moonSign!))));
  }
  return {status:'available',dates,days:out,method:out[0]?.method};
 }
 @Get('practices') @Header('Cache-Control','private, no-store')
 async practices(@Req()req:IncomingMessage){
  return this.prisma.personalPracticeSession.findMany({where:{userId:owner(req)},orderBy:{completedAt:'desc'},take:100,
   select:{id:true,eventId:true,practiceId:true,durationSeconds:true,completedAt:true}});
 }
 @Post('practices') @Header('Cache-Control','private, no-store')
 async completedPractice(@Req()req:IncomingMessage,@Body()body:CompletedPracticeDto){
  const uid=mutation(req);
  const previous=await this.prisma.personalPracticeSession.findUnique({where:{eventId:body.eventId}});
  if(previous){if(previous.userId!==uid)throw new ConflictException('Completion identifier already in use');return {id:previous.id,saved:true,duplicate:true};}
  try{
   const saved=await this.prisma.personalPracticeSession.create({data:{
    userId:uid,eventId:body.eventId,practiceId:body.practiceId,durationSeconds:body.durationSeconds
   }});
   return {id:saved.id,saved:true,duplicate:false};
  }catch(e){
   if(typeof e==='object'&&e&&'code' in e&&e.code==='P2002'){
    const existing=await this.prisma.personalPracticeSession.findFirst({where:{eventId:body.eventId,userId:uid}});
    if(existing)return {id:existing.id,saved:true,duplicate:true};
    throw new ConflictException('Completion identifier already in use');
   }
   throw e;
  }
 }
}
for(const [name,types]of [
 ['updateProfile',[Object,PersonalProfileDto]],
 ['setPrimaryChart',[Object,PrimaryChartDto]],
 ['completedPractice',[Object,CompletedPracticeDto]],
 ['calendar',[Object,String,String]],
 ['transits',[Object,String]]
] as const)Reflect.defineMetadata('design:paramtypes',types,PersonalController.prototype,name);
