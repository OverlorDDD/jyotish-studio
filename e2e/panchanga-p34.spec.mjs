import {test,expect} from '@playwright/test';
import {fixtureAccount} from './support/disposable-accounts.mjs';
import {randomUUID} from 'node:crypto';
const path='/api/v1/personal/panchanga/timing';
const qs='date=2026-11-02&zone=Europe%2FKyiv&latitude=50.4501&longitude=30.5234';
test('P3.4 private endpoint is unavailable to unauthenticated visitors',async({request})=>{
 const response=await request.get(path+'?'+qs);
 expect(response.status()).toBe(401);
 expect(response.headers()['cache-control']).toContain('no-store');
});
for(const locale of ['uk','en']){
 test('P3.4 '+locale+' shows change-point windows without a duplicate daily verdict',async({page})=>{
  test.setTimeout(150000);
  await page.goto('/'+locale+'/panchanga?date=2026-11-02');
  const card=page.getByTestId('p31-my-day');
  await expect(card.getByTestId('p32-headline')).toHaveCount(1,{timeout:90000});
  const timing=card.getByTestId('p34-timing');
  const button=timing.getByRole('button',{name:locale==='uk'?'Показати години':'Show time windows'});
  await expect(button).toHaveAttribute('aria-expanded','false');
  await button.click();
  await expect(timing.getByTestId('p34-expanded')).toBeVisible();
  await expect(timing.getByTestId('p34-windows').locator('li').first()).toBeVisible();
  await expect(timing.getByTestId('p34-scope')).toContainText(
   locale==='uk'?'Загальна шкала':'General timeline');
  await expect(card.getByTestId('p32-headline')).toHaveCount(1);
  await card.getByRole('button',{name:locale==='uk'?'Поїздки':'Travel'}).click();
  await expect(timing.getByTestId('p34-alternative')).toBeVisible();
 });
}

test('P3.4 private timeline uses selected verified chart and isolates a second account',async({page,browser})=>{
 test.setTimeout(240000);
 const id=randomUUID().slice(0,8);
 const a=await fixtureAccount(page,{data:{email:'p34-a-'+id+'@example.invalid',
  password:'P34-fixture-'+id+'-test-passphrase'}});
 expect(a.status()).toBe(201);
 const missing=await page.request.get(path+'?'+qs);
 expect((await missing.json()).status).toBe('requires_primary_chart');
 const created=await page.request.post('/api/v1/account/charts',{data:{
  date:'1996-03-27',time:'12:58',timeZone:'Europe/Kyiv',
  latitude:47.9105,longitude:33.3918,place:'Kryvyi Rih'}});
 expect(created.status(),await created.text()).toBe(201);
 const chart=await created.json();
 expect((await page.request.put('/api/v1/personal/primary-chart',{data:{chartId:chart.id}})).status()).toBe(200);
 const privateResponse=await page.request.get(path+'?'+qs);
 expect(privateResponse.status(),await privateResponse.text()).toBe(200);
 expect(privateResponse.headers()['cache-control']).toContain('no-store');
 const result=await privateResponse.json();
 expect(result.version).toBe('private-time-guidance-p34');
 expect(result.status).toBe('available');
 expect(result.samples.length).toBeGreaterThan(1);
 await page.goto('/uk/panchanga?date=2026-11-02');
 const timing=page.getByTestId('p34-timing');
 await expect(timing).toBeVisible({timeout:90000});
 await timing.getByRole('button',{name:'Показати години'}).click();
 await expect(timing.getByTestId('p34-scope')).toContainText('Персональна шкала',{timeout:120000});
 const secondContext=await browser.newContext();
 try{
  const other=await secondContext.newPage();
  const b=await fixtureAccount(other,{data:{email:'p34-b-'+id+'@example.invalid',
   password:'P34-fixture-'+id+'-other-passphrase'}});
  expect(b.status()).toBe(201);
  const adoption=await other.request.put('/api/v1/personal/primary-chart',{data:{chartId:chart.id}});
  expect(adoption.status()).toBe(400);
  const check=await other.request.get(path+'?'+qs);
  expect((await check.json()).status).toBe('requires_primary_chart');
 }finally{await secondContext.close();}
});
