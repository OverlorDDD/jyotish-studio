import {test,expect} from '@playwright/test';
import {PrismaClient} from '@prisma/client';

test('A6 real editor journey: bilingual draft, admin review, live article and archive',async({page})=>{
 test.setTimeout(90000);
 const prisma=new PrismaClient();
 const slug='a6-browser-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);
 const email=slug+'@example.invalid';
 try{
  const signed=await page.request.post('/api/v1/account/register',{data:{email,password:'A6-browser-only-password-2026'}});
  expect(signed.status()).toBe(201);
  await prisma.user.update({where:{email},data:{role:'ADMIN'}});
  await page.goto('/uk/editorial');
  await expect(page.getByRole('heading',{name:'Керування матеріалами'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Створити чернетку'})).toBeVisible();
  await page.getByLabel('URL-адреса (латиницею)').fill(slug);
  await page.getByLabel('Назва',{exact:true}).fill('Практика уважного читання');
  await page.getByLabel('Title',{exact:true}).fill('A mindful reading practice');
  await page.getByLabel('Короткий опис').fill('Новий навчальний матеріал, який пояснює, як читати усвідомлено й спокійно.');
  await page.getByLabel('Short description').fill('A practical learning article explaining a gentle approach to attentive reading.');
  await page.getByLabel('Текст статті (абзаци через порожній рядок)').fill(
   'Ця стаття присвячена уважному читанню і пропонує зручний спосіб вивчення традицій без обіцянок передбачення. '.repeat(3));
  await page.getByLabel('Article (paragraphs separated by blank lines)').fill(
   'This article explores attentive reading and offers a measured introduction to cultural traditions, without promises of prediction. '.repeat(3));
  await page.getByLabel('Запитання тесту').fill('Навіщо потрібне уважне читання тексту?');
  await page.getByLabel('Quiz question').fill('Why can attentive reading be useful?');
  await page.getByLabel('Три варіанти (кожен із нового рядка)').fill('Для кращого розуміння\n\nДля діагнозу\n\nДля гарантій\n');
  await page.getByLabel('Three choices (one per line)').fill('To improve understanding\n\nTo diagnose\n\nTo guarantee outcomes\n');
  await page.getByLabel('Пояснення відповіді').fill('Так!');
  await page.getByLabel('Answer explanation').fill('Yes!');
  await expect(page.getByTestId('quiz-count-choicesUk')).toContainText('3 з 3');
  await expect(page.getByTestId('quiz-count-choicesEn')).toContainText('3 з 3');
  await page.getByRole('button',{name:'Створити чернетку'}).click();
  await expect(page.getByRole('status')).toContainText('Чернетку збережено');
  expect((await page.request.get('/api/v1/content/ACADEMY/'+slug)).status()).toBe(404);
  await page.getByRole('button',{name:'Надіслати на перевірку'}).click();
  await expect(page.locator('.as-editorial-pill')).toHaveText('IN_REVIEW');
  await page.getByRole('button',{name:'Схвалити',exact:true}).click();
  await expect(page.locator('.as-editorial-pill')).toHaveText('APPROVED');
  await page.getByRole('button',{name:'Опублікувати'}).click();
  await expect(page.locator('.as-editorial-pill')).toHaveText('PUBLISHED');
  await page.getByRole('button',{name:'Історія версій'}).click();
  await expect(page.locator('.as-editorial-history p')).toHaveCount(4);
  await page.goto('/uk/learn');
  await expect(page.locator('[data-published="'+slug+'"]')).toBeVisible();
  await page.locator('[data-published="'+slug+'"]').click();
  await expect(page.getByRole('heading',{level:1,name:'Практика уважного читання'})).toBeVisible();
  await page.locator('.as-language a[lang="en"]').click();
  await expect(page).toHaveURL(new RegExp('/en/learn/'+slug+'$'));
  await expect(page.getByRole('heading',{level:1,name:'A mindful reading practice'})).toBeVisible();
  await page.goto('/uk/editorial');
  await page.locator('.as-editorial-item',{hasText:slug}).click();
  await page.getByRole('button',{name:'Зняти з публікації'}).click();
  await expect(page.locator('.as-editorial-pill')).toHaveText('ARCHIVED');
  expect((await page.request.get('/api/v1/content/ACADEMY/'+slug)).status()).toBe(404);
 }finally{await prisma.$disconnect();}
});

test('A6 Yoga: new guide saves without Safety notice; no required notice field',async({page})=>{
 test.setTimeout(70000);
 const prisma=new PrismaClient();
 const slug='a6-yoga-no-safety-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);
 const email=slug+'@example.invalid';
 try{
  const signed=await page.request.post('/api/v1/account/register',{data:{email,password:'A6-browser-only-password-2026'}});
  expect(signed.status()).toBe(201);
  await prisma.user.update({where:{email},data:{role:'ADMIN'}});
  await page.goto('/uk/editorial');
  await page.getByLabel('Тип матеріалу').selectOption('YOGA');
  await expect(page.getByLabel('Safety notice')).toHaveCount(0);
  await expect(page.getByLabel('Застереження щодо безпеки')).toHaveCount(0);
  await page.getByLabel('URL-адреса (латиницею)').fill(slug);
  await page.getByLabel('Назва',{exact:true}).fill('Практика зосередженості');
  await page.getByLabel('Title',{exact:true}).fill('A focus exercise');
  await page.getByLabel('Короткий опис').fill('Увага до навколишніх відчуттів та власного темпу.');
  await page.getByLabel('Short description').fill('Gentle awareness of sensations and your own pace.');
  await page.getByLabel('Кроки (через порожній рядок)').fill('Сядь зручно.\n\nЗверни увагу на навколишні звуки.');
  await page.getByLabel('Steps (separate by a blank line)').fill('Sit comfortably.\n\nListen to sounds around you.');
  await page.getByRole('button',{name:'Створити чернетку'}).click();
  await expect(page.getByRole('status')).toContainText('Чернетку збережено');
  const data=await page.request.get('/api/v1/editorial/entries');
  const match=(await data.json()).find(x=>x.slug===slug);
  expect(match.document.safety).toBeUndefined();
  await page.getByRole('button',{name:'Надіслати на перевірку'}).click();
  await page.getByRole('button',{name:'Схвалити',exact:true}).click();
  await page.getByRole('button',{name:'Опублікувати'}).click();
  await page.goto('/uk/yoga');
  await expect(page.locator('[data-published="'+slug+'"]')).toBeVisible();
 }finally{await prisma.$disconnect();}
});
