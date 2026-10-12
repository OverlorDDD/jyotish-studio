import {Body,Controller,Get,Post,Param,Module,Inject,Injectable,BadRequestException,NotFoundException,ServiceUnavailableException,OnModuleInit,OnModuleDestroy} from '@nestjs/common';
import {ApiProperty,ApiTags} from '@nestjs/swagger';
import {IsISO8601,IsNumber,IsOptional,IsString,Matches,Max,Min,MaxLength} from 'class-validator';
import {PrismaClient} from '@prisma/client';
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {runCalculation,interpretChart} from './logic.ts';
class BirthDto {
 @ApiProperty({example:'2000-01-01'}) @Matches(/^\d{4}-\d{2}-\d{2}$/) date!:string;
 @ApiProperty({example:'12:00'}) @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) time!:string;
 @ApiProperty({example:'Asia/Kolkata'}) @IsString() @MaxLength(80) timeZone!:string;
 @ApiProperty({example:28.6139}) @IsNumber() @Min(-90) @Max(90) latitude!:number;
 @ApiProperty({example:77.209}) @IsNumber() @Min(-180) @Max(180) longitude!:number;
 @IsOptional() @IsString() @MaxLength(120) place?:string;
}
class InterpretDto {
 @ApiProperty() @IsString() id!:string;
 @ApiProperty({example:'uk'}) @Matches(/^(uk|en)$/) lang!:'uk'|'en';
}
@Injectable()
class PrismaService extends PrismaClient implements OnModuleInit,OnModuleDestroy {
 async onModuleInit(){await this.$connect();}
 async onModuleDestroy(){await this.$disconnect();}
}
@ApiTags('Jyotish')
@Controller('api')
class JyotishController {
 constructor(@Inject(PrismaService) private readonly prisma:PrismaService){}
 @Get('health') async health(){try{await this.prisma.$queryRaw`SELECT 1`;return {status:'ok',service:'jyotish-nestjs',database:'connected'};}catch{throw new ServiceUnavailableException('Database not connected');}}
 @Post('v1/charts/calculate')
 async calculate(@Body() birth:BirthDto){
  let chart:CalculatedChart;
  try{chart=await runCalculation(birth);}catch(e){throw new BadRequestException(e instanceof Error?e.message:'Invalid birth data');}
  try {const row=await this.prisma.chart.create({data:{input:JSON.parse(JSON.stringify(chart.input)),result:JSON.parse(JSON.stringify(chart))}});return {id:row.id,...chart};}
  catch{throw new ServiceUnavailableException('Database unavailable. Run docker compose up -d db and npm run db:migrate');}
 }
 @Get('v1/charts/:id')async get(@Param('id') id:string){const row=await this.prisma.chart.findUnique({where:{id}});if(!row)throw new NotFoundException();return {id,...(row.result as object)};}
 @Get('v1/charts/:id/dashas')async dashas(@Param('id') id:string){const row=await this.prisma.chart.findUnique({where:{id}});if(!row)throw new NotFoundException();return {id,dasha:(row.result as unknown as CalculatedChart).dasha};}
 @Post('v1/interpretations')async interpret(@Body() body:InterpretDto){
  const row=await this.prisma.chart.findUnique({where:{id:body.id}});if(!row)throw new NotFoundException('Chart does not exist');
  const answer=await interpretChart(row.result as unknown as CalculatedChart,body.lang);
  await this.prisma.interpretation.create({data:{chartId:row.id,provider:answer.provider,language:body.lang,text:answer.text}});
  return answer;
 }
}
@Module({controllers:[JyotishController],providers:[PrismaService]})export class AppModule{}
