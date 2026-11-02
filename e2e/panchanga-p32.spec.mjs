import {test,expect} from '@playwright/test';
for(const locale of ['uk','en']){
 test('P3.2 '+locale+' delivers one evidence-backed recommendation with all five limbs and Moon',async({page})=>{
  test.setTimeout(120000);
  await page.goto('/'+locale+'/panchanga?date=2026-11-02');
  const screen=page.getByTestId('p31-my-day');
  const advice=screen.getByTestId('p32-interpretation');
  await expect(advice).toBeVisible({timeout:90000});
  await expect(advice.getByTestId('p32-headline')).toBeVisible();
  await expect(advice).toContainText(locale==='uk'?'Астрологічна традиція':'Traditional calendar');
  await expect(advice).toContainText(locale==='uk'?'Обрана справа':'Planned activity');
  const details=screen.getByTestId('p32-evidence');
  await expect(details).not.toHaveAttribute('open');
  await details.locator('summary').click();
  await expect(details).toHaveAttribute('open');
  await expect(details.locator('li')).toHaveCount(7);
  for(const text of locale==='uk'?
   ['Місячний день','Накшатра','День тижня','Сонячно-місячна йога','Карана','Фаза Місяця','Раху-калам']:
   ['Lunar day','Nakshatra','Weekday','Sun–Moon Yoga','Karana','Moon phase','Rahu Kalam'])
   await expect(details).toContainText(text);
  const topics=screen.getByRole('group',{name:locale==='uk'?'Тема поради':'Advice topic'});
  await topics.getByRole('button',{name:locale==='uk'?'Гроші':'Money'}).click();
  await expect(advice).toContainText(locale==='uk'?'нову фінансову угоду':'new financial agreement');
  await expect(advice.getByTestId('p32-headline')).toHaveCount(1);
  await expect(screen.getByRole('link',{name:locale==='uk'?/натальну карту/:/birth chart/})).toBeVisible();
 });
}
test('P3.2 refuses corrupted traditional names instead of displaying invented advice',async({page})=>{
 test.setTimeout(120000);
 await page.route('**/api/v1/panchanga/day?**',async route=>{
  const reply=await route.fetch(),payload=await reply.json();
  payload.sunrise.yoga.name='CORRUPTED';
  if(payload.periods?.yoga?.length)payload.periods.yoga[0].value.name='CORRUPTED';
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
 });
 await page.goto('/uk/panchanga?date=2026-11-02');
 const screen=page.getByTestId('p31-my-day');
 await expect(screen).toBeVisible({timeout:90000});
 await expect(screen.getByRole('alert')).toContainText('Пораду не показано');
 await expect(screen.getByTestId('p32-interpretation')).toHaveCount(0);
});
