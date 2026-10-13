import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';

/** Single public Jyotish website. Guest tools are available without login.
 * Protect user history at the NestJS API layer, not by hiding the entire site. */
export function middleware(request:NextRequest){
 if(request.nextUrl.pathname.startsWith('/api/docs')){
  return new NextResponse('Not found',{status:404,headers:{'Cache-Control':'no-store'}});
 }
 const response=NextResponse.next();
 response.headers.set('Cache-Control','no-store');
 if(process.env.SITE_NOINDEX==='1')response.headers.set('X-Robots-Tag','noindex, nofollow');
 return response;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
