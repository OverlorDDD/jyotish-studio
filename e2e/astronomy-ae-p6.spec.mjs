import {test,expect} from '@playwright/test';
const query='/api/v1/astronomy/eclipses?start=2027-01-01&days=366&zone=Europe%2FKyiv&latitude=50.4501&longitude=30.5234';
test('AE-P6 real Swiss global/local eclipse API distinguishes visibility and returns NASA-catalogued 2027 events',async({request})=>{
 test.setTimeout(120000);
 const response=await request.get(query,{timeout:90000});
 expect(response.status(),await response.text()).toBe(200);
 const r=await response.json();
 expect(r.version).toBe('verified-swiss-eclipses-v1');
 expect(r.independentVisibilityCertified).toBe(false);
 expect(r.events.length).toBeGreaterThanOrEqual(4);
 expect(r.events.some(e=>e.type==='solar'&&e.maximumUtc.startsWith('2027-02-06'))).toBe(true);
 expect(r.events.some(e=>e.type==='solar'&&e.maximumUtc.startsWith('2027-08-02'))).toBe(true);
 expect(r.events.some(e=>e.type==='lunar'&&e.maximumUtc.startsWith('2027-02-20'))).toBe(true);
 for(const e of r.events){
  expect(typeof e.visibleHere).toBe('boolean');
  expect(e.visibleHere).toBe(e.localMaximumUtc!==null);
  expect(['total','partial','annular','hybrid','penumbral']).toContain(e.eclipseKind);
 }
 for(const bad of ['/api/v1/astronomy/eclipses?days=500',
  '/api/v1/astronomy/eclipses?start=2027-02-30',
  '/api/v1/astronomy/eclipses?latitude=100',
  '/api/v1/astronomy/eclipses?zone=Not_A_Zone']){
  expect((await request.get(bad)).status(),bad).toBe(400);
 }
});
test('AE-P6 private personal Panchanga refuses anonymous lunar strength and cannot disclose natal chart',async({request})=>{
 const r=await request.get('/api/v1/personal/panchanga?date=2027-01-01&zone=Europe%2FKyiv&latitude=50.4501&longitude=30.5234');
 expect(r.status()).toBe(401);
 const body=await r.text();
 expect(body).not.toMatch(/moonLongitude|birthTime|birthDate|dasha|ownerId/);
});
for(const locale of ['uk','en']){
 test('AE-P6 '+locale+' shows private lunar state and independently triggered eclipse visibility',async({page})=>{
  test.setTimeout(120000);
  await page.goto('/'+locale+'/panchanga');
  await expect(page.getByTestId('personal-panchanga')).toBeVisible();
  const panel=page.getByTestId('eclipse-panel');
  await expect(panel).toBeVisible();
  await page.getByLabel(locale==='uk'?'Дата':'Date').fill('2027-01-01');
  await page.getByRole('button',{name:locale==='uk'?'Розрахувати день':'Calculate day'}).click();
  await panel.getByRole('button',{name:locale==='uk'?'Знайти затемнення на рік':'Find eclipses for a year'}).click();
  await expect(panel.locator('li').first()).toBeVisible({timeout:90000});
  expect(await panel.locator('li').count()).toBeGreaterThanOrEqual(4);
  await expect(panel.getByText('NASA · Eclipse Canon',{exact:false})).toBeVisible();
 });
}
