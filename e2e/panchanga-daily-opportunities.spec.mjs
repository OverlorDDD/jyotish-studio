import {test,expect} from '@playwright/test';
const DAY='2026-11-05'; // future relative to the Nov 3 design baseline
for(const locale of ['uk','en']){
 for(const width of [320,390]){
  test('P410 '+locale+' '+width+'px opportunities, real timing, no 53-percent ring',async({page})=>{
   test.setTimeout(180000);
   await page.setViewportSize({width,height:780});
   await page.goto('/'+locale+'/panchanga?date='+DAY);
   const hub=page.getByTestId('panchanga-hub');
   const guide=hub.getByTestId('p410-opportunities');
   await expect(guide).toBeVisible({timeout:90000});
   await expect(guide.getByRole('heading',{name:locale==='uk'?
    'Що краще робити сьогодні й коли?':'What is good to do today — and when?'})).toBeVisible();
   const opportunities=guide.getByTestId('p410-opportunity');
   expect(await opportunities.count()).toBeGreaterThan(0);
   expect(await opportunities.count()).toBeLessThanOrEqual(3);
   await expect(hub.getByTestId('p31-my-day')).toHaveCount(0);
   await expect(hub.getByTestId('p390-favorability-ring')).toHaveCount(0);
   await expect(guide).not.toContainText('53%');
   const first=opportunities.first();
   const calendar=first.getByRole('link',{name:locale==='uk'?'Додати в календар':'Add to calendar'});
   await expect(calendar).toHaveAttribute('href',/^data:text\/calendar;charset=utf-8,/);
   await expect(calendar).toHaveAttribute('download',/\.ics$/);
   await guide.getByText(locale==='uk'?'Чому саме ці години? Переглянути розрахунок':
    'Why these times? View the calculation').click();
   await expect(guide.getByRole('heading',{name:locale==='uk'?'Чогхадія · день і ніч':'Choghadiya · day and night'})).toBeVisible();
   await expect(guide.locator('ol').first().locator('li')).toHaveCount(16);
   await expect(guide.locator('ol').last().locator('li')).toHaveCount(24);
   const sizes=await page.evaluate(()=>({viewport:window.innerWidth,scroll:document.documentElement.scrollWidth}));
   expect(sizes.scroll).toBeLessThanOrEqual(sizes.viewport+2);
  });
 }
 test('P410 '+locale+' browse tomorrow, week and preserve specialist owner tool on demand',async({page})=>{
  test.setTimeout(180000);
  await page.goto('/'+locale+'/panchanga?date='+DAY);
  const hub=page.getByTestId('panchanga-hub');
  await expect(hub.getByTestId('p410-opportunities')).toBeVisible({timeout:90000});
  await hub.getByTestId('p410-opportunities').getByRole('button',{
   name:locale==='uk'?'А що завтра?':'What about tomorrow?'}).click();
  await expect(hub.locator('input[type=date]')).toHaveValue('2026-11-06');
  await expect(hub.getByTestId('p410-opportunities')).toBeVisible({timeout:90000});
  await hub.getByTestId('p410-opportunities').getByRole('button',{
   name:locale==='uk'?'Переглянути 7 днів':'Explore 7 days'}).click();
  await expect(hub.getByTestId('panchanga-day-cell')).toHaveCount(7,{timeout:90000});
  await hub.getByRole('navigation').getByRole('button',{name:locale==='uk'?'День':'Day'}).click();
  await expect(hub.getByTestId('p410-opportunities')).toBeVisible({timeout:90000});
  await hub.getByTestId('p410-opportunities').getByRole('button',{
   name:locale==='uk'?'Складні події: персональний Time Finder і попередня мухурта':
    'Special events: personal Time Finder and preliminary Muhurta'}).click();
  await expect(hub.getByTestId('p31-my-day')).toBeVisible({timeout:90000});
  await expect(hub.getByTestId('p386-activity-select')).toBeVisible();
  await expect(hub.getByTestId('p389-muhurta-checklist')).toHaveCount(0);
 });
}
test('P410 public results disclose no natal details and guest private API remains protected',async({page,request})=>{
 await page.goto('/en/panchanga?date='+DAY);
 await expect(page.getByTestId('p410-opportunities')).toBeVisible({timeout:90000});
 await expect(page.getByTestId('p410-personal')).toContainText('birth chart');
 const q=new URLSearchParams({date:DAY,zone:'Europe/Kyiv',latitude:'50.4501',
  longitude:'30.5234',at:'2026-11-05T10:00:00.000Z'});
 const privateResponse=await request.get('/api/v1/personal/panchanga/resonance?'+q);
 expect(privateResponse.status()).toBe(401);
});
