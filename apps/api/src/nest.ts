import {Body,Controller,Get,Post,Param,Module,Inject,BadRequestException,UnauthorizedException,ServiceUnavailableException,HttpException,HttpStatus,Req} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import type {IncomingMessage} from 'node:http';
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {runCalculation,interpretChart} from './logic.ts';
import {AiProviderError,createHourlyLimiter,explainAiFailure,type AiUsageEvent} from './ai.ts';
import {buildDetailedReport,detailedReportFacts} from './report.ts';
import {ruleFindings} from '../../../packages/jyotish-core/src/rules.ts';
import {generateFreeInterpretationDetailed} from './free-ai.ts';
import {buildAiChapterSpecs} from './consultation-ai.ts';
import {yogakarakasForLagna} from './reader-classical.ts';
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
import {TarotController,TAROT_USE_CASES} from './tarot.ts';
import {TarotUseCases} from './tarot-application.ts';
import {PrismaTarotReadingRepository} from './tarot-prisma-repository.ts';
import {createTarotAiGateway} from './tarot-ai-gateway.ts';
import {BirthDto,ReportDto} from './dto.ts';
import {cookieUser} from './auth.ts';

const allowCalculation=createHourlyLimiter(120);
const allowInterpretation=createHourlyLimiter(50);
/** Ephemeral, bounded replay cache: guests are NEVER stored in PostgreSQL.
 * Successful free-model prose is identical for repeated chart/lang/asOf in this process.
 * A restart drops the cache; the deterministic report remains identical. */
type FreeReportAi=Awaited<ReturnType<typeof generateFreeInterpretationDetailed>>;
const interpretationReplay=new Map<string,{expires:number;pending:Promise<FreeReportAi>}>();
function replayFreeNarrative(key:string,generate:()=>Promise<FreeReportAi>){
 const now=Date.now(),existing=interpretationReplay.get(key);
 if(existing&&existing.expires>now)return existing.pending.then(outcome=>({outcome,cached:true}));
 if(interpretationReplay.size>=60){
  const first=interpretationReplay.keys().next().value;
  if(first)interpretationReplay.delete(first);
 }
 const pending=generate().then(result=>{
  // Do not cache failures or quota exhaustion.
  if(!result.result)interpretationReplay.delete(key);
  return result;
 }).catch(error=>{interpretationReplay.delete(key);throw error;});
 interpretationReplay.set(key,{expires:now+30*60*1000,pending});
 return pending.then(outcome=>({outcome,cached:false}));
}

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
  if(birth.preferred==='local'||process.env.AI_MODE==='local')
   return {...report,ai:{provider:'local' as const,text:'',source:'deterministic' as const,cached:false,fallbackReason:'local_only'}};
  if((process.env.AI_MODE||'free')!=='free')
   return {...report,ai:{provider:'local' as const,text:'',source:'deterministic' as const,cached:false,fallbackReason:'no_provider'}};
  const {outcome:free,cached}=await replayFreeNarrative(report.rulesDigest+':'+birth.lang+':'+report.asOf+':interpretation-v5-authored-narrative-and-editor',
   ()=>generateFreeInterpretationDetailed(chart,birth.lang,{
    chapterSpecs:buildAiChapterSpecs(report.editorial),
    factsOverride:report.editorial.findings.map(f=>({id:f.id,
      fact:'Verified rule: '+f.ruleId+'. Evidence: '+f.verifiedEvidence.join('; ')+'. Traditional reading: '+f.traditionalMeaning+
       '. Supporting: '+f.supportingFactors.join('; ')+'. Limits: '+f.limitations.join('; ')})),reportMode:true,
    onUsage:event=>this.recordAiUsage(event,'detailed_report'),
    approvedYogas:[...ruleFindings(chart).yogas.map(y=>y.name),...(yogakarakasForLagna(chart.ascendant.sign).length?['yogakaraka']:[])]
   }));
  return {...report,ai:free.result?{...free.result,source:'llm' as const,cached}:
   {provider:'local' as const,text:'',source:'deterministic' as const,cached:false,fallbackReason:free.reason}};
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

@Module({controllers:[JyotishController,AccountController,AdminController,EditorialController,PublicContentController,ReadingOrdersController,TarotController],
 providers:[PrismaService,
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
