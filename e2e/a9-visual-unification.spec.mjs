import {test,expect} from '@playwright/test';

test('Global shell is single in Jyotish and the local tool preserves saved-chart access',async({page})=>{
 await page.goto('/uk/astrology/jyotish');
 await expect(page.locator('header.as-header')).toHaveCount(1);
 await expect(page.locator('header.topbar')).toHaveCount(0);
 await expect(page.locator('.jy-workbench .logo')).toHaveCount(0);
 await expect(page.locator('.jy-workbench .lang-button')).toHaveCount(0);
 await expect(page.locator('button.as-account-trigger')).toHaveCount(1);
 await expect(page.locator('button.account-trigger')).toContainText('Зберегти карту');
 await expect(page.locator('.jy-section-nav')).toBeVisible();
 await expect(page.locator('.jy-portal-toolbar')).toContainText('GalaxiAstro');
});
test('Cosmic hero uses circular orbit tracks, fills viewport and honors reduced motion',async({page})=>{
 await page.goto('/uk');
 await expect(page.locator('.as-orbit-track')).toHaveCount(3);
 const geometry=await page.evaluate(()=>{
  const hero=document.querySelector('.as-cosmic-hero').getBoundingClientRect();
  const style=getComputedStyle(document.querySelector('.as-track-inner'));
  return {left:hero.left,right:hero.right,viewport:document.documentElement.clientWidth,animation:style.animationName};
 });
 expect(geometry.left).toBeGreaterThanOrEqual(-2);
 expect(geometry.right).toBeLessThanOrEqual(geometry.viewport+2);
 expect(geometry.animation).toContain('galaxi-orbit');
 await page.emulateMedia({reducedMotion:'reduce'});
 const animation=await page.locator('.as-track-inner').evaluate(x=>getComputedStyle(x).animationName);
 expect(animation).toBe('none');
});
test('Main navigation reaches practical content without splash redirect loops',async({page})=>{
 await page.goto('/uk');
 await page.locator('.as-main-nav').getByRole('link',{name:'Астрологія'}).click();
 await expect(page).toHaveURL(/\/uk\/astrology\/jyotish$/);
 await expect(page.getByRole('heading',{name:/Натальна карта/})).toBeVisible();
 await page.locator('.as-main-nav').getByRole('link',{name:'Таро'}).click();
 await expect(page.getByRole('button',{name:'Розкласти карти'})).toBeVisible();
 await expect(page.locator('.as-tarot-live-link')).toHaveAttribute('href','#human-readings');
 await page.locator('.as-main-nav').getByRole('link',{name:'Йога та медитація'}).click();
 await expect(page.getByTestId('breathing-square')).toBeVisible();
});
