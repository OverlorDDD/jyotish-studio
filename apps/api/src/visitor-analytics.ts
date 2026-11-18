/** Anonymous, coarse, request-level site counters. Not visitors, sessions or people.
 * One record per UTC date x allowlisted section x metric. No IP, URL, user ID,
 * cookies, fingerprint, referrer or headers are stored or logged here.
 */
import {Body,Controller,ForbiddenException,HttpCode,Header,Inject,Post,Req} from '@nestjs/common';
import type {IncomingMessage} from 'node:http';
import {timingSafeEqual} from 'node:crypto';
import {PrismaService} from './prisma.ts';

import {countVisitorAggregate,countStoryRead,validSection,validReferralBucket,referralMetric,viewReferralMetric} from './visitor-aggregate.ts';
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
  const referral=(body as {channel?:unknown}|null)?.channel;
  if(validReferralBucket(referral)){
   // Same coarse UTC date/section aggregation: raw Referer and UTM values
   // are never transmitted to this controller or persisted in the database.
   await countVisitorAggregate(this.prisma,referralMetric(referral),section);
  }
  const story=(body as {story?:unknown}|null)?.story;
  if(section==='news'&&typeof story==='string'&&/^[0-9a-f]{8}$/.test(story)){
   // Only stories that exist and are published are counted.
   const exists=await this.prisma.newsArticle.count({where:{status:'PUBLISHED',id:{startsWith:story}}});
   if(exists===1)await countStoryRead(this.prisma,story);
  }
 }
}
Reflect.defineMetadata('design:paramtypes',[Object,Object],InternalVisitorAnalyticsController.prototype,'hit');

/**
 * Privacy-first browser page-view confirmation.
 * A route render can occur without a document HTTP request in Next.js.
 * Accept only three fixed categories from our own origin. No cookies, IDs, IPs,
 * paths, raw referrers, user agents, geo locations or personal data are stored.
 * This is a client-reported aggregate, NOT verified unique human visitors.
 */
@Controller('api/v1/traffic')
export class PublicPageViewController{
 constructor(@Inject(PrismaService)private readonly prisma:PrismaService){}
 @Post('page-view') @HttpCode(204) @Header('Cache-Control','no-store')
 async record(@Req()req:IncomingMessage,@Body()body:unknown){
  const origin=req.headers.origin;
  const ownOrigin=origin==='https://galaxiora.com'||
   (process.env.NODE_ENV!=='production'&&
    (origin==='http://localhost:3000'||origin==='http://127.0.0.1:3000'));
  // Requests from another site, a missing Origin or a non-fetch document
  // cannot increment our page-view counts from a regular browser.
  const fetchSite=req.headers['sec-fetch-site'],fetchDest=req.headers['sec-fetch-dest'];
  if(!ownOrigin||(fetchSite!==undefined&&fetchSite!=='same-origin')||
   (fetchDest!==undefined&&fetchDest!=='empty')||
   !String(req.headers['content-type']||'').startsWith('application/json'))
   throw new ForbiddenException('First-party aggregate only');
  const ua=String(req.headers['user-agent']||'');
  if(!ua||/(bot|crawler|spider|headless|lighthouse|curl|wget|python|playwright|selenium|axios|postman|monitor|uptime)/i.test(ua))return;
  if(!body||typeof body!=='object'||Array.isArray(body))throw new ForbiddenException('Invalid aggregate');
  const fields=Object.keys(body);
  if(fields.length!==3||!fields.includes('section')||!fields.includes('channel')||!fields.includes('locale'))
   throw new ForbiddenException('Unexpected analytics fields');
  const section=(body as {section:unknown}).section,channel=(body as {channel:unknown}).channel;
  const locale=(body as {locale:unknown}).locale;
  if(!validSection(section)||!validReferralBucket(channel)||(locale!=='en'&&locale!=='uk'))
   throw new ForbiddenException('Invalid analytics category');
  await countVisitorAggregate(this.prisma,'rendered_page_view',section);
  await countVisitorAggregate(this.prisma,viewReferralMetric(channel),section);
  await countVisitorAggregate(this.prisma,locale==='uk'?'rendered_locale_uk':'rendered_locale_en',section);
 }
}
Reflect.defineMetadata('design:paramtypes',[Object,Object],PublicPageViewController.prototype,'record');
