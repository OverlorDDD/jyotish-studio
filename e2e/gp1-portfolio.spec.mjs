import {test,expect} from '@playwright/test';

test('GP1 root opens the real EN calculator while About Me is first in navigation',async({page})=>{
 await page.goto('/');
 await expect(page).toHaveURL(/\/$/);
 await expect(page.locator('.jy-workbench')).toBeVisible();
 await expect(page.locator('.as-main-nav a').first()).toHaveText('About Me');
 await page.locator('.as-main-nav a').first().click();
 await expect(page).toHaveURL(/\/en\/about-me$/);
 await expect(page.locator('h1')).toContainText('I turn ideas');
});
for(const locale of ['en','uk']){
 test('GP1 '+locale+' portfolio has links, downloads, canonical, and fits mobile',async({page,request})=>{
  await page.goto('/'+locale+'/about-me');
  await expect(page.locator('main#main-content')).toBeVisible();
  await expect(page.getByRole('heading',{name:'Galaxiora',exact:true})).toBeVisible();
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href','https://galaxiora.example/'+locale+'/about-me');
  await expect(page.locator('a[href*="github.com/OverlorDDD"]').first()).toBeVisible();
  for(const ext of ['pdf','docx']){
   const href='/resume/denys-avramenko-cv.'+locale+'.'+ext;
   await expect(page.locator('a[download][href="'+href+'"]')).toBeVisible();
   const file=await request.get(href);
   expect(file.status()).toBe(200);
   const bytes=await file.body();
   expect(bytes.byteLength).toBeGreaterThan(3000);
   expect(bytes.subarray(0,ext==='pdf'?4:2).toString('ascii')).toBe(ext==='pdf'?'%PDF':'PK');
  }
  await page.setViewportSize({width:360,height:780});
  await page.reload();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
 });
}
