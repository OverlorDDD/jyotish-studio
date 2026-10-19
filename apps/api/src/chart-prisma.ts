/** Infrastructure adapter: tenant ownership checks live in every database query. */
import type {PrismaService} from './prisma.ts';
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import type {SavedChartPort,StoredChart} from './chart-application.ts';
export class PrismaSavedChartStore implements SavedChartPort{
 constructor(private readonly prisma:PrismaService){}
 count(ownerId:string){return this.prisma.chart.count({where:{ownerId}});}
 async list(ownerId:string):Promise<StoredChart[]>{
  const rows=await this.prisma.chart.findMany({where:{ownerId},orderBy:{createdAt:'desc'},
   select:{id:true,createdAt:true,input:true,result:true,savedReport:true},take:100});
  return rows as StoredChart[];
 }
 async find(ownerId:string,chartId:string):Promise<StoredChart|null>{
  const row=await this.prisma.chart.findFirst({where:{id:chartId,ownerId},
   select:{id:true,createdAt:true,input:true,result:true,savedReport:true}});
  return row as StoredChart|null;
 }
 async create(ownerId:string,chart:CalculatedChart,savedReport:unknown){
  const row=await this.prisma.chart.create({data:{
   ownerId,
   input:JSON.parse(JSON.stringify(chart.input)),
   result:JSON.parse(JSON.stringify(chart)),
   savedReport:JSON.parse(JSON.stringify(savedReport))
  }});
  return {id:row.id,createdAt:row.createdAt};
 }
 async delete(ownerId:string,chartId:string){
  const row=await this.prisma.chart.deleteMany({where:{id:chartId,ownerId}});
  return row.count===1;
 }
}
