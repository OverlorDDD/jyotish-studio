import {Body,Controller,Get,Post,Param,Module,Inject,BadRequestException,UnauthorizedException,ServiceUnavailableException,HttpException,HttpStatus,Req} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import type {IncomingMessage} from 'node:http';
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {runCalculation,interpretChart} from './logic.ts';
import {CHART_VERIFICATION_VERSION} from './jyotish-integrity.ts';
import {AiProviderError,createHourlyLimiter,explainAiFailure,type AiUsageEvent} from './ai.ts';
import {buildDetailedReport} from './report.ts';
import {generateDirectJyotish,DIRECT_JYOTISH_VERSION} from './direct-jyotish.ts';
import {SuccessfulConsultationCache} from './consultation-replay.ts';
import {PrismaService} from './prisma.ts';
import {AccountController} from './account.ts';
import {CHART_USE_CASES,SavedChartUseCases,SavedChartError} from './chart-application.ts';
import {PrismaSavedChartStore} from './chart-prisma.ts';
import {JYOTISH_REPORT_USE_CASES,JyotishReportUseCases} from './jyotish-report-application.ts';
import {ADMIN_ROLE_USE_CASE,ChangeRoleUseCase} from './admin-role-application.ts';
import {PrismaRoleChangeStore} from './admin-role-prisma.ts';
import {AdminController} from './admin.ts';
import {EditorialController,PublicContentController} from './editorial.ts';
import {EDITORIAL_USE_CASES,EditorialUseCases} from './editorial-application.ts';
import {PrismaEditorialStore} from './editorial-prisma.ts';
import {ReadingOrdersController} from './reading-orders.ts';
import {PersonalController} from './personal.ts';
import {HoroscopeController} from './horoscope.ts';
import {PanchangaController} from './panchanga-controller.ts';
import {dailySkyContext} from './sky-context.ts';
import {PanchangaPlacesController} from './panchanga-places-controller.ts';
import {AstronomicalEventsController} from './astronomical-events-controller.ts';
import {VedicCalendarController} from './vedic-calendar-controller.ts';
import {NewsController} from './news.ts';
import {ComController} from './com.ts';
import {ComSocialController} from './com-social.ts';
import {ComContextController} from './com-context.ts';
import {ComSafetyController} from './com-safety.ts';
import {ComGrowthController} from './com-growth.ts';
import {NewsIngestionService} from './news-ingestion.ts';
import {TarotController,TAROT_USE_CASES} from './tarot.ts';
import {TarotUseCases} from './tarot-application.ts';
import {PrismaTarotReadingRepository} from './tarot-prisma-repository.ts';
import {createTarotAiGateway} from './tarot-ai-gateway.ts';
import {BirthDto,ReportDto} from './dto.ts';
import {cookieUser} from './auth.ts';

const allowCalculation=createHourlyLimiter(120);
const allowInterpretation=createHourlyLimiter(50);
/** Bounded, successful-only AI consultation cache. No birth identifiers are stored. */
const directCache=new SuccessfulConsultationCache<Awaited<ReturnType<typeof generateDirectJyotish>>>();
function owner(req:IncomingMessage){
 const id=cookieUser(req);
 if(!id)throw new UnauthorizedException('Sign in to access saved charts.');
 return id;
}

@ApiTags('Jyotish')
@Controller('api')
export class JyotishController{
 constructor(@Inject(PrismaService)private readonly prisma:PrismaService,
  @Inject(CHART_USE_CASES)private readonly savedCharts:SavedChartUseCases,
  @Inject(JYOTISH_REPORT_USE_CASES)private readonly reports:JyotishReportUseCases){}
 private async recordAiUsage(event:AiUsageEvent,operation:string){
  // Use only provider-returned usage; unknown tokens/cost remain NULL, never guess.
  await this.prisma.aiUsage.create({data:{
   provider:event.provider,model:event.model,operation,outcome:event.outcome,
   promptTokens:event.promptTokens,completionTokens:event.completionTokens,
   totalTokens:event.totalTokens,costUsd:event.costUsd
  }});
 }
 @Get('v1/jyotish/runtime')
 runtime(){return {service:'galaxiora-jyotish',readerVersion:'6.0.0',pipeline:DIRECT_JYOTISH_VERSION,verificationContract:CHART_VERIFICATION_VERSION,mode:process.env.AI_MODE||'free',
  referenceBenchmark:{
   // Versioned CI-pinned result, NOT a live JHora check of the current visitor.
   // The CI release gate runs jqa3:certify-signs against all raw source hashes.
   version:'jhora8-same-profile-v2',source:'20 original JHora 8.0 exports with captured INIs',cases:20,
   status:'SIGN_PARITY_CERTIFIED',
   d1SignMatches:200,d1Total:200,d9SignMatches:200,d9Total:200,
   d10SignMatches:200,d10Total:200,
   notes:['Same-method D1/D9/D10 sign parity is independently checked',
    'Sub-arcsecond longitude and Vimshottari calendar dates remain separate quality gates',
    'Legacy Gandhi reference uses different settings and is excluded from same-profile totals'],
   perUserJhoraVerified:false
  }};}

