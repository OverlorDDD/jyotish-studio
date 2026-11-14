/** Anonymous, coarse, request-level site counters. Not visitors, sessions or people.
 * One record per UTC date x allowlisted section x metric. No IP, URL, user ID,
 * cookies, fingerprint, referrer or headers are stored or logged here.
 */
import {Body,Controller,ForbiddenException,HttpCode,Inject,Post,Req} from '@nestjs/common';
import type {IncomingMessage} from 'node:http';
import {timingSafeEqual} from 'node:crypto';
import {PrismaService} from './prisma.ts';

import {countVisitorAggregate,countStoryRead,validSection,validReferralBucket,referralMetric} from './visitor-aggregate.ts';
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
