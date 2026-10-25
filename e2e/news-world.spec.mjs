import {test,expect} from '@playwright/test';
test('GalaxiNews World is a public bilingual editorial feed with tag preferences',async({page})=>{
 await page.goto('/uk/news');
 await expect(page.getByTestId('galaxinews-world')).toBeVisible();
 await expect(page.getByRole('heading',{name:'GalaxiNews'})).toBeVisible();
 await expect(page.locator('header.as-header')).toHaveCount(1);
 await expect(page.getByRole('button',{name:'Таро',exact:true})).toHaveAttribute('aria-pressed','false');
 await page.getByRole('button',{name:'Таро',exact:true}).click();
 await expect(page.getByRole('button',{name:'Таро',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.reload();
 await expect(page.getByRole('button',{name:'Таро',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:/Для мене/}).click();
 await expect(page.getByText('Добірка за твоїми інтересами')).toBeVisible();
 const feed=await page.request.get('/api/v1/news/feed?limit=12');
 expect(feed.status()).toBe(200);
 const data=await feed.json();expect(Array.isArray(data.items)).toBe(true);
 expect(data.personalized).toBe(false);
 const bad=await page.request.get('/api/v1/news/feed?topic=invalid');
 expect(bad.status()).toBe(400);
 await page.goto('/en/news');
 await expect(page.getByRole('heading',{name:'GalaxiNews'})).toBeVisible();
 await expect(page.getByRole('region',{name:'Your constellation of interests'})).toBeVisible();
});

test('GalaxiNews World renders an informative paragraph and feedback from database-backed articles',async({page})=>{
 if(!process.env.DATABASE_URL)test.skip();
 const {PrismaClient}=await import('@prisma/client');
 const {randomUUID}=await import('node:crypto');
 const db=new PrismaClient(),prefix='news-ci-'+randomUUID();
 const items=[];
 try{
  for(let i=0;i<5;i++){
   const title='Tarot spread patterns and symbolism for new readers — '+prefix+' '+i;
   const id=randomUUID();
   items.push(id);
   await db.newsArticle.create({data:{
    id,urlHash:prefix+'-'+i,url:'https://example.org/editorial/'+prefix+'-'+i,title,
    source:'CI Tarot Publisher',language:'en',topic:'tarot',tags:['tarot'],
    score:200,summary:'This article introduces the structure of a Tarot spread and explains why each position matters to the interpretation.',
    summaryKind:'source_excerpt',titleUk:'Значення символів у розкладах Таро',summaryUk:'Матеріал пояснює структуру розкладу Таро та призначення кожної позиції.',imageUrl:'https://images.example.org/news-cover.jpg',imageCredit:'CI Image',publishedAt:new Date(),publishedAccuracy:'published'
   }});
  }
  const response=await page.request.get('/api/v1/news/feed?topic=tarot&limit=48');
  expect(response.status()).toBe(200);
  const data=await response.json();
  expect(data.items.some(x=>x.title.includes(prefix)&&x.summary?.includes('Tarot spread'))).toBe(true);
  await page.goto('/uk/news');
  await page.locator('#news-topic-filter').selectOption('tarot');
  await expect(page.getByTestId('news-summary').first()).toBeVisible();
  await expect(page.getByText(/Матеріал пояснює структуру розкладу Таро/).first()).toBeVisible();
  await expect(page.getByRole('heading',{name:'Значення символів у розкладах Таро'}).first()).toBeVisible();
  await expect(page.getByText('Орієнтир за заголовком')).toHaveCount(0);
  await expect(page.getByText(/Це орієнтир за назвою матеріалу/)).toHaveCount(0);
  await expect(page.locator('img[src="https://images.example.org/news-cover.jpg"]').first()).toHaveCount(1);
  await expect(page.getByTestId('news-feedback').first()).toBeVisible();
  await page.getByTestId('news-feedback').first().getByRole('button',{name:/Так, цікаво/}).click();
  await expect(page.getByTestId('news-feedback').first().getByRole('button',{name:/Так, цікаво/})).toHaveAttribute('aria-pressed','true');
 }finally{
  await db.newsArticle.deleteMany({where:{id:{in:items}}});
  await db.$disconnect();
 }
});
