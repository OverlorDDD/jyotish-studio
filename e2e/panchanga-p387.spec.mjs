import {test,expect} from '@playwright/test';
import {fixtureAccount} from './support/disposable-accounts.mjs';
import {randomUUID} from 'node:crypto';
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
 test('Panchanga Today '+locale+' month calendar: real day cells, month switch and day drilldown',async({page})=>{
  test.setTimeout(180000);
  await page.goto('/'+locale+'/panchanga?date=2026-11-02');
  await rejectAnalyticsIfPrompted(page);
  const month=page.getByTestId('panchanga-month');
  await expect(month.getByTestId('panchanga-month-day')).toHaveCount(30,{timeout:90000});
  await month.getByRole('button',{name:locale==='uk'?'Наступний місяць':'Next month'}).click();
  await expect(month.getByTestId('panchanga-month-day')).toHaveCount(31,{timeout:90000});
  await month.getByTestId('panchanga-month-day').nth(9).click();
  await expect(page.locator('input[type=date]')).toHaveValue('2026-12-10');
  await expect(page.locator('#pt-verdict')).toBeVisible({timeout:90000});
  await expect(month.getByTestId('panchanga-month-day').nth(9)).toHaveAttribute('aria-current','date');
  const upcoming=page.getByTestId('panchanga-upcoming');
  await expect(upcoming.locator('li').first()).toBeVisible({timeout:90000});
 });
}
test('Guest: protected personal endpoints are not called automatically',async({page})=>{
 test.setTimeout(150000);
 const requested=[];
 page.on('request',r=>{
  if(r.url().includes('/api/v1/personal/panchanga/calendar')||
     r.url().includes('/api/v1/personal/panchanga/time-finder'))requested.push(r.url());
 });
 await page.goto('/uk/panchanga?date=2026-11-02');
 await rejectAnalyticsIfPrompted(page);
 await expect(page.getByTestId('panchanga-month-day')).toHaveCount(30,{timeout:90000});
 await expect(page.getByTestId('panchanga-activity')).toHaveCount(9,{timeout:90000});
 expect(requested).toEqual([]);
 await expect(page.getByTestId('p387-sunrise')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Показати мій календар'})).toHaveCount(0);
});

test('P3.8.7 real signed-in month 31/29 days, natal city, and second-owner isolation',async({page,browser},testInfo)=>{
 test.skip(testInfo.project.name!=='desktop-chromium','Full chart calculation tested once on desktop');
 test.setTimeout(270000);
 const suffix=randomUUID().slice(0,8);
 const response=await fixtureAccount(page,{data:{
  email:'p387-owner-'+suffix+'@example.invalid',
  password:'P387-disposable-'+suffix+'-secret-example'}});
 expect(response.status()).toBe(201);
 const chart=await page.request.post('/api/v1/account/charts',{data:{
  date:'1996-03-27',time:'12:58',timeZone:'Europe/Kyiv',
  latitude:47.9105,longitude:33.3918,place:'Kryvyi Rih'}});
 expect(chart.status(),await chart.text()).toBe(201);
 const {id:chartId}=await chart.json();
 const primary=await page.request.put('/api/v1/personal/primary-chart',{data:{chartId}});
 expect(primary.status(),await primary.text()).toBe(200);
 for(const [start,days] of [['2026-10-01',31],['2028-02-01',29]]){
  const q=new URLSearchParams({start,days:String(days),zone:'Europe/Kyiv',
   latitude:'50.4501',longitude:'30.5234'});
  const r=await page.request.get('/api/v1/personal/panchanga/calendar?'+q,{timeout:120000});
  expect(r.status(),await r.text()).toBe(200);
  expect(r.headers()['cache-control']).toContain('no-store');
  const d=await r.json();
  expect(d.status).toBe('available');
  expect(d.personal.days).toHaveLength(days);
  expect(d.range.days).toHaveLength(days);
  expect(d.personal.events).toBeInstanceOf(Array);
 }
 await page.goto('/uk/panchanga?date=2026-11-02');
 await rejectAnalyticsIfPrompted(page);
 // The chart owner's city comes from the birth chart; no duplicate month grid.
 await expect(page.getByTestId('panchanga-hub')).toContainText('Місто з вашої натальної карти',{timeout:90000});
 await expect(page.getByTestId('panchanga-month-day')).toHaveCount(30,{timeout:90000});
 await expect(page.getByTestId('panchanga-day-cell')).toHaveCount(0);
 const other=await browser.newContext();
 try{
  const p=await other.newPage();
  const logged=await fixtureAccount(p,{data:{
   email:'p387-second-'+suffix+'@example.invalid',
   password:'P387-secondary-'+suffix+'-secret-example'}});
  expect(logged.status()).toBe(201);
  const denied=await p.request.put('/api/v1/personal/primary-chart',{data:{chartId}});
  expect(denied.status()).toBe(400);
  const unauthorized=await p.request.get('/api/v1/personal/panchanga/calendar?'+
   new URLSearchParams({start:'2026-11-01',days:'30',zone:'Europe/Kyiv',
    latitude:'50.4501',longitude:'30.5234'}));
  expect(unauthorized.status()).toBe(200);
  expect((await unauthorized.json()).status).toBe('requires_primary_chart');
 }finally{await other.close()}
});
