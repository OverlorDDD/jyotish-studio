import {test,expect} from '@playwright/test';

for(const locale of ['uk','en']){
 test('P388 '+locale+' bilingual unified calendar, local sunrise provenance, exact no-personal-leak and 320px layout',async({page})=>{
  test.setTimeout(180000);
  await page.setViewportSize({width:320,height:740});
  await page.goto('/'+locale+'/panchanga?date=2026-11-03');
  const hub=page.getByTestId('panchanga-hub');
  await expect(hub.getByTestId('p410-opportunities')).toBeVisible({timeout:90000});
  await hub.getByTestId('p410-advanced').locator('summary').click();
  await expect(hub.getByTestId('p386-activity-select')).toBeVisible();
  const nav=page.getByRole('navigation',{name:locale==='uk'?'Період календаря':'Calendar period'});
  await expect(nav.getByRole('button')).toHaveCount(3);
  await nav.getByRole('button',{name:locale==='uk'?'7 днів':'7 days'}).click();
  const week=hub.getByTestId('panchanga-calendar-range');
  await expect(week.getByTestId('panchanga-day-cell')).toHaveCount(7,{timeout:90000});
  await expect(week.getByTestId('p387-activity-select')).toBeVisible();
  await expect(week.getByTestId('p387-sunrise')).toHaveCount(0);
  await expect(week.getByTestId('p387-exact-windows')).toHaveCount(0);
  await nav.getByRole('button',{name:locale==='uk'?'Місяць':'Month'}).click();
  const month=hub.getByTestId('panchanga-calendar-range');
  await expect(month.getByTestId('panchanga-day-cell')).toHaveCount(30,{timeout:90000});
  await month.getByTestId('p387-activity-select').selectOption('wedding');
  await expect(month.getByTestId('p387-exact-windows')).toHaveCount(0);
  // Wedding eligibility cannot silently turn into complete ceremonial certification.
  await expect(month.getByTestId('p387-window-scope')).toHaveCount(0);
  const dims=await page.evaluate(()=>({
   viewport:window.innerWidth,scroll:document.documentElement.scrollWidth
  }));
  expect(dims.scroll).toBeLessThanOrEqual(dims.viewport+2);
  await page.setViewportSize({width:390,height:844});
  const large=await page.evaluate(()=>({
   viewport:window.innerWidth,scroll:document.documentElement.scrollWidth
  }));
  expect(large.scroll).toBeLessThanOrEqual(large.viewport+2);
 });
}
test('P388 exact Swiss 31-day public month and Day use identical five limbs, Sunrise UTC and no full-ceremony certification',async({request})=>{
 test.setTimeout(180000);
 const q=new URLSearchParams({zone:'Europe/Kyiv',latitude:'50.4501',longitude:'30.5234'});
 const day=new URLSearchParams(q);day.set('date','2026-11-03');
 const month=new URLSearchParams(q);month.set('start','2026-11-01');month.set('days','30');month.set('monthSystem','amanta');
 const [one,full]=await Promise.all([
  request.get('/api/v1/panchanga/day?'+day,{timeout:120000}),
  request.get('/api/v1/vedic-calendar/overview?'+month,{timeout:120000})
 ]);
 expect(one.status()).toBe(200);
 expect(full.status()).toBe(200);
 const d=await one.json(),m=await full.json();
 expect(m.days).toHaveLength(30);
 const row=m.days.find(x=>x.date==='2026-11-03');
 expect(row.sunriseUtc).toBe(d.sunriseUtc);
 expect(row.nextSunriseUtc).toBe(d.nextSunriseUtc);
 for(const limb of ['tithi','nakshatra','vara','yoga','karana'])
  expect(row.sunriseAngas[limb]).toEqual(d.sunrise[limb]);
 expect(m.observanceDayCertifiedByTradition).toBe(false);
});
test('P388 guest: exact natal calendar and event-election POST stay private, no credentials/cached result',async({request})=>{
 const q='start=2026-11-01&days=31&zone=Europe%2FKyiv&latitude=50.4501&longitude=30.5234';
 const r=await request.get('/api/v1/personal/panchanga/calendar?'+q);
 expect(r.status()).toBe(401);
 expect(r.headers()['cache-control']).toContain('no-store');
 for(const activityId of ['foundation','wedding']){
  const found=await request.post('/api/v1/personal/panchanga/time-finder',{data:{
   activityId,atUtc:'2027-05-10T15:00:00.000Z',timeZone:'Europe/Kyiv',
   latitude:50.4501,longitude:30.5234,days:7}});
  expect(found.status()).toBe(401);
  expect(found.headers()['cache-control']).toContain('no-store');
 }
});
