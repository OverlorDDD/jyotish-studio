import {test,expect} from '@playwright/test';

test('R4.2: branded domain root sends sanitized English canonical homepage view after consent',async({page})=>{
 await page.route(/googletagmanager\.com|google-analytics\.com/,route=>
  route.fulfill({status:200,contentType:'application/javascript',body:''}));
 await page.goto('/');
 await expect(page.getByRole('dialog',{name:'Visitor analytics'})).toBeVisible();
 await page.getByRole('button',{name:'Allow analytics'}).click();
 await expect.poll(()=>page.evaluate(()=>window.dataLayer?.length??0)).toBeGreaterThan(3);
 const data=await page.evaluate(()=>JSON.stringify(window.dataLayer||[]));
 expect(data).toContain('page_view');
 expect(data).toContain('https://galaxiora.com/en');
 expect(data).not.toContain('undefined');
 await page.getByRole('button',{name:'Analytics settings'}).click();
 await expect(page.getByTestId('analytics-tag-status')).toContainText('script loaded');
});

test('R4.2: blocked Google tag is visibly diagnosed, not falsely reported as analytics received',async({page})=>{
 await page.route(/googletagmanager\.com/,route=>route.abort('blockedbyclient'));
 await page.route(/google-analytics\.com/,route=>route.abort('blockedbyclient'));
 await page.goto('/uk');
 await page.getByRole('button',{name:'Дозволити аналітику'}).click();
 await page.getByRole('button',{name:'Налаштування аналітики'}).click();
 await expect(page.getByTestId('analytics-tag-status')).toContainText('завантаження заблоковане');
});

test('R4.2: explicit rejection at root never loads Google tag',async({page})=>{
 const calls=[];
 await page.route(/googletagmanager\.com|google-analytics\.com/,route=>{
  calls.push(route.request().url());return route.abort();
 });
 await page.goto('/');
 await page.getByRole('button',{name:'Reject'}).click();
 expect(calls).toHaveLength(0);
});
