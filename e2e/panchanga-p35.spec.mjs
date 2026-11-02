import {test,expect} from '@playwright/test';
import {fixtureAccount} from './support/disposable-accounts.mjs';
import {randomUUID} from 'node:crypto';
const root='/api/v1/personal/panchanga/calendar';
const qs='start=2026-11-02&days=7&zone=Europe%2FKyiv&latitude=50.4501&longitude=30.5234';
test('P3.5 guest cannot access owner calendar, no public cache',async({request})=>{
 const res=await request.get(root+'?'+qs);
 expect(res.status()).toBe(401);
 expect(res.headers()['cache-control']).toContain('no-store');
});
for(const locale of ['uk','en']){
 test('P3.5 '+locale+' switches 7/30, shows all sunrise cards and opens exact P3.4 day',async({page})=>{
  test.setTimeout(180000);
  await page.goto('/'+locale+'/panchanga?date=2026-11-02');
  const calendarTab=page.getByRole('button',{name:locale==='uk'?'Мій календар 7/30':'My 7/30 calendar'});
  await calendarTab.click();
  const c=page.getByTestId('p35-calendar');
  await expect(c).toBeVisible();
  await expect(c.getByTestId('p35-guest')).toBeVisible({timeout:90000});
  await expect(c.getByTestId('p35-scope')).toContainText(
   locale==='uk'?'Загальний астрономічний':'General astronomical');
  await expect(c.getByTestId('p35-days').locator('article')).toHaveCount(7);
  await c.getByRole('button',{name:'30 '+(locale==='uk'?'днів':'days')}).click();
  await expect(c.getByTestId('p35-days').locator('article')).toHaveCount(30,{timeout:90000});
  await c.getByRole('button',{name:locale==='uk'?'Поїздки':'Travel'}).click();
  await expect(c.getByTestId('p35-days').locator('article')).toHaveCount(30);
  await c.getByRole('button',{name:locale==='uk'?'Відкрити день і точні години':
   'Open day and exact hours'}).first().click();
  await expect(page.getByTestId('p31-my-day')).toBeVisible({timeout:90000});
  await expect(page.getByTestId('p34-timing')).toBeVisible();
  await expect(page.getByTestId('p32-headline')).toHaveCount(1);
 });
}
test('P3.5 exact owner chart selected, 7/30 verified API and other-user isolation',async({page,browser})=>{
 test.setTimeout(270000);
 const id=randomUUID().slice(0,8);
 const a=await fixtureAccount(page,{data:{email:'p35-a-'+id+'@example.invalid',
  password:'P35-fixture-'+id+'-secret-example'}});
 expect(a.status()).toBe(201);
 const missing=await page.request.get(root+'?'+qs);
 expect(missing.status()).toBe(200);
 expect((await missing.json()).status).toBe('requires_primary_chart');
 const created=await page.request.post('/api/v1/account/charts',{data:{
  date:'1996-03-27',time:'12:58',timeZone:'Europe/Kyiv',
  latitude:47.9105,longitude:33.3918,place:'Kryvyi Rih'}});
 expect(created.status(),await created.text()).toBe(201);
 const {id:chartId}=await created.json();
 expect((await page.request.put('/api/v1/personal/primary-chart',{
  data:{chartId}})).status()).toBe(200);
 for(const days of [7,30]){
  const q=qs.replace('days=7','days='+days);
  const reply=await page.request.get(root+'?'+q,{timeout:120000});
  expect(reply.status(),await reply.text()).toBe(200);
  expect(reply.headers()['cache-control']).toContain('private');
  expect(reply.headers()['cache-control']).toContain('no-store');
  const info=await reply.json();
  expect(info.status).toBe('available');
  expect(info.observation).toBe('OWNER_VERIFIED_SWISS_AT_EACH_LOCAL_SUNRISE');
  expect(info.range.days).toHaveLength(days);
  expect(info.personal.days).toHaveLength(days);
  expect(info.personal.events).toBeInstanceOf(Array);
  for(const sensitive of ['birthDate','birthTime','birthLatitude','birthLongitude','ownerId','email','input'])
   expect(Object.keys(info)).not.toContain(sensitive);
 }
 await page.goto('/uk/panchanga?date=2026-11-02');
 await page.getByRole('button',{name:'Мій календар 7/30'}).click();
 await expect(page.getByTestId('p35-scope')).toContainText('Персональна оцінка',
  {timeout:120000});
 await expect(page.getByTestId('p35-days').locator('article')).toHaveCount(7);
 const otherCtx=await browser.newContext();
 try{
  const other=await otherCtx.newPage();
  const b=await fixtureAccount(other,{data:{email:'p35-b-'+id+'@example.invalid',
   password:'P35-fixture-'+id+'-secondary-example'}});
  expect(b.status()).toBe(201);
  const denied=await other.request.put('/api/v1/personal/primary-chart',{data:{chartId}});
  expect(denied.status()).toBe(400);
  const second=await other.request.get(root+'?'+qs);
  expect((await second.json()).status).toBe('requires_primary_chart');
 }finally{await otherCtx.close();}
});
test('P3.5 rejects invalid days and locations before a personalized calculation',async({page})=>{
 test.setTimeout(90000);
 const id=randomUUID().slice(0,8);
 const a=await fixtureAccount(page,{data:{email:'p35-invalid-'+id+'@example.invalid',
  password:'P35-invalid-'+id+'-test-example'}});
 expect(a.status()).toBe(201);
 for(const q of [qs.replace('days=7','days=31'),
  qs.replace('2026-11-02','2026-13-99'),qs.replace('latitude=50.4501','latitude=91')]){
  const response=await page.request.get(root+'?'+q);
  expect(response.status()).toBe(400);
 }
});
