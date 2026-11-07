import {test,expect} from '@playwright/test';
for(const lang of ['en','uk']){
 test(lang+' natal page: user-first heading, SEO canonical, free tool and inline minute accuracy',async({page})=>{
  await page.goto('/'+lang+'/astrology/jyotish');
  await expect(page.getByRole('heading',{level:1})).toHaveCount(1);
  await expect(page.getByRole('heading',{level:1})).toContainText(lang==='uk'?'натальна карта':'birth chart',{ignoreCase:true});
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href',new RegExp('/'+lang+'/astrology/jyotish$'));
  await expect(page.locator('meta[name=description]')).toHaveAttribute('content',/16|birth chart|натальн/);
  await expect(page.getByRole('link',{name:lang==='uk'?'Створити мою карту':'Create my birth chart'})).toHaveAttribute('href','#birth-details');
  await expect(page.locator('input[type=date]')).toHaveValue('');
  await expect(page.locator('input[type=time]')).toHaveValue('');
  await expect(page.getByTestId('n4-rc-explorer')).toContainText('16');
  await expect(page.getByText(lang==='uk'?'Що ти побачиш у своїй карті?':'What will your birth chart reveal?')).toBeVisible();
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
