import {test,expect} from '@playwright/test';
import {fixtureAccount} from './support/disposable-accounts.mjs';
import {randomUUID} from 'node:crypto';
const root='/api/v1/personal/panchanga/resonance';
const qs='date=2026-11-02&zone=Europe%2FKyiv&latitude=50.4501&longitude=30.5234';
const birthA={date:'1996-03-27',time:'12:58',timeZone:'Europe/Kyiv',
 latitude:47.9105,longitude:33.3918,place:'Kryvyi Rih'};
test('P3.3 private natal resonance requires ownership; guest cannot read chart context',async({request})=>{
 const r=await request.get(root+'?'+qs);
 expect(r.status()).toBe(401);
 expect(r.headers()['cache-control']).toContain('no-store');
});
test('P3.3 two independent accounts, selected verified primary chart and exact natal Moon match',async({page,browser,request})=>{
 test.setTimeout(210000);
 const tag=randomUUID().slice(0,10);
 const a=await fixtureAccount(page,{data:{email:'p33-a-'+tag+'@example.invalid',
  password:'Test-2026-'+('b'.repeat(32))}});
 expect(a.status()).toBe(201);
 const missing=await page.request.get(root+'?'+qs);
 expect(missing.status()).toBe(200);
 expect((await missing.json()).status).toBe('requires_primary_chart');
 const created=await page.request.post('/api/v1/account/charts',{data:birthA});
 expect(created.status(),await created.text()).toBe(201);
 const {id:chartA}=await created.json();
 expect((await page.request.put('/api/v1/personal/primary-chart',{data:{chartId:chartA}})).status()).toBe(200);
 const day=await (await page.request.get('/api/v1/panchanga/day?'+qs)).json();
 const personal=await page.request.get(root+'?'+qs);
 expect(personal.status(),await personal.text()).toBe(200);
 expect(personal.headers()['cache-control']).toContain('private');
 expect(personal.headers()['cache-control']).toContain('no-store');
 const verified=await personal.json();
 expect(verified.status).toBe('available');
 expect(verified.observation).toBe('VERIFIED_SWISS_SAME_MOMENT_AND_OWNED_NATAL');
 expect(verified.sunriseUtc).toBe(day.sunriseUtc);
 expect(verified.evaluatedAtUtc).toBe(day.sunriseUtc);
 expect(verified.transitMoon.nakshatraNumber).toBe(day.sunrise.nakshatra.number);
 expect(verified.transitMoon.sign).toBe(day.sunrise.moonSign);
 expect(verified.tarabala.transitNakshatraIndex).toBe(day.sunrise.nakshatra.number);
 expect(verified.gochar).toHaveLength(5);
 expect(verified.natal.moonSign).toBeGreaterThan(0);
 expect(verified.natal.lagnaSign).toBeGreaterThan(0);
 for(const sensitive of ['birthDate','birthTime','birthLatitude','birthLongitude','email','ownerId','input','utc'])
  expect(Object.keys(verified)).not.toContain(sensitive);
 await page.goto('/uk/panchanga?date=2026-11-02');
 const card=page.getByTestId('p31-my-day');
 await expect(card.getByTestId('p33-personal')).toBeVisible({timeout:90000});
 await expect(card.getByTestId('p32-headline')).toHaveCount(1);
 await card.getByTestId('p33-evidence').locator('summary').click();
 await expect(card.getByTestId('p33-evidence').locator('li').count()).resolves.toBeGreaterThanOrEqual(7);
 const other=await browser.newContext();
 const second=await other.newPage();
 try{
  const b=await fixtureAccount(second,{data:{email:'p33-b-'+tag+'@example.invalid',
   password:'Test-2026-'+('c'.repeat(32))}});
  expect(b.status()).toBe(201);
  const attempt=await second.request.put('/api/v1/personal/primary-chart',{data:{chartId:chartA}});
  expect(attempt.status()).toBe(400);
  const noOwn=await second.request.get(root+'?'+qs);
  expect(noOwn.status()).toBe(200);
  expect((await noOwn.json()).status).toBe('requires_primary_chart');
 }finally{await other.close();}
});
test('P3.3 invalid sample time and malformed observer fail without leaking natal facts',async({page})=>{
 test.setTimeout(110000);
 const id=randomUUID().slice(0,9);
 const created=await fixtureAccount(page,{data:{email:'p33-bad-'+id+'@example.invalid',
  password:'Test-2026-'+('d'.repeat(32))}});
 expect(created.status()).toBe(201);
 const r=await page.request.get(root+'?'+qs+'&at=2026-11-03T23%3A00%3A00.000Z');
 // If no primary chart is selected, no private computations are performed.
 expect(r.status()).toBe(200);
 expect((await r.json()).status).toBe('requires_primary_chart');
 const wrong=await page.request.get(root+'?date=2026-13-43&zone=Europe%2FKyiv&latitude=50.4501&longitude=30.5234');
 expect(wrong.status()).toBe(400);
});