 @Get('health')
 async health(){
  try{await this.prisma.$queryRaw`SELECT 1`;return {status:'ok',service:'jyotish-nestjs',database:'connected'};}
  catch{throw new ServiceUnavailableException('Database not connected');}
 }

 /** Guest and account calculations never persist until Save is clicked. */
 @Post('v1/charts/calculate')
 async calculate(@Body()birth:BirthDto){
  if(!allowCalculation())throw new HttpException('Hourly calculation limit reached.',HttpStatus.TOO_MANY_REQUESTS);
  try{return await runCalculation(birth);}
  catch(error){throw new BadRequestException(error instanceof Error?error.message:'Invalid birth input');}
 }

 /** Old unauthenticated read-by-ID API is now restricted to chart owners. */
 @Get('v1/charts/:id')
 async get(@Param('id')id:string,@Req()req:IncomingMessage){
  try{return await this.savedCharts.legacy(owner(req),id);}
  catch(error){if(error instanceof SavedChartError)throw new UnauthorizedException('This chart is not in your account.');throw error;}
 }
 @Get('v1/charts/:id/dashas')
 async dashas(@Param('id')id:string,@Req()req:IncomingMessage){
  try{return await this.savedCharts.dashas(owner(req),id);}
  catch(error){if(error instanceof SavedChartError)throw new UnauthorizedException('This chart is not in your account.');throw error;}
 }

 /** Stateless generation from birth input: the server recomputes the astronomical facts.
  * The browser cannot submit a forged chart to the language model. */
 @Post('v1/reports')
 async detailedReport(@Body()birth:ReportDto){
  if(!allowInterpretation())throw new HttpException('Hourly report limit reached.',HttpStatus.TOO_MANY_REQUESTS);
  let chart:CalculatedChart;
  let report:ReturnType<typeof buildDetailedReport>;
  try{
   const prepared=await this.reports.prepare(birth,birth.lang);
   chart=prepared.chart;report=prepared.report as ReturnType<typeof buildDetailedReport>;
  }catch(error){throw new BadRequestException(error instanceof Error?error.message:'Invalid birth input');}
  // User intent is explicit: local Reader always responds without contacting providers.
  // Old A8.9 eight-chapter gate is RETIRED from this route.
  const verified=chart as CalculatedChart&{verification?:{status:string;version:string;digest:string}};
  if(verified.verification?.status!=='verified_internal')
   throw new ServiceUnavailableException('Jyotish verification missing. Report generation is blocked.');
  // Additive, independently computed contemporary sky/calendar section.
  // Never reinterpret the historic birth chart as if a current festival
  // happened at the birth instant; the city is labelled reference only.
  const asOf=report.asOf.slice(0,10);
  const sky=await dailySkyContext(asOf,'Europe/Kyiv').catch(()=>null);
  const nextSky=sky?.events[0],todayFestival=sky?.observances[0];
  const skyParagraphs=[
   nextSky?(birth.lang==='uk'?
    'Найближча астрономічна подія ('+nextSky.atUtc+'): '+nextSky.meaning.uk+
    ' Практичний крок: '+nextSky.practice.uk:
    'Upcoming exact event ('+nextSky.atUtc+'): '+nextSky.meaning.en+
    ' Practice: '+nextSky.practice.en):null,
   todayFestival?(birth.lang==='uk'?
    'Календарний орієнтир для Києва: '+todayFestival.id.replaceAll('_',' ')+
    '. Це кандидат за традиційним правилом, а не остаточна дата посту.':
    'Kyiv-reference calendar observance: '+todayFestival.id.replaceAll('_',' ')+
    '. It is a rule-based candidate, not a certified fasting date.'):null
  ].filter((x):x is string=>Boolean(x));
  const skySection=skyParagraphs.length?{
   id:'current-sky-context',eyebrow:'AE-P5 · AE-P7',
   heading:birth.lang==='uk'?'Поточний небесний календар':'Current sky and observance calendar',
   lead:birth.lang==='uk'?'Розрахунок на дату читання, не характеристика народження':'Calculated for reading date, not birth attributes',
   paragraphs:skyParagraphs,
   facts:['Swiss Ephemeris · Lahiri','Reference: Europe/Kyiv / Kyiv','Festival dates are candidates']
  }:null;
  const base={...report,sections:skySection?[...report.sections,skySection]:report.sections,
   calendarContext:sky,readerVersion:'6.0.0',verification:verified.verification};
  if(birth.preferred==='local'||process.env.GALAXIORA_READER_ONLY==='1')
   return {...base,ai:{provider:'local' as const,text:'',source:'deterministic' as const,cached:false,fallbackReason:'reader_only'}};
  if((process.env.AI_MODE||'free')!=='free')
   return {...base,ai:{provider:'local' as const,text:'',source:'deterministic' as const,cached:false,fallbackReason:'no_provider'}};
  const key=report.rulesDigest+':'+birth.lang+':'+report.asOf+':'+DIRECT_JYOTISH_VERSION;
  const {outcome,reused}=await directCache.obtain(key,()=>generateDirectJyotish(chart,birth.lang,report.asOf,{
   onUsage:event=>this.recordAiUsage(event,'direct_jyotish')
  }));
  if(outcome.result)
   return {...base,ai:{...outcome.result,source:'llm' as const,cached:reused}};
  return {...base,ai:{provider:'local' as const,text:'',source:'deterministic' as const,cached:false,fallbackReason:outcome.reason||'no_provider'}};

 }

