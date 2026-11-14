import {fixtureAccount} from './support/disposable-accounts.mjs';
import {test,expect} from '@playwright/test';

test('minimal Tarot expert inquiry uses dark form, saves without payment and reveals Telegram afterwards',async({page})=>{
 test.setTimeout(65000);
 const email='expert-inquiry-'+Date.now()+'-'+Math.random().toString(36).slice(2,7)+'@example.invalid';
 const account=await fixtureAccount(page,{
  data:{email,password:'A7-expert-test-only-password'}
 });
 expect(account.status()).toBe(201);
 await page.goto('/uk/tarot#human-readings');
 const form=page.locator('#human-readings');
 await expect(form.getByRole('heading',{name:'Коли питання надто важливе для автоматичного розкладу'})).toBeVisible();
 await expect(form).not.toContainText('$30');
 await expect(form).toContainText('коротку підказку');
 await expect(form.locator('a[href="https://t.me/Galaxiora"]')).toHaveCount(0);
 const question=form.getByLabel('Ваше питання');
 await question.fill('Я');
 const background=await question.evaluate(el=>getComputedStyle(el).backgroundColor);
 expect(background).not.toBe('rgb(255, 255, 255)');
 await form.getByRole('checkbox').check();
 await form.getByRole('button',{name:'Надіслати питання тарологу'}).click();
 await expect(form.getByText('Питання надіслано!')).toBeVisible();
 await expect(form.locator('a[href="https://t.me/Galaxiora"]')).toBeVisible();
 await expect(form).toContainText('зв’язатися з ним через контакти');
 await expect(form.locator('.as-expert-drafts')).toContainText('Надіслано тарологу');
 const rows=await page.request.get('/api/v1/reading-orders/questions');
 expect(rows.status()).toBe(200);
 const items=await rows.json();
 const saved=items.find(x=>x.question==='Я'&&x.expertSubmittedAt);
 expect(saved).toBeTruthy();
 const forbidden=await page.request.get('/api/v1/admin/expert-requests');
 expect(forbidden.status()).toBe(403);
 const deleted=await page.request.delete('/api/v1/reading-orders/questions/'+saved.id);
 expect(deleted.status()).toBe(200);
});
