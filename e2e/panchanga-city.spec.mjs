import {test,expect} from '@playwright/test';

for(const [locale,slug,name] of [['uk','kyiv','Київ'],['en','delhi','Delhi']]){
 test('City Panchanga '+locale+'/'+slug+' is server-rendered with five limbs, sun times and SEO tags',async({page,request})=>{
  test.setTimeout(120000);
  const raw=await request.get('/'+locale+'/panchanga/'+slug);
  expect(raw.status()).toBe(200);
  const html=await raw.text();
  // Values must be in the initial HTML, not fetched by the browser.
  expect(html).toContain('data-testid="panchanga-city-summary"');
  expect(html).toContain('data-anga="nakshatra"');
  await page.goto('/'+locale+'/panchanga/'+slug);
  const article=page.getByTestId('panchanga-city-page');
  await expect(article.getByRole('heading',{level:1})).toContainText(name);
  await expect(article.locator('tbody tr')).toHaveCount(5);
  await expect(article.getByText(locale==='uk'?'Раху-кала':'Rahu Kalam',{exact:true})).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',new RegExp('/'+locale+'/panchanga/'+slug+'$'));
  await expect(page.locator('link[rel="alternate"][hreflang="uk"]')).toHaveAttribute('href',new RegExp('/uk/panchanga/'+slug+'$'));
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href',new RegExp('/en/panchanga/'+slug+'$'));
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content',/follow/);
  await expect(page.getByTestId('panchanga-city-index').getByRole('link')).not.toHaveCount(0);
  const width=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(width).toBeLessThanOrEqual(1);
 });
}

test('Unknown city is a real 404 and the directory is linked from the Panchanga hub page',async({page,request})=>{
 expect((await request.get('/en/panchanga/not-a-city')).status()).toBe(404);
 await page.goto('/uk/panchanga');
 await expect(page.getByTestId('panchanga-city-index').getByRole('link',{name:'Львів',exact:true}))
  .toHaveAttribute('href','/uk/panchanga/lviv');
});

test('City landing link preselects that city in the interactive calendar',async({page})=>{
 test.setTimeout(120000);
 await page.goto('/en/panchanga?city=delhi');
 await expect(page.getByTestId('global-city-search').getByRole('combobox')).toHaveValue('Delhi',{timeout:20000});
 await expect(page.getByTestId('panchanga-hub').getByTestId('panchanga-five-angas')).toBeVisible({timeout:90000});
});
