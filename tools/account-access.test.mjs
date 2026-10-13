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
 assert.ok(code.includes('const ownerId=owner(req)'));
 assert.ok(code.includes('findFirst({where:{id,ownerId}})'));
 assert.ok(code.includes('buildDetailedReport(chart,birth.lang,asOf)'));
 const account=source('apps/api/src/account.ts');
 assert.ok(account.includes('ownerId:id'));
 assert.ok(account.includes('where:{id:chartId,ownerId}'));
 assert.ok(account.includes('deleteMany({where:{id:chartId,ownerId}})'));
});
test('public site does not require Basic Auth, while history requires valid cookie',()=>{
 const middleware=source('apps/web/middleware.ts');
 assert.ok(!middleware.includes('DEMO_ACCESS_PASSWORD'));
 assert.ok(!middleware.includes('WWW-Authenticate'));
 const account=source('apps/api/src/account.ts');
 assert.ok(account.includes('cookieUser(req)'));
 assert.ok(account.includes('UnauthorizedException'));
});
