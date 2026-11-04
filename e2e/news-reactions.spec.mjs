import {fixtureAccount} from './support/disposable-accounts.mjs';
import {test,expect} from '@playwright/test';
import {randomUUID} from 'node:crypto';
const unique=()=>randomUUID().slice(0,10);
test('P2 private reactions: persist, switch, undo, erase and two-account isolation',async({page})=>{
 test.setTimeout(90000);
 if(!process.env.DATABASE_URL)test.skip();
 const {PrismaClient}=await import('@prisma/client');
 const prisma=new PrismaClient();
 const id=randomUUID(),urlHash='feedback-e2e-'+randomUUID();
 try{
  await prisma.newsArticle.create({data:{
   id,urlHash,url:'https://example.org/news/reactions/'+id,title:'Tarot symbolism and historical arcana story '+id,
   titleUk:'Таро: символіка арканів і традиція '+id,source:'P2 test publisher',
   topic:'tarot',tags:['tarot'],language:'en',score:95,publishedAt:new Date(),
   summaryUk:'Матеріал про символіку арканів та традиції читання карт Таро.'
  }});
  const route='/api/v1/news/reactions/'+id;
  expect((await page.request.get('/api/v1/news/reactions')).status()).toBe(401);
  expect((await page.request.put(route,{data:{vote:'YES'}})).status()).toBe(401);
  const accountA=await fixtureAccount(page,{data:{
   email:'galaxinews-p2-a-'+unique()+'@example.invalid',password:'News-P2-safe-password-2026'
  }});
  expect(accountA.status()).toBe(201);
  expect((await page.request.put(route,{data:{vote:'MAYBE'}})).status()).toBe(400);
  expect((await page.request.put(route,{headers:{Origin:'https://malicious.example'},data:{vote:'YES'}})).status()).toBe(403);
  const yes=await page.request.put(route,{data:{vote:'YES'}});
  expect(yes.status()).toBe(200);expect((await yes.json()).vote).toBe('YES');
  expect((await page.request.put(route,{data:{vote:'YES'}})).status()).toBe(200);
  const stored=await prisma.newsReaction.findMany({where:{articleId:id}});
  expect(stored.length).toBe(1);
  await page.reload();
  const reactionFeed=await page.request.get('/api/v1/news/reactions');
  expect(reactionFeed.status()).toBe(200);
  expect((await reactionFeed.json()).items.some(x=>x.articleId===id&&x.vote==='YES')).toBe(true);
  const personal=await page.request.get('/api/v1/news/feed?sort=personal&limit=48');
  expect(personal.status()).toBe(200);expect((await personal.json()).personalized).toBe(true);
  const no=await page.request.put(route,{data:{vote:'NO'}});
  expect(no.status()).toBe(200);
  const personalAfter=await (await page.request.get('/api/v1/news/feed?sort=personal&limit=48')).json();
  expect(personalAfter.items.some(x=>x.id===id)).toBe(false);
  const world=await (await page.request.get('/api/v1/news/feed?sort=relevance&limit=48')).json();
  expect(world.items.some(x=>x.id===id)).toBe(true);
  const registerB=await fixtureAccount(page,{data:{
   email:'galaxinews-p2-b-'+unique()+'@example.invalid',password:'News-P2-safe-password-2026'
  }});
  expect(registerB.status()).toBe(201);
  expect((await (await page.request.get('/api/v1/news/reactions')).json()).items).toEqual([]);
  expect((await page.request.delete(route)).status()).toBe(200);
  // A still has the NO vote after B's deletion attempt.
  expect((await prisma.newsReaction.findMany({where:{articleId:id}})).length).toBe(1);
  const bVote=await page.request.put(route,{data:{vote:'YES'}});
  expect(bVote.status()).toBe(200);
  const erase=await page.request.delete('/api/v1/news/reactions');
  expect(erase.status()).toBe(200);
  expect((await erase.json()).deleted).toBe(1);
  expect((await (await page.request.get('/api/v1/news/reactions')).json()).items).toEqual([]);
  expect((await prisma.newsReaction.findMany({where:{articleId:id}})).length).toBe(1);
 }finally{
  await prisma.newsArticle.deleteMany({where:{id}});
  await prisma.$disconnect();
 }
});
