import {test,expect} from '@playwright/test';
import {randomUUID} from 'node:crypto';
test('Personal: styled and accessible dashboard, responsive grid and settings',async({page})=>{
 const account='personal-visual-'+randomUUID().slice(0,12)+'@example.invalid';
 const register=await page.request.post('/api/v1/account/register',{data:{email:account,password:'Personal-visual-test-2026-strong'}});
 expect(register.status()).toBe(201);
 // Both Playwright projects must first inspect the same explicit desktop width;
 // subsequently assert single-column behavior in the same browser at 390px.
 await page.setViewportSize({width:1440,height:900});
 await page.goto('/uk/personal');
 const hero=page.locator('[data-testid="personal-dashboard"] header').first();
 await expect(hero).toBeVisible();
 const grid=page.getByTestId('personal-overview-grid');
 await expect(grid).toBeVisible();
 const desktop=await page.evaluate(()=>{
  const hero=document.querySelector('[data-testid="personal-dashboard"] header');
  const grid=document.querySelector('[data-testid="personal-overview-grid"]');
  const card=grid.querySelector('section');
  return {heroBg:getComputedStyle(hero).backgroundImage,heroRadius:parseFloat(getComputedStyle(hero).borderTopLeftRadius),
   display:getComputedStyle(grid).display,columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length,
   foundationColumns:getComputedStyle(document.querySelector('[data-testid="personal-foundation"] > div:last-of-type')).gridTemplateColumns.split(' ').length,
   cardBg:getComputedStyle(card).backgroundImage,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
 });
 expect(desktop.heroBg).not.toBe('none');
 expect(desktop.heroRadius).toBeGreaterThan(10);
 expect(desktop.display).toBe('grid');
 expect(desktop.columns).toBe(1);
 expect(desktop.foundationColumns).toBeGreaterThanOrEqual(3);
 await expect(page.getByTestId('astrological-path')).toBeVisible();
 expect(desktop.cardBg).not.toBe('none');
 expect(desktop.overflow).toBeLessThanOrEqual(2);
 const settings=page.getByTestId('personal-settings');
 await expect(settings).not.toHaveAttribute('open','');
 await settings.locator('summary').click();
 await expect(settings).toHaveAttribute('open','');
 await expect(page.getByText('Цікаві мені теми')).toBeVisible();
 await expect(settings.locator('input[type="checkbox"]')).toHaveCount(6);
 await page.setViewportSize({width:390,height:844});
 await expect(grid).toBeVisible();
 const mobile=await page.evaluate(()=>({
  columns:getComputedStyle(document.querySelector('[data-testid="personal-overview-grid"]')).gridTemplateColumns.split(' ').length,
  foundationColumns:getComputedStyle(document.querySelector('[data-testid="personal-foundation"] > div:last-of-type')).gridTemplateColumns.split(' ').length,
  overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
 }));
 expect(mobile.columns).toBe(1);
 expect(mobile.foundationColumns).toBe(1);
 expect(mobile.overflow).toBeLessThanOrEqual(2);
});
