import {test,expect} from '@playwright/test';
import {fixtureIdentity} from './support/disposable-accounts.mjs';

test('localized home metadata, language, indexability and semantic main',async({page})=>{
 for(const locale of ['en','uk']){
  await page.goto('/'+locale);
  await expect(page.locator('html')).toHaveAttribute('lang',locale);
  await expect(page.locator('main#main-content')).toBeVisible();
  await expect(page.locator('h1')).toBeVisible();
  const canonical=await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(canonical).toBe('https://galaxiora.example/'+locale);
  await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute('content',/noindex/);
  await expect(page.locator('nav.as-main-nav')).toHaveAttribute('aria-label',locale==='uk'?'Основна навігація':'Main navigation');
 }
});
test('SEO includes finished News and Community while account/admin stay private; robots and sitemap are safe',async({page,request})=>{
 for(const path of ['/en/news','/en/community','/uk/panchanga']){
  await page.goto(path);
  await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute('content',/noindex/);
 }
 for(const path of ['/uk/account','/en/admin']){
  await page.goto(path);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content',/noindex/);
 }
 const robots=await request.get('/robots.txt');
 expect(robots.status()).toBe(200);
 const rules=await robots.text();
 expect(rules).toContain('Sitemap: https://galaxiora.example/sitemap.xml');
 expect(rules).toContain('/uk/account');
 const sitemap=await request.get('/sitemap.xml');
 expect(sitemap.status()).toBe(200);
 const xml=await sitemap.text();
 expect(xml).toContain('https://galaxiora.example/uk/astrology/jyotish');
 expect(xml).toContain('https://galaxiora.example/en/tarot');
 expect(xml).toContain('https://galaxiora.example/uk/yoga');
 expect(xml).toContain('https://galaxiora.example/en/learn');
 expect(xml).toContain('https://galaxiora.example/uk/news');
 expect(xml).toContain('https://galaxiora.example/en/community');
 expect(xml).toContain('https://galaxiora.example/uk/panchanga');
 expect(xml).toContain('https://galaxiora.example/uk/horoscope/aries');
 expect(xml).not.toContain('/en/admin');
});
test('keyboard has visible skip link, navigable main content and focus treatment',async({page})=>{
 await page.goto('/uk');
 await page.keyboard.press('Tab');
 await expect(page.locator('a.as-skip-link')).toBeFocused();
 await expect(page.locator('a.as-skip-link')).toBeVisible();
 await page.keyboard.press('Enter');
 await expect(page.locator('main#main-content')).toBeFocused();
});
test('360px-style responsiveness never forces document-level horizontal scrolling',async({page})=>{
 await page.setViewportSize({width:360,height:780});
 for(const path of ['/uk','/uk/tarot','/uk/astrology/jyotish','/en/account']){
  await page.goto(path);
  const geometry=await page.evaluate(()=>({
   screen:document.documentElement.clientWidth,content:document.documentElement.scrollWidth,
   offenders:[...document.querySelectorAll('body *')].map(el=>({el,rect:el.getBoundingClientRect()}))
    .filter(({rect})=>rect.width>0&&rect.right>document.documentElement.clientWidth+2)
    .slice(0,12).map(({el,rect})=>({tag:el.tagName,className:String(el.className).slice(0,85),
      right:Math.round(rect.right),width:Math.round(rect.width)}))
  }));
  expect(geometry.content-geometry.screen, path+' horizontal overflow: '+JSON.stringify(geometry.offenders)).toBeLessThanOrEqual(2);
 }
});
test('live user flow: verified identity login, local Tarot draw, persisted history and logout',async({page})=>{
 const email='a4-e2e-'+Date.now()+'-'+Math.random().toString(36).slice(2,7)+'@example.invalid';
 const password='A4-testing-only-password-2026';
 await fixtureIdentity({data:{email,password}});
 await page.goto('/uk');
 await page.locator('button.as-account-trigger').click();
 await page.locator('#global-email').fill(email);
 await page.locator('#global-password').fill(password);
 await page.locator('button[type="submit"]', {hasText:'Увійти'}).click();
 await expect(page.locator('button.as-account-trigger')).toContainText('Кабінет');
 await page.goto('/uk/tarot');
 await expect(page.locator('button.as-button-primary', {hasText:'Розкласти карти'})).toBeEnabled();
 await page.locator('input[name="spread"][value="one"]').check();
 await page.locator('#as-tarot-question').fill('Що мені варто сьогодні помітити?');
 await page.getByRole('button',{name:'Розкласти карти'}).click();
 await expect(page.locator('.as-tarot-result')).toBeVisible();
 await expect(page.locator('.as-tarot-history>button')).toHaveCount(1);
 await page.reload();
 await expect(page.locator('.as-tarot-history>button')).toHaveCount(1);
 await page.locator('button.as-account-trigger').click();
 await page.getByRole('button',{name:'Вийти'}).click();
 await expect(page.locator('button.as-account-trigger')).toContainText('Увійти');
});
