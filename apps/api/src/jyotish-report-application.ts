/** Pure application coordinator for deterministic, server-side Jyotish facts. */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import type {ChartCalculator,SaveChartInput,ChartReportBuilder} from './chart-application.ts';
export const JYOTISH_REPORT_USE_CASES='JYOTISH_REPORT_USE_CASES';
export class JyotishReportUseCases{
 private readonly calculateChart:ChartCalculator;
 private readonly buildReport:ChartReportBuilder;
 private readonly now:()=>Date;
 constructor(calculate:ChartCalculator,report:ChartReportBuilder,now:()=>Date=()=>new Date()){
  this.calculateChart=calculate;this.buildReport=report;this.now=now;
 }
 calculate(input:SaveChartInput){return this.calculateChart(input);}
 async prepare(input:SaveChartInput,lang:'uk'|'en'){
  const chart:CalculatedChart=await this.calculateChart(input);
  const asOf=input.asOf||this.now().toISOString().slice(0,10);
  const report=this.buildReport(chart,lang,asOf);
  return {chart,report,asOf};
 }
}
