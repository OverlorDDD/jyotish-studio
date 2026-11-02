import {test,expect} from '@playwright/test';
for(const locale of ['uk','en']){
 test('P2.4 '+locale+' unified day summary, shared month system and lazy detailed modules',async({page})=>{
  test.setTimeout(120000);
  let extraSky=0,extraPersonal=0,overview=0,festivalOld=0;
  page.on('request',req=>{
   const path=new URL(req.url()).pathname;
   if(path==='/api/v1/astronomy/events')extraSky++;
   if(path==='/api/v1/personal/panchanga')extraPersonal++;
   if(path==='/api/v1/vedic-calendar/overview')overview++;
   if(path==='/api/v1/vedic-calendar/week')festivalOld++;
  });
  await page.goto('/'+locale+'/panchanga?date=2026-11-02');
  await expect(page.getByTestId('panchanga-five-angas').locator('article')).toHaveCount(5,{timeout:90000});
  const guide=page.getByTestId('panchanga-integrated-day');
  await expect(guide).toBeVisible();
  await expect(guide.locator('[role="alert"]')).toHaveCount(0,{timeout:60000});
  await expect(guide.locator('p[role="status"]')).toHaveCount(0,{timeout:60000});
  await expect(guide.getByText(locale==='uk'?'Ведичний місяць':'Vedic month')).toBeVisible();
  const related=page.getByTestId('panchanga-related');
  await expect(related).toBeVisible();
  expect(extraSky).toBe(0);
  expect(extraPersonal).toBe(0);
  expect(festivalOld).toBe(0);
  expect(overview).toBe(1);
  await related.getByRole('button',{name:locale==='uk'?/Переходи планет/:/Planetary transitions/}).click();
  await expect(page.getByTestId('astronomical-events-panel')).toBeVisible();
  await expect.poll(()=>extraSky).toBeGreaterThan(0);
  await related.getByRole('button',{name:locale==='uk'?/Мій місячний ритм/:/My lunar rhythm/}).click();
  await expect(page.getByTestId('personal-panchanga')).toBeVisible();
  await expect.poll(()=>extraPersonal).toBeGreaterThan(0);
  await related.getByRole('button',{name:locale==='uk'?/Видимість затемнень/:/Eclipse visibility/}).click();
  await expect(page.getByTestId('eclipse-panel')).toBeVisible();
  // P2.4 keeps month choice when switching between day and grid.
  const monthSystem=page.getByTestId('panchanga-month-system');
  await monthSystem.getByRole('button',{name:locale==='uk'?'Пурніманта':'Purnimanta'}).click();
  await expect(monthSystem.getByRole('button',{name:locale==='uk'?'Пурніманта':'Purnimanta'})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('navigation',{name:locale==='uk'?'Період календаря':'Calendar period'})
   .getByRole('button',{name:locale==='uk'?'Місяць':'Month'}).click();
  await expect(page.getByTestId('panchanga-calendar-range').getByTestId('panchanga-day-cell')).toHaveCount(30,{timeout:90000});
  await expect(page.getByTestId('panchanga-related')).toHaveCount(0);
  await page.getByRole('navigation',{name:locale==='uk'?'Період календаря':'Calendar period'})
   .getByRole('button',{name:locale==='uk'?'День':'Day',exact:true}).click();
  await expect(page.getByTestId('panchanga-integrated-day')).toBeVisible({timeout:90000});
  await expect(monthSystem.getByRole('button',{name:locale==='uk'?'Пурніманта':'Purnimanta'})).toHaveAttribute('aria-pressed','true');
 });
}
test('P2.4 delays day computation until the profile-derived observer is resolved',async({page})=>{
 test.setTimeout(120000);
 let release;
 const blocker=new Promise(done=>release=done);
 let requests=0;
 await page.route('**/api/v1/personal/panchanga/location',async route=>{
  await blocker;
  await route.fulfill({status:401,contentType:'application/json',body:'{"message":"Unauthorized"}'});
 });
 page.on('request',req=>{if(new URL(req.url()).pathname==='/api/v1/panchanga/day')requests++});
 await page.goto('/uk/panchanga?date=2026-11-02');
 await page.waitForTimeout(350);
 expect(requests).toBe(0);
 release();
 await expect(page.getByTestId('panchanga-five-angas').locator('article')).toHaveCount(5,{timeout:90000});
 expect(requests).toBe(1);
});
test('P2.4 fails closed if moon-calendar observer or sunrise does not match detailed Panchanga',async({page})=>{
 test.setTimeout(120000);
 await page.route('**/api/v1/vedic-calendar/overview?**',async route=>{
  const response=await route.fetch();
  const json=await response.json();
  json.observer.latitude=0;
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(json)});
 });
 await page.goto('/uk/panchanga?date=2026-11-02');
 await expect(page.getByTestId('panchanga-five-angas').locator('article')).toHaveCount(5,{timeout:90000});
 const guide=page.getByTestId('panchanga-integrated-day');
 await expect(guide.getByRole('alert')).toContainText('Дані про свята й фази',{timeout:90000});
 await expect(guide.locator('ol li')).toHaveCount(0);
});
test('P2.4 full day on narrow mobile has no horizontal overflow',async({page})=>{
 test.setTimeout(120000);
 await page.setViewportSize({width:320,height:740});
 await page.goto('/uk/panchanga?date=2026-11-02');
 await expect(page.getByTestId('panchanga-integrated-day')).toBeVisible({timeout:90000});
 await expect(page.getByTestId('panchanga-related')).toBeVisible();
 const width=await page.evaluate(()=>({body:document.documentElement.scrollWidth,viewport:window.innerWidth}));
 expect(width.body).toBeLessThanOrEqual(width.viewport+2);
});
