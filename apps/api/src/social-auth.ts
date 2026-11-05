/** Optional first-party Google / Apple OIDC sign-in.
 * No provider button or external request until its server credentials are configured.
 * Identity is (provider, verified sub), NEVER a matching email address alone.
 */
import {Controller,Get,Post,Param,Query,Req,Res,Inject,ForbiddenException,ServiceUnavailableException} from '@nestjs/common';
import type {IncomingMessage,ServerResponse} from 'node:http';
import {createHash,createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {createRemoteJWKSet,importPKCS8,jwtVerify,SignJWT} from 'jose';
import {PrismaService} from './prisma.ts';
import {authReady,cookieHeader,cookieUser,normalizedEmail,sameOrigin,sessionToken} from './auth.ts';

export type SocialProvider='google'|'apple';
type Flow={provider:SocialProvider;state:string;nonce:string;verifier:string;locale:'uk'|'en';actor:string|null;exp:number};
type Identity={provider:SocialProvider;subject:string;email:string|null};
class SocialAuthError extends Error{
 constructor(readonly code:string){super(code);}
}
const PROVIDERS=['google','apple'] as const;
const TTL=10*60_000;
const GOOGLE_KEYS=createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const APPLE_KEYS=createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
function providerName(value:string):SocialProvider{
 if(!PROVIDERS.includes(value as SocialProvider))throw new SocialAuthError('unknown_provider');
 return value as SocialProvider;
}
export function providerConfig(provider:SocialProvider){
 if(!authReady())return false;
 if(provider==='google')return !!(process.env.GOOGLE_OAUTH_CLIENT_ID&&process.env.GOOGLE_OAUTH_CLIENT_SECRET);
 const path=process.env.APPLE_OAUTH_PRIVATE_KEY_FILE;
 return !!(process.env.APPLE_OAUTH_SERVICE_ID&&process.env.APPLE_OAUTH_TEAM_ID&&
  process.env.APPLE_OAUTH_KEY_ID&&path&&existsSync(path));
}
function publicOrigin(){
 const origin=(process.env.OAUTH_PUBLIC_ORIGIN||process.env.NEXT_PUBLIC_SITE_URL||'https://galaxiora.com').replace(/\/$/,'');
 if(origin==='https://galaxiora.com')return origin;
 if(process.env.NODE_ENV!=='production'&&/^http:\/\/(?:localhost|127\.0\.0\.1):3000$/.test(origin))return origin;
 throw new SocialAuthError('invalid_origin');
}
function secret(){
 const key=process.env.AUTH_SECRET||'';
 if(key.length<32)throw new SocialAuthError('not_configured');
 return key;
}
function cookieName(provider:SocialProvider){return 'galaxiora_oidc_'+provider;}
export function signFlow(flow:Flow){
 const data=Buffer.from(JSON.stringify(flow)).toString('base64url');
 const signature=createHmac('sha256',secret()).update(data).digest('base64url');
 return data+'.'+signature;
}
export function validFlow(raw:string|undefined,provider:SocialProvider,state:unknown,now=Date.now()):Flow{
 if(typeof raw!=='string'||raw.length>3000||typeof state!=='string'||state.length>250)
  throw new SocialAuthError('invalid_state');
 const parts=raw.split('.');
 if(parts.length!==2)throw new SocialAuthError('invalid_state');
 const expected=createHmac('sha256',secret()).update(parts[0]).digest();
 let actual:Buffer;
 try{actual=Buffer.from(parts[1],'base64url');}
 catch{throw new SocialAuthError('invalid_state');}
 if(expected.length!==actual.length||!timingSafeEqual(expected,actual))throw new SocialAuthError('invalid_state');
 let flow:Flow;
 try{flow=JSON.parse(Buffer.from(parts[0],'base64url').toString('utf8')) as Flow;}
 catch{throw new SocialAuthError('invalid_state');}
 if(flow.provider!==provider||flow.state!==state||typeof flow.exp!=='number'||flow.exp<now||
  flow.exp>now+TTL+30_000||typeof flow.nonce!=='string'||flow.nonce.length<24||
  typeof flow.verifier!=='string'||flow.verifier.length<24||
  !['uk','en'].includes(flow.locale)||
  (flow.actor!==null&&(typeof flow.actor!=='string'||!/^[a-f0-9-]{32,40}$/i.test(flow.actor))))
  throw new SocialAuthError('invalid_state');
 return flow;
}
function cookieValue(req:IncomingMessage,provider:SocialProvider){
 const name=cookieName(provider)+'=';
 const pair=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name));
 return pair?.slice(name.length);
}
export function flowCookie(provider:SocialProvider,token:string,origin:string){
 const secure=origin.startsWith('https:');
 return cookieName(provider)+'='+token+'; Path=/api/v1/account/oauth; Max-Age=600; HttpOnly; '+
  (provider==='apple'?'SameSite=None; ':'SameSite=Lax; ')+(secure?'Secure; ':'');
}
export function clearedCookie(provider:SocialProvider,origin:string){
 return cookieName(provider)+'=; Path=/api/v1/account/oauth; Max-Age=0; HttpOnly; '+
  (provider==='apple'?'SameSite=None; ':'SameSite=Lax; ')+(origin.startsWith('https:')?'Secure; ':'');
}
function redirect(res:ServerResponse,target:string,post=false){
 res.statusCode=post?303:302;
 res.setHeader('Location',target);
 res.setHeader('Cache-Control','no-store');
 res.setHeader('Referrer-Policy','no-referrer');
 res.end();
}
function callbackUrl(provider:SocialProvider){return publicOrigin()+'/api/v1/account/oauth/'+provider+'/callback';}
function authorizeUrl(provider:SocialProvider,flow:Flow){
 const id=provider==='google'?process.env.GOOGLE_OAUTH_CLIENT_ID!:process.env.APPLE_OAUTH_SERVICE_ID!;
 const url=new URL(provider==='google'?'https://accounts.google.com/o/oauth2/v2/auth':'https://appleid.apple.com/auth/authorize');
 url.searchParams.set('client_id',id);
 url.searchParams.set('redirect_uri',callbackUrl(provider));
 url.searchParams.set('response_type','code');
 url.searchParams.set('scope',provider==='google'?'openid email profile':'email');
 url.searchParams.set('state',flow.state);
 url.searchParams.set('nonce',flow.nonce);
 if(provider==='google'){
  url.searchParams.set('code_challenge',createHash('sha256').update(flow.verifier).digest('base64url'));
  url.searchParams.set('code_challenge_method','S256');
 }else{
  // Apple requires form_post for the email scope. The flow cookie must be
  // SameSite=None+Secure to return on this cross-site POST.
  url.searchParams.set('response_mode','form_post');
 }
 return url.toString();
}
async function clientSecret(provider:SocialProvider){
 if(provider==='google')return process.env.GOOGLE_OAUTH_CLIENT_SECRET!;
 const path=process.env.APPLE_OAUTH_PRIVATE_KEY_FILE!;
 let key:string;
 try{key=readFileSync(path,'utf8');}catch{throw new SocialAuthError('not_configured');}
 const privateKey=await importPKCS8(key,'ES256');
 return new SignJWT({})
  .setProtectedHeader({alg:'ES256',kid:process.env.APPLE_OAUTH_KEY_ID!})
  .setIssuer(process.env.APPLE_OAUTH_TEAM_ID!)
  .setSubject(process.env.APPLE_OAUTH_SERVICE_ID!)
  .setAudience('https://appleid.apple.com')
  .setIssuedAt().setExpirationTime('5m')
  .sign(privateKey);
}
async function exchange(provider:SocialProvider,code:string,flow:Flow):Promise<Identity>{
 const clientId=provider==='google'?process.env.GOOGLE_OAUTH_CLIENT_ID!:process.env.APPLE_OAUTH_SERVICE_ID!;
 const params=new URLSearchParams({
  grant_type:'authorization_code',code,redirect_uri:callbackUrl(provider),
  client_id:clientId,client_secret:await clientSecret(provider)
 });
 if(provider==='google')params.set('code_verifier',flow.verifier);
 const endpoint=provider==='google'?'https://oauth2.googleapis.com/token':'https://appleid.apple.com/auth/token';
 let token:Record<string,unknown>;
 try{
  const response=await fetch(endpoint,{method:'POST',
   headers:{'Content-Type':'application/x-www-form-urlencoded'},
   body:params,signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw new Error('token exchange rejected');
  token=await response.json() as Record<string,unknown>;
 }catch{throw new SocialAuthError('provider_failed');}
 if(typeof token.id_token!=='string'||token.id_token.length>12000)throw new SocialAuthError('provider_failed');
 let claims:Record<string,unknown>;
 try{
  const verified=await jwtVerify(token.id_token,provider==='google'?GOOGLE_KEYS:APPLE_KEYS,{
   algorithms:['RS256'],
   issuer:provider==='google'?['https://accounts.google.com','accounts.google.com']:'https://appleid.apple.com',
   audience:clientId,
   clockTolerance:5
  });
  claims=verified.payload;
 }catch{throw new SocialAuthError('invalid_token');}
 if(typeof claims.sub!=='string'||claims.sub.length<1||claims.sub.length>255||
  claims.nonce!==flow.nonce)throw new SocialAuthError('invalid_token');
 const verified=claims.email_verified===true||claims.email_verified==='true';
 const email=typeof claims.email==='string'?normalizedEmail(claims.email):'';
 const usable=verified&&email.length<=150&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
 return {provider,subject:claims.sub,email:usable?email:null};
}
export function oauthErrorMessage(code:string){
 const allowed=new Set(['not_configured','invalid_origin','invalid_state','invalid_token','provider_failed',
  'existing_email','email_unverified','link_conflict','no_link_session','unknown_provider','cancelled','try_again']);
 return allowed.has(code)?code:'try_again';
}
function callbackParams(data:unknown){
 const body=data&&typeof data==='object'?data as Record<string,unknown>:{};
 return {code:body.code,state:body.state,error:body.error};
}

@Controller('api/v1/account/oauth')
export class SocialAuthController {
 constructor(@Inject(PrismaService)private readonly prisma:PrismaService){}
 @Get('providers')
 async providers(@Req()req:IncomingMessage){
  const userId=cookieUser(req);
  const linked=userId?await this.prisma.externalIdentity.findMany({
   where:{userId},select:{provider:true}
  }):[];
  return {google:providerConfig('google'),apple:providerConfig('apple'),
   linked:linked.map(x=>x.provider)};
 }
 private begin(res:ServerResponse,provider:SocialProvider,locale:'en'|'uk',actor:string|null){
  if(!providerConfig(provider))throw new ServiceUnavailableException('Sign-in provider is not configured');
  const flow:Flow={provider,state:randomBytes(24).toString('base64url'),
   nonce:randomBytes(24).toString('base64url'),
   verifier:randomBytes(32).toString('base64url'),
   locale,actor,exp:Date.now()+TTL};
  res.setHeader('Set-Cookie',flowCookie(provider,signFlow(flow),publicOrigin()));
  res.setHeader('Cache-Control','no-store');
  return authorizeUrl(provider,flow);
 }
 @Get(':provider/start')
 start(@Param('provider')name:string,@Query('locale')rawLocale:string,
  @Req()_req:IncomingMessage,@Res()res:ServerResponse){
  const provider=providerName(name),locale=rawLocale==='uk'?'uk':'en';
  redirect(res,this.begin(res,provider,locale,null));
 }
 @Post(':provider/link')
 link(@Param('provider')name:string,@Req()req:IncomingMessage&{body?:unknown},
  @Res({passthrough:true})res:ServerResponse){
  if(!sameOrigin(req))throw new ForbiddenException('Cross-site linking denied');
  const actor=cookieUser(req);
  if(!actor)throw new ForbiddenException('Sign in first to link a provider');
  const body=req.body&&typeof req.body==='object'?req.body as {locale?:unknown}:{};
  const locale=body.locale==='uk'?'uk':'en';
  const provider=providerName(name);
  return {url:this.begin(res,provider,locale,actor)};
 }
 @Get(':provider/callback')
 async callbackGet(@Param('provider')name:string,@Req()req:IncomingMessage,
  @Res()res:ServerResponse){
  if(name!=='google')throw new ForbiddenException('Callback method not supported');
  const uri=new URL(req.url||'/',publicOrigin());
  await this.complete('google',{state:uri.searchParams.get('state'),code:uri.searchParams.get('code'),
   error:uri.searchParams.get('error')},req,res,false);
 }
 @Post(':provider/callback')
 async callbackPost(@Param('provider')name:string,@Req()req:IncomingMessage&{body?:unknown},
  @Res()res:ServerResponse){
  if(name!=='apple')throw new ForbiddenException('Callback method not supported');
  if(!String(req.headers['content-type']||'').startsWith('application/x-www-form-urlencoded'))
   throw new ForbiddenException('Unexpected callback encoding');
  await this.complete('apple',callbackParams(req.body),req,res,true);
 }
 private async complete(provider:SocialProvider,params:{state:unknown;code:unknown;error:unknown},
  req:IncomingMessage,res:ServerResponse,post:boolean){
  const raw=cookieValue(req,provider);
  const origin=publicOrigin();
  // Invalidate the one-time browser binding even on failed provider responses.
  const clear=clearedCookie(provider,origin);
  let locale:'en'|'uk'='en';
  try{
   const flow=validFlow(raw,provider,params.state);
   locale=flow.locale;
   if(params.error)throw new SocialAuthError('cancelled');
   if(!providerConfig(provider))throw new SocialAuthError('not_configured');
   if(typeof params.code!=='string'||params.code.length<8||params.code.length>2048)
    throw new SocialAuthError('provider_failed');
   const identity=await exchange(provider,params.code,flow);
   const userId=await this.prisma.$transaction(async tx=>{
    const prior=await tx.externalIdentity.findUnique({
     where:{provider_subject:{provider,subject:identity.subject}},
     select:{userId:true}
    });
    if(flow.actor){
     const owner=await tx.user.findUnique({where:{id:flow.actor},select:{id:true}});
     if(!owner)throw new SocialAuthError('no_link_session');
     if(prior&&prior.userId!==flow.actor)throw new SocialAuthError('link_conflict');
     if(identity.email){
      const emailOwner=await tx.user.findUnique({where:{email:identity.email},select:{id:true}});
      if(emailOwner&&emailOwner.id!==flow.actor)throw new SocialAuthError('link_conflict');
     }
     if(!prior)await tx.externalIdentity.create({data:{provider,subject:identity.subject,userId:flow.actor}});
     return flow.actor;
    }
    if(prior)return prior.userId;
    if(!identity.email)throw new SocialAuthError('email_unverified');
    const existing=await tx.user.findUnique({where:{email:identity.email},select:{id:true}});
    if(existing)throw new SocialAuthError('existing_email');
    const created=await tx.user.create({data:{email:identity.email,passwordHash:null,role:'MEMBER'},
     select:{id:true}});
    await tx.externalIdentity.create({data:{provider,subject:identity.subject,userId:created.id}});
    return created.id;
   });
   if(flow.actor){
    res.setHeader('Set-Cookie',clear);
   }else{
    res.setHeader('Set-Cookie',[cookieHeader(sessionToken(userId),req),clear]);
   }
   redirect(res,origin+'/'+locale+'/account?oauth=success',post);
  }catch(error){
   const code=error instanceof SocialAuthError?error.code:'try_again';
   res.setHeader('Set-Cookie',clear);
   redirect(res,origin+'/'+locale+'/?oauth_error='+encodeURIComponent(oauthErrorMessage(code)),post);
  }
 }
}
// tsx/esbuild does not generate decorator method paramtypes; supply runtime reflection.
for(const [method,types] of [
 ['providers',[Object]],['start',[String,String,Object,Object]],
 ['link',[String,Object,Object]],['callbackGet',[String,Object,Object]],
 ['callbackPost',[String,Object,Object]]
] as const)Reflect.defineMetadata('design:paramtypes',types,SocialAuthController.prototype,method);
