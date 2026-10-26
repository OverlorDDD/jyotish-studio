import {test,expect} from '@playwright/test';
import {randomUUID} from 'node:crypto';
const email=()=>`p4-${randomUUID().slice(0,12)}@example.invalid`;
const register=page=>page.request.post('/api/v1/account/register',{
 data:{email:email(),password:'P4-GalaxiNews-acceptance-2026'}});
test('P4: reactions history, export, opt-out and confirmed news-only reset preserve Personal data',async({page})=>{
 test.setTimeout(100000);
 if(!process.env.DATABASE_URL)test.skip();
 const {PrismaClient}=await import('@prisma/client');
 const prisma=new PrismaClient(),id=randomUUID(),urlHash='p4-'+randomUUID();
 try{
  await prisma.newsArticle.create({data:{id,urlHash,title:'Meditation and breathwork news '+id,
   titleUk:'Медитація та дихальні практики '+id,source:'Test P4 source',
   url:'https://example.org/meditation/'+id,topic:'meditation',tags:['meditation','pranayama'],
   language:'en',score:60,publishedAt:new Date(),
   summaryUk:'Публікація про медитацію та дихальні практики.'}});
  expect((await page.request.get('/api/v1/news/privacy/export')).status()).toBe(401);
  expect((await page.request.put('/api/v1/news/settings',{data:{enabled:false}})).status()).toBe(401);
  expect((await page.request.delete('/api/v1/news/privacy/reset')).status()).toBe(401);
  expect((await register(page)).status()).toBe(201);
  const articleRoute='/api/v1/news/reactions/'+id;
  expect((await page.request.patch('/api/v1/personal/profile',{
   data:{newsTopics:['academy','meditation']}})).status()).toBe(200);
  const vote=await page.request.put(articleRoute,{data:{vote:'NO'}});
  expect(vote.status()).toBe(200);
  const history=await page.request.get('/api/v1/news/reactions');
  expect(history.status()).toBe(200);
  const rows=(await history.json()).items;
  const single=rows.find(x=>x.articleId===id);
  expect(single?.vote).toBe('NO');
  expect(single?.article.titleUk).toContain('Медитація');
  const exported=await page.request.get('/api/v1/news/privacy/export');
  expect(exported.status()).toBe(200);
  const json=await exported.json();
  expect(json.complete).toBe(true);
  expect(json.interests).toEqual(['meditation']);
  expect(json.reactions.find(x=>x.articleId===id).vote).toBe('NO');
  expect(JSON.stringify(json)).not.toMatch(/passwordHash|birthDate|primaryChartId|journalEntries/);
  expect((await page.request.put('/api/v1/news/settings',{
   data:{enabled:false},headers:{Origin:'https://attacker.example'}})).status()).toBe(403);
  expect((await page.request.delete('/api/v1/news/privacy/reset',{
   headers:{Origin:'https://attacker.example'}})).status()).toBe(403);
  expect((await page.request.put('/api/v1/news/settings',{data:{enabled:'no'}})).status()).toBe(400);
  expect((await page.request.put('/api/v1/news/settings',{data:{enabled:false}})).status()).toBe(200);
  const status=await page.request.get('/api/v1/news/interests');
  expect((await status.json()).enabled).toBe(false);
  const feed=await page.request.get('/api/v1/news/feed?sort=personal&limit=48');
  expect(feed.status()).toBe(200);
  expect((await feed.json()).personalized).toBe(false);
  expect((await page.request.put(articleRoute,{data:{vote:'YES'}})).status()).toBe(409);
  // Turning personalization off does not silently delete the user's saved feedback.
  expect((await prisma.newsReaction.count({where:{articleId:id}})).toString()).toBe('1');
  await page.goto('/uk/news');
  const toggle=page.getByRole('button',{name:'Керування рекомендаціями'});
  await toggle.click();
  await expect(page.getByRole('switch',{name:'Персоналізацію вимкнено'})).toBeVisible();
  await expect(page.getByRole('heading',{name:/Історія реакцій/})).toBeVisible();
  await page.getByRole('switch',{name:'Персоналізацію вимкнено'}).click();
  await expect(page.getByRole('switch',{name:'Персоналізацію увімкнено'})).toBeVisible();
  expect((await page.request.put(articleRoute,{data:{vote:'YES'}})).status()).toBe(200);
  await page.reload();
  await page.getByRole('button',{name:'Керування рекомендаціями'}).click();
  await expect(page.getByRole('heading',{name:/Історія реакцій/})).toContainText('1');
  await page.getByRole('button',{name:'Скинути новинні налаштування'}).click();
  await expect(page.getByText(/Натальні карти й інші дані залишаться/)).toBeVisible();
  await page.getByRole('button',{name:'Назад'}).click();
  expect((await prisma.newsReaction.count({where:{articleId:id}})).toString()).toBe('1');
  await page.getByRole('button',{name:'Скинути новинні налаштування'}).click();
  await page.getByRole('button',{name:'Так, видалити'}).click();
  await expect(page.getByText('Ще немає оцінених публікацій.')).toBeVisible();
  expect((await prisma.newsReaction.count({where:{articleId:id}})).toString()).toBe('0');
  const profile=await page.request.get('/api/v1/personal/profile');
  expect((await profile.json()).profile.newsTopics).toEqual(['academy']);
  const preferences=await page.request.get('/api/v1/news/interests');
  expect((await preferences.json()).tags).toEqual([]);
  expect((await preferences.json()).enabled).toBe(true);
  // An unrelated account does not inherit A's history or interests.
  expect((await register(page)).status()).toBe(201);
  const b=await page.request.get('/api/v1/news/privacy/export');
  expect((await b.json()).reactions).toEqual([]);
 }finally{
  await prisma.newsArticle.deleteMany({where:{id}});
  await prisma.$disconnect();
 }
});

