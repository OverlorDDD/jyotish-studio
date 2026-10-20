import {test,expect} from '@playwright/test';
import {PrismaClient} from '@prisma/client';
test('A7 applicant → private review → verified public listing → suspension',async({page,browser})=>{
 test.setTimeout(100000);
 const db=new PrismaClient();
 const tag=Date.now().toString(36)+Math.random().toString(36).slice(2,7);
 const email='expert-'+tag+'@example.invalid';
 const adminEmail='expert-admin-'+tag+'@example.invalid';
 const ctx=await browser.newContext({baseURL:'http://127.0.0.1:3000'});
 try{
  const applicant=await page.request.post('/api/v1/account/register',{data:{email,password:'Expert-test-password-2026'}});
  expect(applicant.status()).toBe(201);
  await db.user.update({where:{email},data:{role:'EXPERT'}});
  await page.goto('/uk/experts');
  await expect(page.getByRole('heading',{name:'Заявка на профіль'})).toBeVisible();
  const displayName='Test expert '+tag;
  await page.getByLabel('Публічне ім’я').fill(displayName);
  await page.getByLabel('Опис українською').fill('Традиційний досвід читання Джйотіш та повага до особистих запитань клієнта у кожній консультації.');
  await page.getByLabel('Опис англійською').fill('Traditional study of Jyotish and care for people seeking meaningful chart interpretation.');
  await page.getByRole('button',{name:'Надіслати заявку'}).click();
  await expect(page.getByTestId('expert-review-status')).toHaveText('SUBMITTED');
  await expect(page.getByRole('heading',{name:displayName})).toHaveCount(0);
  const adminRegistration=await ctx.request.post('/api/v1/account/register',{
   data:{email:adminEmail,password:'Admin-test-password-2026'}});
  expect(adminRegistration.status()).toBe(201);
  await db.user.update({where:{email:adminEmail},data:{role:'ADMIN'}});
  const ap=await ctx.newPage();
  await ap.goto('/uk/experts');
  await expect(ap.getByRole('heading',{name:'Заявки на перевірку'})).toBeVisible();
  const review=ap.locator('.as-expert-review',{hasText:displayName});
  await expect(review).toBeVisible();
  await review.getByRole('button',{name:'Підтвердити профіль'}).click();
  await expect(review).toContainText('VERIFIED');
  await page.reload();
  await expect(page.getByRole('heading',{name:displayName})).toBeVisible();
  await expect(page.locator('.as-expert-card',{hasText:displayName})).toContainText('Профіль перевірений');
  await review.getByRole('button',{name:'Призупинити публікацію'}).click();
  await expect(review).toContainText('SUSPENDED');
  await page.reload();
  await expect(page.getByRole('heading',{name:displayName})).toHaveCount(0);
 }finally{await ctx.close();await db.$disconnect();}
});
