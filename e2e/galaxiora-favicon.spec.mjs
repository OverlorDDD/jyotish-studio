import {test,expect} from '@playwright/test';
for(const locale of ['uk','en']){
 test('Galaxiora '+locale+' uses same cosmic G in header, browser favicon, and mobile icon',async({page,request})=>{
  await page.goto('/'+locale+'/panchanga');
  await expect(page.locator('link[rel="icon"][href*="cosmic-g-20261101"]').first()).toHaveCount(1);
  await expect(page.locator('link[rel="shortcut icon"][href*="favicon.ico"]').first()).toHaveCount(1);
  await expect(page.locator('link[rel="apple-touch-icon"][href*="apple-touch-icon.png"]').first()).toHaveCount(1);
  await expect(page.locator('link[rel="manifest"][href*="site.webmanifest"]').first()).toHaveCount(1);
  await expect(page.locator('.as-brand-icon img[src="/galaxiora-favicon.png"]')).toHaveCount(1);
  const icon=await request.get('/icon.svg');
  expect(icon.status()).toBe(200);
  const svg=await icon.text();
  expect(svg).toContain('G cosmic monogram');
  expect(svg).toContain('stroke="url(#orbit)"');
  expect(svg).not.toMatch(/<rect\b/i);
  for(const image of ['/favicon.ico','/galaxiora-favicon.png','/galaxiora-logo-128.png','/apple-touch-icon.png','/galaxiora-192.png','/galaxiora-512.png']){
   const r=await request.get(image);
   expect(r.status(),image).toBe(200);
   expect((await r.body()).byteLength,image).toBeGreaterThan(100);
  }
 });
}
