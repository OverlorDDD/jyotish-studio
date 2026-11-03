import {test,expect} from '@playwright/test';
import {fixtureAccount} from './support/disposable-accounts.mjs';
import {randomUUID} from 'node:crypto';
for(const locale of ['uk','en']){
 test('P3.8.7 '+locale+' preserves activity across exact Day / Week / Month without creating unverified personal badges',async({page})=>{
  test.setTimeout(120000);
  await page.goto('/'+locale+'/panchanga?date=2026-11-02');
  await expect(page.getByTestId('p31-my-day')).toBeVisible({timeout:90000});
  await page.getByRole('button',{name:locale==='uk'?'Подорожі':'Travel',exact:true}).click();
  await page.getByTestId('p386-activity-select').selectOption('short_journey');
  const nav=page.getByRole('navigation',{name:locale==='uk'?'Період календаря':'Calendar period'});
  await nav.getByRole('button',{name:locale==='uk'?'7 днів':'7 days'}).click();
  const weekly=page.getByTestId('panchanga-calendar-range');
  await expect(weekly.getByTestId('panchanga-day-cell')).toHaveCount(7,{timeout:90000});
  await expect(weekly.getByTestId('p387-activity-select')).toHaveValue('short_journey');
  await expect(weekly.getByTestId('p387-sunrise')).toHaveCount(0);
  await weekly.getByTestId('p387-activity-select').selectOption('foundation');
  await nav.getByRole('button',{name:locale==='uk'?'Місяць':'Month'}).click();
  const monthly=page.getByTestId('panchanga-calendar-range');
  await expect(monthly.getByTestId('panchanga-day-cell')).toHaveCount(30,{timeout:90000});
  await expect(monthly.getByTestId('p387-activity-select')).toHaveValue('foundation');
  await monthly.getByTestId('panchanga-day-cell').nth(3).click();
  await expect(page.getByTestId('p386-activity-select')).toHaveValue('foundation',{timeout:90000});
 });
}
test('P3.8.7 guest: protected personal endpoints are not called automatically and are never rendered as verified',async({page})=>{
 test.setTimeout(120000);
 const requested=[];
 page.on('request',r=>{
  if(r.url().includes('/api/v1/personal/panchanga/calendar')||
     r.url().includes('/api/v1/personal/panchanga/time-finder'))requested.push(r.url());
 });
 await page.goto('/uk/panchanga?date=2026-11-02');
 await page.getByRole('navigation',{name:'Період календаря'}).getByRole('button',{name:'Місяць'}).click();
 await expect(page.getByTestId('panchanga-day-cell')).toHaveCount(30,{timeout:90000});
 expect(requested).toEqual([]);
 await expect(page.getByTestId('p387-exact-windows')).toHaveCount(0);
 await expect(page.getByTestId('p387-sunrise')).toHaveCount(0);
});
test('P3.8.7 mobile 320px: Week and Month toolbars do not overflow page',async({page})=>{
 test.setTimeout(120000);
 await page.setViewportSize({width:320,height:740});
 await page.goto('/uk/panchanga?date=2026-11-02');
 const nav=page.getByRole('navigation',{name:'Період календаря'});
 await nav.getByRole('button',{name:'7 днів'}).click();
 await expect(page.getByTestId('p387-activity-select')).toBeVisible({timeout:90000});
 let dims=await page.evaluate(()=>({width:window.innerWidth,scroll:document.documentElement.scrollWidth}));
 expect(dims.scroll).toBeLessThanOrEqual(dims.width+2);
 await nav.getByRole('button',{name:'Місяць'}).click();
 await expect(page.getByTestId('panchanga-day-cell')).toHaveCount(30,{timeout:90000});
 dims=await page.evaluate(()=>({width:window.innerWidth,scroll:document.documentElement.scrollWidth}));
 expect(dims.scroll).toBeLessThanOrEqual(dims.width+2);
});

test('P3.8.7 real signed-in month 31/29 days, UI natal overlay, and second-owner isolation',async({page,browser},testInfo)=>{
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
 const nav=page.getByRole('navigation',{name:'Період календаря'});
 await nav.getByRole('button',{name:'Місяць'}).click();
 await expect(page.getByTestId('panchanga-day-cell')).toHaveCount(30,{timeout:90000});
 await page.getByRole('button',{name:'Показати особисті події'}).click();
 await expect(page.getByTestId('p387-personal-scope')).toBeVisible({timeout:120000});
 await expect(page.getByTestId('p387-sunrise')).toHaveCount(30);
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
