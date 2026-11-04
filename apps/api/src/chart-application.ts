/** Saved chart application boundary: no database client, Nest or HTTP dependency. */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
export const CHART_USE_CASES='CHART_USE_CASES';
export type SaveChartInput={
 date:string;time:string;timeZone:string;latitude:number;longitude:number;place?:string;
 asOf?:string;language?:'uk'|'en';aiProvider?:'local'|'openrouter'|'ollama'|'gemini'|'groq';aiText?:string;aiModel?:string;
};
export type StoredChart={
 id:string;createdAt:Date;input:unknown;result:unknown;savedReport:unknown;
};
export interface SavedChartPort{
 count(ownerId:string):Promise<number>;
 list(ownerId:string):Promise<StoredChart[]>;
 find(ownerId:string,chartId:string):Promise<StoredChart|null>;
 create(ownerId:string,chart:CalculatedChart,savedReport:unknown):Promise<{id:string;createdAt:Date}>;
 delete(ownerId:string,chartId:string):Promise<boolean>;
}
export type ChartCalculator=(input:SaveChartInput)=>Promise<CalculatedChart>;
export type ChartReportBuilder=(chart:CalculatedChart,lang:'uk'|'en',asOf:string)=>unknown;
export type ChartFailure='limit'|'not_found'|'invalid_birth';
export class SavedChartError extends Error{
 readonly code:ChartFailure;
 constructor(code:ChartFailure,message:string){super(message);this.code=code;this.name='SavedChartError';}
}
export class SavedChartUseCases{
 private readonly store:SavedChartPort;
 private readonly calculate:ChartCalculator;
 private readonly report:ChartReportBuilder;
 private readonly now:()=>Date;
 constructor(store:SavedChartPort,calculate:ChartCalculator,report:ChartReportBuilder,now:()=>Date=()=>new Date()){
  this.store=store;this.calculate=calculate;this.report=report;this.now=now;
 }
 async list(ownerId:string){
  const rows=await this.store.list(ownerId);
  return rows.map(row=>{
   const result=row.result as {ascendant?:{signName?:string}};
   const input=row.input as {date?:string;place?:string};
   return {id:row.id,createdAt:row.createdAt,place:input.place||'',date:input.date||'',
    ascendant:result.ascendant?.signName||'',hasReport:Boolean(row.savedReport)};
  });
 }
 async save(ownerId:string,body:SaveChartInput){
  if(await this.store.count(ownerId)>=100)
   throw new SavedChartError('limit','Your account has reached its 100-chart limit. Delete an old chart first.');
  let chart:CalculatedChart;
  try{chart=await this.calculate(body);}
  catch(error){throw new SavedChartError('invalid_birth',error instanceof Error?error.message:'Invalid birth data');}
  const snapshot=this.report(chart,body.language||'uk',body.asOf||this.now().toISOString().slice(0,10));
  const ai=body.aiProvider&&body.aiProvider!=='local'&&body.aiText?
   {provider:body.aiProvider,model:body.aiModel||'',text:body.aiText}:
   {provider:'local',text:'',fallbackReason:'local_only'};
  return this.store.create(ownerId,chart,{...(snapshot as object),readerVersion:'6.0.0',verification:(chart as CalculatedChart&{verification?:unknown}).verification,ai:{...ai,source:ai.provider==='local'?'deterministic':'llm'}});
 }
 private async read(ownerId:string,chartId:string){
  const row=await this.store.find(ownerId,chartId);
  if(!row)throw new SavedChartError('not_found','This chart is not available in your account.');
  return row;
 }
 async detail(ownerId:string,chartId:string){
  const row=await this.read(ownerId,chartId);
  return {id:row.id,createdAt:row.createdAt,chart:{id:row.id,...(row.result as object)},report:row.savedReport};
 }
 async legacy(ownerId:string,chartId:string){
  const row=await this.read(ownerId,chartId);
  return {id:chartId,...(row.result as object)};
 }
 async dashas(ownerId:string,chartId:string){
  const row=await this.read(ownerId,chartId);
  return {id:chartId,dasha:(row.result as {dasha:unknown}).dasha};
 }
 async remove(ownerId:string,chartId:string){
  if(!await this.store.delete(ownerId,chartId))
   throw new SavedChartError('not_found','This chart is not available in your account.');
  return {deleted:true};
 }
}
