import {test,expect} from '@playwright/test';

test('R4.2 never loads analytics before explicit consent and remains silent after rejection',async({page})=>{
 const requested=[];
 await page.route(/googletagmanager\.com|google-analytics\.com/,route=>{
  requested.push(route.request().url());
  return route.fulfill({status:200,contentType:'application/javascript',body:''});
 });
 await page.goto('/uk');
 await expect(page.getByRole('dialog',{name:'Аналітика відвідувань'})).toBeVisible();
 expect(requested).toHaveLength(0);
 await page.getByRole('button',{name:'Відхилити'}).click();
 expect(requested).toHaveLength(0);
 await page.reload();
 await expect(page.getByRole('dialog',{name:'Аналітика відвідувань'})).toHaveCount(0);
 expect(requested).toHaveLength(0);
});

test('R4.2 only sends scrubbed public paths and blocks private routes after consent',async({page})=>{
 const requested=[];
 await page.route(/googletagmanager\.com|google-analytics\.com/,route=>{
  requested.push(route.request().url());
  return route.fulfill({status:200,contentType:'application/javascript',body:''});
 });
 await page.goto('/uk/panchanga?birthTime=PRIVATE-TEST-VALUE');
 await page.getByRole('button',{name:'Дозволити аналітику'}).click();
 await expect.poll(()=>requested.length).toBeGreaterThan(0);
 const events=await page.evaluate(()=>window.dataLayer||[]);
 const serialized=JSON.stringify(events);
 expect(serialized).toContain('page_view');
 expect(serialized).toContain('https://galaxiora.com/uk/panchanga');
 expect(serialized).not.toContain('PRIVATE-TEST-VALUE');
 expect(serialized).not.toContain('birthTime');
 await page.goto('/uk/account');
 await expect.poll(()=>page.evaluate(()=>!!window.__galaxioraAnalyticsReady)).toBe(false);
});

test('R4.2 user may revoke analytics consent without deleting their account',async({page})=>{
 await page.route(/googletagmanager\.com|google-analytics\.com/,route=>
  route.fulfill({status:200,contentType:'application/javascript',body:''}));
 await page.goto('/en');
 await page.getByRole('button',{name:'Allow analytics'}).click();
 await expect(page.getByRole('button',{name:'Analytics settings'})).toBeVisible();
 await page.getByRole('button',{name:'Analytics settings'}).click();
 await page.getByRole('button',{name:'Withdraw consent'}).click();
 await expect.poll(()=>page.evaluate(()=>!!window.__galaxioraAnalyticsReady)).toBe(false);
 await page.reload();
 await expect(page.getByRole('dialog',{name:'Visitor analytics'})).toHaveCount(0);
});
