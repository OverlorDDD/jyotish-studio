import {test,expect} from '@playwright/test';
import {randomUUID} from 'node:crypto';
test('GalaxiCom compact UX and focused creation, understandable moderation, visible helpful votes',async({page})=>{
 test.setTimeout(95000);
 if(!process.env.DATABASE_URL)test.skip();
 const email='com-ux-'+randomUUID().slice(0,12)+'@example.invalid',
 password='GalaxiCom-UX-valid-password-2026';
 const {PrismaClient}=await import('@prisma/client');
 const db=new PrismaClient();let userId='';
 try{
  const registration=await page.request.post('/api/v1/account/register',{data:{email,password}});
  expect(registration.status()).toBe(201);
  userId=(await registration.json()).user.id;
  await page.goto('/uk/community');
  const toolbar=page.getByTestId('com-compact-toolbar');
  await expect(toolbar).toBeVisible();
  await expect(toolbar.getByLabel('Публічний псевдонім')).toBeVisible();
  await expect(toolbar.getByText('Мої закладки')).toBeVisible();
  await expect(toolbar.getByText('Мій профіль спільноти')).toBeVisible();
  const form=page.getByTestId('com-composer');
  await page.getByRole('button',{name:'Створити тему'}).click();
  await expect(form).toBeVisible();
  await expect(form.getByRole('heading',{name:'Створити тему'})).toBeFocused();
  const frame=await form.boundingBox();
  expect(frame).toBeTruthy();
  const rail=await page.getByTestId('com-compact-toolbar').boundingBox();
  expect(rail).toBeTruthy();
  expect(frame.width).toBeGreaterThan(rail.width*0.8); // Full page editor, never a narrow flex item
  const textarea=await form.locator('textarea').boundingBox();
  expect(textarea.width).toBeGreaterThan(frame.width*0.65);
  const title=form.getByRole('textbox',{name:'Назва теми'});
  expect(await title.getAttribute('maxlength')).toBe('160');
  expect(await form.locator('textarea').getAttribute('maxlength')).toBe('8000');
  await title.fill('Мій короткий тест GalaxiCom');
  await form.locator('textarea').fill('Це окреме тестове обговорення для перевірки навігації.');
  await form.getByRole('button',{name:'Опублікувати'}).click();
  await expect(page.getByTestId('com-thread')).toBeVisible();
  await expect(page.getByText('Кнопка «Корисно» є під кожною відповіддю.',{exact:false})).toBeVisible();
  await db.user.update({where:{id:userId},data:{role:'SUPPORT'}});
  await page.reload();
  await page.getByRole('button',{name:/Черга модерації/}).click();
  const mod=page.getByTestId('com-mod-queue');
  await expect(mod.getByText('Скарги від учасників')).toBeVisible();
  await expect(mod.getByText('Перевір скаргу та відкрий пов’язану публікацію.',{exact:false})).toBeVisible();
  await expect(mod.getByRole('heading',{name:'Скарги від учасників'})).toBeVisible();
 }finally{
  if(userId){await db.comThread.deleteMany({where:{authorId:userId}});await db.user.deleteMany({where:{id:userId}})}
  await db.$disconnect();
 }
});
