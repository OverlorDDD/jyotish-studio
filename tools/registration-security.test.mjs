import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registrationReady,registrationCode,registrationCodeDigest,secureCodeMatches,verifySignupTurnstile,
 sendSignupVerification,registrationCooldownMs,registrationExpiryMs,parseRegistrationRequest,parseVerifyRegistrationRequest,parseLoginRequest} from '../apps/api/src/registration-security.ts';

const env={PUBLIC_REGISTRATION_ENABLED:'1',AUTH_SECRET:'z'.repeat(64),
 TURNSTILE_SECRET_KEY:'secret',NEXT_PUBLIC_TURNSTILE_SITE_KEY:'site-key',
 RESEND_API_KEY:'test-token',RESEND_FROM_EMAIL:'hello@galaxiora.com',
 NEXT_PUBLIC_SITE_URL:'https://galaxiora.com'};
test('signup fails closed without every service key',()=>{
 assert.equal(registrationReady(env),true);
 for(const key of Object.keys(env)){
  assert.equal(registrationReady({...env,[key]:''}),false,key);
 }
 assert.equal(registrationReady({...env,PUBLIC_REGISTRATION_ENABLED:'0'}),false);
 assert.equal(registrationExpiryMs,900000);
 assert.equal(registrationCooldownMs,120000);
});
test('short-lived one-time code has constant-length keyed digest',()=>{
 const code=registrationCode();
 assert.match(code,/^[0-9]{6}$/);
 const hash=registrationCodeDigest('A@b.com',code,env.AUTH_SECRET);
 assert.match(hash,/^[a-f0-9]{64}$/);
 assert.equal(secureCodeMatches(hash,registrationCodeDigest('a@b.com',code,env.AUTH_SECRET)),true);
 assert.equal(secureCodeMatches(hash,registrationCodeDigest('other@b.com',code,env.AUTH_SECRET)),false);
 assert.equal(secureCodeMatches(hash,registrationCodeDigest('a@b.com','999999',env.AUTH_SECRET)),
  code==='999999');
});
test('Turnstile demands valid action, hostname and token',async()=>{
 let hits=0;
 const fake=async (url,options)=>{
  hits++;assert.equal(url,'https://challenges.cloudflare.com/turnstile/v0/siteverify');
  const body=JSON.parse(options.body);
  assert.equal(body.secret,'secret');assert.equal(body.response,'one-time-token');
  return new Response(JSON.stringify({success:true,action:'register',hostname:'galaxiora.com'}),{status:200});
 };
 await verifySignupTurnstile('one-time-token',fake,env);
 assert.equal(hits,1);
 await assert.rejects(()=>verifySignupTurnstile('',fake,env));
 await assert.rejects(()=>verifySignupTurnstile('one-time-token',
  async()=>new Response(JSON.stringify({success:true,action:'login',hostname:'galaxiora.com'})),env));
 await assert.rejects(()=>verifySignupTurnstile('one-time-token',
  async()=>new Response(JSON.stringify({success:true,action:'register',hostname:'malicious.com'})),env));
});
test('Resend uses private server authorization and sends only to requested address',async()=>{
 let sent=0;
 const fake=async (url,options)=>{
  sent++;assert.equal(url,'https://api.resend.com/emails');
  assert.equal(options.headers.Authorization,'Bearer test-token');
  const body=JSON.parse(options.body);
  assert.equal(body.from,'hello@galaxiora.com');
  assert.deepEqual(body.to,['reader@example.com']);
  assert.match(body.text,/103204/);
  return new Response(JSON.stringify({id:'email-id'}),{status:200});
 };
 await sendSignupVerification('reader@example.com','103204',fake,env);
 assert.equal(sent,1);
 await assert.rejects(()=>sendSignupVerification('reader@example.com','103204',
  async()=>new Response('failed',{status:429}),env));
});
test('Registration route never creates User before verified-code handler',()=>{
 const source=readFileSync(new URL('../apps/api/src/account.ts',import.meta.url),'utf8');
 const start=source.indexOf(" @Post('register')"),end=source.indexOf(" @Post('register/verify')");
 assert.ok(start>0&&end>start);
 const preverify=source.slice(start,end);
 assert.match(preverify,/verifySignupTurnstile/);
 assert.match(preverify,/sendSignupVerification/);
 assert.match(preverify,/pendingRegistration\.upsert/);
 assert.doesNotMatch(preverify,/user\.create|setSession/);
 const verify=source.slice(end,source.indexOf(" @Post('login')",end));
 assert.match(verify,/pendingRegistration\.updateMany/);
 assert.match(verify,/attempts:\{lt:5\}/);
 assert.match(verify,/\$transaction/);
 assert.match(verify,/pendingRegistration\.deleteMany/);
 assert.match(verify,/user\.create/);
 assert.match(verify,/setSession/);
});


test('production Nest startup does not introspect Swagger with tsx missing paramtypes',()=>{
 const main=readFileSync(new URL('../apps/api/src/main.ts',import.meta.url),'utf8');
 assert.doesNotMatch(main,/SwaggerModule\.createDocument\s*\(/);
 assert.doesNotMatch(main,/SwaggerModule\.setup\s*\(/);
});
test('signup validates real JSON field types without decorator metadata',()=>{
 const valid={email:'Reader@example.com',password:'Password-For-QA-2026',turnstileToken:'fake-token'};
 assert.deepEqual(parseRegistrationRequest(valid),valid);
 assert.deepEqual(parseLoginRequest({email:valid.email,password:valid.password}),
  {email:valid.email,password:valid.password});
 assert.deepEqual(parseVerifyRegistrationRequest({email:valid.email,code:'002184'}),
  {email:valid.email,code:'002184'});
 const invalid=[
  {...valid,turnstileToken:123},
  {...valid,turnstileToken:''},
  {...valid,turnstileToken:'a'.repeat(2049)},
  {...valid,password:'short'},
  {...valid,email:'not-an-email'},
  {...valid,isAdmin:true},
  null,
  []
 ];
 for(const payload of invalid)assert.throws(()=>parseRegistrationRequest(payload),
   e=>e?.getStatus?.()===400);
 assert.throws(()=>parseVerifyRegistrationRequest({email:valid.email,code:'1234567'}),
   e=>e?.getStatus?.()===400);
 assert.throws(()=>parseLoginRequest({...valid}),
   e=>e?.getStatus?.()===400);
});
test('controllers parse request bodies explicitly rather than relying on erased reflect metadata',()=>{
 const account=readFileSync(new URL('../apps/api/src/account.ts',import.meta.url),'utf8');
 for(const phrase of [
  'parseRegistrationRequest(req.body)',
  'parseVerifyRegistrationRequest(req.body)',
  'parseLoginRequest(req.body)'
 ])assert.ok(account.includes(phrase),'Missing explicit parser: '+phrase);
 assert.doesNotMatch(account,/REGISTER_BODY_PIPE|VERIFY_BODY_PIPE|LOGIN_BODY_PIPE/);
 const routes=account.slice(account.indexOf(" @Post('register')"),account.indexOf(" @Get('me')"));
 assert.doesNotMatch(routes,/@Body\(/,'Never attach erased body metadata to signup, OTP or login');
});
