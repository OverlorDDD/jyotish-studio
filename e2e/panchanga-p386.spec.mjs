import {test,expect} from '@playwright/test';
const DAY='2026-11-03';
for(const locale of ['uk','en']){
 test('P3.8.6 '+locale+' clean Day: real specific activities, five compact icons, source details, no old duplicate advice',async({page})=>{
  test.setTimeout(120000);
  await page.goto('/'+locale+'/panchanga?date='+DAY);
  const hub=page.getByTestId('panchanga-hub');
  await expect(hub.getByTestId('p386-observer')).toBeVisible();
  await expect(hub.getByTestId('p31-my-day')).toBeVisible({timeout:90000});
  await expect(hub.getByTestId('p386-activity-select')).toBeVisible();
  await expect(hub.getByTestId('p32-headline')).toBeVisible();
  const source=await hub.innerText();
  expect(source).not.toContain('Підготуйте три результати');
  expect(source).not.toContain('Запишіть два головні питання');
  expect(source).not.toContain('Обрана справа:');
  expect(source).not.toContain('Selected activity:');
  expect(source).not.toContain('Мій календар 7/30');
  expect(source).not.toContain('My 7/30 calendar');
  await expect(hub.getByRole('button',{name:locale==='uk'?'Розрахувати день':'Calculate day'})).toHaveCount(0);
  const cards=hub.getByTestId('p32-evidence');
  await expect(cards.locator('details')).toHaveCount(5);
  await expect(cards.locator('summary svg').first()).toBeVisible();
  await expect(cards.locator('details').first()).not.toHaveAttribute('open');
  await cards.locator('details').first().locator('summary').click();
  await expect(cards.locator('details').first()).toHaveAttribute('open');
  await expect(cards.locator('details').first().getByRole('link')).toBeVisible();
  await cards.locator('details').first().locator('summary').click();
  const relationship=hub.getByRole('button',{name:locale==='uk'?'Стосунки':'Relationships',exact:true});
  await relationship.click();
  const select=hub.getByTestId('p386-activity-select');
  await expect(select.locator('option')).toHaveCount(5);
  await select.selectOption('first_date');
  await expect(hub.getByTestId('p32-headline')).toBeVisible();
  await select.selectOption('wedding');
  await expect(hub.getByTestId('p389-muhurta-checklist')).toBeVisible();
  await expect(hub.getByTestId('p389-muhurta-checklist')).toContainText(
   locale==='uk'?'21 доша':'21 doshas');
  await expect(hub.getByTestId('p31-my-day').locator('[role="img"][aria-label*="%"]')).toHaveCount(0);
  await expect(hub.getByTestId('p31-details')).not.toHaveAttribute('open');
 });
 test('P3.8.6 '+locale+' day/week/month one calendar and date drilldown',async({page})=>{
  test.setTimeout(120000);
  await page.goto('/'+locale+'/panchanga?date=2026-11-02');
  const hub=page.getByTestId('panchanga-hub');
  await expect(hub.getByTestId('p31-my-day')).toBeVisible({timeout:90000});
  const nav=page.getByRole('navigation',{name:locale==='uk'?'Період календаря':'Calendar period'});
  await expect(nav.getByRole('button')).toHaveCount(3);
  await nav.getByRole('button',{name:locale==='uk'?'7 днів':'7 days'}).click();
  const week=hub.getByTestId('panchanga-calendar-range');
  await expect(week.getByTestId('panchanga-day-cell')).toHaveCount(7,{timeout:90000});
  await week.getByTestId('panchanga-day-cell').nth(1).click();
  await expect(hub.getByTestId('p31-my-day')).toBeVisible({timeout:90000});
  await nav.getByRole('button',{name:locale==='uk'?'Місяць':'Month'}).click();
  const month=hub.getByTestId('panchanga-calendar-range');
  await expect(month.getByTestId('panchanga-day-cell').first()).toBeVisible({timeout:90000});
  const settings=hub.locator('details').filter({hasText:locale==='uk'?'Налаштування місячного календаря':'Lunar calendar settings'}).first();
  await settings.locator(':scope > summary').click();
  await expect(hub.getByTestId('panchanga-month-system')).toBeVisible();
  await hub.getByTestId('panchanga-month-system').getByRole('button',
   {name:locale==='uk'?'Пурніманта':'Purnimanta'}).click();
  await expect(month.getByTestId('panchanga-day-cell').first()).toBeVisible({timeout:90000});
 });
}
test('P3.8.6 active saved/natal observer city is inside autocomplete, never a second city line',async({page})=>{
 await page.route('**/api/v1/personal/panchanga/location',async route=>{
  if(route.request().method()==='GET'){
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
    source:'natal',location:{place:'Кривий Ріг, Дніпропетровська область, Україна',
     timeZone:'Europe/Kyiv',latitude:47.9105,longitude:33.3918}})});
  }else await route.continue();
 });
 await page.goto('/uk/panchanga?date=2026-11-03');
 const search=page.getByTestId('global-city-search').getByRole('searchbox');
 await expect(search).toHaveValue(/Кривий Ріг/,{timeout:20000});
 await expect(page.getByTestId('panchanga-hub')).not.toContainText('Місто: Кривий Ріг');
 await search.click();await search.fill('Кременчук');
 await expect(search).toHaveValue('Кременчук');
});
test('P3.8.6 mobile 320px: no horizontal whole-page overflow; icons + date + location readable',async({page})=>{
 test.setTimeout(120000);
 await page.setViewportSize({width:320,height:740});
 await page.goto('/uk/panchanga?date='+DAY);
 await expect(page.getByTestId('p31-my-day')).toBeVisible({timeout:90000});
 await expect(page.getByTestId('p32-evidence').locator('details')).toHaveCount(5);
 const size=await page.evaluate(()=>({
  doc:document.documentElement.scrollWidth,width:window.innerWidth}));
 expect(size.doc).toBeLessThanOrEqual(size.width+2);
});
test('P3.8.6 protected private election preview never leaks to guest; Swiss public day still verified',async({request})=>{
 const q='date=2026-11-03&zone=Europe%2FKyiv&latitude=47.9105&longitude=33.3918';
 const day=await request.get('/api/v1/panchanga/day?'+q);
 expect(day.status(),await day.text()).toBe(200);
 const data=await day.json();
 for(const k of ['tithi','nakshatra','vara','yoga','karana'])expect(data.sunrise[k]).toBeTruthy();
 const privateRequest=await request.post('/api/v1/personal/panchanga/time-finder',{
  data:{activityId:'wedding',atUtc:'2027-05-10T15:00:00.000Z',timeZone:'Europe/Kyiv',
   latitude:47.9105,longitude:33.3918,days:7}});
 expect(privateRequest.status()).toBe(401);
});
