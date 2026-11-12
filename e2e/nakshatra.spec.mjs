import {test,expect} from '@playwright/test';

test('Nakshatra hub lists all 27 and shows the verified current Moon nakshatra',async({page,request})=>{
 test.setTimeout(120000);
 const raw=await request.get('/uk/nakshatra');
 expect(raw.status()).toBe(200);
 expect(await raw.text()).toContain('data-testid="nakshatra-live"');
 await page.goto('/uk/nakshatra');
 const hub=page.getByTestId('nakshatra-hub');
 await expect(hub.locator('tbody tr')).toHaveCount(27);
 await expect(hub.locator('tbody tr[aria-current="true"]')).toHaveCount(1);
 await expect(hub.getByRole('link',{name:'Рохіні',exact:true})).toHaveAttribute('href','/uk/nakshatra/rohini');
 await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',/\/uk\/nakshatra$/);
});

for(const [locale,slug,name] of [['uk','rohini','Рохіні'],['en','purva-phalguni','Purva Phalguni']]){
 test('Nakshatra '+locale+'/'+slug+' has attributes, padas, live Moon line and SEO tags',async({page})=>{
  test.setTimeout(120000);
  await page.goto('/'+locale+'/nakshatra/'+slug);
  const article=page.getByTestId('nakshatra-page');
  await expect(article.getByRole('heading',{level:1})).toContainText(name);
  await expect(article.locator('tbody tr')).toHaveCount(4);
  await expect(article.locator('dl > div')).toHaveCount(6);
  await expect(article.getByTestId('nakshatra-live')).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',new RegExp('/'+locale+'/nakshatra/'+slug+'$'));
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href',new RegExp('/en/nakshatra/'+slug+'$'));
  await expect(page.locator('link[rel="alternate"][hreflang="uk"]')).toHaveAttribute('href',new RegExp('/uk/nakshatra/'+slug+'$'));
  const width=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(width).toBeLessThanOrEqual(1);
 });
}

test('Unknown nakshatra is a real 404; city Panchanga links its nakshatra to the guide',async({page,request})=>{
 test.setTimeout(120000);
 expect((await request.get('/en/nakshatra/not-a-star')).status()).toBe(404);
 await page.goto('/en/panchanga/delhi');
 await expect(page.getByTestId('panchanga-city-page').locator('tr[data-anga="nakshatra"] a'))
  .toHaveAttribute('href',/^\/en\/nakshatra\/[a-z-]+$/);
});

test('Nakshatra guide and city pages are reachable from the Panchanga page, footer and live day card',async({page})=>{
 test.setTimeout(120000);
 await page.goto('/uk/panchanga');
 const strip=page.getByTestId('panchanga-quick-links');
 await expect(strip.getByRole('link',{name:'Київ',exact:true})).toHaveAttribute('href','/uk/panchanga/kyiv');
 await expect(strip.getByRole('link',{name:/27 накшатр/})).toHaveAttribute('href','/uk/nakshatra');
 await expect(page.locator('footer').getByRole('link',{name:'27 накшатр'})).toHaveAttribute('href','/uk/nakshatra');
 await expect(page.locator('footer').getByRole('link',{name:'Панчанга по містах'})).toHaveAttribute('href','/uk/panchanga#cities');
 await expect(page.getByTestId('panchanga-nakshatra-guide')).toHaveAttribute('href',/^\/uk\/nakshatra\/[a-z-]+$/,{timeout:90000});
 const width=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 expect(width).toBeLessThanOrEqual(1);
});
