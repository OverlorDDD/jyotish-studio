import {test,expect} from '@playwright/test';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGPsWX2fgYGBiYGBgYGBAQAY3wIamMxOkAAAAABJRU5ErkJggg==','base64');
test('licensed Commons alternative photo is visible with creator and click-through license attribution',async({page})=>{
 const photo='https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Sunrise.jpg/760px-Sunrise.jpg';
 await page.route('https://upload.wikimedia.org/**',route=>route.fulfill({status:200,contentType:'image/png',body:png}));
 await page.route('**/api/v1/news/feed?*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
  items:[{id:'licensed-news-cover',url:'https://example.org/reading',title:'Vedic yoga and sunrise meditation for spiritual practice',
   titleUk:'Ранкова йога і медитація у ведичній традиції',topic:'yoga',tags:['yoga','meditation'],
   publishedAt:'2026-10-28T08:00:00Z',publishedAccuracy:'published',
   source:'Publisher',language:'en',relevance:55,
   imageUrl:photo,imageCredit:'Photographer Example · CC BY 4.0 · Wikimedia Commons',
   imagePageUrl:'https://commons.wikimedia.org/wiki/File:Sunrise.jpg',
   imageLicense:'CC BY 4.0',imageLicenseUrl:'https://creativecommons.org/licenses/by/4.0/'}],
  total:1,articleCount:1,page:1,limit:24,lastScan:null,personalized:false,sort:'relevance'
 })}));
 await page.goto('/uk/news');
 const img=page.locator('img[src*="upload.wikimedia.org"]').first();
 await expect(img).toBeVisible();
 await expect(page.getByRole('link',{name:/Photographer Example/})).toHaveAttribute('href','https://commons.wikimedia.org/wiki/File:Sunrise.jpg');
 await expect(page.locator('a[href="https://creativecommons.org/licenses/by/4.0/"]')).toHaveCount(1);
});

test('news card keeps an immediately readable illustration when the licensed photo fails',async({page})=>{
 await page.route('https://upload.wikimedia.org/**',route=>route.abort('failed'));
 await page.route('**/api/v1/news/feed?*',route=>route.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify({
   items:[{id:'offline-illustration',url:'https://example.org/story',
    title:'Yoga and meditation for morning practice',titleUk:'Ранкова йога і медитація',
    source:'Publisher',language:'en',topic:'yoga',tags:['yoga'],
    publishedAt:'2026-10-28T08:00:00Z',relevance:10,
    imageUrl:'https://upload.wikimedia.org/wikipedia/commons/thumb/missing.jpg',
    imageCredit:'Example author · CC BY 4.0 · Wikimedia Commons',
    imagePageUrl:'https://commons.wikimedia.org/wiki/File:Missing.jpg',
    imageLicense:'CC BY 4.0',imageLicenseUrl:'https://creativecommons.org/licenses/by/4.0/'}],
   total:1,articleCount:1,lastScan:null
  })
 }));
 await page.goto('/uk/news');
 const fallback=page.locator('article img[data-image-role="fallback"]').first();
 await expect(fallback).toBeVisible();
 await expect.poll(()=>fallback.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
 await expect(page.locator('article img[data-image-role="licensed-photo"]')).toHaveCount(0);
 await expect(page.getByRole('link',{name:/Example author/})).toHaveCount(0);
});
