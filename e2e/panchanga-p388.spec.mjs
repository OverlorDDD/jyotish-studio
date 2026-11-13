import {test,expect} from '@playwright/test';
// Wait for the hydrated consent prompt before interacting with mobile UI.
// Reject via the actual button; R4.2 independently tests opt-in and revocation.
async function rejectAnalyticsIfPrompted(page){
 const dialog=page.getByRole('dialog',{name:/Аналітика відвідувань|Visitor analytics/});
 try { await dialog.waitFor({state:'visible',timeout:8000}); }
 catch { return; } // Previously decided consent or prompt intentionally absent.
 await dialog.getByRole('button',{name:/Відхилити|Reject/}).click();
 await expect(dialog).toHaveCount(0);
}
const noOverflow=async page=>{
 const d=await page.evaluate(()=>({w:window.innerWidth,s:document.documentElement.scrollWidth}));
 expect(d.s).toBeLessThanOrEqual(d.w+2);
};

for(const locale of ['uk','en']){
 test('P388 '+locale+' Panchanga Today at 320px: day, month, festivals and classical details without leaks',async({page})=>{
  test.setTimeout(180000);
  await page.setViewportSize({width:320,height:740});
  await page.goto('/'+locale+'/panchanga?date=2026-11-03');
  await rejectAnalyticsIfPrompted(page);
  const hub=page.getByTestId('panchanga-hub');
  await expect(hub.locator('#pt-verdict')).toBeVisible({timeout:90000});
  await expect(hub.getByTestId('panchanga-month-day')).toHaveCount(30,{timeout:90000});
  await expect(hub.getByTestId('panchanga-upcoming')).toBeVisible();
  await hub.getByTestId('p31-details').locator(':scope > summary').click();
  await expect(hub.getByTestId('panchanga-five-angas').locator('article')).toHaveCount(5,{timeout:90000});
  await expect(hub.getByTestId('p387-sunrise')).toHaveCount(0);
  await expect(hub.getByTestId('p387-exact-windows')).toHaveCount(0);
  await noOverflow(page);
  await page.setViewportSize({width:390,height:844});
  await noOverflow(page);
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
