import {test,expect} from '@playwright/test';
const common='zone=Europe%2FKyiv&latitude=50.4501&longitude=30.5234';
test('P2.1 week/month sunrise snapshots share the exact day ephemeris',async({request})=>{
 test.setTimeout(120000);
 const day=await request.get('/api/v1/panchanga/day?date=2026-11-02&'+common);
 expect(day.status(),await day.text()).toBe(200);
 const detailed=await day.json();
 const week=await request.get('/api/v1/panchanga/range?start=2026-11-02&days=7&'+common);
 expect(week.status(),await week.text()).toBe(200);
 const data=await week.json();
 expect(data.version).toBe('panchanga-range-v1');
 expect(data.scope).toBe('five-angas-at-local-sunrise-not-all-day-intervals');
 expect(data.days).toHaveLength(7);
 expect(data.days[0].sunriseUtc).toBe(detailed.sunriseUtc);
 for(const key of ['tithi','nakshatra','vara','yoga','karana']){
  expect(data.days[0].sunrise[key]).toEqual(detailed.sunrise[key]);
 }
 const month=await request.get('/api/v1/panchanga/range?start=2026-11-01&days=30&'+common);
 expect(month.status(),await month.text()).toBe(200);
 const grid=await month.json();
 expect(grid.days).toHaveLength(30);
 expect(grid.days[0].date).toBe('2026-11-01');
 expect(grid.days[29].date).toBe('2026-11-30');
 expect(grid.days.every(d=>Date.parse(d.sunriseUtc)<Date.parse(d.nextSunriseUtc))).toBe(true);
 const tooLong=await request.get('/api/v1/panchanga/range?start=2026-11-01&days=32&'+common);
 expect(tooLong.status()).toBe(400);
});
test('observer preference never exposes other accounts to guests',async({request})=>{
 const r=await request.get('/api/v1/personal/panchanga/location');
 expect(r.status()).toBe(401);
});
for(const locale of ['uk','en']){
 test('P2.1 '+locale+' shows first-class five limbs and week/month navigation',async({page})=>{
  test.setTimeout(120000);
  await page.goto('/'+locale+'/panchanga');
  await expect(page.getByTestId('p31-details')).toBeVisible({timeout:90000});
  await page.getByTestId('p31-details').locator(':scope > summary').click();
  await expect(page.getByTestId('panchanga-five-angas').locator('article')).toHaveCount(5,{timeout:60000});
  const periodNav=page.getByRole('navigation',{name:locale==='uk'?'Період календаря':'Calendar period'});
  await periodNav.getByRole('button',{name:locale==='uk'?'7 днів':'7 days'}).click();
  await expect(page.getByTestId('panchanga-calendar-range').getByTestId('panchanga-day-cell')).toHaveCount(7,{timeout:90000});
  await periodNav.getByRole('button',{name:locale==='uk'?'Місяць':'Month'}).click();
  await expect(page.getByTestId('panchanga-calendar-range').getByTestId('panchanga-day-cell')).toHaveCount(30,{timeout:90000});
 });
}
