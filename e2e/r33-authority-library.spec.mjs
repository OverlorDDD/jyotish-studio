import {test,expect} from '@playwright/test';

const slugs=['fool','magician','high-priestess','lovers','hermit','death','moon','sun'];
for(const locale of ['uk','en']){
 test('R3.3 '+locale+' Tarot library exposes actual SSR card pages',async({request,page})=>{
  const hub='/'+locale+'/tarot/cards';
  const response=await request.get(hub);
  expect(response.status()).toBe(200);
  const body=await response.text();
  for(const slug of slugs)expect(body).toContain('/'+locale+'/tarot/cards/'+slug);
  await page.goto(hub);
  await expect(page.getByRole('heading',{level:1})).toContainText(locale==='uk'?'Значення карт Таро':'Tarot card meanings');
  await expect(page.locator('article.as-lesson-card')).toHaveCount(8);
  for(const slug of slugs){
   const url='/'+locale+'/tarot/cards/'+slug;
   const r=await request.get(url);
   expect(r.status(),url).toBe(200);
   const html=await r.text();
   expect(html).toContain('data-testid="tarot-card-guide"');
   expect(html).toContain('https://galaxiora.example'+url);
   expect(html).toContain('BreadcrumbList');
   expect(html).toContain('Article');
   expect(html).not.toMatch(/<meta[^>]*name="robots"[^>]*content="[^"]*noindex/i);
   expect(html).toContain('/'+locale+'/learn/tarot-reversals');
  }
 });
 test('R3.3 '+locale+' 2027 eclipse guide has NASA sources, correct dates and Panchanga links',async({request,page})=>{
  const url='/'+locale+'/eclipses/2027';
  const response=await request.get(url);
  expect(response.status()).toBe(200);
  const body=await response.text();
  expect(body).toContain('data-testid="eclipse-calendar-2027"');
  for(const date of ['2027-02-06','2027-02-20','2027-07-18','2027-08-02','2027-08-17'])expect(body).toContain(date);
  expect(body).toContain('https://eclipse.gsfc.nasa.gov/OH/OH2027.html');
  expect(body).toContain('https://galaxiora.example'+url);
  await page.goto(url);
  await expect(page.getByRole('heading',{level:1})).toContainText('2027');
  await expect(page.getByTestId('eclipse-calendar-2027').locator('time')).toHaveCount(5);
  await expect(page.locator('a[href="/'+locale+'/panchanga"]').last()).toBeVisible();
 });
}
test('R3.3 sitemap includes precisely curated guides, not nonexistent card routes',async({request})=>{
 const sitemap=await request.get('/sitemap.xml');
 expect(sitemap.status()).toBe(200);
 const xml=await sitemap.text();
 for(const locale of ['uk','en']){
  for(const slug of slugs)expect(xml).toContain('https://galaxiora.example/'+locale+'/tarot/cards/'+slug);
  expect(xml).toContain('https://galaxiora.example/'+locale+'/tarot/cards');
  expect(xml).toContain('https://galaxiora.example/'+locale+'/eclipses/2027');
  expect(xml).not.toContain('https://galaxiora.example/'+locale+'/tarot/cards/not-a-real-card');
 }
});
test('R3.3 public Tarot and Panchanga hubs link to editorial material',async({request})=>{
 const tarot=await request.get('/uk/tarot');
 const panchanga=await request.get('/uk/panchanga');
 expect(await tarot.text()).toContain('/uk/tarot/cards');
 expect(await panchanga.text()).toContain('/uk/eclipses/2027');
});
