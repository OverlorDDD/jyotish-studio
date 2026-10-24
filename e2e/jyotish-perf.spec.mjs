import {test,expect} from '@playwright/test';

test('Jyotish opens calculator and delays saved-history network until account is opened',async({page})=>{
 let historyCalls=0;
 await page.route('**/api/v1/account/me',r=>r.fulfill({status:200,contentType:'application/json',
  body:JSON.stringify({user:{id:'e2e-user',email:'perf@example.invalid'}})}));
 await page.route('**/api/v1/account/charts',r=>{
  historyCalls++;
  return r.fulfill({status:200,contentType:'application/json',body:'[]'});
 });
 const start=Date.now();
 await page.goto('/uk/astrology/jyotish');
 await expect(page.getByRole('heading',{level:1})).toBeVisible();
 await expect(page.locator('.jy-rashi-card')).toBeVisible();
 const openedMs=Date.now()-start;
 console.info('[Jyotish-perf] production calculator UI ready ms:',openedMs);
 await expect(page.locator('button.account-trigger')).toContainText('Збережені карти');
 await expect(page.locator('header.as-header')).toHaveCount(1);
 await expect(page.locator('button.as-account-trigger')).toHaveCount(1);
 await expect(page.locator('button.lang-button')).toHaveCount(0);
 expect(historyCalls).toBe(0);
 await page.locator('button.account-trigger').click();
 await expect.poll(()=>historyCalls).toBe(1);
});
