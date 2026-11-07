import {test,expect} from '@playwright/test';

for(const locale of ['uk','en']){
 test('R3.2 official Galaxiora brand is visible in '+locale+' and about page is crawlable',async({page})=>{
  await page.goto('/'+locale);
  await expect(page.locator('.jy-workbench')).toBeVisible();
  const about=page.locator('a[href="/'+locale+'/about"]').first();
  await expect(about).toBeVisible();
  await about.click();
  await expect(page).toHaveURL(new RegExp('/'+locale+'/about$'));
  await expect(page.getByRole('heading',{level:1})).toContainText('Galaxiora');
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href','https://galaxiora.example/'+locale+'/about');
  await expect(page.locator('head meta[name="robots"]')).not.toHaveAttribute('content',/noindex/);
  const lang=await page.locator('html').getAttribute('lang');
  expect(lang).toBe(locale);
  await expect(page.locator('script[type="application/ld+json"]')).not.toHaveCount(0);
 });
}
test('R3.2 sitemap only lists canonical astronomy destination and about pages',async({request})=>{
 const response=await request.get('/sitemap.xml');
 expect(response.status()).toBe(200);
 const xml=await response.text();
 expect(xml).toContain('https://galaxiora.example/uk/about');
 expect(xml).toContain('https://galaxiora.example/en/about');
 expect(xml).toContain('https://galaxiora.example/uk/astrology/jyotish');
 expect(xml).not.toMatch(/<loc>https:\/\/galaxiora\.example\/(uk|en)\/astrology<\/loc>/);
});
test('R3.2 about and home pages have no horizontal overflow at mobile width',async({page,isMobile})=>{
 if(!isMobile)return;
 for(const path of ['/uk','/uk/about','/en/about']){
  await page.goto(path);
  const size=await page.evaluate(()=>({
   doc:document.documentElement.scrollWidth,
   viewport:document.documentElement.clientWidth
  }));
  expect(size.doc,'horizontal overflow '+path).toBeLessThanOrEqual(size.viewport+2);
 }
});

test('R3.2 both Tarot landing pages expose a meaningful H1 in the initial HTML',async({page})=>{
 for(const locale of ['uk','en']){
  await page.goto('/'+locale+'/tarot');
  await expect(page.getByRole('heading',{level:1})).toContainText('GalaxiTarot');
 }
});

test('GP1 root is canonical and locale homepage 308 aliases do not appear in sitemap',async({request})=>{
 const root=await request.get('/',{maxRedirects:0});
 expect(root.status()).toBe(200);
 const html=await root.text();
 expect(html).toContain('<link rel="canonical" href="https://galaxiora.example/">');
 for(const locale of ['en','uk']){
  const alias=await request.get('/'+locale,{maxRedirects:0});
  expect(alias.status()).toBe(308);
  expect(new URL(alias.headers()['location'],'https://galaxiora.example').pathname).toBe('/'+locale+'/astrology/jyotish');
 }
 const xml=await (await request.get('/sitemap.xml')).text();
 expect(xml).toContain('<loc>https://galaxiora.example/</loc>');
 expect(xml).not.toMatch(/<loc>https:\\/\\/galaxiora\\.example\\/(en|uk)<\\/loc>/);
});
