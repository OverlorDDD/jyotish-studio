import {test,expect} from '@playwright/test';

test('minimal Tarot expert inquiry uses dark form, saves without payment and reveals Telegram afterwards',async({page})=>{
 test.setTimeout(65000);
 const email='expert-inquiry-'+Date.now()+'-'+Math.random().toString(36).slice(2,7)+'@example.invalid';
 const account=await page.request.post('/api/v1/account/register',{
  data:{email,password:'A7-expert-test-only-password'}
 });
 expect(account.status()).toBe(201);
 await page.goto('/uk/tarot#human-readings');
 const form=page.locator('#human-readings');
 await expect(form.getByRole('heading',{name:'Запитай справжнього таролога'})).toBeVisible();
 await expect(form.locator('a[href="https://t.me/Galaxiora"]')).toHaveCount(0);
 const question=form.getByLabel('Головне запитання');
 await question.fill('Я');
 const background=await question.evaluate(el=>getComputedStyle(el).backgroundColor);
 expect(background).not.toBe('rgb(255, 255, 255)');
 await form.getByRole('checkbox').check();
 await form.getByRole('button',{name:'Надіслати запит експерту'}).click();
 await expect(form.getByText('Твоє звернення прийнято!')).toBeVisible();
 await expect(form.locator('a[href="https://t.me/Galaxiora"]')).toBeVisible();
 await expect(form).toContainText('зв’яжися з ним через контакти');
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
