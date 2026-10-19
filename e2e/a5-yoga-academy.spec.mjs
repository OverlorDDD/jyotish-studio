import {test,expect} from '@playwright/test';
test('Yoga hub: four bilingual live practices and language-preserving deep links',async({page})=>{
 await page.goto('/uk/yoga');
 await expect(page.getByRole('heading',{level:1})).toContainText('Повернись');
 await expect(page.locator('[data-practice]')).toHaveCount(4);
 await page.locator('[data-practice="gentle-breath"]').click();
 await expect(page).toHaveURL(/\/uk\/yoga\/gentle-breath$/);
 await expect(page.getByRole('heading',{level:2,name:'Влаштуйся зручно'})).toBeVisible();
 await page.locator('.as-language a[lang="en"]').click();
 await expect(page).toHaveURL(/\/en\/yoga\/gentle-breath$/);
 await expect(page.getByRole('heading',{level:2,name:'Settle comfortably'})).toBeVisible();
});
test('Yoga player: start/pause, untimed steps and completion without account',async({page})=>{
 await page.goto('/uk/yoga/gentle-breath');
 await expect(page.getByRole('timer')).toHaveText('00:30');
 await page.getByRole('button',{name:/Почати \/ продовжити/}).click();
 await expect.poll(async()=>page.getByRole('timer').textContent()).not.toBe('00:30');
 await page.getByRole('button',{name:'Пауза'}).click();
 await page.getByLabel('Без таймера').check();
 for(let i=0;i<3;i++)await page.getByRole('button',{name:/Наступний крок/}).click();
 await expect(page.getByRole('heading',{level:2,name:'Заверши паузу'})).toBeVisible();
 await page.getByRole('button',{name:'Завершити'}).click();
 await expect(page.getByRole('heading',{level:2,name:'Практику завершено'})).toBeVisible();
 await page.getByRole('button',{name:'Повторити'}).click();
 await expect(page.getByRole('heading',{level:2,name:'Влаштуйся зручно'})).toBeVisible();
});
test('Academy hub: seven original lessons, topic anchors, deep link EN/UK',async({page})=>{
 await page.goto('/uk/learn');
 await expect(page.locator('[data-lesson]')).toHaveCount(7);
 await page.getByRole('link',{name:'Символіка Таро',exact:true}).click();
 await expect(page).toHaveURL(/#topic-tarot$/);
 await page.locator('[data-lesson="sidereal-and-tropical"]').click();
 await expect(page).toHaveURL(/\/uk\/learn\/sidereal-and-tropical$/);
 await expect(page.locator('.as-lesson-section')).toHaveCount(3);
 await page.locator('.as-language a[lang="en"]').click();
 await expect(page).toHaveURL(/\/en\/learn\/sidereal-and-tropical$/);
 await expect(page.getByRole('heading',{level:1})).toContainText('Sidereal');
});
test('Academy knowledge check: wrong answer, retry and correct explanation',async({page})=>{
 await page.goto('/uk/learn/sidereal-and-tropical');
 const quiz=page.locator('.as-academy-quiz');
 await quiz.getByLabel('Швидкість руху Місяця').check();
 await quiz.getByRole('button',{name:'Перевірити відповідь'}).click();
 await expect(quiz.getByRole('status')).toContainText('Спробуй ще раз');
 await quiz.getByRole('button',{name:'Повторити'}).click();
 await quiz.getByLabel('Зміщення між системами відліку').check();
 await quiz.getByRole('button',{name:'Перевірити відповідь'}).click();
 await expect(quiz.getByRole('status')).toContainText('Правильно');
 await expect(quiz).toContainText('Аянамша');
});
test('A5 SEO and 360px layout: hubs and all lesson/practice details indexed without overflow',async({page,request})=>{
 const xml=await (await request.get('/sitemap.xml')).text();
 for(const path of ['/uk/yoga/gentle-breath','/en/yoga/evening-unwind',
  '/uk/learn/sidereal-and-tropical','/en/learn/yoga-roots-and-safety']){
  expect(xml).toContain('https://galaxiora.example'+path);
 }
 await page.setViewportSize({width:360,height:780});
 for(const path of ['/uk/yoga','/uk/learn','/uk/yoga/desk-mobility','/en/learn/tarot-questions']){
  await page.goto(path);
  await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute('content',/noindex/);
  const excess=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(excess,path+' horizontal overflow').toBeLessThanOrEqual(2);
 }
 const notFound=await request.get('/uk/yoga/unknown-program');
 expect(notFound.status()).toBe(404);
});
