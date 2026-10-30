/** True HTTP integration test for the exact NestJS/tsx production bootstrap.
 * Only ever runs against disposable localhost database galaxiora_a1_test.
 * Never sends mail, calls Cloudflare, or registers a user. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {randomUUID} from 'node:crypto';
import {PrismaClient} from '@prisma/client';

const db=process.env.DATABASE_URL||'';
const url=new URL(db);
if(!['postgres:','postgresql:'].includes(url.protocol)||
   !['127.0.0.1','localhost'].includes(url.hostname)||
   url.pathname!=='/galaxiora_a1_test'||
   process.env.CI!=='true')
 throw Error('REFUSE: registration HTTP smoke requires disposable localhost galaxiora_a1_test and CI=true');

const port=45698,origin='http://127.0.0.1:'+port;
test('real NestJS HTTP signup validates body under tsx and rejects unconfigured signup',{timeout:55000},async()=>{
 const nonce=randomUUID().slice(0,8),email='reg-ci-'+nonce+'@example.com';
 const env={...process.env,
  PORT:String(port),PUBLIC_REGISTRATION_ENABLED:'0',AUTH_SECRET:'galaxiora-ci-test-only-signing-secret-0123456789',
  NEWS_INGESTION_ENABLED:'0',NEWS_TRANSLATION_ENABLED:'0',AI_MODE:'local'};
 const child=spawn(process.execPath,
  ['node_modules/tsx/dist/cli.mjs','--tsconfig','apps/api/tsconfig.json','apps/api/src/main.ts'],
  {cwd:process.cwd(),env,stdio:['ignore','pipe','pipe']});
 let logs='';
 for(const channel of [child.stdout,child.stderr])
  channel.on('data',buf=>{logs=(logs+String(buf)).slice(-5000)});
 const prisma=new PrismaClient();
 const request=async(path,body)=>fetch(origin+path,{
  method:'POST',
  headers:{'Content-Type':'application/json','Origin':origin},
  body:JSON.stringify(body),
  signal:AbortSignal.timeout(7000)});
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
  const credential={email,password:'Strong-test-password-2026',turnstileToken:'fake-token'};
  const valid=await request('/api/v1/account/register',credential);
  const validResult=await valid.json();
  assert.equal(valid.status,503,'Valid body must reach disabled-signup handler (not 400): '+JSON.stringify(validResult));
  for(const malformed of [
   {...credential,turnstileToken:123},
   {...credential,turnstileToken:''},
   {...credential,unexpectedAdmin:true}
  ]){
   const r=await request('/api/v1/account/register',malformed);
   assert.equal(r.status,400,'Malformed body must be rejected: '+await r.text());
  }
  const verify=await request('/api/v1/account/register/verify',{email,code:'012345'});
  assert.equal(verify.status,503,'Valid OTP format reaches disabled verification handler: '+await verify.text());
  const badCode=await request('/api/v1/account/register/verify',{email,code:'not-six'});
  assert.equal(badCode.status,400,'Malformed verification code rejected: '+await badCode.text());
  const login=await request('/api/v1/account/login',{email,password:credential.password});
  assert.equal(login.status,401,'Valid login reaches account lookup, not validation failure: '+await login.text());
  assert.equal(await prisma.user.count({where:{email}}),0);
  console.log('PASS: Real Nest HTTP register 503 (not 400), invalid body 400, OTP 503, login 401');
 }finally{
  child.kill('SIGTERM');
  for(let i=0;i<30&&child.exitCode===null;i++)await delay(100);
  if(child.exitCode===null)child.kill('SIGKILL');
  await prisma.$disconnect();
 }
});
