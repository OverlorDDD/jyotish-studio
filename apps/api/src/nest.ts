import {Body,Controller,Get,Post,Param,Module,Inject,BadRequestException,UnauthorizedException,ServiceUnavailableException,HttpException,HttpStatus,Req} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import type {IncomingMessage} from 'node:http';
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {runCalculation,interpretChart} from './logic.ts';
import {AiProviderError,createHourlyLimiter,explainAiFailure} from './ai.ts';
import {buildDetailedReport,detailedReportFacts} from './report.ts';
import {generateFreeInterpretationDetailed} from './free-ai.ts';
import {PrismaService} from './prisma.ts';
import {AccountController} from './account.ts';
import {BirthDto,ReportDto} from './dto.ts';
import {cookieUser} from './auth.ts';

const allowCalculation=createHourlyLimiter(120);
const allowInterpretation=createHourlyLimiter(50);
function owner(req:IncomingMessage){
 const id=cookieUser(req);
 if(!id)throw new UnauthorizedException('Sign in to access saved charts.');
 return id;
}

@ApiTags('Jyotish')
@Controller('api')
export class JyotishController{
 constructor(@Inject(PrismaService)private readonly prisma:PrismaService){}
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
  const ownerId=owner(req);
  const row=await this.prisma.chart.findFirst({where:{id,ownerId}});
  if(!row)throw new UnauthorizedException('This chart is not in your account.');
  return {id,...row.result as object};
 }
 @Get('v1/charts/:id/dashas')
 async dashas(@Param('id')id:string,@Req()req:IncomingMessage){
  const ownerId=owner(req);
  const row=await this.prisma.chart.findFirst({where:{id,ownerId}});
  if(!row)throw new UnauthorizedException('This chart is not in your account.');
  return {id,dasha:(row.result as unknown as CalculatedChart).dasha};
 }

 /** Stateless generation from birth input: the server recomputes the astronomical facts.
  * The browser cannot submit a forged chart to the language model. */
 @Post('v1/reports')
 async detailedReport(@Body()birth:ReportDto){
  if(!allowInterpretation())throw new HttpException('Hourly report limit reached.',HttpStatus.TOO_MANY_REQUESTS);
  let chart:CalculatedChart;
  try{chart=await runCalculation(birth);}
  catch(error){throw new BadRequestException(error instanceof Error?error.message:'Invalid birth input');}
  const report=buildDetailedReport(chart,birth.lang);
  if(birth.preferred==='local'||process.env.AI_MODE==='local')
   return {...report,ai:{provider:'local' as const,text:'',fallbackReason:'local_only'}};
  if((process.env.AI_MODE||'free')!=='free')
   return {...report,ai:{provider:'local' as const,text:'',fallbackReason:'no_provider'}};
  const free=await generateFreeInterpretationDetailed(chart,birth.lang,{
   factsOverride:detailedReportFacts(chart,birth.lang),reportMode:true
  });
  return {...report,ai:free.result||{provider:'local' as const,text:'',fallbackReason:free.reason}};
 }

 /** Backward-compatible short reading: also stateless, no guest database write. */
 @Post('v1/interpretations')
 async interpret(@Body()birth:ReportDto){
  if(!allowInterpretation())throw new HttpException('Hourly interpretation limit reached.',HttpStatus.TOO_MANY_REQUESTS);
  let chart:CalculatedChart;
  try{chart=await runCalculation(birth);}
  catch(error){throw new BadRequestException(error instanceof Error?error.message:'Invalid birth input');}
  try{return await interpretChart(chart,birth.lang,birth.preferred||'auto');}
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

@Module({controllers:[JyotishController,AccountController],providers:[PrismaService]})
export class AppModule{}
