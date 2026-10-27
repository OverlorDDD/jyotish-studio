import {test,expect} from '@playwright/test';
const endpoint='/api/v1/vedic-calendar/week?start=2026-10-27&days=7&zone=Europe%2FKyiv&latitude=50.4501&longitude=30.5234&monthSystem=amanta';
test('AE-P7 real Swiss festival week has exact local sunrise, versioned month rules and observer Muhurta',async({request})=>{
 test.setTimeout(120000);
 const r=await request.get(endpoint,{timeout:90000});
 expect(r.status(),await r.text()).toBe(200);
 const data=await r.json();
 expect(data.version).toBe('vedic-observance-indications-v1');
 expect(data.days).toHaveLength(7);
 expect(data.monthSystem).toBe('amanta');
 expect(data.observanceDayCertifiedByTradition).toBe(false);
 expect(data.astronomicalTimeCertifiedByIndependentReference).toBe(false);
 const dates=new Set();
 for(const d of data.days){
  expect(d.date).toMatch(/^2026-1[01]-\d\d$/);
  dates.add(d.date);
  expect(d.tithi).toBeGreaterThanOrEqual(1);
  expect(d.tithi).toBeLessThanOrEqual(30);
  expect(d.moonMonth.lunarMonthStatus).toMatch(/^(regular|adhika|kshaya_review_required)$/);
  expect(d.moonMonth.sourceNewMoonUtc).toBeTruthy();
  expect(d.windows.abhijit.startUtc).toBeTruthy();
  expect(Date.parse(d.windows.abhijit.startUtc)).toBeGreaterThan(Date.parse(d.sunriseUtc));
  expect(Date.parse(d.windows.abhijit.endUtc)).toBeLessThan(Date.parse(d.sunsetUtc));
  expect(d.observances.every(o=>o.category==='candidate'||o.category==='astronomical_event')).toBe(true);
  for(let i=1;i<d.observances.length;i++)expect(d.observances[i].atUtc>=d.observances[i-1].atUtc).toBe(true);
 }
 expect(dates.size).toBe(7);
 const north=await request.get(endpoint.replace('monthSystem=amanta','monthSystem=purnimanta'),{timeout:90000});
 expect(north.status(),await north.text()).toBe(200);
 const northData=await north.json();
 expect(northData.days.map(d=>d.sunriseUtc)).toEqual(data.days.map(d=>d.sunriseUtc));
 expect(northData.days.map(d=>d.tithi)).toEqual(data.days.map(d=>d.tithi));
 expect(northData.monthSystem).toBe('purnimanta');
 for(const query of [
  '/api/v1/vedic-calendar/week?days=8',
  '/api/v1/vedic-calendar/week?days=0',
  '/api/v1/vedic-calendar/week?start=2026-02-30',
  '/api/v1/vedic-calendar/week?monthSystem=other',
  '/api/v1/vedic-calendar/week?latitude=91',
  '/api/v1/vedic-calendar/week?zone=Fake%2FInvalid'
 ]){
  const bad=await request.get(query);
  expect(bad.status(),query).toBe(400);
 }
});
for(const locale of ['uk','en']){
 test('AE-P7 '+locale+' festival panel displays seven days and switches month tradition',async({page})=>{
  test.setTimeout(120000);
  await page.goto('/'+locale+'/panchanga');
  const p=page.getByTestId('vedic-festival-panel');
  await expect(p).toBeVisible();
  await expect(p.locator('article')).toHaveCount(7,{timeout:90000});
  const other=locale==='uk'?'Пурніманта (місяць до повні)':'Purnimanta (full-moon ending)';
  await p.getByRole('button',{name:other}).click();
  await expect(p.getByRole('button',{name:other})).toHaveAttribute('aria-pressed','true');
  await expect(p.locator('article')).toHaveCount(7,{timeout:90000});
  await expect(p.getByText(locale==='uk'?'Абхіджіт-мухурта':'Abhijit Muhurta').first()).toBeVisible();
  const warning=locale==='uk'?'кандидати свят':'observance candidates';
  await expect(p.getByText(new RegExp(warning,'i')).last()).toBeVisible();
 });
}

test('AE-P7 rule-based New Delhi festival indicators align with independently published 2026 Rama Navami and Maha Shivaratri dates',async({request})=>{
 test.setTimeout(150000);
 const base='/api/v1/vedic-calendar/week?days=7&zone=Asia%2FKolkata&latitude=28.6139&longitude=77.209&monthSystem=amanta&start=';
 const samples=[
  {start:'2026-03-23',day:'2026-03-26',id:'rama_navami'},
  {start:'2026-02-12',day:'2026-02-15',id:'maha_shivaratri'}
 ];
 for(const s of samples){
  const response=await request.get(base+s.start,{timeout:90000});
  expect(response.status(),await response.text()).toBe(200);
  const data=await response.json();
  const found=data.days.find(d=>d.date===s.day);
  expect(found,s.id+' '+s.day+' missing').toBeTruthy();
  expect(found.observances.some(x=>x.id===s.id),
    'Source: Drik Panchang publicly published New Delhi '+s.id+' '+s.day).toBe(true);
  expect(data.observanceDayCertifiedByTradition).toBe(false);
 }
});
