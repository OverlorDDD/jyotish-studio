import {test,expect} from '@playwright/test';
for(const locale of ['uk','en']){
 test('Galaxiora '+locale+' uses approved original galaxy #6 for header, browser and mobile icons',async({page,request})=>{
  await page.goto('/'+locale+'/panchanga');
  await expect(page.locator('link[rel="icon"][href$="/galaxiora-favicon.png"]').first()).toHaveCount(1);
  await expect(page.locator('link[rel="icon"]')).toHaveCount(1);
  await expect(page.locator('link[rel="shortcut icon"]')).toHaveCount(0);
  await expect(page.locator('link[rel="apple-touch-icon"][href*="apple-touch-icon.png"]').first()).toHaveCount(1);
  await expect(page.locator('link[rel="manifest"][href*="site.webmanifest"]').first()).toHaveCount(1);
  await expect(page.locator('.as-brand-icon img[src$="/galaxiora-favicon.png"]')).toHaveCount(1);
  const original=await request.get('/galaxiora-favicon.png');
  const next=await request.get('/icon.png');
  expect(original.status()).toBe(200);
  expect(next.status()).toBe(200);
  expect(await next.body()).toEqual(await original.body());
  const old=await request.get('/icon.svg');
  expect(old.status()).toBe(404);
  const ico=await request.get('/favicon.ico');
  expect(ico.status()).toBe(200);
  expect((await ico.body()).includes(await original.body())).toBe(true);
  for(const image of ['/galaxiora-logo-128.png','/apple-touch-icon.png','/galaxiora-192.png','/galaxiora-512.png']){
   const r=await request.get(image);
   expect(r.status(),image).toBe(200);
   expect((await r.body()).byteLength,image).toBeGreaterThan(100);
  }
 });
}
