import {test,expect} from '@playwright/test';
test('GalaxiNews World is a public bilingual editorial feed with tag preferences',async({page})=>{
 const response=await page.goto('/uk/news');
 expect(response?.headers()['x-galaxiora-news-revision']).toBe('world-v1.6');
 await expect(page.getByTestId('galaxinews-world')).toBeVisible();
 await expect(page.getByRole('heading',{name:'GalaxiNews'})).toBeVisible();
 await expect(page.getByRole('search',{name:'Пошук новин'})).toBeVisible();
 const tabs=page.getByRole('navigation',{name:'Тип стрічки'});
 const search= tabs.getByRole('searchbox',{name:'Пошук новин'});
 await expect(search).toBeVisible();
 const searchBox=await search.boundingBox();
 const forMe=await tabs.getByRole('button',{name:/Для мене/}).boundingBox();
 const tagsArea=await page.getByRole('region',{name:'Хмара твоїх інтересів'}).boundingBox();
 expect(searchBox&&forMe&&tagsArea).toBeTruthy();
 expect(searchBox.y).toBeLessThan(tagsArea.y);
 if((page.viewportSize()?.width||0)>=1000){
  expect(searchBox.x).toBeGreaterThan(forMe.x+forMe.width-5);
  expect(Math.abs(searchBox.y-forMe.y)).toBeLessThan(35);
 }
 await expect(page.getByTestId('news-article-count')).toContainText(/\d[\d\s]* статей/);
 const interestCloud=page.getByRole('region',{name:'Хмара твоїх інтересів'});
 const allTags=page.getByTestId('news-all-interest-tags');
 await expect(allTags.locator('button')).toHaveCount(12);
 await expect(allTags.getByRole('button',{name:'Астрономія'})).toBeVisible();
 await expect(page.getByText('Обери кілька тегів — вони стануть основою твоєї добірки. Поки що вибір зберігається лише в цьому браузері.')).toHaveCount(0);
 await expect(page.getByText(/Перевірка джерел приблизно кожні 15 хвилин/)).toHaveCount(0);
 await expect(page.getByTestId('news-tabs-search')).toBeVisible();
 await expect(page.getByTestId('news-article-count')).toBeVisible();
 const actualDOM=await page.evaluate(()=>({
  revision:document.querySelector('[data-testid="galaxinews-world"]')?.getAttribute('data-release'),
  searchFound:Boolean(document.querySelector('#galaxinews-search')),
  htmlText:document.body.innerText
 }));
 expect(actualDOM.revision).toBe('world-v1.6');
 expect(actualDOM.searchFound).toBe(true);
 expect(actualDOM.htmlText).not.toContain('Астрономічні матеріали не змішуються');
 expect(actualDOM.htmlText).not.toContain('Перевірка джерел приблизно кожні 15 хвилин');
 await expect(interestCloud.getByRole('button',{name:'Астрономія'})).toBeVisible();
 await expect(interestCloud.getByRole('button',{name:'Натальні карти'})).toBeVisible();
 await expect(interestCloud.getByRole('button',{name:'Мантри'})).toBeVisible();
 await expect(page.getByText('Астрономічні матеріали не змішуються з астрологічними трактуваннями автоматично.')).toHaveCount(0);

 await expect(page.locator('[data-release="world-v1.6"]')).toHaveCount(1);
 await expect(page.getByText('Перевірка джерел приблизно кожні 15 хвилин')).toHaveCount(0);
 await expect(page.getByText('Хмара твоїх інтересів',{exact:true})).toHaveCount(1);
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
 expect(Number.isInteger(data.articleCount)).toBe(true);
 expect(data.articleCount).toBeGreaterThanOrEqual(data.total);
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
  const matched=await page.request.get('/api/v1/news/feed?limit=48&q='+encodeURIComponent(prefix));
  expect(matched.status()).toBe(200);
  const results=await matched.json();
  expect(results.items.filter(x=>x.title.includes(prefix)).length).toBe(5);
  const badSearch=await page.request.get('/api/v1/news/feed?q='+('x'.repeat(90)));
  expect(badSearch.status()).toBe(400);
  const guests=await page.request.get('/api/v1/news/admin/health');
  expect(guests.status()).toBe(401);
  await page.route('https://images.example.org/news-cover.jpg',route=>route.fulfill({
   status:200,contentType:'image/png',
   body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jlhQAAAAASUVORK5CYII=','base64')
  }));
  await page.goto('/uk/news');
  await page.locator('#news-topic-filter').selectOption('tarot');
  const search=page.getByRole('searchbox',{name:'Пошук новин'});
  await search.fill(prefix);
  await expect(page.getByRole('heading',{name:'Результати пошуку'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Значення символів у розкладах Таро'}).first()).toBeVisible();
  await search.fill('');

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
