/** Anonymous, coarse, request-level site counters. Not visitors, sessions or people.
 * One record per UTC date x allowlisted section x metric. No IP, URL, user ID,
 * cookies, fingerprint, referrer or headers are stored or logged here.
 */
import {Body,Controller,ForbiddenException,HttpCode,Inject,Post,Req} from '@nestjs/common';
import type {IncomingMessage} from 'node:http';
import {timingSafeEqual} from 'node:crypto';
import {PrismaService} from './prisma.ts';

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
function loopbackAddress(address:string|undefined){
 return address==='127.0.0.1'||address==='::1'||address==='::ffff:127.0.0.1';
}
function secretEquals(actual:unknown,secret:string|undefined){
 if(typeof actual!=='string'||!secret||secret.length<24)return false;
 const a=Buffer.from(actual,'utf8'),b=Buffer.from(secret,'utf8');
 return a.length===b.length&&timingSafeEqual(a,b);
}
@Controller('api/v1/internal/visitor-analytics')
export class InternalVisitorAnalyticsController {
 constructor(@Inject(PrismaService)private readonly prisma:PrismaService){}
 @Post('hit') @HttpCode(204)
 async hit(@Req()req:IncomingMessage,@Body()body:unknown){
  // No publicly callable, client-generated visitor counting.
  if(!loopbackAddress(req.socket.remoteAddress)||
   !secretEquals(req.headers['x-galaxiora-internal-key'],process.env.AUTH_SECRET))
   throw new ForbiddenException('Internal telemetry only');
  const section=(body as {section?:unknown}|null)?.section;
  if(!validSection(section))throw new ForbiddenException('Invalid aggregate section');
  await countVisitorAggregate(this.prisma,'public_html_request',section);
 }
}
Reflect.defineMetadata('design:paramtypes',[Object,Object],InternalVisitorAnalyticsController.prototype,'hit');
