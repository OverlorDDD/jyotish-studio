import {fixtureAccount} from './support/disposable-accounts.mjs';
import {test,expect} from '@playwright/test';
import {randomUUID} from 'node:crypto';
test('Personal News shows real published GalaxiNews items and a full-feed link without requiring a natal chart',async({page})=>{
 test.setTimeout(100000);
 if(!process.env.DATABASE_URL)test.skip();
 const {PrismaClient}=await import('@prisma/client');const db=new PrismaClient();
 const code=randomUUID(),title='Перевірена добірка Джйотіш — '+code.slice(0,8);
 let userId='',articleId='';
 try{
  const user=await fixtureAccount(page,{data:{
   email:'personal-news-preview-'+code.slice(0,10)+'@example.invalid',
   password:'PersonalNews-v2-test-valid-password-2026'}});
  expect(user.status()).toBe(201);userId=(await user.json()).user.id;
  const prefs=await page.request.patch('/api/v1/personal/profile',{data:{newsTopics:['jyotish']}});
  expect(prefs.status()).toBe(200);
  const article=await db.newsArticle.create({data:{
   urlHash:code,url:'https://example.com/galaxiora-editorial-fixture-'+code,title,
   titleUk:title,source:'Editorial CI fixture',language:'uk',topic:'jyotish',tags:['jyotish'],
   score:100000,publishedAt:new Date(),status:'PUBLISHED',
   summaryUk:'Короткий огляд матеріалу, створеного лише для перевірки інтеграції.',
   summaryEn:'A short test article preview from the real News API.'
  },select:{id:true}});
  articleId=article.id;
  await page.goto('/uk/personal');
  const preview=page.getByTestId('personal-news-preview');
  await expect(preview).toBeVisible();
  await expect(preview.getByText(title)).toBeVisible();
  await expect(preview.getByText('Editorial CI fixture')).toBeVisible();
  await expect(preview.getByRole('link',{name:/Усі новини GalaxiNews/})).toHaveAttribute('href','/uk/news');
 }finally{
  if(articleId)await db.newsArticle.deleteMany({where:{id:articleId}});
  if(userId)await db.user.deleteMany({where:{id:userId}});
  await db.$disconnect();
 }
});
