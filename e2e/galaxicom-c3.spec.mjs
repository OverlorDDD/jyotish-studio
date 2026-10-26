import {test,expect} from '@playwright/test';
import {randomUUID} from 'node:crypto';
const identity=()=>({email:'galaxicom-c3-'+randomUUID().slice(0,12)+'@example.invalid',
 password:'GalaxiCom-C3-valid-demo-password-2026'});
const ctx=(kind,slug)=>'/api/v1/com/context?'+new URLSearchParams({kind,slug});
test('GalaxiCom C3: published sources, editorial approvals, hidden posts and private-data separation',async({page})=>{
 test.setTimeout(130000);
 if(!process.env.DATABASE_URL)test.skip();
 const {PrismaClient}=await import('@prisma/client');
 const db=new PrismaClient();const creds=identity();
 const cmsSlug='c3-test-'+randomUUID().slice(0,8);
 let userId='',threadId='',linkId='',cmsId='';
 try{
  await page.goto('/uk/learn/vimshottari-life-cycle');
  await expect(page.getByTestId('community-context')).toBeVisible();
  await expect(page.getByText('Ще немає схвалених тематичних обговорень.')).toBeVisible();
  const guest=await page.request.get(ctx('ACADEMY','vimshottari-life-cycle'));
  expect(guest.status()).toBe(200);
  expect((await guest.json()).source.category).toBe('jyotish');
  expect((await page.request.get(ctx('CHART','private-chart'))).status()).toBe(400);
  expect((await page.request.get(ctx('ACADEMY','draft-unknown-article'))).status()).toBe(404);
  expect((await page.request.post('/api/v1/com/context/links',{data:{
   kind:'ACADEMY',slug:'vimshottari-life-cycle',threadId:randomUUID()}})).status()).toBe(401);
  const register=await page.request.post('/api/v1/account/register',{data:creds});
  expect(register.status()).toBe(201);
  userId=(await register.json()).user.id;
  const posted=await page.request.post('/api/v1/com/threads',{data:{
   categorySlug:'jyotish',title:'Reading Vimshottari in the context of an entire natal chart',
   body:'This is an original public discussion about classical Vimshottari cycles; no private chart or reading data is included.'}});
  expect(posted.status()).toBe(201);threadId=(await posted.json()).id;
  const proposal={kind:'ACADEMY',slug:'vimshottari-life-cycle',threadId};
  expect((await page.request.post('/api/v1/com/context/links',{data:proposal})).status()).toBe(403);
  await db.user.update({where:{id:userId},data:{role:'SUPPORT'}});
  expect((await page.request.post('/api/v1/com/context/links',{data:proposal})).status()).toBe(403);
  await db.user.update({where:{id:userId},data:{role:'ADMIN'}});
  const cross=await page.request.post('/api/v1/com/context/links',{headers:{Origin:'https://hostile.example'},data:proposal});
  expect(cross.status()).toBe(403);
  const untrusted=await page.request.post('/api/v1/com/context/links',{data:{kind:'CHART',slug:'private-chart',threadId}});
  expect([400,422].includes(untrusted.status())).toBe(true);
  const approved=await page.request.post('/api/v1/com/context/links',{data:proposal});
  expect(approved.status()).toBe(201);linkId=(await approved.json()).id;
  expect((await page.request.post('/api/v1/com/context/links',{data:proposal})).status()).toBe(409);
  await page.goto('/uk/learn/vimshottari-life-cycle');
  const bridge=page.getByTestId('community-context');
  await expect(bridge.getByRole('link',{name:/Reading Vimshottari in the context/})).toBeVisible();
  await expect(bridge.getByText('Зв’язок схвалений редакцією')).toBeVisible();
  expect(await bridge.getByText('Прив’язати тему').count()).toBeGreaterThan(0);
  expect(await db.comModerationAction.count({where:{targetId:linkId,action:'APPROVE_LINK'}})).toBe(1);
  await page.goto('/en/learn/vimshottari-life-cycle');
  await expect(page.getByText('Editorially linked')).toBeVisible();
  // Rejected source is still DRAFT in CMS.
  const entry=await db.editorialEntry.create({data:{kind:'ACADEMY',slug:cmsSlug,
   topic:'tarot',status:'DRAFT',creatorId:userId,
   document:{title:{uk:'Пробний матеріал',en:'Test material'},summary:{uk:'Анотація',en:'Summary'},
    body:{uk:'Пробний текст',en:'Test body'}}},select:{id:true}});
  cmsId=entry.id;
  expect((await page.request.get(ctx('ACADEMY',cmsSlug))).status()).toBe(404);
  expect((await page.request.post('/api/v1/com/context/links',{data:{kind:'ACADEMY',slug:cmsSlug,threadId}})).status()).toBe(400);
  await db.editorialEntry.update({where:{id:cmsId},data:{status:'PUBLISHED',publishedAt:new Date()}});
  expect((await (await page.request.get(ctx('ACADEMY',cmsSlug))).json()).source.category).toBe('tarot');
  await db.editorialEntry.update({where:{id:cmsId},data:{status:'ARCHIVED'}});
  expect((await page.request.get(ctx('ACADEMY',cmsSlug))).status()).toBe(404);
  // Moderators can hide content; linked lists must not leak the hidden discussion.
  expect((await page.request.patch('/api/v1/com/mod/threads/'+threadId,{data:{
   status:'HIDDEN',reason:'Community link visibility integration test'}})).status()).toBe(200);
  expect((await (await page.request.get(ctx('ACADEMY','vimshottari-life-cycle'))).json()).items).toEqual([]);
  expect((await page.request.patch('/api/v1/com/mod/threads/'+threadId,{data:{
   status:'PUBLISHED',reason:'Restore after forum integration test'}})).status()).toBe(200);
  const unlinked=await page.request.delete('/api/v1/com/context/links/'+linkId);
  expect(unlinked.status()).toBe(200);
  expect((await (await page.request.get(ctx('ACADEMY','vimshottari-life-cycle'))).json()).items).toEqual([]);
  expect(await db.comModerationAction.count({where:{targetId:linkId,action:'UNLINK'}})).toBe(1);
  await page.goto('/uk/tarot');
  await expect(page.getByTestId('community-module-link').getByRole('link',{name:/Перейти до GalaxiCom/})).toHaveAttribute('href','/uk/community?category=tarot');
  await page.goto('/uk/astrology/jyotish');
  await expect(page.getByTestId('community-module-link').getByRole('link',{name:/Перейти до GalaxiCom/})).toHaveAttribute('href','/uk/community?category=jyotish');
 }finally{
  if(linkId)await db.comContextLink.deleteMany({where:{id:linkId}});
  if(threadId)await db.comThread.deleteMany({where:{id:threadId}});
  if(cmsId)await db.editorialEntry.deleteMany({where:{id:cmsId}});
  if(userId)await db.comModerationAction.deleteMany({where:{actorId:userId}});
  if(userId)await db.user.deleteMany({where:{id:userId}});
  await db.$disconnect();
 }
});
