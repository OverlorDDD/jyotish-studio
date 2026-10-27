import {test,expect} from '@playwright/test';
import {randomUUID} from 'node:crypto';
const account=()=>({email:'galaxicom-'+randomUUID().slice(0,12)+'@example.invalid',
 password:'GalaxiCom-safe-demo-password-2026'});
test('GalaxiCom C0/C1: guest, two users, moderation, PREMIUM isolation and UI',async({page})=>{
 test.setTimeout(115000);
 if(!process.env.DATABASE_URL)test.skip();
 const {PrismaClient}=await import('@prisma/client');
 const db=new PrismaClient();let aId='',bId='',topicId='',postId='';
 try{
  const cats=await page.request.get('/api/v1/com/categories');
  expect(cats.status()).toBe(200);
  expect((await cats.json()).items.length).toBeGreaterThanOrEqual(7);
  expect((await page.request.get('/api/v1/com/threads')).status()).toBe(200);
  expect((await page.request.post('/api/v1/com/threads',{data:{categorySlug:'tarot',
   title:'A member discusses Tarot symbolism and practice',
   body:'My question concerns traditional card reading and interpretation.'}})).status()).toBe(401);
  await page.goto('/uk/community');
  await expect(page.getByRole('heading',{name:'GalaxiCom'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Створити тему'})).toHaveCount(0);
  const first=await page.request.post('/api/v1/account/register',{data:account()});
  expect(first.status()).toBe(201);aId=(await first.json()).user.id;
  const bad=await page.request.post('/api/v1/com/threads',{headers:{Origin:'https://hostile.example'},
   data:{categorySlug:'tarot',title:'A topic about a Tarot reading',body:'A long enough discussion body for a real thread.'}});
  expect(bad.status()).toBe(403);
  const make=await page.request.post('/api/v1/com/threads',{data:{categorySlug:'jyotish',
   title:'How should Navamsha be interpreted in Jyotish?',
   body:'I would like to understand the difference between D1 and D9 without sharing personal birth data.'}});
  expect(make.status()).toBe(201);topicId=(await make.json()).id;
  const read=await page.request.get('/api/v1/com/threads/'+topicId);
  expect(read.status()).toBe(200);
  const created=(await read.json()).thread;
  expect(created.author.name).not.toMatch(/@/);
  expect(created.author.premium).toBe(false);
  const invalid=await page.request.post('/api/v1/com/threads/'+topicId+'/posts',{
   data:{body:'<script>alert(1)</script>'}});
  expect(invalid.status()).toBe(400);
  await page.goto('/uk/community');
  const topicLink=page.getByTestId('com-thread-card').getByRole('link',{name:created.title});
  await expect(topicLink).toBeVisible();
  await topicLink.click();
  await expect(page.getByTestId('com-thread')).toBeVisible();
  await expect(page.getByText('I would like to understand the difference between D1 and D9 without sharing personal birth data.')).toBeVisible();
  const second=await page.request.post('/api/v1/account/register',{data:account()});
  expect(second.status()).toBe(201);bId=(await second.json()).user.id;
  expect((await page.request.patch('/api/v1/com/me',{data:{showPremiumBadge:true}})).status()).toBe(403);
  const cross=await page.request.patch('/api/v1/com/threads/'+topicId,{
   data:{body:'I should never be allowed to rewrite someone else’s discussion.'}});
  expect([403,404].includes(cross.status())).toBe(true);
  const reply=await page.request.post('/api/v1/com/threads/'+topicId+'/posts',{
   data:{body:'Read the whole chart context first, not only an isolated divisional position.'}});
  expect(reply.status()).toBe(201);postId=(await reply.json()).id;
  const posts=await (await page.request.get('/api/v1/com/threads/'+topicId+'/posts')).json();
  expect(posts.items.length).toBe(1);
  expect(posts.items[0].author.id).toBe(bId);
  const report=await page.request.post('/api/v1/com/reports',{data:{
   target:'thread',targetId:topicId,reason:'Moderator review requested because this example may contain private facts.'}});
  expect(report.status()).toBe(201);
  expect((await page.request.get('/api/v1/com/mod/reports')).status()).toBe(403);
  // Controlled local CI fixture: PREMIUM is only set by Prisma, NEVER by public API.
  await db.user.update({where:{id:bId},data:{subscriptionTier:'PREMIUM',
   subscriptionEndsAt:new Date(Date.now()+86400000),role:'SUPPORT'}});
  const me=await (await page.request.get('/api/v1/com/me')).json();
  expect(me.permissions.premiumBadge).toBe(true);
  expect(me.permissions.canModerate).toBe(true);
  expect(me.permissions.canOverrideModeration).toBe(false);
  expect((await page.request.patch('/api/v1/com/me',{data:{showPremiumBadge:true}})).status()).toBe(200);
  const premiumPosts=await (await page.request.get('/api/v1/com/threads/'+topicId+'/posts')).json();
  expect(premiumPosts.items.find(p=>p.id===postId)?.author.premium).toBe(true);
  await db.user.update({where:{id:bId},data:{subscriptionEndsAt:new Date(Date.now()-86400000)}});
  const expiredPosts=await (await page.request.get('/api/v1/com/threads/'+topicId+'/posts')).json();
  expect(expiredPosts.items.find(p=>p.id===postId)?.author.premium).toBe(false);

  const queue=await (await page.request.get('/api/v1/com/mod/reports')).json();
  expect(queue.items.some(r=>r.targetId===topicId)).toBe(true);
  expect((await page.request.patch('/api/v1/com/mod/threads/'+topicId,{data:{
   pinned:true,reason:'Moderator requested highlight'}})).status()).toBe(403);
  const hide=await page.request.patch('/api/v1/com/mod/threads/'+topicId,{data:{
   status:'HIDDEN',reason:'Reported content requires moderator review'}});
  expect(hide.status()).toBe(200);
  expect((await page.request.get('/api/v1/com/threads/'+topicId)).status()).toBe(404);
  const restore=await page.request.patch('/api/v1/com/mod/threads/'+topicId,{data:{
   status:'PUBLISHED',locked:true,reason:'Reviewed and locked after resolution'}});
  expect(restore.status()).toBe(200);
  const locked=await page.request.post('/api/v1/com/threads/'+topicId+'/posts',{data:{body:'Locked'}});
  expect([404,403].includes(locked.status())).toBe(true);
  const queueEntry=queue.items.find(r=>r.targetId===topicId);
  expect((await page.request.patch('/api/v1/com/mod/reports/'+queueEntry.id,{data:{
   decision:'RESOLVED',reason:'Reviewed with explicit human moderation'}})).status()).toBe(200);
  const auditedActions=await db.comModerationAction.count({where:{targetId:topicId}});
  expect(auditedActions).toBeGreaterThanOrEqual(2);
  await page.goto('/en/community/topic/'+topicId);
  await expect(page.getByRole('heading',{name:created.title})).toBeVisible();
  await expect(page.getByText(/Read the whole chart context first/)).toBeVisible();
 }finally{
  if(topicId)await db.comReport.deleteMany({where:{threadId:topicId}});
  if(topicId)await db.comThread.deleteMany({where:{id:topicId}});
  if(aId||bId)await db.comModerationAction.deleteMany({where:{actorId:{in:[aId,bId]}}});
  if(aId||bId)await db.user.deleteMany({where:{id:{in:[aId,bId]}}});
  await db.$disconnect();
 }
});
