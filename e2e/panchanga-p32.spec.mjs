import {test,expect} from '@playwright/test';
for(const locale of ['uk','en']){
 test('P3.7 '+locale+' five live limb cards with class, cause, thematic use and references',async({page})=>{
  test.setTimeout(120000);
  await page.goto('/'+locale+'/panchanga?date=2026-11-02');
  const screen=page.getByTestId('p31-my-day'),advice=screen.getByTestId('p32-interpretation');
  await expect(advice).toBeVisible({timeout:90000});
  await expect(advice.getByTestId('p32-headline')).toHaveCount(1);
  await expect(advice).toContainText(locale==='uk'?'Загальна Панчанга · без натальної оцінки':'General Panchanga · no natal comparison');
  await expect(advice).toContainText(locale==='uk'?'Обрана справа':'Planned activity');
  const cards=screen.getByTestId('p32-evidence');
  await expect(cards.locator('article')).toHaveCount(5);
  for(const x of ['tithi','nakshatra','vara','yoga','karana'])
   await expect(cards.locator('article[data-factor="'+x+'"]')).toBeVisible();
  await expect(cards.locator('a')).toHaveCount(5);
  await expect(cards.locator('article[data-factor="nakshatra"]')).toContainText(
   locale==='uk'?/Дхрува|Чара|Угра|Мішра|Кшипра|Мріду|Тікшна/:/Dhruva|Chara|Ugra|Mishra|Kshipra|Mridu|Tikshna/);
  const first=await cards.locator('article[data-factor="nakshatra"]').innerText();
  await screen.getByRole('group',{name:locale==='uk'?'Тема поради':'Advice topic'})
   .getByRole('button',{name:locale==='uk'?'Поїздки':'Travel'}).click();
  await expect(advice).toContainText(locale==='uk'?'нову важливу поїздку':'important new trip');
  await expect(cards.locator('article[data-factor="nakshatra"]')).toBeVisible();
  const after=await cards.locator('article[data-factor="nakshatra"]').innerText();
  expect(first.length).toBeGreaterThan(20);expect(after.length).toBeGreaterThan(20);
 });
}
test('P3.7 invalid classical inputs fail closed without guessed five-limb advice',async({page})=>{
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
 await expect(screen.getByTestId('p32-evidence')).toHaveCount(0);
});
