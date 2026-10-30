import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {PrismaClient} from '@prisma/client';
import {passwordHash} from '../apps/api/src/auth.ts';

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
/** Fixtures are inserted only in the disposable CI database, NOT via a bypass in public signup. */
async function register(label){
 const email='a1-'+label+'-'+nonce+'@example.invalid',password='A1-testing-only-password-2026';
 const user=await prisma.user.create({data:{email,passwordHash:await passwordHash(password)},select:{id:true,email:true}});
 const result=await post('/api/v1/account/login',{email,password});
 assert.equal(result.status,201,JSON.stringify(result.data));
 assert.ok(result.cookie.startsWith('jyotish_session='));
 return {id:user.id,email:user.email,cookie:result.cookie};
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
  // Unverified public registration is unavailable in CI, even for valid-looking requests.
  const unverified=await post('/api/v1/account/register',{
   email:'no-verification-'+nonce+'@example.invalid',
   password:'A1-testing-only-password-2026',turnstileToken:'fake-bot-proof'
  });
  assert.equal(unverified.status,503,'Public signup must fail closed without real Cloudflare/Resend configuration');
  assert.equal(await prisma.user.count({where:{email:'no-verification-'+nonce+'@example.invalid'}}),0);
  const [a,b,admin]=await Promise.all([register('a'),register('b'),register('admin')]);
  await prisma.user.update({where:{id:admin.id},data:{role:'ADMIN'}});
  await t.test('Private Tarot questions persist, remain owner-only and are never orders',async()=>{
   const path='/api/v1/reading-orders/questions';
   const body={topic:'relationships',question:'What can the cards reveal about this new chapter?',
    context:'I want to reflect on a new direction and consider what matters most.',privacyConsent:true};
   assert.equal((await request(path)).status,401);
   assert.equal((await post(path,body)).status,401);
   assert.equal((await post(path,body,a.cookie,'https://evil.example')).status,403);
   const created=await post(path,body,a.cookie);
   assert.equal(created.status,201,JSON.stringify(created.data));
   assert.match(created.data.id,/^[a-f0-9-]{36}$/i);
   assert.equal(created.data.status,'SAVED_PRIVATE');
   assert.equal(created.data.checkoutAvailable,false);
   const mine=await request(path,{cookie:a.cookie});
   assert.equal(mine.status,200);
   assert.ok(mine.data.some(q=>q.id===created.data.id&&q.question===body.question));
   assert.ok(!('expiresAt' in mine.data.find(q=>q.id===created.data.id)),'no seven-day expiry');
   const other=await request(path,{cookie:b.cookie});
   assert.equal(other.status,200);assert.equal(other.data.some(q=>q.id===created.data.id),false);
   const denied=await request(path+'/'+created.data.id,{method:'DELETE',cookie:b.cookie,origin:base});
   assert.equal(denied.data.deleted,false);
   assert.equal((await prisma.tarotQuestion.findUnique({where:{id:created.data.id}})).userId,a.id);
   const removed=await request(path+'/'+created.data.id,{method:'DELETE',cookie:a.cookie,origin:base});
   assert.equal(removed.data.deleted,true);
   assert.equal((await request(path,{cookie:a.cookie})).data.some(q=>q.id===created.data.id),false);
  });
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
  await t.test('A6 editorial PostgreSQL: CSRF, roles, revisions, publishing and archives',async()=>{
   const body={
    title:{uk:'Новий урок про традиції',en:'A new lesson about traditions'},
    summary:{uk:'Зрозумілий вступний матеріал про традиції та їхні історичні межі.',en:'A clear introductory guide to traditions and their historical boundaries.'},
    body:{uk:'Це освітній матеріал про культурний контекст та способи його вивчення. '.repeat(4),
     en:'This educational material explores historical context and the methods used in careful inquiry. '.repeat(4)},
    quiz:{question:{uk:'Що ми вивчаємо в цьому уроці?',en:'What are we exploring in this lesson?'},
     choices:[{uk:'Традиції',en:'Traditions'},{uk:'Рецепт',en:'Recipe'},{uk:'Діагноз',en:'Diagnosis'}],
     correct:0,explanation:{uk:'Ми аналізуємо культурний контекст, а не медичні діагнози.',en:'We examine cultural context rather than medical diagnoses.'}}
   };
   const slug='a6-'+nonce;
   const create={kind:'ACADEMY',slug,topic:'jyotish',document:body};
   const write='/api/v1/editorial/entries';
   assert.equal((await post(write,create,a.cookie)).status,403);
   assert.equal((await post(write,create,b.cookie,'https://evil.example')).status,403);
   const made=await post(write,create,b.cookie);
   assert.equal(made.status,201,JSON.stringify(made.data));
   let rev=made.data.revision,id=made.data.id;
   assert.equal(rev,1);
   const live='/api/v1/content/ACADEMY/'+slug;
   assert.equal((await request(live)).status,404);
   assert.equal((await request('/api/v1/content?kind=ACADEMY')).data.some(e=>e.slug===slug),false);
   assert.equal((await request('/api/v1/editorial/entries')).status,401);
   assert.equal((await request('/api/v1/editorial/entries',{cookie:a.cookie})).status,403);
   assert.equal((await post(write,create,b.cookie)).status,409);
   const editUrl=write+'/'+id;
   const edited=await request(editUrl,{method:'PATCH',cookie:b.cookie,origin:base,
    body:{topic:'practice',document:body,expectedRevision:rev}});
   assert.equal(edited.status,200,JSON.stringify(edited.data));
   rev=edited.data.revision;assert.equal(rev,2);
   assert.equal((await request(editUrl,{method:'PATCH',cookie:b.cookie,origin:base,
    body:{topic:'practice',document:body,expectedRevision:1}})).status,409);
   const action=(cookie,act,revision)=>post(editUrl+'/transition',{action:act,expectedRevision:revision},cookie);
   assert.equal((await action(b.cookie,'publish',rev)).status,403);
   const review=await action(b.cookie,'submit',rev);
   assert.equal(review.status,201,JSON.stringify(review.data));
   rev=review.data.revision;
   assert.equal(review.data.status,'IN_REVIEW');
   assert.equal((await request(live)).status,404);
   assert.equal((await action(b.cookie,'approve',rev)).status,403);
   const approved=await action(admin.cookie,'approve',rev);
   assert.equal(approved.status,201,JSON.stringify(approved.data));rev=approved.data.revision;
   const published=await action(admin.cookie,'publish',rev);
   assert.equal(published.status,201,JSON.stringify(published.data));rev=published.data.revision;
   assert.equal(published.data.status,'PUBLISHED');
   const accessible=await request(live);
   assert.equal(accessible.status,200);assert.equal(accessible.data.document.title.en,body.title.en);
   assert.equal((await request('/api/v1/content?kind=ACADEMY')).data.some(e=>e.slug===slug),true);
   assert.equal((await request(editUrl,{method:'PATCH',cookie:b.cookie,origin:base,
    body:{topic:'jyotish',document:body,expectedRevision:rev}})).status,409);
   const history=await request(editUrl+'/history',{cookie:b.cookie});
   assert.equal(history.status,200);assert.equal(history.data.length,5);
   assert.deepEqual(history.data.map(x=>x.action),['publish','approve','submit','edit','create']);
   const archived=await action(admin.cookie,'archive',rev);
   assert.equal(archived.status,201);assert.equal(archived.data.status,'ARCHIVED');
   assert.equal((await request(live)).status,404);
   assert.equal((await request('/api/v1/content?kind=ACADEMY')).data.some(e=>e.slug===slug),false);
   const reopened=await action(admin.cookie,'reopen',archived.data.revision);
   assert.equal(reopened.status,201);assert.equal(reopened.data.status,'DRAFT');
  });
  await t.test('A6.1 live API supports >100kb bilingual article, short answers and Yoga without safety',async()=>{
   const longBody='Уважна велика стаття. '.repeat(5100);
   const longEn='A long educational article. '.repeat(3500);
   const article={
    title:{uk:'Текст',en:'Text'},summary:{uk:'Опис',en:'Desc'},
    body:{uk:longBody,en:longEn},
    quiz:{question:{uk:'Так?',en:'Yes?'},
     choices:[{uk:'А',en:'A'},{uk:'Б',en:'B'},{uk:'В',en:'C'}],
     correct:1,explanation:{uk:'Так',en:'Yes'}}
   };
   assert.ok(Buffer.byteLength(JSON.stringify(article),'utf8')>100000);
   const created=await post('/api/v1/editorial/entries',
    {kind:'ACADEMY',slug:'a61-long-'+nonce,topic:'jyotish',document:article},b.cookie);
   assert.equal(created.status,201,JSON.stringify(created.data).slice(0,450));
   assert.equal(created.data.document.body.uk,longBody.trim());
   assert.equal(created.data.document.quiz.choices[1].uk,'Б');
   const yoga=await post('/api/v1/editorial/entries',{
    kind:'YOGA',slug:'a61-yoga-'+nonce,topic:'meditation',
    document:{title:{uk:'Уважність',en:'Mindfulness'},
     summary:{uk:'Спокійна пауза',en:'A quiet pause'},
     body:{uk:'Сядь зручно та зверни увагу на звуки.',en:'Sit comfortably and notice surrounding sounds.'}}
   },b.cookie);
   assert.equal(yoga.status,201,JSON.stringify(yoga.data).slice(0,450));
   assert.equal(yoga.data.document.safety,undefined);
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
