/** Anonymous, coarse, request-level site counters. Not visitors, sessions or people.
 * One record per UTC date x allowlisted section x metric. No IP, URL, user ID,
 * cookies, fingerprint, referrer or headers are stored or logged here.
 */
import {Body,Controller,ForbiddenException,HttpCode,Inject,Post,Req} from '@nestjs/common';
import type {IncomingMessage} from 'node:http';
import {timingSafeEqual} from 'node:crypto';
import {PrismaService} from './prisma.ts';

import {countVisitorAggregate,validSection} from './visitor-aggregate.ts';
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
