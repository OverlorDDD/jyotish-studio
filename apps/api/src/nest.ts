import {Body,Controller,Get,Post,Param,Module,Inject,Injectable,BadRequestException,NotFoundException,ServiceUnavailableException,HttpException,HttpStatus,OnModuleInit,OnModuleDestroy} from '@nestjs/common';
import {ApiProperty,ApiTags} from '@nestjs/swagger';
import {IsISO8601,IsNumber,IsOptional,IsString,Matches,Max,Min,MaxLength} from 'class-validator';
import {PrismaClient} from '@prisma/client';
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {runCalculation,interpretChart} from './logic.ts';
import {AiProviderError,createHourlyLimiter,explainAiFailure} from './ai.ts';
import {buildDetailedReport,detailedReportFacts} from './report.ts';
import {generateFreeInterpretationDetailed} from './free-ai.ts';
// Short-lived, per-process protection for a passwordless portfolio preview.
const allowPublicCalculation=createHourlyLimiter(60);
const allowPublicInterpretation=createHourlyLimiter(30);
class BirthDto {
 @ApiProperty({type:String,example:'2000-01-01'}) @Matches(/^\d{4}-\d{2}-\d{2}$/) date!:string;
 @ApiProperty({type:String,example:'12:00'}) @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) time!:string;
 @ApiProperty({type:String,example:'Asia/Kolkata'}) @IsString() @MaxLength(80) timeZone!:string;
 @ApiProperty({type:Number,example:28.6139}) @IsNumber() @Min(-90) @Max(90) latitude!:number;
 @ApiProperty({type:Number,example:77.209}) @IsNumber() @Min(-180) @Max(180) longitude!:number;
 @IsOptional() @IsString() @MaxLength(120) place?:string;
}
class InterpretDto {
 @ApiProperty({type:String}) @IsString() id!:string;
 @ApiProperty({type:String,example:'uk'}) @Matches(/^(uk|en)$/) lang!:'uk'|'en';
 @ApiProperty({type:String,required:false,enum:['auto','local']}) @IsOptional() @Matches(/^(auto|local)$/) preferred?:'auto'|'local';
}
@Injectable()
class PrismaService extends PrismaClient implements OnModuleInit,OnModuleDestroy {
 async onModuleInit(){await this.$connect();}
 async onModuleDestroy(){await this.$disconnect();}
}
@ApiTags('Jyotish')
@Controller('api')
export class JyotishController {
 constructor(@Inject(PrismaService) private readonly prisma:PrismaService){}
 @Get('health') async health(){try{await this.prisma.$queryRaw`SELECT 1`;return {status:'ok',service:'jyotish-nestjs',database:'connected'};}catch{throw new ServiceUnavailableException('Database not connected');}}
 @Post('v1/charts/calculate')
 async calculate(@Body() birth:BirthDto){
  if(process.env.PUBLIC_DEMO==='1'&&!allowPublicCalculation())throw new HttpException('Public demo hourly chart limit reached. Try again later.',HttpStatus.TOO_MANY_REQUESTS);
  let chart:CalculatedChart;
  try{chart=await runCalculation(birth);}catch(e){throw new BadRequestException(e instanceof Error?e.message:'Invalid birth data');}
  try {const row=await this.prisma.chart.create({data:{input:JSON.parse(JSON.stringify(chart.input)),result:JSON.parse(JSON.stringify(chart))}});return {id:row.id,...chart};}
  catch{throw new ServiceUnavailableException('Database unavailable. Run docker compose up -d db and npm run db:migrate');}
 }
 @Get('v1/charts/:id')async get(@Param('id') id:string){const row=await this.prisma.chart.findUnique({where:{id}});if(!row)throw new NotFoundException();return {id,...(row.result as object)};}
 @Get('v1/charts/:id/dashas')async dashas(@Param('id') id:string){const row=await this.prisma.chart.findUnique({where:{id}});if(!row)throw new NotFoundException();return {id,dasha:(row.result as unknown as CalculatedChart).dasha};}
 @Post('v1/reports')async detailedReport(@Body() body:InterpretDto){
  if(process.env.PUBLIC_DEMO==='1'&&!allowPublicInterpretation())
   throw new HttpException('Public demo hourly report limit reached. Try later.',HttpStatus.TOO_MANY_REQUESTS);
  const row=await this.prisma.chart.findUnique({where:{id:body.id}});
  if(!row)throw new NotFoundException('Chart does not exist');
  const chart=row.result as unknown as CalculatedChart;
  const report=buildDetailedReport(chart,body.lang);
  if(body.preferred==='local'||process.env.AI_MODE==='local'){
   return {...report,ai:{provider:'local' as const,text:'',fallbackReason:'local_only'}};
  }
  // Deliberately refuse paid OpenAI on this report endpoint, even when legacy
  // settings are enabled. Detailed reports have zero-cost/free inference only.
  if((process.env.AI_MODE||'free')!=='free'){
   return {...report,ai:{provider:'local' as const,text:'',fallbackReason:'no_provider'}};
  }
  const free=await generateFreeInterpretationDetailed(chart,body.lang,{
   factsOverride:detailedReportFacts(chart,body.lang),reportMode:true
  });
  return {...report,ai:free.result||{provider:'local' as const,text:'',fallbackReason:free.reason}};
 }
 @Post('v1/interpretations')async interpret(@Body() body:InterpretDto){
  if(process.env.PUBLIC_DEMO==='1'&&!allowPublicInterpretation())throw new HttpException('Public demo hourly interpretation limit reached. Try again later.',HttpStatus.TOO_MANY_REQUESTS);
  const row=await this.prisma.chart.findUnique({where:{id:body.id}});if(!row)throw new NotFoundException('Chart does not exist');
  let answer:Awaited<ReturnType<typeof interpretChart>>;
  try {answer=await interpretChart(row.result as unknown as CalculatedChart,body.lang,body.preferred||'auto');}
  catch(error){
   if(error instanceof AiProviderError){
    if(error.reason==='limit')throw new HttpException(error.message,HttpStatus.TOO_MANY_REQUESTS);
    throw new ServiceUnavailableException(explainAiFailure(error));
   }
   throw error;
  }
  await this.prisma.interpretation.create({data:{chartId:row.id,provider:answer.provider,language:body.lang,text:answer.text}});
  return answer;
 }
}
/**
 * tsx uses esbuild, which doesn't emit TypeScript's legacy design:paramtypes metadata
 * even when emitDecoratorMetadata is enabled in tsconfig. Nest's route decorators
 * still work, but @nestjs/swagger and ValidationPipe require these runtime types.
 * Define the parameter types explicitly for each decorated handler so Swagger
 * bootstrap and DTO validation work in development and compiled deployments.
 */
for(const [method,types] of [
 ['calculate',[BirthDto]],
 ['get',[String]],
 ['dashas',[String]],
 ['detailedReport',[InterpretDto]],
 ['interpret',[InterpretDto]]
] as const){
 Reflect.defineMetadata('design:paramtypes',types,JyotishController.prototype,method);
}

@Module({controllers:[JyotishController],providers:[PrismaService]})export class AppModule{}
