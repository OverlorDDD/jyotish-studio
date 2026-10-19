import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {PrismaClient} from '@prisma/client';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const db=process.env.DATABASE_URL;
if(process.env.GALAXIORA_INTEGRATION_TEST!=='1'||!db)
 throw Error('Safety guard: GALAXIORA_INTEGRATION_TEST=1 and disposable PostgreSQL required');
const parsed=new URL(db);
if(!['postgresql:','postgres:'].includes(parsed.protocol)||parsed.pathname!=='/galaxiora_a1_test'||
 !['localhost','127.0.0.1'].includes(parsed.hostname))
 throw Error('Refusing a non-local or non-galaxiora_a1_test database');
const port=Number(process.env.A1_API_PORT||45721),base='http://127.0.0.1:'+port;
const prisma=new PrismaClient(),nonce=randomUUID().slice(0,8);
let child,log='';
const request=async(path,{method='GET',cookie,origin,fetchSite,body}={})=>{
 const headers={};
 if(body!==undefined)headers['Content-Type']='application/json';
 if(cookie)headers.Cookie=cookie;
 if(origin)headers.Origin=origin;
 if(fetchSite)headers['Sec-Fetch-Site']=fetchSite;
 const response=await fetch(base+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
 const raw=await response.text();let data;
 try{data=JSON.parse(raw);}catch{data={raw:raw.slice(0,300)};}
 return {status:response.status,data,cookie:response.headers.get('set-cookie')?.split(';')[0]||'',requestId:response.headers.get('x-request-id')};
};
const post=(path,body,cookie,origin=base)=>request(path,{method:'POST',body,cookie,origin});
async function register(label){
 const result=await post('/api/v1/account/register',{email:'a1-'+label+'-'+nonce+'@example.invalid',password:'A1-testing-only-password-2026'});
 assert.equal(result.status,201,JSON.stringify(result.data));
 assert.ok(result.cookie.startsWith('jyotish_session='));
 return {id:result.data.user.id,email:result.data.user.email,cookie:result.cookie};
}
async function start(){
 child=spawn(process.execPath,['node_modules/tsx/dist/cli.mjs','--tsconfig','apps/api/tsconfig.json','apps/api/src/main.ts'],{cwd:root,
  env:{...process.env,PORT:String(port),WEB_PORT:'3000',AI_MODE:'local',TAROT_AI_ENABLED:'false',
   AUTH_SECRET:'a1-test-only-session-signing-secret-0123456789'},stdio:['ignore','pipe','pipe']});
 const onData=data=>{log=(log+String(data)).slice(-5000);};
 child.stdout.on('data',onData);child.stderr.on('data',onData);child.on('error',onData);
 for(let attempt=0;attempt<100;attempt++){
  if(child.exitCode!==null)throw Error('Nest exited: '+log);
  try{const health=await request('/api/health');
   if(health.status===200&&health.data.database==='connected')return;}catch{}
  await delay(200);
 }
 throw Error('Nest not ready: '+log);
}
test('A1 live Postgres: account access, quotas, concurrency and CSRF',{timeout:90000},async t=>{
 try{
  await prisma.$connect();await start();
  const [a,b,admin]=await Promise.all([register('a'),register('b'),register('admin')]);
  await prisma.user.update({where:{id:admin.id},data:{role:'ADMIN'}});
  await t.test('API request correlation is non-sensitive UUID',async()=>{
   const health=await request('/api/health');
   assert.match(health.requestId||'',/^[0-9a-f]{8}-[0-9a-f-]{27,}$/);
   assert.equal((await request('/api/v1/account/me',{cookie:a.cookie})).status,200);
  });
  await t.test('admin role enforced by database',async()=>{
   assert.equal((await request('/api/v1/admin/users')).status,401);
   assert.equal((await request('/api/v1/admin/users',{cookie:a.cookie})).status,403);
   const authorized=await request('/api/v1/admin/users',{cookie:admin.cookie});
   assert.equal(authorized.status,200);
   assert.ok(authorized.data.users.some(row=>row.id===a.id));
   assert.ok(authorized.data.users.every(row=>!('passwordHash' in row)));
   assert.equal((await request('/api/v1/admin/users/'+admin.id+'/role',{
    method:'PATCH',origin:base,cookie:admin.cookie,body:{role:'MEMBER'}})).status,403);
  });
  await t.test('saved charts are owner-only, including delete',async()=>{
   const chart=await prisma.chart.create({data:{ownerId:a.id,input:{date:'2000-01-01'},result:{dasha:[],proof:'a1'}}});
   const url='/api/v1/account/charts/'+chart.id;
   assert.equal((await request(url,{cookie:a.cookie})).status,200);
   assert.equal((await request(url,{cookie:b.cookie})).status,401);
   assert.equal((await request(url)).status,401);
   assert.equal((await request('/api/v1/charts/'+chart.id,{cookie:b.cookie})).status,401);
   assert.equal((await request('/api/v1/charts/'+chart.id,{cookie:a.cookie})).status,200);
   assert.equal((await request('/api/v1/charts/'+chart.id+'/dashas',{cookie:a.cookie})).status,200);
   assert.equal((await request('/api/v1/charts/'+chart.id+'/dashas',{cookie:b.cookie})).status,401);
   assert.equal((await request(url,{method:'DELETE',cookie:b.cookie,origin:base})).status,401);
   assert.equal((await request(url,{cookie:a.cookie})).status,200);
  });
  await t.test('cross-site write cannot consume quota',async()=>{
   const body={spread:'one',question:'What themes matter today?'};
   assert.equal((await post('/api/v1/tarot/readings',body,b.cookie,'https://evil.example')).status,400);
   assert.equal((await request('/api/v1/tarot/readings',{
    method:'POST',cookie:b.cookie,fetchSite:'cross-site',body})).status,400);
   assert.equal((await request('/api/v1/tarot/readings',{cookie:b.cookie})).data.remaining,3);
  });
  await t.test('8 parallel requests produce 3 member draws and 5 HTTP 429',async()=>{
   const draws=await Promise.all(Array.from({length:8},()=>post('/api/v1/tarot/readings',{
    spread:'one',question:'What may be useful today?'},a.cookie)));
   assert.equal(draws.filter(x=>x.status===201).length,3,JSON.stringify(draws.map(x=>x.status)));
   assert.equal(draws.filter(x=>x.status===429).length,5,JSON.stringify(draws.map(x=>x.status)));
   const history=await request('/api/v1/tarot/readings',{cookie:a.cookie});
   const other=await request('/api/v1/tarot/readings',{cookie:b.cookie});
   assert.equal(history.data.limit,3);assert.equal(history.data.remaining,0);
   assert.equal(history.data.readings.length,3);assert.equal(other.data.readings.length,0);
   assert.equal(other.data.remaining,3);assert.equal((await request('/api/v1/tarot/readings')).status,401);
  });
  await t.test('admin keeps 100-per-UTC-day limit',async()=>{
   const draws=await Promise.all(Array.from({length:4},()=>post('/api/v1/tarot/readings',{
    spread:'three',question:'What is worth reflecting on?'},admin.cookie)));
   assert.ok(draws.every(x=>x.status===201),JSON.stringify(draws.map(x=>x.status)));
   const state=await request('/api/v1/tarot/readings',{cookie:admin.cookie});
   assert.equal(state.data.limit,100);assert.equal(state.data.remaining,96);
   assert.equal(state.data.readings.length,4);
  });
  await t.test('client-supplied userId cannot redirect a signed-in Tarot draw',async()=>{
   const forged=await post('/api/v1/tarot/readings',{
    userId:a.id,spread:'one',question:'Check server-authenticated owner'},admin.cookie);
   // Global whitelist+forbidNonWhitelisted rejects a client-controlled owner ID.
   assert.equal(forged.status,400,JSON.stringify(forged.data));
   const own=await request('/api/v1/tarot/readings',{cookie:admin.cookie});
   const other=await request('/api/v1/tarot/readings',{cookie:a.cookie});
   assert.equal(own.data.readings.length,4);
   assert.equal(other.data.readings.length,3);
  });
  await t.test('only admin can change roles, audit persists',async()=>{
   const url='/api/v1/admin/users/'+b.id+'/role',payload={role:'SUPPORT'};
   assert.equal((await request(url,{method:'PATCH',cookie:a.cookie,origin:base,body:payload})).status,403);
   assert.equal((await request(url,{method:'PATCH',cookie:admin.cookie,origin:'https://evil.example',body:payload})).status,403);
   const changed=await request(url,{method:'PATCH',cookie:admin.cookie,origin:base,body:payload});
   assert.equal(changed.status,200,JSON.stringify(changed.data));
   assert.equal((await request('/api/v1/account/me',{cookie:b.cookie})).data.user.role,'SUPPORT');
   const audit=await request('/api/v1/admin/role-audit',{cookie:admin.cookie});
   assert.equal(audit.status,200);assert.ok(audit.data.some(row=>row.newRole==='SUPPORT'));
  });
  await t.test('logout clears browser cookie',async()=>{
   const out=await post('/api/v1/account/logout',{},b.cookie);
   assert.equal(out.status,201);assert.equal(out.cookie,'jyotish_session=');
   assert.equal((await request('/api/v1/account/me',{cookie:out.cookie})).data.user,null);
  });
 }catch(error){console.error('Nest log tail: '+log);throw error;}
 finally{
  if(child){
   child.kill('SIGTERM');
   await Promise.race([new Promise(resolve=>child.once('exit',resolve)),delay(1000)]);
   if(child.exitCode===null)child.kill('SIGKILL');
  }
  await prisma.$disconnect();
 }
});
