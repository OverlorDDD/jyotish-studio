/** Anonymous date/category counters; no personal identifiers. */
import type {PrismaService} from './prisma.ts';
export const VISITOR_METRICS=[
 'public_html_request','jyotish_chart_completed','tarot_spread_completed','panchanga_calculation_completed'
] as const;
export type VisitorMetric=typeof VISITOR_METRICS[number];
export const VISITOR_SECTIONS=[
 'home','about','astrology','jyotish','tarot','tarot_cards','panchanga','eclipses',
 'horoscope','yoga','learn','news','community','methodology','tools'
] as const;
export function validSection(x:unknown):x is typeof VISITOR_SECTIONS[number]{
 return typeof x==='string'&&(VISITOR_SECTIONS as readonly string[]).includes(x);
}
export function toolMetric(method:string,url:string):VisitorMetric|null{
 if(method==='POST'&&url==='/api/v1/charts/calculate')return 'jyotish_chart_completed';
 if(method==='POST'&&url==='/api/v1/tarot/readings')return 'tarot_spread_completed';
 if(method==='GET'&&(url==='/api/v1/panchanga/day'||url==='/api/v1/panchanga/range'))
  return 'panchanga_calculation_completed';
 return null;
}
export async function countVisitorAggregate(prisma:PrismaService,metric:VisitorMetric,section:string){
 if(!VISITOR_METRICS.includes(metric)||!validSection(section))throw Error('Invalid visitor category');
 const day=new Date();
 day.setUTCHours(0,0,0,0);
 await prisma.visitorAggregate.upsert({
  where:{day_section_metric:{day,section,metric}},
  create:{day,section,metric,count:1},
  update:{count:{increment:1}}
 });
}
