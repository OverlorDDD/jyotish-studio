import {BadRequestException,Body,ConflictException,Controller,Delete,Get,Header,Inject,Param,Patch,Post,Put,Query,Req,UnauthorizedException,ServiceUnavailableException} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {ArrayMaxSize,IsArray,IsIn,IsInt,IsOptional,IsString,IsUUID,Max,Min} from 'class-validator';
import type {IncomingMessage} from 'node:http';
import {PrismaService} from './prisma.ts';
import {cookieUser,sameOrigin} from './auth.ts';
import {createKeyedHourlyLimiter} from './ai.ts';
import {calendarDays,dailyTransit,localToday,validLocalDay,validTimeZone} from './personal-transits.ts';
import {verifyLunarContinuity} from './horoscope.ts';
import {tropicalSkyAtUtc,tropicalSkyForDay,westernSignReading,TROPICAL_METHOD} from './western-horoscope.ts';
import {buildAstrologicalSynthesis} from './astrological-synthesis.ts';
import {tropicalNatalChartAtUtc} from './western-natal.ts';
import {buildAdvancedSynthesis} from './advanced-synthesis.ts';
import {verifiedDailyMoonStrength} from '../../../packages/jyotish-core/src/lunar-strength.ts';
import {calculatePanchangaDay,validatePanchangaLocation} from './panchanga.ts';
import {dailySkyContext} from './sky-context.ts';
import {resolvePersonalChart,type RecoveryState} from './personal-chart-recovery.ts';
import {buildDailyGuidance,buildMoonSignHoroscope,buildPeriodGuidance,buildWeekHighlights,type VerifiedNatalContext} from './personal-guidance.ts';

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
 // The familiar Western sign must come from the precise tropical Sun at the
 // owner's VERIFIED birth instant, never by re-labeling natal Moon or Lagna.
 let westernSunSign:number|null=null;
 let westernSunLongitude:number|null=null;
 if(result?.utc){
  try{
   const sun=await tropicalSkyAtUtc(result.utc);
   westernSunSign=sun.sun.sign;
   westernSunLongitude=sun.sun.longitude;
  }catch{ /* Do not fabricate a Western sign if exact Swiss data is unavailable. */ }
 }
 return {id:row.id,createdAt:row.createdAt,date:input.date||'',place:input.place||'',
  verified:Boolean(result),recoveryStatus:recovery.status as RecoveryState,
  lagnaSign:result&&Number.isInteger(asc?.sign)?asc!.sign:null,
  lagnaName:asc?.signName||(row.result as ChartResult)?.ascendant?.signName||'',
  moonSign:result&&Number.isInteger(moon?.sign)?moon!.sign:null,
  natalUtc:result?.utc||null,
  westernSunSign,westernSunLongitude,westernMethod:westernSunSign?'Swiss Ephemeris / tropical-of-date':null,
  moonLongitude:result&&Number.isFinite(moon?.longitude)?moon!.longitude:null,
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
 /** Authenticated Western interpretation anchored to the verified birth-time
  * tropical Sun, not to the Vedic Moon. Explicitly Sun-sign-based, not a
  * complete Western natal reading. No DB writes; private and uncached.
  */
 /** Astrological Synthesis Engine v1: natal private transit comparison.
  * Never exposes birth details via query params or shared cache. Requires an
  * authenticated user with a verified primary natal chart.
  */
 @Get('horoscope/synthesis') @Header('Cache-Control','private, no-store')
 async synthesisHoroscope(@Req()req:IncomingMessage,@Query('days')span?:string){
  const uid=owner(req);
  if(span!==undefined&&span!=='1'&&span!=='7')
   throw new BadRequestException('days must be 1 or 7');
  const {profile,selected:chart}=await this.profile(uid);
  if(!chart?.verified||!chart.natalUtc||!chart.moonSign||!chart.lagnaSign||
     !chart.westernSunSign||!Number.isFinite(chart.westernSunLongitude))
   return {status:'requires_verified_chart',reference:'ASTROLOGICAL_SYNTHESIS_V1',days:[]};
  const zone=profile.currentTimeZone,date=localToday(zone);
  try{
   const natal=await tropicalSkyAtUtc(chart.natalUtc);
   if(natal.sun.sign!==chart.westernSunSign)
    throw Error('Natal Sun disagreement: refusing synthesis');
   const dates=calendarDays(date,span==='7'?7:7).slice(0,span==='7'?7:1);
   const days=await Promise.all(dates.map(async day=>{
    const [western,vedic]=await Promise.all([
     tropicalSkyForDay(day,zone),
     dailyTransit(day,zone,chart.lagnaSign,chart.moonSign)
    ]);
    const period=verifiedContextAt(chart,vedic.sampledAtUtc)?.period;
    return buildAstrologicalSynthesis({
     date:day,western,vedic,
     natalWestern:{Sun:natal.sun.longitude,Moon:natal.moon.longitude},
     natalVedic:{moonSign:chart.moonSign!,lagnaSign:chart.lagnaSign!},
     period:period?{lord:period.lord,antardasha:period.antardasha?.lord||null}:null
    });
   }));
   return {status:'available',reference:'ASTROLOGICAL_SYNTHESIS_V1',
    date,zone,natal:{westernSunSign:chart.westernSunSign,
     vedicMoonSign:chart.moonSign,vedicLagnaSign:chart.lagnaSign},
    method:'SWISS_VERIFIED_TROPICAL_ASPECTS_AND_LAHIRI_GOCHARA_V1',
    scope:'TRADITIONAL_INTERPRETIVE_COMPARISON_NOT_CERTAINTY_OF_EVENTS',
    today:days[0],days};
  }catch{
   throw new ServiceUnavailableException('Verified planetary data unavailable; synthesis was not fabricated');
  }
 }

 /**
  * ASE-2 owner scoped advanced calculation. ASE-1 response unchanged.
  * Birth coordinates remain on the server: never included in JSON/URLs.
  */
 @Get('horoscope/synthesis/advanced') @Header('Cache-Control','private, no-store')
 async advancedSynthesis(@Req()req:IncomingMessage,@Query('days')span?:string){
  const uid=owner(req);
  if(span!==undefined&&span!=='1'&&span!=='7')
   throw new BadRequestException('days must be 1 or 7');
  const base=await this.synthesisHoroscope(req,span);
  if(base.status!=='available')return {...base,advancedStatus:'requires_verified_chart'};
  const {profile,selected:chart}=await this.profile(uid);
  if(!chart?.verified||!chart.id||!chart.natalUtc||!chart.lagnaSign)
   return {...base,advancedStatus:'requires_verified_chart'};
  const row=await this.prisma.chart.findFirst({
   where:{id:chart.id,ownerId:uid},select:{input:true}});
  const birth=(row?.input||{}) as {latitude?:unknown;longitude?:unknown};
  if(typeof birth.latitude!=='number'||typeof birth.longitude!=='number'||
     !Number.isFinite(birth.latitude)||!Number.isFinite(birth.longitude))
   return {...base,advancedStatus:'requires_birth_coordinates'};
  try{
   const natal=await tropicalNatalChartAtUtc(chart.natalUtc,birth.latitude,birth.longitude);
   const days=await Promise.all(base.days.map(async(day,index)=>{
    const transit=await dailyTransit(day.date,profile.currentTimeZone,chart.lagnaSign,chart.moonSign);
    const raw=verifiedContextAt(chart,transit.sampledAtUtc)?.period;
    const period=raw?{lord:raw.lord,start:raw.start,end:raw.end,
     antardasha:raw.antardasha?.lord||null}:null;
    const advanced=await buildAdvancedSynthesis({
     natal,transit,natalPositions:chart.natalPositions,
     lagnaSign:chart.lagnaSign!,period,maxTimed:index===0?3:0});
    return {...day,advanced};
   }));
   return {...base,reference:'ASTROLOGICAL_SYNTHESIS_V2' as const,
    advancedStatus:'available',days};
  }catch{
   // Fail closed for unsupported Placidus geometry or unverifiable data.
   return {...base,advancedStatus:'calculation_unavailable'};
  }
 }

 @Get('horoscope/western') @Header('Cache-Control','private, no-store')
 async westernHoroscope(@Req()req:IncomingMessage){
  const uid=owner(req),profile=await this.profile(uid),chart=profile.selected;
  if(!chart?.verified||!chart.westernSunSign||!Number.isFinite(chart.westernSunLongitude))
   return {status:'requires_verified_tropical_sun',reference:'TROPICAL_NATAL_SUN_SIGN',today:null,days:[]};
  const zone=profile.profile.currentTimeZone;
  const date=localToday(zone);
  let days:{date:string;sky:Awaited<ReturnType<typeof tropicalSkyForDay>>}[];
  try{
   days=await Promise.all(calendarDays(date,7).map(async day=>({date:day,sky:await tropicalSkyForDay(day,zone)})));
  }catch{throw new ServiceUnavailableException('Tropical Swiss Ephemeris unavailable; cannot give an accurate reading');}
  const reading=(day:{date:string;sky:Awaited<ReturnType<typeof tropicalSkyForDay>>})=>{
   const entry=westernSignReading(chart.westernSunSign!,day.sky,day.date);
   return {...entry,evidence:{...entry.evidence,kind:'PERSONAL_TROPICAL_NATAL_SUN_REFERENCE',
    natalSunSign:chart.westernSunSign,natalSunLongitude:chart.westernSunLongitude,
    provenance:'VERIFIED_BIRTH_INSTANT_SWISS_TROPICAL_SUN',timeZone:zone}};
  };
  return {status:'available',reference:'TROPICAL_NATAL_SUN_SIGN',timeZone:zone,
   date,natalSunSign:chart.westernSunSign,natalSunLongitude:chart.westernSunLongitude,
   method:TROPICAL_METHOD,scope:'SUN_SIGN_TRANSITS_NOT_FULL_WESTERN_NATAL_CHART',
   today:reading(days[0]),days:days.map(day=>({date:day.date,guidance:reading(day)}))};
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
  // Noon-based lunar comparison is marked explicitly; the sunrise-based
  // independent comparison remains available on the verified Panchanga page.
  let lunarStrength:null|ReturnType<typeof verifiedDailyMoonStrength>=null;
  if(chart?.verified&&chart.moonLongitude!=null&&chart.moonSign&&transit&&
    Number.isFinite(transit.moon.longitude)){
   try{lunarStrength=verifiedDailyMoonStrength(
    {moonLongitude:chart.moonLongitude,moonSign:chart.moonSign},
    {nakshatraNumber:Math.floor(transit.moon.longitude/(360/27))+1,moonSign:transit.moon.sign});}
   catch{lunarStrength=null;}
  }
  const sky=await dailySkyContext(today,profile.profile.currentTimeZone);
  const todayEvent=sky.events.find(e=>e.localDate===today);
  const baseDaily=buildDailyGuidance(transit,context);
  const daily=baseDaily&&todayEvent?{...baseDaily,
   description:{
    uk:baseDaily.description.uk+' Сьогодні є розрахована астрономічна подія: '+todayEvent.meaning.uk,
    en:baseDaily.description.en+' An exact astronomical event occurs today: '+todayEvent.meaning.en
   },
   action:{
    uk:baseDaily.action.uk+' Астрономічний акцент: '+todayEvent.practice.uk,
    en:baseDaily.action.en+' Astronomical focus: '+todayEvent.practice.en
   }}:baseDaily;
  return {...profile,today,activeDasha:currentPeriod,sky,lunarStrength,
   lunarStrengthSampling:'NOON_OBSERVATION_NOT_LOCAL_SUNRISE',
   journey:{period:context?buildPeriodGuidance(currentPeriod,context.lagnaSign,context.natalPositions):null,
    daily,horoscope:buildMoonSignHoroscope(transit,context)},
   transit,transitStatus,recentTarot:tarot,recentJournal:journal,privateQuestions:questions,
   recentPractices:practices,horoscope:{status:verified?'available':'requires_verified_chart',personal:verified},
   news:{status:'available',topics:profile.profile.newsTopics,usesPrivateJournal:false}};
 }
 /** AE-P6: private lunar suitability, computed only from the owner's
  * verified natal Moon + actual local-sunrise Swiss Moon. No birth data in
  * URL, no chart selections from unauthenticated callers, no persistence.
  */
 @Get('panchanga') @Header('Cache-Control','private, no-store')
 async personalPanchanga(@Req()req:IncomingMessage,
  @Query('date')date?:string,@Query('zone')zone?:string,
  @Query('latitude')latitude?:string,@Query('longitude')longitude?:string){
  const uid=owner(req);
  const p=await this.profile(uid),chart=p.selected;
  if(!chart?.verified||!chart.moonSign||chart.moonLongitude==null)
   return {status:'requires_verified_chart',method:'no_personal_values_without_verified_natal'};
  const raw={date,timeZone:zone??p.profile.currentTimeZone,
   latitude:latitude===undefined?undefined:Number(latitude),
   longitude:longitude===undefined?undefined:Number(longitude)};
  try{validatePanchangaLocation(raw);}
  catch(error){throw new BadRequestException(error instanceof Error?error.message:'Invalid location');}
  let day:Awaited<ReturnType<typeof calculatePanchangaDay>>;
  try{day=await calculatePanchangaDay(raw);}
  catch{throw new ServiceUnavailableException('Verified sunrise Panchanga unavailable');}
  return {status:'available',date:day.date,sunriseUtc:day.sunriseUtc,
   timeZone:day.location.timeZone,
   observation:'VERIFIED_NATAL_MOON_VS_LOCAL_SUNRISE_TRANSIT',
   ...verifiedDailyMoonStrength(
    {moonLongitude:chart.moonLongitude,moonSign:chart.moonSign},
    {nakshatraNumber:day.sunrise.nakshatra.number,moonSign:day.sunrise.moonSign})};
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
  verifyLunarContinuity(out);
  // Use the exact same verified AE-P5 interpretation and optional action
  // in today's Personal card AND the first calendar-week highlight.
  const sky=await dailySkyContext(start,p.profile.currentTimeZone);
  const baseHighlights=buildWeekHighlights(out,events,utc=>verifiedContextAt(c,utc));
  const weekHighlights=baseHighlights.map(h=>{
   const event=sky.events.find(e=>e.localDate===h.date);
   if(!event)return h;
   return {...h,summary:{
    uk:h.summary.uk+' Сьогодні є розрахована астрономічна подія: '+event.meaning.uk,
    en:h.summary.en+' An exact astronomical event occurs today: '+event.meaning.en
   },action:{
    uk:h.action.uk+' Астрономічний акцент: '+event.practice.uk,
    en:h.action.en+' Astronomical focus: '+event.practice.en
   }};
  });
  return {status:personalized?'available':'general',recoveryStatus:c?.recoveryStatus||'no_chart',
   dates,days:out,events,weekHighlights,
   // One canonical fact-verified daily reading; no competing advice or invented personal placements.
   horoscopes:out.slice(0,7).map(t=>({date:t.date,guidance:buildMoonSignHoroscope(t,verifiedContextAt(c,t.sampledAtUtc))})),
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
 ['personalPanchanga',[Object,String,String,String,String]],
 ['transits',[Object,String]]
] as const)Reflect.defineMetadata('design:paramtypes',types,PersonalController.prototype,name);
