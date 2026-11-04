import {fixtureAccount} from './support/disposable-accounts.mjs';
import {test,expect} from '@playwright/test';
import {PrismaClient} from '@prisma/client';

test('A7: logged-in client can save, privately review and remove private pre-consultation Tarot question',async({page})=>{
 test.setTimeout(85000);
 const id='expert-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);
 const email=id+'@example.invalid';
 const signed=await fixtureAccount(page,{data:{email,password:'A7-expert-test-only-password'}});
 expect(signed.status()).toBe(201);
 const draft={topic:'career',question:'Який напрямок зараз для мене найважливіший?',context:'Я розглядаю зміну професії й хочу уточнити свої пріоритети.',privacyConsent:true};
 const created=await page.request.post('/api/v1/reading-orders/questions',{data:draft});
 expect(created.status()).toBe(201);
 const row=await created.json();
 const my=await page.request.get('/api/v1/reading-orders/questions');
 expect((await my.json()).some(x=>x.id===row.id)).toBe(true);
 const noPayment=await created.json();
 expect(noPayment.checkoutAvailable).toBe(false);
 expect(noPayment.status).toBe('SAVED_PRIVATE');
 const url='/uk/tarot';
 await page.goto(url);
 const list=page.locator('.as-expert-drafts');
 await expect(list).toBeVisible();
 await expect(list).toContainText(draft.question);
 await list.getByRole('button',{name:'Видалити запитання'}).first().click();
 await expect(list).not.toContainText(draft.question);
 const check=await page.request.get('/api/v1/reading-orders/questions');
 expect((await check.json()).some(x=>x.id===row.id)).toBe(false);
});