 /** Backward-compatible short reading: also stateless, no guest database write. */
 @Post('v1/interpretations')
 async interpret(@Body()birth:ReportDto){
  if(!allowInterpretation())throw new HttpException('Hourly interpretation limit reached.',HttpStatus.TOO_MANY_REQUESTS);
  let chart:CalculatedChart;
  try{chart=await this.reports.calculate(birth);}
  catch(error){throw new BadRequestException(error instanceof Error?error.message:'Invalid birth input');}
  try{return await interpretChart(chart,birth.lang,birth.preferred||'auto',event=>this.recordAiUsage(event,'short_reading'));}
  catch(error){
   if(error instanceof AiProviderError){
    if(error.reason==='limit')throw new HttpException(error.message,HttpStatus.TOO_MANY_REQUESTS);
    throw new ServiceUnavailableException(explainAiFailure(error));
   }
   throw error;
  }
 }
}
/** Runtime reflection for tsx: esbuild does not emit design:paramtypes. */
for(const [method,types]of [
 ['calculate',[BirthDto]],
 ['get',[String,Object]],
 ['dashas',[String,Object]],
 ['detailedReport',[ReportDto]],
 ['interpret',[ReportDto]]
] as const){
 Reflect.defineMetadata('design:paramtypes',types,JyotishController.prototype,method);
}

@Module({controllers:[JyotishController,AccountController,AdminController,EditorialController,PublicContentController,ReadingOrdersController,TarotController,PersonalController,HoroscopeController,PanchangaController,PanchangaPlacesController,AstronomicalEventsController,VedicCalendarController,NewsController,ComController,ComSocialController,ComContextController,ComSafetyController,ComGrowthController],
 providers:[PrismaService,NewsIngestionService,
  {provide:CHART_USE_CASES,useFactory:(prisma:PrismaService)=>
   new SavedChartUseCases(new PrismaSavedChartStore(prisma),runCalculation,buildDetailedReport),inject:[PrismaService]},
  {provide:JYOTISH_REPORT_USE_CASES,useFactory:()=>new JyotishReportUseCases(runCalculation,buildDetailedReport)},
  {provide:ADMIN_ROLE_USE_CASE,useFactory:(prisma:PrismaService)=>
   new ChangeRoleUseCase(new PrismaRoleChangeStore(prisma)),inject:[PrismaService]},
  {provide:EDITORIAL_USE_CASES,useFactory:(prisma:PrismaService)=>
   new EditorialUseCases(new PrismaEditorialStore(prisma)),inject:[PrismaService]},
  {provide:TAROT_USE_CASES,
  useFactory:(prisma:PrismaService)=>new TarotUseCases(new PrismaTarotReadingRepository(prisma),createTarotAiGateway()),
  inject:[PrismaService]}]})
export class AppModule{}
