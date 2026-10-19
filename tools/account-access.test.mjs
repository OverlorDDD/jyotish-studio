import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {passwordHash,passwordMatches,sessionToken,sessionUser,cookieHeader,sameOrigin} from '../apps/api/src/auth.ts';
const source=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('passwords use salted scrypt hashes, not plaintext',async()=>{
 const hash=await passwordHash('a strong password 123');
 assert.ok(hash.startsWith('scrypt$'));
 assert.ok(!hash.includes('a strong password'));
 assert.equal(await passwordMatches('a strong password 123',hash),true);
 assert.equal(await passwordMatches('wrong password',hash),false);
});
test('signed HttpOnly session expires and rejects altered tokens',()=>{
 const previous=process.env.AUTH_SECRET;
 process.env.AUTH_SECRET='dev-test-secret-0123456789abcdef-0123456789';
 try{
  const token=sessionToken('4c018e53-2322-4d64-8e09-92e006ad3b15',10000);
  assert.equal(sessionUser(token,11000),'4c018e53-2322-4d64-8e09-92e006ad3b15');
  assert.equal(sessionUser(token+'x',11000),null);
  assert.equal(sessionUser(token,10000+8*24*3600*1000),null);
  const cookie=cookieHeader(token,{headers:{'x-forwarded-proto':'https'}});
  assert.ok(cookie.includes('HttpOnly')&&cookie.includes('SameSite=Lax')&&cookie.includes('Secure'));
 }finally{if(previous===undefined)delete process.env.AUTH_SECRET;else process.env.AUTH_SECRET=previous;}
});
test('CSRF origin validation rejects foreign hosts',()=>{
 assert.equal(sameOrigin({headers:{host:'localhost:4000','x-forwarded-host':'localhost:3000',origin:'http://localhost:3000'}}),true);
 assert.equal(sameOrigin({headers:{host:'localhost:4000','x-forwarded-host':'localhost:3000',origin:'https://attacker.example'}}),false);
});
test('guest calculation and reports have no Prisma writes; old saved chart reads check owner',()=>{
 const code=source('apps/api/src/nest.ts');
 assert.ok(code.includes('return await runCalculation(birth)'));
 assert.ok(!code.includes('prisma.chart.create'));
 assert.ok(code.includes('this.savedCharts.legacy(owner(req),id)'));
 assert.ok(code.includes('this.reports.prepare(birth,birth.lang)'));
 const adapter=source('apps/api/src/chart-prisma.ts');
 assert.ok(adapter.includes('where:{id:chartId,ownerId}'));
 assert.ok(adapter.includes('deleteMany({where:{id:chartId,ownerId}})'));
 const account=source('apps/api/src/account.ts');
 assert.ok(account.includes('this.chartsService.save(ownerId,body)'));
 assert.ok(account.includes('this.chartsService.remove(currentUser(req),chartId)'));
});
test('public site does not require Basic Auth, while history requires valid cookie',()=>{
 const middleware=source('apps/web/middleware.ts');
 assert.ok(!middleware.includes('DEMO_ACCESS_PASSWORD'));
 assert.ok(!middleware.includes('WWW-Authenticate'));
 const account=source('apps/api/src/account.ts');
 assert.ok(account.includes('cookieUser(req)'));
 assert.ok(account.includes('UnauthorizedException'));
});

test('CSRF fetch metadata blocks missing-Origin cross-site browser writes',()=>{
 assert.equal(sameOrigin({headers:{host:'localhost:4000','sec-fetch-site':'cross-site'}}),false);
 assert.equal(sameOrigin({headers:{host:'localhost:4000','sec-fetch-site':'same-site'}}),false);
 assert.equal(sameOrigin({headers:{host:'localhost:4000','sec-fetch-site':'same-origin'}}),true);
 assert.equal(sameOrigin({headers:{host:'localhost:4000'}}),true);
});
test('production secure cookie override and bounded per-account limiter',async()=>{
 const {createKeyedHourlyLimiter}=await import('../apps/api/src/ai.ts');
 const previous=process.env.SESSION_COOKIE_SECURE;
 try{
  process.env.SESSION_COOKIE_SECURE='1';
  const cookie=cookieHeader('test',{headers:{host:'localhost:4000'}});
  assert.ok(cookie.includes('Secure'));
 }finally{if(previous===undefined)delete process.env.SESSION_COOKIE_SECURE;else process.env.SESSION_COOKIE_SECURE=previous;}
 const allow=createKeyedHourlyLimiter(2,3);
 assert.equal(allow('user-a',1000),true);
 assert.equal(allow('user-a',1001),true);
 assert.equal(allow('user-a',1002),false);
 assert.equal(allow('user-b',1002),true);
 assert.equal(allow('user-a',3601000),true);
});
