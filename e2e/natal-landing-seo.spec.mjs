import {test,expect} from '@playwright/test';
for(const lang of ['en','uk']){
 test(lang+' natal page: user-first heading, SEO canonical, free tool and inline minute accuracy',async({page})=>{
  await page.goto('/'+lang+'/astrology/jyotish');
  await expect(page.getByRole('heading',{level:1})).toHaveCount(1);
  await expect(page.getByRole('heading',{level:1})).toContainText(lang==='uk'?'16 карт життя':'16 life charts',{ignoreCase:true});
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href',new RegExp('/'+lang+'/astrology/jyotish$'));
  await expect(page.locator('meta[name=description]')).toHaveAttribute('content',/16|birth chart|натальн/);
  await expect(page.getByRole('link',{name:lang==='uk'?'Створити мої 16 карт життя':'Create my 16 life charts'})).toHaveAttribute('href','#birth-details');
  await expect(page.locator('input[type=date]')).toHaveValue('');
  await expect(page.locator('input[type=time]')).toHaveValue('');
  await expect(page.getByTestId('n4-rc-explorer')).toContainText('16');
  await expect(page.getByTestId('n41-all-charts').getByRole('button')).toHaveCount(16);
  await expect(page.getByTestId('n4-rc-additional')).toHaveCount(0);
  const sky=page.getByTestId('n41-sky');
  await expect(sky).toBeVisible();
  const options=sky.getByRole('button');
  await expect(options).toHaveCount(4);
  await options.nth(1).click();
  await expect(options.nth(1)).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.as-brand-icon img')).toHaveCount(1);
  expect(await page.locator('.as-brand-icon img').evaluate(img=>img.complete&&img.naturalWidth>0)).toBeTruthy();
  await expect(page.getByText(lang==='uk'?'Навіщо досліджувати 16 карт життя?':'What can 16 life charts help you explore?')).toBeVisible();
  await expect(page.locator('#natal-faq-title')).toBeVisible();
  await expect(page.locator('input[type=checkbox]')).toHaveCount(1);
  await page.locator('input[type=checkbox]').check();
  await expect(page.getByText(lang==='uk'?'Без точних хвилин':'Without exact minutes',{exact:false})).toBeVisible();
 });
}
test('natal landing responds without horizontal overflow from 320 to 1440px',async({page})=>{
 await page.goto('/en/astrology/jyotish');
 for(const width of [320,360,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:850});
  const spill=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(spill,'natal landing viewport overflow '+width+'px').toBeLessThanOrEqual(2);
 }
});
