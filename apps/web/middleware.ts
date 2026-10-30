import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';

/** Single public Jyotish website. Guest tools are available without login.
 * Protect user history at the NestJS API layer, not by hiding the entire site. */
export function middleware(request:NextRequest){
 if(request.nextUrl.pathname.startsWith('/api/docs')){
  return new NextResponse('Not found',{status:404,headers:{'Cache-Control':'no-store'}});
 }
 const requestHeaders=new Headers(request.headers);
 // Trust the route, not an incoming client-supplied locale header.
 requestHeaders.set('x-galaxiora-locale',/^\/uk(?:\/|$)/.test(request.nextUrl.pathname)?'uk':'en');
 const response=NextResponse.next({request:{headers:requestHeaders}});
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
