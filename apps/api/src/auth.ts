import {createHmac,randomBytes,scrypt as scryptCallback,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import type {IncomingMessage,ServerResponse} from 'node:http';
const scrypt=promisify(scryptCallback);
const COOKIE='jyotish_session';
const SEVEN_DAYS=7*24*60*60*1000;
const key=()=>process.env.AUTH_SECRET?.trim()||'';
export function authReady(){return key().length>=32;}
export function normalizedEmail(email:string){return email.trim().toLowerCase();}
export async function passwordHash(password:string){
 const salt=randomBytes(16).toString('hex');
 const derived=(await scrypt(password,salt,64)) as Buffer;
 return 'scrypt$'+salt+'$'+derived.toString('hex');
}
export async function passwordMatches(password:string,stored:string){
 const parts=stored.split('$');
 if(parts.length!==3||parts[0]!=='scrypt')return false;
 const expected=Buffer.from(parts[2],'hex');
 if(expected.length!==64)return false;
 const actual=(await scrypt(password,parts[1],64)) as Buffer;
 return timingSafeEqual(actual,expected);
}
export function sessionToken(userId:string,now=Date.now()){
 if(!authReady())throw new Error('AUTH_SECRET is not configured (32+ chars)');
 const payload=Buffer.from(JSON.stringify({sub:userId,exp:now+SEVEN_DAYS})).toString('base64url');
 const sig=createHmac('sha256',key()).update(payload).digest('base64url');
 return payload+'.'+sig;
}
export function sessionUser(token:string|undefined,now=Date.now()){
 if(!authReady()||!token||token.length>1000)return null;
 const bits=token.split('.');
 if(bits.length!==2)return null;
 const signed=createHmac('sha256',key()).update(bits[0]).digest();
 let submitted:Buffer;
 try{submitted=Buffer.from(bits[1],'base64url');}
 catch{return null;}
 if(submitted.length!==signed.length||!timingSafeEqual(submitted,signed))return null;
 try{
  const parsed=JSON.parse(Buffer.from(bits[0],'base64url').toString('utf8')) as {sub?:unknown;exp?:unknown};
  if(typeof parsed.sub!=='string'||!/^[-a-z0-9]{10,60}$/i.test(parsed.sub))return null;
  return typeof parsed.exp==='number'&&parsed.exp>now?parsed.sub:null;
 }catch{return null;}
}
export function cookieUser(req:IncomingMessage,now=Date.now()){
 const raw=req.headers.cookie||'';
 const value=raw.split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
 return sessionUser(value,now);
}
export function cookieHeader(token:string,request:IncomingMessage,maxAgeSeconds=SEVEN_DAYS/1000){
 const forwarded=request.headers['x-forwarded-proto'];
 const encrypted=process.env.SESSION_COOKIE_SECURE==='1'||Boolean((request.socket as {encrypted?:boolean}|undefined)?.encrypted)||String(Array.isArray(forwarded)?forwarded[0]:forwarded||'').split(',')[0].trim()==='https';
 return COOKIE+'='+token+'; Path=/; HttpOnly; SameSite=Lax; Max-Age='+maxAgeSeconds+(encrypted?'; Secure':'');
}
export function setSession(res:ServerResponse,req:IncomingMessage,token:string){
 res.setHeader('Set-Cookie',cookieHeader(token,req));
 res.setHeader('Cache-Control','no-store');
}
export function clearSession(res:ServerResponse,req:IncomingMessage){
 res.setHeader('Set-Cookie',cookieHeader('',req,0));
 res.setHeader('Cache-Control','no-store');
}
/** Defend account mutations against cross-site browser POSTs (cookies alone are not sufficient). */
export function sameOrigin(req:IncomingMessage){
 const origin=req.headers.origin;
 // Fetch Metadata blocks cross-site browser writes even if Origin is stripped.
 // Node scripts/curl without either header remain supported for local diagnostics.
 const fetchSite=req.headers['sec-fetch-site'];
 if(fetchSite==='cross-site'||fetchSite==='same-site')return false;
 if(!origin)return fetchSite===undefined||fetchSite==='same-origin'||fetchSite==='none';
 try{
  const parsed=new URL(origin);
  if(!['http:','https:'].includes(parsed.protocol))return false;
  const forwards=req.headers['x-forwarded-host'];
  const host=String(Array.isArray(forwards)?forwards[0]:forwards||req.headers.host||'').split(',')[0].trim().toLowerCase();
  if(parsed.host.toLowerCase()===host)return true;
  // Next.js rewrites to a loopback-only NestJS listener. Some Next versions
  // preserve only the backend Host header instead of forwarding the browser Host.
  const backendHost=String(req.headers.host||'').toLowerCase();
  if(['127.0.0.1:4000','localhost:4000'].includes(backendHost)&&
     ['localhost:3000','127.0.0.1:3000'].includes(parsed.host.toLowerCase())&&
     parsed.protocol==='http:')return true;
  return false;
 }catch{return false;}
}
