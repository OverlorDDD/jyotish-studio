import {BadRequestException,Body,ConflictException,Controller,Delete,Get,Header,Inject,Param,Patch,Post,Put,Query,Req,UnauthorizedException,ServiceUnavailableException} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {ArrayMaxSize,IsArray,IsIn,IsInt,IsOptional,IsString,IsUUID,Max,Min} from 'class-validator';
import type {IncomingMessage} from 'node:http';
import {PrismaService} from './prisma.ts';
import {cookieUser,sameOrigin} from './auth.ts';
import {createKeyedHourlyLimiter} from './ai.ts';
import {calendarDays,dailyTransit,localToday,validLocalDay,validTimeZone} from './personal-transits.ts';
import {resolvePersonalChart,type RecoveryState} from './personal-chart-recovery.ts';
import {buildDailyGuidance,buildPeriodGuidance,buildWeekHighlights,type VerifiedNatalContext} from './personal-guidance.ts';

type ChartResult={verification?:{status?:string};ascendant?:{sign?:number;signName?:string};
 d1?:{name:string;sign:number}[];dasha?:{lord:string;start:string;end:string;antardashas?:{lord:string;start:string;end:string}[]}[]};
const TOPICS=['astronomy','jyotish','tarot','yoga','vedic-traditions','academy',
 'astrology','meditation','vedic','self-development','natal-charts','nakshatras','mantras','pranayama'] as const;
