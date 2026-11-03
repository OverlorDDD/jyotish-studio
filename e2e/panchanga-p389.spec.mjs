import {test,expect} from '@playwright/test';
for(const locale of ['uk','en']){
 test('P389 '+locale+' real-time activity differentiation, form inputs and incomplete Muhurta truthfulness',async({page})=>{
  test.setTimeout(180000);
  await page.setViewportSize({width:390,height:844});
  await page.goto('/'+locale+'/panchanga?date=2026-11-03');
  const hub=page.getByTestId('panchanga-hub');
  const day=hub.getByTestId('p31-my-day');
  await expect(day).toBeVisible({timeout:90000});
  const hour=day.getByTestId('p389-time-select');
  await expect(hour).toBeVisible();
  const options=hour.locator('option');
  expect(await options.count()).toBeGreaterThan(30);
  const last=await options.last().getAttribute('value');
  expect(last).toMatch(/^2026-11-0[34]T/);
  await hour.selectOption(last);
  await expect(hour).toHaveValue(last);
  await expect(day.getByTestId('p389-action')).toBeVisible();
  const start=await day.getByTestId('p32-interpretation').innerText();
  const selector=day.getByTestId('p386-activity-select');
  await selector.selectOption('shop_opening');
  const shop=await day.getByTestId('p32-interpretation').innerText();
  expect(start).not.toEqual(shop);
  await expect(day.getByTestId('p389-shared-criteria')).toBeVisible();
  await day.getByRole('button',{name:locale==='uk'?'Стосунки':'Relationships',exact:true}).click();
  await selector.selectOption('first_date');
  await expect(day.getByTestId('p389-action')).toContainText(
   locale==='uk'?'аналогію':'analogy');
  const firstDate=await day.getByTestId('p32-headline').innerText();
  await selector.selectOption('wedding');
  await expect(day.getByTestId('p389-muhurta-checklist')).toBeVisible();
  const wedding=await day.getByTestId('p32-headline').innerText();
  expect(wedding).not.toEqual(firstDate);
  await expect(day.getByTestId('p389-muhurta-checklist')).toContainText(
   locale==='uk'?'21 доша':'21 doshas');
  const muhurtaLinks=day.getByTestId('p389-muhurta-checklist').getByRole('link');
  await expect(muhurtaLinks).toHaveCount(2);
  await expect(muhurtaLinks.first()).toBeVisible();
  await expect(muhurtaLinks.last()).toBeVisible();
  await expect(day).not.toContainText('Частина показників підтримує, інші потребують уваги');
  await expect(day).not.toContainText('Для цієї справи потрібна повна мухурта');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth))
   .toBeLessThanOrEqual(2);
  await page.setViewportSize({width:320,height:740});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth))
   .toBeLessThanOrEqual(2);
 });
}
