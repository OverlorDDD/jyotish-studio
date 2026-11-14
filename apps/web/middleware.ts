import {NextResponse} from 'next/server';
import type {NextRequest,NextFetchEvent} from 'next/server';
import {eligiblePublicHtmlSection,classifyReferralBucket} from './lib/visitor-analytics-policy';

/** Single public Jyotish website. Guest tools are available without login.
 * Protect user history at the NestJS API layer, not by hiding the entire site. */
export function middleware(request:NextRequest,event:NextFetchEvent){
 if(request.nextUrl.pathname.startsWith('/api/docs')){
  return new NextResponse('Not found',{status:404,headers:{'Cache-Control':'no-store'}});
 }
 const requestHeaders=new Headers(request.headers);
 // Trust the route, not an incoming client-supplied locale header.
 requestHeaders.set('x-galaxiora-locale',/^\/uk(?:\/|$)/.test(request.nextUrl.pathname)?'uk':'en');
 const response=NextResponse.next({request:{headers:requestHeaders}});
 // Count eligible HTTP document requests at the server edge, irrespective of GA4 consent.
 // Do not transmit source IP, cookies, raw URL, query or any visitor identifier.
 // Best-effort: a request counted here might later 404; bot UA filtering is imperfect.
 const secret=process.env.AUTH_SECRET;
 const section=request.method==='GET'&&secret&&secret.length>=24?
  eligiblePublicHtmlSection(request.nextUrl.pathname,{
   accept:request.headers.get('accept'),agent:request.headers.get('user-agent'),
   purpose:request.headers.get('purpose')||request.headers.get('sec-purpose'),
   routerPrefetch:request.headers.get('next-router-prefetch'),rsc:request.headers.get('rsc'),
   fetchDest:request.headers.get('sec-fetch-dest')
  }):null;
 if(section){
  event.waitUntil(fetch((process.env.INTERNAL_API_ORIGIN||'http://127.0.0.1:4000')+'/api/v1/internal/visitor-analytics/hit',{
   method:'POST',cache:'no-store',headers:{'Content-Type':'application/json','x-galaxiora-internal-key':secret!},
   // GalaxiNews «Найчитаніше»: the 8-hex story key from the public URL only.
   body:JSON.stringify({section,channel:classifyReferralBucket(request.headers.get('referer'),request.nextUrl.search),
    ...(section==='news'?{story:/^\/(?:uk|en)\/news\/[a-z0-9-]*-([0-9a-f]{8})$/.exec(request.nextUrl.pathname)?.[1]}:{})})
  }).then(()=>{}).catch(()=>{}));
 }
 // Never cache authenticated views or frequently changing user-generated feeds.
 // Public evergreen pages keep Next.js' own caching so search crawlers and
 // visitors are not forced through a cold response on every request.
 const path=request.nextUrl.pathname;
 const noCache=path==='/api'||path.startsWith('/api/')||
  (['uk','en'] as const).some(locale=>
   (['account','admin','personal','news','community'] as const).some(section=>
    path==='/'+locale+'/'+section||path.startsWith('/'+locale+'/'+section+'/')));
 if(noCache)response.headers.set('Cache-Control','no-store, max-age=0, must-revalidate');
 if(/^\/(?:uk|en)\/news(?:\/|$)/.test(request.nextUrl.pathname)){
  response.headers.set('X-Galaxiora-News-Revision','world-v1.8');
 }
 response.headers.set('X-Content-Type-Options','nosniff');
 response.headers.set('X-Frame-Options','DENY');
 response.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
 response.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
 if(process.env.SITE_NOINDEX==='1')response.headers.set('X-Robots-Tag','noindex, nofollow');
 return response;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
