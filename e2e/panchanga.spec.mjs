import {test,expect} from '@playwright/test';
const API='/api/v1/panchanga/day?date=2026-10-27&zone=Europe%2FKyiv&latitude=50.4501&longitude=30.5234';
test('real Swiss Panchanga returns local sunrise, five angas and actual transition instants',async({request})=>{
 test.setTimeout(90000);
 const response=await request.get(API);
 expect(response.status(),await response.text()).toBe(200);
 const data=await response.json();
 expect(data.version).toBe('panchanga-five-anga-v1');
 expect(data.sunrise.tithi.number).toBeGreaterThanOrEqual(1);
 expect(data.sunrise.tithi.number).toBeLessThanOrEqual(30);
 expect(data.sunrise.nakshatra.number).toBeGreaterThanOrEqual(1);
 expect(data.sunrise.nakshatra.number).toBeLessThanOrEqual(27);
 expect(data.sunrise.karana.slot).toBeGreaterThanOrEqual(1);
 expect(data.sunrise.karana.slot).toBeLessThanOrEqual(60);
 expect(data.sunrise.yoga.number).toBeGreaterThanOrEqual(1);
 expect(data.sunrise.yoga.number).toBeLessThanOrEqual(27);
 expect(data.sunrise.vara.name).toBe('Mangalavara');
 expect(data.astronomyProfile).toMatch(/verified SWIEPH/);
 expect(data.methodology.boundaryResolutionSeconds).toBe(1);
 expect(data.astronomicalEvents.some(e=>e.type==='sunrise')).toBe(true);
 expect(data.astronomicalEvents.some(e=>e.type==='sunset')).toBe(true);
 const start=Date.parse(data.sunriseUtc),end=Date.parse(data.nextSunriseUtc);
 expect(end-start).toBeGreaterThan(20*3600000);
 expect(end-start).toBeLessThan(28*3600000);
 expect(Date.parse(data.sunsetUtc)).toBeGreaterThan(start);
 for(const key of ['tithi','nakshatra','yoga','karana']){
  expect(Date.parse(data.boundaries[key].startUtc)).toBeLessThanOrEqual(start);
  expect(Date.parse(data.boundaries[key].endUtc)).toBeGreaterThan(start);
  expect(data.changes.some(c=>c.kind===key)).toBe(true);
 }
 expect(data.changes.every(c=>Date.parse(c.atUtc)>=start&&Date.parse(c.atUtc)<end)).toBe(true);
 for(let i=1;i<data.changes.length;i++)expect(data.changes[i].atUtc>=data.changes[i-1].atUtc).toBe(true);
 const bad=await request.get('/api/v1/panchanga/day?date=2026-02-30');
 expect(bad.status()).toBe(400);
});
for(const locale of ['uk','en']){
 test('Panchanga '+locale+' shows real five-limb calendar and local transition timeline',async({page})=>{
  test.setTimeout(90000);
  await page.goto('/'+locale+'/panchanga');
  const label=locale==='uk'?'Панчанга':'Panchanga';
  await expect(page.getByRole('heading',{name:label,exact:true})).toBeVisible();
  await page.getByLabel(locale==='uk'?'Дата':'Date').fill('2026-10-27');
  await page.getByRole('button',{name:locale==='uk'?'Розрахувати день':'Calculate day'}).click();
  await expect(page.getByTestId('panchanga-five-angas').locator('article')).toHaveCount(5,{timeout:60000});
  await expect(page.getByText('Swiss Ephemeris · Programming Documentation')).toBeVisible();
  await expect(page.getByText(locale==='uk'?'Переходи протягом дня':'Transitions during the day')).toBeVisible();
 });
}
