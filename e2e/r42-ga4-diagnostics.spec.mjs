import {test,expect} from '@playwright/test';

test('R4.2: sanitized English canonical root view only after Privacy opt-in',async({page})=>{
 await page.route(/googletagmanager\.com|google-analytics\.com/,route=>
  route.fulfill({status:200,contentType:'application/javascript',body:''}));
 await page.goto('/');
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await expect.poll(()=>page.evaluate(()=>!!window.__galaxioraAnalyticsReady)).toBe(false);
 await page.goto('/en/privacy');
 await page.getByRole('button',{name:'Allow analytics'}).click();
 await page.goto('/');
 await expect.poll(()=>page.evaluate(()=>window.dataLayer?.length??0)).toBeGreaterThan(3);
 const data=await page.evaluate(()=>JSON.stringify(window.dataLayer||[]));
 expect(data).toContain('page_view');
 expect(data).toContain('https://galaxiora.com/en');
 expect(data).not.toContain('undefined');
 await expect.poll(()=>page.evaluate(()=>window.__galaxioraTagStatus)).toBe('loaded');
});

test('R4.2: blocked Google tag is diagnosed without false successful-collection claim',async({page})=>{
 await page.route(/googletagmanager\.com/,route=>route.abort('blockedbyclient'));
 await page.route(/google-analytics\.com/,route=>route.abort('blockedbyclient'));
 await page.goto('/uk/privacy');
 await page.getByRole('button',{name:'Дозволити аналітику'}).click();
 await page.goto('/uk');
 await expect.poll(()=>page.evaluate(()=>window.__galaxioraTagStatus)).toBe('blocked');
});

test('R4.2: explicit opt-out at Privacy prevents Google tag and private growth events',async({page})=>{
 const calls=[];
 await page.route(/googletagmanager\.com|google-analytics\.com/,route=>{
  calls.push(route.request().url());return route.abort();
 });
 await page.goto('/en/privacy');
 await page.getByRole('button',{name:'Keep analytics off'}).click();
 await page.goto('/');
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('galaxiora:growth',{detail:{name:'jyotish_chart_completed'}})));
 expect(calls).toHaveLength(0);
});