test('P5 guests suppress similar news locally and restore on undo without account writes',async({page})=>{
 test.setTimeout(80000);
 if(!process.env.DATABASE_URL)test.skip();
 const {PrismaClient}=await import('@prisma/client');
 const db=new PrismaClient(),ids=[randomUUID(),randomUUID()],suffix=randomUUID().slice(0,9);
 try{
  for(let n=0;n<2;n++){
   await db.newsArticle.create({data:{id:ids[n],urlHash:'guest-p5-'+ids[n],
    title:'P5Guest'+suffix+(n===0?' Gentle pranayama breathing practice for evening relaxation':
     ' Ancient yoga philosophy and pranayama traditions examined'),
    titleUk:'P5Guest'+suffix+(n===0?' Дихальні вправи для спокійного вечора та відпочинку':
     ' Історія пранаями у ведичній традиції та філософії йоги'),
    url:'https://example.org/guest-news/'+ids[n],
    topic:'yoga',tags:['yoga','pranayama'],language:'en',source:'P5 guest publisher',
    score:9999-n,publishedAt:new Date()}})
  }
  await page.goto('/uk/news');
  await page.getByRole('searchbox',{name:'Пошук новин'}).fill('P5Guest'+suffix);
  await expect(page.locator('[data-testid="galaxinews-world"] article')).toHaveCount(2);
  const no=page.getByTestId('news-vote-no').first();
  await expect(no).toBeEnabled();await no.click();
  await page.getByRole('button',{name:'Пранаяма'}).click();
  await page.getByRole('button',{name:/Для мене/}).click();
  await expect(page.locator('[data-testid="galaxinews-world"] article')).toHaveCount(0);
  await page.getByRole('button',{name:/Головне/}).click();
  await expect(page.locator('[data-testid="galaxinews-world"] article')).toHaveCount(2);
  await page.getByTestId('news-vote-no').first().click();
  await page.getByRole('button',{name:/Для мене/}).click();
  await expect(page.locator('[data-testid="galaxinews-world"] article')).toHaveCount(2);
  expect((await page.request.get('/api/v1/news/reactions')).status()).toBe(401);
 }finally{
  await db.newsArticle.deleteMany({where:{id:{in:ids}}});
  await db.$disconnect();
 }
});
