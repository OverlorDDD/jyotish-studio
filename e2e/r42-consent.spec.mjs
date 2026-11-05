import {test,expect} from '@playwright/test';

test('R4.2 quiet default: no banner, floating control or Google tag before opt-in',async({page})=>{
 const requested=[];
 await page.route(/googletagmanager\\.com|google-analytics\\.com/,route=>{
  requested.push(route.request().url());
  return route.fulfill({status:200,contentType:'application/javascript',body:''});
 });
 await page.goto('/uk');
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Налаштування аналітики'})).toHaveCount(0);
 expect(requested).toHaveLength(0);
 await page.goto('/uk/privacy');
 await expect(page.getByTestId('analytics-consent-state')).toContainText('вимкнено за замовчуванням');
 await page.getByRole('button',{name:'Залишити вимкненою'}).click();
 await page.goto('/uk');
 expect(requested).toHaveLength(0);
 await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('R4.2 opt-in on Privacy sends scrubbed public paths and blocks private routes',async({page})=>{
 const requested=[];
 await page.route(/googletagmanager\\.com|google-analytics\\.com/,route=>{
  requested.push(route.request().url());
  return route.fulfill({status:200,contentType:'application/javascript',body:''});
 });
 await page.goto('/uk/privacy');
 await page.getByRole('button',{name:'Дозволити аналітику'}).click();
 await page.goto('/uk/panchanga?birthTime=PRIVATE-TEST-VALUE');
 await expect.poll(()=>requested.length).toBeGreaterThan(0);
 const serialized=JSON.stringify(await page.evaluate(()=>window.dataLayer||[]));
 expect(serialized).toContain('page_view');
 expect(serialized).toContain('https://galaxiora.com/uk/panchanga');
 expect(serialized).not.toContain('PRIVATE-TEST-VALUE');
 expect(serialized).not.toContain('birthTime');
 await page.goto('/uk/account');
 await expect.poll(()=>page.evaluate(()=>!!window.__galaxioraAnalyticsReady)).toBe(false);
});

test('R4.2 user may withdraw consent from Privacy and it remains disabled after reload',async({page})=>{
 await page.route(/googletagmanager\\.com|google-analytics\\.com/,route=>
  route.fulfill({status:200,contentType:'application/javascript',body:''}));
 await page.goto('/en/privacy');
 await page.getByRole('button',{name:'Allow analytics'}).click();
 await page.goto('/en');
 await expect.poll(()=>page.evaluate(()=>!!window.__galaxioraAnalyticsReady)).toBe(true);
 await page.goto('/en/privacy');
 await page.getByRole('button',{name:'Withdraw consent'}).click();
 await expect(page.getByTestId('analytics-consent-state')).toContainText('declined');
 await page.reload();
 await expect(page.getByTestId('analytics-consent-state')).toContainText('declined');
 await page.goto('/en');
 await expect.poll(()=>page.evaluate(()=>!!window.__galaxioraAnalyticsReady)).toBe(false);
 await expect(page.getByRole('dialog')).toHaveCount(0);
});
