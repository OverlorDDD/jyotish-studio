
test('GalaxiNews automatically shows a fast initial response and never erases it after the search timer',async({page})=>{
 const item={
  id:'initial-ui-article',url:'https://example.org/story',
  title:'New perspectives on Vedic astrology',titleUk:'Новий погляд на ведичну астрологію',
  summary:'The publisher examines the history of traditional natal chart interpretation.',
  summaryUk:'Матеріал розповідає про історію традиційного трактування натальних карт.',
  source:'Example Publisher',language:'en',topic:'jyotish',tags:['jyotish','natal-charts'],
  score:30,relevance:30,publishedAt:'2026-10-26T09:00:00.000Z',publishedAccuracy:'published'
 };
 let requests=0;
 await page.route('**/api/v1/news/feed?*',async route=>{
  requests++;
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
   items:[item],total:1,articleCount:110,page:1,limit:48,lastScan:{createdAt:'2026-10-26T09:00:00.000Z',sources:10,errors:0},
   personalized:false,sort:'relevance'
  })});
 });
 await page.goto('/uk/news');
 const headline=page.getByRole('heading',{name:item.titleUk});
 await expect(headline).toBeVisible({timeout:15000});
 await expect(page.getByTestId('news-article-count')).toContainText('110 статей');
 // A fast initial request formerly won the race and was erased 320ms later.
 await page.waitForTimeout(900);
 await expect(headline).toBeVisible();
 await expect(page.getByTestId('news-summary')).toContainText('історію традиційного трактування');
 await expect(page.getByRole('button',{name:'Оновити стрічку'})).toBeVisible();
 expect(requests).toBeGreaterThanOrEqual(1);
 await page.reload();
 await expect(headline).toBeVisible({timeout:15000});
 await page.waitForTimeout(900);
 await expect(headline).toBeVisible();
});

undefined