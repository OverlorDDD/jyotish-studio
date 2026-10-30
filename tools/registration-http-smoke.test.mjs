/** Real NestJS HTTP signup flow against isolated CI PostgreSQL.
 * External Turnstile/Resend are mocked only in the CI child process; the live
 * app has no bypass. This catches decorator/payload issues missed by unit tests. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {randomUUID} from 'node:crypto';
import {mkdtempSync,readFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {PrismaClient} from '@prisma/client';

const db=process.env.DATABASE_URL||'';
const url=new URL(db);
if(!['postgres:','postgresql:'].includes(url.protocol)||
   !['127.0.0.1','localhost'].includes(url.hostname)||
   url.pathname!=='/galaxiora_a1_test'||process.env.CI!=='true')
 throw Error('REFUSE: signup E2E requires disposable localhost galaxiora_a1_test and CI=true');

const port=45698,origin='http://127.0.0.1:'+port;
test('real Nest API register → Cloudflare → Resend OTP → verified user → session and login',
 {timeout:65000},async()=>{
 const nonce=randomUUID().slice(0,8),email='ci-signup-'+nonce+'@example.com';
 const password='Strong-test-password-2026';
 const directory=mkdtempSync(join(tmpdir(),'galaxiora-signup-'));
 const otpFile=join(directory,'otp.txt');
 const env={...process.env,
  PORT:String(port),PUBLIC_REGISTRATION_ENABLED:'1',
  AUTH_SECRET:'galaxiora-ci-test-only-signing-secret-0123456789',
  TURNSTILE_SECRET_KEY:'ci-secret-key',
  NEXT_PUBLIC_TURNSTILE_SITE_KEY:'ci-public-key',
  NEXT_PUBLIC_SITE_URL:'https://galaxiora.com',
  RESEND_API_KEY:'re_ci-local-fake',
  RESEND_FROM_EMAIL:'verify@mail.galaxiora.com',
  GALAXIORA_SIGNUP_CI_MOCK:'1',GALAXIORA_SIGNUP_OTP_FILE:otpFile,
  NEWS_INGESTION_ENABLED:'0',NEWS_TRANSLATION_ENABLED:'0',AI_MODE:'local'};
 const child=spawn(process.execPath,
  ['--import','./tools/registration-provider-ci-mock.mjs',
   'node_modules/tsx/dist/cli.mjs','--tsconfig','apps/api/tsconfig.json',
   'apps/api/src/main.ts'],
  {cwd:process.cwd(),env,stdio:['ignore','pipe','pipe']});
 let logs='';
 for(const channel of [child.stdout,child.stderr])
  channel.on('data',buf=>{logs=(logs+String(buf)).slice(-5000)});
 const prisma=new PrismaClient();
 const request=async(path,body,cookie)=>fetch(origin+path,{
  method:'POST',
  headers:{'Content-Type':'application/json','Origin':origin,...(cookie?{Cookie:cookie}:{})},
  body:JSON.stringify(body),
  signal:AbortSignal.timeout(7000)});
 const creds={email,password,turnstileToken:'ci-good-token'};
 try{
  let ready=false;
  for(let i=0;i<120;i++){
   if(child.exitCode!==null)break;
   try{
    const r=await fetch(origin+'/api/health',{signal:AbortSignal.timeout(1000)});
    if(r.ok){ready=true;break;}
   }catch{}
   await delay(150);
  }
  assert.equal(ready,true,'Nest must boot cleanly: '+logs);
  for(const malformed of [
   {...creds,turnstileToken:123},
   {...creds,turnstileToken:''},
   {...creds,unexpectedAdmin:true}
  ]){
   const r=await request('/api/v1/account/register',malformed);
   assert.equal(r.status,400,'Malformed signup JSON must be rejected: '+await r.text());
  }
  const invalidToken=await request('/api/v1/account/register',{...creds,turnstileToken:'ci-bad-token'});
  assert.equal(invalidToken.status,403,'Fake Turnstile token must reach verifier and fail: '+await invalidToken.text());
  assert.equal(await prisma.user.count({where:{email}}),0);
  const pendingResponse=await request('/api/v1/account/register',creds);
  const pendingData=await pendingResponse.json();
  assert.equal(pendingResponse.status,201,'Signup request should send code: '+JSON.stringify(pendingData));
  assert.equal(pendingData.verificationRequired,true);
  assert.equal(await prisma.user.count({where:{email}}),0,'No User before email proof');
  assert.equal(await prisma.pendingRegistration.count({where:{email}}),1);
  let code;
  for(let i=0;i<35;i++){
   if(existsSync(otpFile)){code=readFileSync(otpFile,'utf8');break;}
   await delay(100);
  }
  assert.match(code||'',/^\d{6}$/,'CI Resend mock must capture the real one-time code');
  const failedOtp=await request('/api/v1/account/register/verify',{email,code:'00000x'});
  assert.equal(failedOtp.status,400,'Malformed email code must fail before database');
  const verified=await request('/api/v1/account/register/verify',{email,code});
  const verifiedData=await verified.json();
  assert.equal(verified.status,201,'Valid email code should create account: '+JSON.stringify(verifiedData));
  assert.equal(verifiedData.user.email,email);
  assert.equal(verifiedData.user.role,'MEMBER');
  assert.equal(await prisma.user.count({where:{email}}),1);
  assert.equal(await prisma.pendingRegistration.count({where:{email}}),0);
  const cookie=verified.headers.get('set-cookie')?.split(';')[0]||'';
  assert.match(cookie,/^jyotish_session=/);
  const session=await fetch(origin+'/api/v1/account/me',{headers:{Cookie:cookie}});
  assert.equal(session.status,200);
  assert.equal((await session.json()).user.email,email);
  const login=await request('/api/v1/account/login',{email,password});
  assert.equal(login.status,201,'Login should work with newly verified account: '+await login.text());
  const badPassword=await request('/api/v1/account/login',{email,password:'Wrong-password-2026'});
  assert.equal(badPassword.status,401);
  console.log('PASS: Real HTTP signup -> valid Turnstile -> email OTP -> MEMBER session -> login');
 }finally{
  child.kill('SIGTERM');
  for(let i=0;i<30&&child.exitCode===null;i++)await delay(100);
  if(child.exitCode===null)child.kill('SIGKILL');
  await prisma.$disconnect();
  rmSync(directory,{recursive:true,force:true});
 }
});
