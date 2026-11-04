import {fixtureAccount} from './support/disposable-accounts.mjs';
import {test,expect} from '@playwright/test';
import {randomUUID} from 'node:crypto';
import {drainForumFanout} from '../apps/api/src/com-fanout.ts';
import {forumBudget} from '../apps/api/src/com-budget.ts';
const acc=()=>({email:'c4-'+randomUUID().slice(0,12)+'@example.invalid',password:'GalaxiCom-2026-safe-test-password'});
test('C4: durable fanout, atomic quotas, independent appeals, private export, reviewed public redaction',async({page})=>{
 test.setTimeout(125000);
 if(!process.env.DATABASE_URL)test.skip();
 const {PrismaClient}=await import('@prisma/client');
 const db=new PrismaClient();let aid='',bid='',cid='',threadId='',replyId='',privacyId='';
 const A=acc(),B=acc(),C=acc(),api=p=>'/api/v1/com/'+p;
 try{
  const registeredA=await fixtureAccount(page,{data:A});
  expect(registeredA.status()).toBe(201);aid=(await registeredA.json()).user.id;
  const created=await page.request.post(api('threads'),{data:{categorySlug:'jyotish',
   title:'Test forum security and appeal controls for public discussion',
   body:'A public, intentionally disposable forum discussion without any personal astrology details.'}});
  expect(created.status()).toBe(201);threadId=(await created.json()).id;
  const registeredB=await fixtureAccount(page,{data:B});
  expect(registeredB.status()).toBe(201);bid=(await registeredB.json()).user.id;
  const replied=await page.request.post(api('threads/'+threadId+'/posts'),{
   data:{body:'I will contribute a public reply for moderation testing.'}});
  expect(replied.status()).toBe(201);replyId=(await replied.json()).id;
  expect((await db.comNotificationFanout.findUnique({where:{postId:replyId}}))?.status).toBe('PENDING');
  const first=await drainForumFanout(db);
  expect(first.completed).toBeGreaterThanOrEqual(1);
  expect((await db.comNotificationFanout.findUnique({where:{postId:replyId}}))?.status).toBe('DONE');
  await db.comNotificationFanout.update({where:{postId:replyId},data:{status:'PENDING',cursorUserId:null}});
  await drainForumFanout(db);
  expect(await db.comNotification.count({where:{postId:replyId,userId:aid}})).toBe(1);
  const burst=await Promise.all(Array.from({length:12},()=>forumBudget(db,bid,'c4-concurrent-'+threadId,4,3600000)));
  expect(burst.filter(Boolean).length).toBe(4);
  expect(burst.filter(x=>!x).length).toBe(8);
  const exported=await page.request.get(api('privacy/export?page=1'));
  expect(exported.status()).toBe(200);
  const personal=await exported.json();
  expect(personal.posts.find(x=>x.id===replyId)?.body).toMatch(/public reply/);
  expect(personal.threads).toHaveLength(0);
  await page.goto('/uk/community');
  await expect(page.getByTestId('com-safety')).toBeVisible();
  await page.getByRole('button',{name:/Безпека, апеляції та мої дані/}).click();
  await expect(page.getByText('Мої форумні дані')).toBeVisible();
  const registeredC=await fixtureAccount(page,{data:C});
  expect(registeredC.status()).toBe(201);cid=(await registeredC.json()).user.id;
  await db.user.update({where:{id:cid},data:{role:'ADMIN'}});
  const hidden=await page.request.patch(api('mod/posts/'+replyId),{
   data:{status:'HIDDEN',reason:'Moderator test decision for appeal workflow'}});
  expect(hidden.status()).toBe(200);
  // The original moderator may never adjudicate the same decision.
  const loginB=await page.request.post('/api/v1/account/login',{data:B});expect(loginB.ok()).toBe(true);
  const request=await page.request.post(api('appeals'),{data:{targetType:'POST',targetId:replyId,
   reason:'Please reconsider this test moderation decision because the reply was benign.'}});
  expect(request.status()).toBe(201);const appealId=(await request.json()).id;
  expect((await page.request.post(api('appeals'),{data:{targetType:'POST',targetId:replyId,
   reason:'An accidentally repeated appeal with the same moderation action.'}})).status()).toBe(409);
  expect((await page.request.get(api('mod/appeals'))).status()).toBe(403);
  const loginC=await page.request.post('/api/v1/account/login',{data:C});expect(loginC.ok()).toBe(true);
  expect((await page.request.patch(api('mod/appeals/'+appealId),{data:{decision:'ACCEPTED',
   reason:'The original moderator cannot resolve their own moderation action'}})).status()).toBe(403);
  const loginA=await page.request.post('/api/v1/account/login',{data:A});expect(loginA.ok()).toBe(true);
  await db.user.update({where:{id:aid},data:{role:'SUPPORT'}});
  const accepted=await page.request.patch(api('mod/appeals/'+appealId),{data:{decision:'ACCEPTED',
   reason:'Independent moderator review found the reply should remain public'}});
  expect(accepted.status()).toBe(200);
  expect((await db.comPost.findUnique({where:{id:replyId}}))?.status).toBe('PUBLISHED');
  // A new moderator action makes a pending appeal stale. It must not override current state.
  await page.request.post('/api/v1/account/login',{data:C});
  expect((await page.request.patch(api('mod/posts/'+replyId),{data:{
   status:'HIDDEN',reason:'New independent moderation decision for stale-appeal regression'}})).status()).toBe(200);
  await page.request.post('/api/v1/account/login',{data:B});
  const stale=await page.request.post(api('appeals'),{data:{targetType:'POST',targetId:replyId,
   reason:'A new appeal whose original moderation action will soon become stale.'}});
  expect(stale.status()).toBe(201);
  const staleId=(await stale.json()).id;
  await page.request.post('/api/v1/account/login',{data:C});
  expect((await page.request.patch(api('mod/posts/'+replyId),{data:{
   status:'PUBLISHED',reason:'Restore topic under new moderation decision before old appeal review'}})).status()).toBe(200);
  await page.request.post('/api/v1/account/login',{data:A});
  const blockedStale=await page.request.patch(api('mod/appeals/'+staleId),{data:{
   decision:'ACCEPTED',reason:'An old appeal must never reverse a later moderation action'}});
  expect(blockedStale.status()).toBe(409);
  expect((await page.request.put(api('growth/bookmarks/'+threadId))).status()).toBe(200);
  const privateRequest=await page.request.post(api('privacy/requests'),{data:{kind:'ERASE_FORUM'}});
  expect(privateRequest.status()).toBe(201);privacyId=(await privateRequest.json()).id;
  expect((await page.request.get(api('mod/privacy'))).status()).toBe(403);
  const loginC2=await page.request.post('/api/v1/account/login',{data:C});expect(loginC2.ok()).toBe(true);
  expect((await page.request.get(api('mod/privacy'))).status()).toBe(200);
  const publicRedact=await page.request.patch(api('mod/privacy/'+privacyId),{
   data:{action:'PUBLIC_REDACT',reason:'User requested removal of their public forum contributions'}});
  expect(publicRedact.status()).toBe(200);
  expect((await db.comPrivacyRequest.findUnique({where:{id:privacyId}}))?.status).toBe('PUBLIC_REDACTED');
  expect(await db.comBookmark.count({where:{userId:aid}})).toBe(0);
  expect((await db.comThread.findUnique({where:{id:threadId}}))?.status).toBe('DELETED');
  expect((await page.request.get(api('threads/'+threadId))).status()).toBe(404);
 }finally{
  if(privacyId)await db.comPrivacyRequest.deleteMany({where:{id:privacyId}});
  if(aid||bid||cid)await db.comAppeal.deleteMany({where:{authorId:{in:[aid,bid,cid]}}});
  if(threadId)await db.comThread.deleteMany({where:{id:threadId}});
  if(aid||bid||cid)await db.comModerationAction.deleteMany({where:{actorId:{in:[aid,bid,cid]}}});
  if(aid||bid||cid)await db.user.deleteMany({where:{id:{in:[aid,bid,cid]}}});
  await db.$disconnect();
 }
});
