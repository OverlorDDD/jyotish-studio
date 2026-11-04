import {test,expect} from '@playwright/test';
const url='/api/v1/astronomy/events?start=2026-10-27&days=7&zone=Europe%2FKyiv';
test('AE-P5 verifies Swiss phases, sidereal planetary ingresses, exact UTC ordering and strict range',async({request})=>{
 test.setTimeout(120000);
 const response=await request.get(url);
 expect(response.status(),await response.text()).toBe(200);
 const data=await response.json();
 expect(data.version).toBe('astronomical-events-v1');
 expect(data.days).toBe(7);
 expect(data.referenceFrame).toBe('APPARENT_GEOCENTRIC_SIDEREAL_LAHIRI');
 expect(data.independentEventTimeCertified).toBe(false);
 expect(data.eventTimeResolutionSeconds).toBe(1);
 expect(data.events.length).toBeGreaterThan(0);
 expect(data.events.some(e=>e.kind==='sidereal_ingress'&&e.body==='Moon')).toBe(true);
 const start=Date.parse(data.startUtc),end=Date.parse(data.endUtc);
 for(let i=0;i<data.events.length;i++){
  const e=data.events[i],ms=Date.parse(e.atUtc);
  expect(ms).toBeGreaterThanOrEqual(start);
  expect(ms).toBeLessThan(end);
  if(i>0)expect(e.atUtc>=data.events[i-1].atUtc).toBe(true);
  expect(e.localDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  if(e.kind==='sidereal_ingress'){
   expect(e.fromSign).toBeGreaterThanOrEqual(1);
   expect(e.toSign).toBeLessThanOrEqual(12);
   expect(['direct','retrograde']).toContain(e.motion);
  }
 }
 const errors=[
  '/api/v1/astronomy/events?start=2026-02-30',
  '/api/v1/astronomy/events?start=2026-10-27&days=31',
  '/api/v1/astronomy/events?start=2026-10-27&days=0',
  '/api/v1/astronomy/events?start=2026-10-27&zone=Not_A_Zone'
 ];
 for(const endpoint of errors)expect((await request.get(endpoint)).status()).toBe(400);
});
for(const locale of ['uk','en']){
 test('AE-P5 '+locale+' renders event timeline, accessible filters and 30-day switch',async({page})=>{
  test.setTimeout(120000);
  await page.goto('/'+locale+'/panchanga');
  const panel=page.getByTestId('astronomical-events-panel');
  await expect(panel).toBeVisible();
  await expect(panel.locator('ol li').first()).toBeVisible({timeout:90000});
  const title=locale==='uk'?'Астрономічні події':'Astronomical events';
  await expect(panel.getByRole('heading',{name:title})).toBeVisible();
  const phase=locale==='uk'?'Фази Місяця':'Lunar phases';
  await panel.getByRole('button',{name:phase}).click();
  await expect(panel.getByRole('button',{name:phase})).toHaveAttribute('aria-pressed','true');
  const thirty=locale==='uk'?'30 днів':'30 days';
  await panel.getByRole('button',{name:thirty}).click();
  await expect(panel.getByRole('button',{name:thirty})).toHaveAttribute('aria-pressed','true');
  await expect(panel.locator('ol li').first()).toBeVisible({timeout:90000});
  await expect(panel.getByText('Swiss Ephemeris', {exact:false}).last()).toBeVisible();
 });
}
