import {test,expect} from '@playwright/test';
const zone='zone=Europe%2FKyiv&latitude=50.4501&longitude=30.5234';
test('P2.3 one Swiss overview combines all limbs, month names, candidates and exact phases',async({request})=>{
 test.setTimeout(120000);
 const r=await request.get('/api/v1/vedic-calendar/overview?start=2026-12-01&days=31&monthSystem=amanta&'+zone);
 expect(r.status(),await r.text()).toBe(200);
 const v=await r.json();
 expect(v.days).toHaveLength(31);
 expect(v.days[0].date).toBe('2026-12-01');
 expect(v.days.at(-1).date).toBe('2026-12-31');
 expect(v.observanceDayCertifiedByTradition).toBe(false);
 expect(v.astronomicalTimeCertifiedByIndependentReference).toBe(false);
 expect(v.phaseEvents.length).toBeGreaterThan(1);
 expect(v.phaseEvents.every(x=>['new_moon','full_moon','first_quarter','last_quarter'].includes(x.kind))).toBe(true);
 for(const d of v.days){
  expect(d.sunriseAngas).toBeTruthy();
  for(const k of ['tithi','nakshatra','vara','yoga','karana'])expect(d.sunriseAngas[k]).toBeTruthy();
  expect(Array.isArray(d.observances)).toBe(true);
  expect(d.moonMonth).toBeTruthy();
 }
 const detailed=await request.get('/api/v1/panchanga/day?date=2026-12-01&'+zone);
 expect(detailed.status(),await detailed.text()).toBe(200);
 const day=await detailed.json();
 for(const k of ['tithi','nakshatra','vara','yoga','karana'])
  expect(v.days[0].sunriseAngas[k]).toEqual(day.sunrise[k]);
 expect(v.days[0].sunriseUtc).toBe(day.sunriseUtc);
 const weekInvalid=await request.get('/api/v1/vedic-calendar/week?start=2026-12-01&days=31&'+zone);
 expect(weekInvalid.status()).toBe(400);
 const overviewInvalid=await request.get('/api/v1/vedic-calendar/overview?start=2026-12-01&days=32&'+zone);
 expect(overviewInvalid.status()).toBe(400);
});
test('P2.3 exact phase events agree with independent astronomy-window event geometry',async({request})=>{
 test.setTimeout(120000);
 const [a,b]=await Promise.all([
  request.get('/api/v1/vedic-calendar/overview?start=2026-11-01&days=30&monthSystem=amanta&'+zone),
  request.get('/api/v1/astronomy/events?start=2026-11-01&days=30&zone=Europe%2FKyiv')
 ]);
 expect(a.status(),await a.text()).toBe(200);
 expect(b.status(),await b.text()).toBe(200);
 const v=await a.json(),astro=await b.json();
 const expected=astro.events.filter(e=>['new_moon','first_quarter','full_moon','last_quarter'].includes(e.kind));
 expect(v.phaseEvents.length).toBe(expected.length);
 for(let i=0;i<expected.length;i++){
  expect(v.phaseEvents[i].kind).toBe(expected[i].kind);
  expect(Math.abs(Date.parse(v.phaseEvents[i].atUtc)-Date.parse(expected[i].atUtc))).toBeLessThanOrEqual(1100);
  expect(v.phaseEvents[i].localDate).toBe(expected[i].localDate);
 }
});
for(const locale of ['uk','en']){
 test('P2.3 '+locale+' month navigation, filters, amanta/purnimanta and daily drilldown',async({page})=>{
  test.setTimeout(120000);
  await page.goto('/'+locale+'/panchanga?date=2026-11-02');
  const periodNav=page.getByRole('navigation',{name:locale==='uk'?'Період календаря':'Calendar period'});
  await periodNav.getByRole('button',{name:locale==='uk'?'Місяць':'Month'}).click();
  const grid=page.getByTestId('panchanga-calendar-range');
  await expect(grid.getByTestId('panchanga-day-cell')).toHaveCount(30,{timeout:90000});
  await grid.getByRole('button',{name:locale==='uk'?'Фази':'Phases'}).click();
  await expect(grid.getByTestId('panchanga-day-cell')).toHaveCount(30);
  await page.getByTestId('panchanga-month-system').getByRole('button',
   {name:locale==='uk'?'Пурніманта':'Purnimanta'}).click();
  await expect(grid.getByTestId('panchanga-day-cell')).toHaveCount(30,{timeout:90000});
  await grid.getByRole('button',{name:locale==='uk'?'Наступний період':'Next period'}).click();
  await expect(grid.getByTestId('panchanga-day-cell')).toHaveCount(31,{timeout:90000});
  await grid.getByTestId('panchanga-day-cell').first().click();
  await expect(page.getByTestId('panchanga-day-experience')).toBeVisible({timeout:90000});
 });
}
test('P2.3 narrow mobile monthly calendar does not horizontally overflow',async({page})=>{
 test.setTimeout(120000);
 await page.setViewportSize({width:320,height:740});
 await page.goto('/uk/panchanga?date=2026-11-02');
 await page.getByRole('navigation',{name:'Період календаря'}).getByRole('button',{name:'Місяць'}).click();
 const grid=page.getByTestId('panchanga-calendar-range');
 await expect(grid.getByTestId('panchanga-day-cell')).toHaveCount(30,{timeout:90000});
 const result=await page.evaluate(()=>{
  const el=document.querySelector('[data-testid="panchanga-calendar-range"]');
  return {width:el?.getBoundingClientRect().width??10000,viewport:window.innerWidth,
   pageScroll:document.documentElement.scrollWidth};
 });
 expect(result.width).toBeLessThanOrEqual(result.viewport);
 expect(result.pageScroll).toBeLessThanOrEqual(result.viewport+2);
});
