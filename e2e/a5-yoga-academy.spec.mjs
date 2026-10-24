import {test,expect} from '@playwright/test';
test('Yoga hub: four practices, real box pacing UI and locale-preserving deep links',async({page})=>{
 await page.goto('/uk/yoga');
 await expect(page.locator('[data-practice]')).toHaveCount(4);
 await page.locator('[data-practice="gentle-breath"]').click();
 await expect(page).toHaveURL(/\/uk\/yoga\/gentle-breath$/);
 await expect(page.getByRole('button',{name:'Поїхали!'})).toBeVisible();
 await expect(page.getByTestId('breathing-square')).toHaveAttribute('data-phase','inhale');
 await page.locator('.as-language a[lang="en"]').click();
 await expect(page).toHaveURL(/\/en\/yoga\/gentle-breath$/);
 await expect(page.getByRole('button',{name:"Let's go!"})).toBeVisible();
});
test('Box 4-4-4-4: real phase timings, marker and distinct hold explanations',async({page})=>{
 await page.goto('/uk/yoga/gentle-breath');
 await expect(page.getByRole('timer')).toHaveText('04:00');
 await page.getByTestId('pattern-box').click();
 await page.getByRole('button',{name:'Поїхали!'}).click();
 await expect(page.getByTestId('breath-phase')).toHaveText('Вдих');
 await expect(page.getByTestId('breathing-square')).toHaveAttribute('data-phase','inhale');
 await expect(page.getByTestId('breathing-square')).toHaveAttribute('data-phase','holdIn',{timeout:9000});
 await expect(page.getByTestId('breath-phase')).toContainText('Пауза після вдиху');
 await expect(page.locator('.as-breath-readout')).toContainText('Не набирай додаткового повітря');
 await expect(page.getByTestId('breathing-square')).toHaveAttribute('data-phase','exhale',{timeout:9000});
 await expect(page.getByTestId('breathing-square')).toHaveAttribute('data-phase','holdOut',{timeout:9000});
 await expect(page.locator('.as-breath-readout')).toContainText('М’яко зачекай');
 await page.getByRole('button',{name:'Зупинити'}).click();
 await expect(page.getByRole('heading',{name:'Сесію зупинено'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Усі цикли завершено'})).toHaveCount(0);
 await page.getByRole('button',{name:'Ще раз'}).click();
 await expect(page.getByRole('button',{name:'Поїхали!'})).toBeVisible();
});
test('Alternative breath modes contain no holds; pause/resume and no false completion',async({page})=>{
 await page.goto('/uk/yoga/gentle-breath');
 await page.getByTestId('pattern-equal').click();
 await page.getByRole('button',{name:'Поїхали!'}).click();
 await expect(page.getByTestId('breath-phase')).toHaveText('Вдих');
 await page.getByRole('button',{name:'Пауза',exact:true}).click();
 const first=await page.getByRole('timer').textContent();
 await page.waitForTimeout(450);
 expect(await page.getByRole('timer').textContent()).toBe(first);
 await page.getByRole('button',{name:'Продовжити'}).click();
 await expect(page.getByTestId('breathing-square')).toHaveAttribute('data-phase','exhale',{timeout:9000});
 await page.getByRole('button',{name:'Зупинити'}).click();
 await expect(page.getByRole('heading',{name:'Сесію зупинено'})).toBeVisible();
 await page.getByRole('button',{name:'Ще раз'}).click();
 await page.getByTestId('pattern-extended').click();
 await page.getByRole('button',{name:'Поїхали!'}).click();
 await expect(page.getByTestId('breath-phase')).toHaveText('Вдих');
});
test('Mindfulness and evening reflection have no timer or fake exercise completion',async({page})=>{
 for(const path of ['/uk/yoga/five-senses','/uk/yoga/evening-unwind']){
  await page.goto(path);
  await expect(page.getByRole('timer')).toHaveCount(0);
  await expect(page.locator('.as-reflection-session')).toBeVisible();
  const count=await page.locator('.as-session-progress progress').getAttribute('max');
  for(let i=1;i<Number(count);i++)await page.getByRole('button',{name:'Наступна підказка'}).click();
  await page.getByRole('button',{name:'Усі підказки переглянуто'}).click();
  await expect(page.getByRole('heading',{name:'Усі підказки переглянуто'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Практику завершено'})).toHaveCount(0);
 }
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

test('Breathing modes can switch while running without overlapping clocks',async({page})=>{
 await page.goto('/uk/yoga');
 await page.getByTestId('pattern-box').click();
 await page.getByTestId('breath-start').click();
 await expect(page.getByRole('button',{name:'Пауза',exact:true})).toBeVisible();
 await page.getByTestId('pattern-equal').click();
 await expect(page.getByTestId('pattern-equal')).toHaveAttribute('aria-pressed','true');
 await expect(page.getByTestId('pattern-box')).toHaveAttribute('aria-pressed','false');
 await expect(page.getByTestId('breath-start')).toBeVisible();
 await expect(page.getByRole('timer')).not.toHaveText('00:00');
 await page.getByTestId('breath-start').click();
 await expect(page.getByRole('button',{name:'Пауза',exact:true})).toBeVisible();
 await page.getByTestId('pattern-extended').click();
 await expect(page.getByTestId('breath-start')).toBeVisible();
 await expect(page.getByTestId('breathing-square')).toHaveAttribute('data-phase','inhale');
});