const PRACTICES=['box','equal','extended'] as const;
const calendarLimiter=createKeyedHourlyLimiter(20);
function owner(req:IncomingMessage){const id=cookieUser(req);if(!id)throw new UnauthorizedException('Sign in to your Personal space');return id;}
function mutation(req:IncomingMessage){if(!sameOrigin(req))throw new BadRequestException('Cross-origin personal update denied');return owner(req);}
async function chartFacts(prisma:PrismaService,row:{id:string;createdAt:Date;input:unknown;result:unknown}|null){
 if(!row)return null;
 const recovery=await resolvePersonalChart(prisma,row);
 const result=recovery.chart;
 const input=(row.input||{}) as {date?:string;place?:string};
 const moon=result?.d1.find(x=>x.name==='Moon');
 const asc=result?.ascendant;
 return {id:row.id,createdAt:row.createdAt,date:input.date||'',place:input.place||'',
  verified:Boolean(result),recoveryStatus:recovery.status as RecoveryState,
  lagnaSign:result&&Number.isInteger(asc?.sign)?asc!.sign:null,
  lagnaName:asc?.signName||(row.result as ChartResult)?.ascendant?.signName||'',
  moonSign:result&&Number.isInteger(moon?.sign)?moon!.sign:null,
  dasha:result?.dasha||[],natalPositions:result?.d1.map(x=>({name:x.name,sign:x.sign}))||[]};
}
/** Shared verified natal context for both Personal's main card and the calendar. */
function verifiedContextAt(chart:Awaited<ReturnType<typeof chartFacts>>,utc:string):VerifiedNatalContext|null{
 if(!chart?.verified||!chart.lagnaSign||!chart.moonSign||
 !chart.natalPositions.some(n=>n.name==='Moon'&&n.sign===chart.moonSign))return null;
 const now=Date.parse(utc);
 if(!Number.isFinite(now))return null;
 const d=chart.dasha.find(x=>Date.parse(x.start)<=now&&now<Date.parse(x.end));
 const a=d?.antardashas?.find(x=>Date.parse(x.start)<=now&&now<Date.parse(x.end));
 return {lagnaSign:chart.lagnaSign,moonSign:chart.moonSign,natalPositions:chart.natalPositions,
  period:d?{lord:d.lord,start:d.start,end:d.end,antardasha:a||null}:null};
}
export class PersonalProfileDto{
 @IsOptional() @IsString() currentTimeZone?:string;
 @IsOptional() @IsIn(['uk','en']) preferredLocale?:'uk'|'en';
 @IsOptional() @IsIn(PRACTICES) favoritePractice?:'box'|'equal'|'extended';
 @IsOptional() @IsArray() @ArrayMaxSize(14) @IsIn(TOPICS,{each:true}) newsTopics?:string[];
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
   // Avoid transferring up to 100 large natal + dasha JSON blobs on every dashboard visit.
   this.prisma.chart.findMany({where:{ownerId:uid},select:{id:true,createdAt:true,input:true},orderBy:{createdAt:'desc'},take:100})
  ]);
  const charts=rows.map(row=>{const input=(row.input||{}) as {date?:string;place?:string};
   return {id:row.id,createdAt:row.createdAt,date:input.date||'',place:input.place||''};});
  const source=record?.primaryChartId?await this.prisma.chart.findFirst({
   where:{id:record.primaryChartId,ownerId:uid},select:{id:true,createdAt:true,input:true,result:true}
  }):null;
  const selected=await chartFacts(this.prisma,source);
  return {profile:{primaryChartId:selected?.id||null,currentTimeZone:record?.currentTimeZone||'UTC',
   preferredLocale:record?.preferredLocale||'uk',favoritePractice:record?.favoritePractice||'box',newsTopics:record?.newsTopics||[]},
   charts,suggestedChartId:!record?.primaryChartId&&charts.length===1?charts[0].id:null,
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
   ...(dto.favoritePractice!==undefined?{favoritePractice:dto.favoritePractice}:{}),
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
  const today=localToday(profile.profile.currentTimeZone),chart=profile.selected;
  const verified=Boolean(chart?.verified&&chart.lagnaSign&&chart.moonSign);
  let transit:null|Awaited<ReturnType<typeof dailyTransit>>=null;
  let transitStatus:'available'|'general'|'ephemeris_unavailable'='general';
  try{
   transit=await dailyTransit(today,profile.profile.currentTimeZone,
    verified?chart!.lagnaSign:null,verified?chart!.moonSign:null);
   transitStatus=verified?'available':'general';
  }catch{transitStatus='ephemeris_unavailable';}
  const context=verifiedContextAt(chart,transit?.sampledAtUtc||new Date().toISOString());
  const currentPeriod=context?.period||null;
  return {...profile,today,activeDasha:currentPeriod,
   journey:{period:context?buildPeriodGuidance(currentPeriod,context.lagnaSign,context.natalPositions):null,
    daily:buildDailyGuidance(transit,context)},
   transit,transitStatus,recentTarot:tarot,recentJournal:journal,privateQuestions:questions,
   recentPractices:practices,horoscope:{status:verified?'available':'requires_verified_chart',personal:verified},
   news:{status:'planned_after_launch',topics:profile.profile.newsTopics,usesPrivateJournal:false}};
 }
 @Get('transits') @Header('Cache-Control','private, no-store')
 async transits(@Req()req:IncomingMessage,@Query('date')date?:string){
  const uid=owner(req),p=await this.profile(uid),c=p.selected;
  const day=date||localToday(p.profile.currentTimeZone);
  if(!validLocalDay(day))throw new BadRequestException('Invalid YYYY-MM-DD');
  try{
   return {status:c?.verified?'available':'general',
    recoveryStatus:c?.recoveryStatus||'no_chart',
    transit:await dailyTransit(day,p.profile.currentTimeZone,c?.verified?c.lagnaSign:null,c?.verified?c.moonSign:null)};
  }catch{throw new ServiceUnavailableException('Astronomical ephemeris unavailable, retry later');}
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
  const personalized=Boolean(c?.verified&&c.lagnaSign&&c.moonSign);
  const dateSet=new Set(dates);
  const events=[
   ...(personalized?c!.dasha:[]).map(d=>({type:'MAHADASHA_START',lord:d.lord,atUtc:d.start,date:localToday(p.profile.currentTimeZone,new Date(d.start))})),
   ...(personalized?c!.dasha:[]).flatMap(d=>(d.antardashas||[]).map(a=>({type:'ANTARDASHA_START',lord:a.lord,atUtc:a.start,date:localToday(p.profile.currentTimeZone,new Date(a.start))})))
  ].filter(e=>dateSet.has(e.date)).sort((a,b)=>a.atUtc.localeCompare(b.atUtc));
  const out:Awaited<ReturnType<typeof dailyTransit>>[]=[];
  try{
   for(let i=0;i<dates.length;i+=3){
    out.push(...await Promise.all(dates.slice(i,i+3).map(day=>dailyTransit(day,p.profile.currentTimeZone,personalized?c!.lagnaSign:null,personalized?c!.moonSign:null))));
   }
  }catch{throw new ServiceUnavailableException('Astronomical calendar temporarily unavailable, retry later');}
  return {status:personalized?'available':'general',recoveryStatus:c?.recoveryStatus||'no_chart',
   dates,days:out,events,weekHighlights:buildWeekHighlights(out,events,utc=>verifiedContextAt(c,utc)),
   // One canonical fact-verified daily reading; no competing advice or invented personal placements.
   horoscopes:out.slice(0,7).map(t=>({date:t.date,guidance:buildDailyGuidance(t,verifiedContextAt(c,t.sampledAtUtc))})),
   horoscopeStatus:personalized?'personalized':'requires_verified_chart',method:out[0]?.method};
 }
 @Get('practices') @Header('Cache-Control','private, no-store')
 async practices(@Req()req:IncomingMessage){
  return this.prisma.personalPracticeSession.findMany({where:{userId:owner(req)},orderBy:{completedAt:'desc'},take:100,
   select:{id:true,eventId:true,practiceId:true,durationSeconds:true,completedAt:true}});
 }
 @Delete('practices/:id') @Header('Cache-Control','private, no-store')
 async removePractice(@Req()req:IncomingMessage,@Param('id')id:string){
  const uid=mutation(req);
  const result=await this.prisma.personalPracticeSession.deleteMany({where:{id,userId:uid}});
  if(!result.count)throw new UnauthorizedException('Practice does not belong to your account');
  return {deleted:true};
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
 ['getProfile',[Object]],
 ['overview',[Object]],
 ['practices',[Object]],
 ['updateProfile',[Object,PersonalProfileDto]],
 ['setPrimaryChart',[Object,PrimaryChartDto]],
 ['completedPractice',[Object,CompletedPracticeDto]],
 ['removePractice',[Object,String]],
 ['calendar',[Object,String,String]],
 ['transits',[Object,String]]
] as const)Reflect.defineMetadata('design:paramtypes',types,PersonalController.prototype,name);
