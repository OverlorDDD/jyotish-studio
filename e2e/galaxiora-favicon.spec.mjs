import {test,expect} from '@playwright/test';
for(const locale of ['uk','en']){
 test('Galaxiora '+locale+' uses transparent round favicon and versioned browser metadata',async({page,request})=>{
  await page.goto('/'+locale+'/panchanga');
  const icons=page.locator('link[rel="icon"][href*="galaxiora-round-gold-v3-20261027"]');
  await expect(icons.first()).toHaveCount(1);
  const shortcut=page.locator('link[rel="shortcut icon"][href*="galaxiora-round-gold-v3-20261027"]');
  await expect(shortcut.first()).toHaveCount(1);
  const icon=await request.get('/icon.svg');
  expect(icon.status()).toBe(200);
  const svg=await icon.text();
  expect(svg).toContain('r="30" fill="url(#cosmos)"');
  expect(svg).not.toMatch(/<rect\b/i);
  expect(svg).toContain('Galaxiora');
 });
}
