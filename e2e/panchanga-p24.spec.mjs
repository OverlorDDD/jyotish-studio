import {test,expect} from '@playwright/test';
for(const locale of ['uk','en']){
 test('P2.4/P3.7 '+locale+' preserves month system, raw technical evidence and removes unused legacy panels',async({page})=>{
  test.setTimeout(120000);
  let overview=0,extraSky=0;
  page.on('request',req=>{const p=new URL(req.url()).pathname;
   if(p==='/api/v1/vedic-calendar/overview')overview++;
   if(p==='/api/v1/astronomy/events')extraSky++;
  });
  await page.goto('/'+locale+'/panchanga?date=2026-11-02');
  const detail=page.getByTestId('p31-details');
  await expect(detail).toBeVisible({timeout:90000});
  await expect(page.getByTestId('p32-evidence').locator('article')).toHaveCount(5);
  await detail.locator(':scope > summary').click();
  await expect(page.getByTestId('panchanga-five-angas').locator('article')).toHaveCount(5);
  await expect(page.getByTestId('panchanga-integrated-day')).toHaveCount(0);
  await expect(page.getByTestId('panchanga-related')).toHaveCount(0);
  expect(overview).toBe(0);expect(extraSky).toBe(0);
  const system=page.getByTestId('panchanga-month-system');
  await system.getByRole('button',{name:locale==='uk'?'Пурніманта':'Purnimanta'}).click();
  await expect(system.getByRole('button',{name:locale==='uk'?'Пурніманта':'Purnimanta'})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('navigation',{name:locale==='uk'?'Період календаря':'Calendar period'})
   .getByRole('button',{name:locale==='uk'?'Місяць':'Month'}).click();
  await expect(page.getByTestId('panchanga-calendar-range').getByTestId('panchanga-day-cell')).toHaveCount(30,{timeout:90000});
  await page.getByRole('navigation',{name:locale==='uk'?'Період календаря':'Calendar period'})
   .getByRole('button',{name:locale==='uk'?'День':'Day',exact:true}).click();
  await expect(page.getByTestId('p32-evidence').locator('article')).toHaveCount(5,{timeout:90000});
  await expect(system.getByRole('button',{name:locale==='uk'?'Пурніманта':'Purnimanta'})).toHaveAttribute('aria-pressed','true');
 });
}
test('P2.4 delays day computation until profile observer resolves',async({page})=>{
 test.setTimeout(120000);
 let release;
 const blocker=new Promise(done=>release=done);let requests=0;
 await page.route('**/api/v1/personal/panchanga/location',async route=>{
  await blocker;
  await route.fulfill({status:401,contentType:'application/json',body:'{"message":"Unauthorized"}'});
 });
 page.on('request',req=>{if(new URL(req.url()).pathname==='/api/v1/panchanga/day')requests++});
 await page.goto('/uk/panchanga?date=2026-11-02');
 await page.waitForTimeout(350);expect(requests).toBe(0);release();
 await expect(page.getByTestId('p32-evidence').locator('article')).toHaveCount(5,{timeout:90000});
 expect(requests).toBe(1);
});
test('P2.4/P3.7 rejects mismatched yoga instead of presenting invented interpretation',async({page})=>{
 test.setTimeout(120000);
 await page.route('**/api/v1/panchanga/day?**',async route=>{
  const r=await route.fetch(),body=await r.json();
  body.sunrise.yoga.number=30;
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
 });
 await page.goto('/uk/panchanga?date=2026-11-02');
 await expect(page.getByTestId('p31-my-day').getByRole('alert')).toContainText('Пораду не показано',{timeout:90000});
});
test('P3.7 full day 320px mobile has no horizontal overflow',async({page})=>{
 test.setTimeout(120000);
 await page.setViewportSize({width:320,height:740});
 await page.goto('/uk/panchanga?date=2026-11-02');
 await expect(page.getByTestId('p32-evidence').locator('article')).toHaveCount(5,{timeout:90000});
 const width=await page.evaluate(()=>({body:document.documentElement.scrollWidth,viewport:window.innerWidth}));
 expect(width.body).toBeLessThanOrEqual(width.viewport+2);
});
