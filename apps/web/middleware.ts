import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';

export function middleware(request:NextRequest){
 const user=process.env.DEMO_ACCESS_USER||'';
 const password=process.env.DEMO_ACCESS_PASSWORD||'';
 const forwarded=request.headers.get('x-forwarded-host')||request.headers.get('host')||'';
 const hostname=forwarded.split(',')[0].trim().split(':')[0].toLowerCase();
 const local=hostname==='localhost'||hostname==='127.0.0.1'||hostname==='[::1]';
 // Deny-by-default for external hostnames without demo credentials.
 if(!user||!password){
   return local?NextResponse.next():new NextResponse('External preview is disabled. Set DEMO_ACCESS_USER and DEMO_ACCESS_PASSWORD before tunneling.',{status:503,headers:{'Cache-Control':'no-store'}});
 }
 const auth=request.headers.get('authorization')||'';
 const expected='Basic '+btoa(`${user}:${password}`);
 if(auth!==expected)return new NextResponse('Jyotish Studio — private demo. Authentication required.',{status:401,headers:{'WWW-Authenticate':'Basic realm="Jyotish Studio demo"','Cache-Control':'no-store'}});
 return NextResponse.next();
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
