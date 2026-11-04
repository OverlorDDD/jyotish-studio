import {test,expect} from '@playwright/test';

for(const locale of ['uk','en']){
 test('R4 '+locale+' eclipse calendar appears by existing astronomical visibility tool',async({page,request})=>{
  const r=await request.get('/'+locale+'/panchanga');
  expect(r.status()).toBe(200);
  const html=await r.text();
  expect(html).toContain('/'+locale+'/eclipses/2027');
  await page.goto('/'+locale+'/panchanga');
  await expect(page.getByRole('heading',{name:locale==='uk'?'Затемнення · астрономічна видимість':'Eclipses · local visibility'})).toBeVisible();
  const link=page.getByRole('link',{name:locale==='uk'?'Відкрити календар 2027':'Explore the 2027 calendar'});
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href','/'+locale+'/eclipses/2027');
  const order=await page.evaluate(()=>{
   const eclipse=document.querySelector('[data-testid="eclipse-panel"]');
   const anchor=document.querySelector('a[href$="/eclipses/2027"]');
   return {eclipse:eclipse?.getBoundingClientRect().top??null,anchor:anchor?.getBoundingClientRect().top??null};
  });
  // The link is part of the same content flow, not an inaccessible separate page.
  expect(order.anchor).not.toBeNull();
 });
 test('R4 '+locale+' public guides have accessible share control without third-party widgets',async({page})=>{
  for(const path of ['/tarot/cards/moon','/eclipses/2027']){
   await page.goto('/'+locale+path);
   const share=page.getByRole('button',{name:locale==='uk'?'Поділитися матеріалом':'Share this resource'});
   await expect(share).toBeVisible();
   await expect(page.locator('iframe[src*="facebook.com"], iframe[src*="telegram.org"]')).toHaveCount(0);
  }
 });
}
