import {test,expect} from '@playwright/test';
// Wait for the hydrated consent prompt before interacting with mobile UI.
// Reject via the actual button; R4.2 independently tests opt-in and revocation.
async function rejectAnalyticsIfPrompted(page){
 const dialog=page.getByRole('dialog',{name:/Аналітика відвідувань|Visitor analytics/});
 try { await dialog.waitFor({state:'visible',timeout:8000}); }
 catch { return; } // Previously decided consent or prompt intentionally absent.
 await dialog.getByRole('button',{name:/Відхилити|Reject/}).click();
 await expect(dialog).toHaveCount(0);
}
const noOverflow=async page=>{
 const d=await page.evaluate(()=>({w:window.innerWidth,s:document.documentElement.scrollWidth}));
 expect(d.s).toBeLessThanOrEqual(d.w+2);
};

const DAY='2026-11-03';
for(const locale of ['uk','en']){
 test('Panchanga Today '+locale+' day navigation and the classical five limbs behind one fold',async({page})=>{
  test.setTimeout(150000);
  await page.goto('/'+locale+'/panchanga?date='+DAY);
  await rejectAnalyticsIfPrompted(page);
  const hub=page.getByTestId('panchanga-hub');
  await expect(hub.getByTestId('p386-observer')).toBeVisible();
  await expect(hub.locator('#pt-verdict')).toBeVisible({timeout:90000});
  await hub.getByRole('button',{name:locale==='uk'?'Наступний день':'Next day'}).click();
  await expect(hub.locator('input[type=date]')).toHaveValue('2026-11-04');
  await expect(hub.locator('#pt-verdict')).toBeVisible({timeout:90000});
  await hub.getByRole('button',{name:locale==='uk'?'Попередній день':'Previous day'}).click();
  await expect(hub.locator('input[type=date]')).toHaveValue(DAY);
  const details=hub.getByTestId('p31-details');
  await expect(details).toBeVisible({timeout:90000});
  await details.locator(':scope > summary').click();
  await expect(details.getByTestId('panchanga-five-angas').locator('article')).toHaveCount(5);
  await expect(details.getByTestId('panchanga-daily-timeline')).toBeVisible();
  await expect(details.getByRole('heading',{name:locale==='uk'?'Класична Панчанга':'Classical Panchanga'})).toBeVisible();
 });
}
test('Saved/natal observer city fills the city search, never a second city line',async({page})=>{
 await page.route('**/api/v1/personal/panchanga/location',async route=>{
  if(route.request().method()==='GET'){
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
    source:'natal',location:{place:'Кривий Ріг, Дніпропетровська область, Україна',
     timeZone:'Europe/Kyiv',latitude:47.9105,longitude:33.3918}})});
  }else await route.continue();
 });
 await page.goto('/uk/panchanga?date=2026-11-03');
 const search=page.getByTestId('global-city-search').getByRole('combobox');
 await expect(search).toHaveValue(/Кривий Ріг/,{timeout:20000});
 await expect(page.getByTestId('panchanga-hub')).not.toContainText('Місто: Кривий Ріг');
 await expect(page.getByTestId('panchanga-hub')).toContainText('Місто з вашої натальної карти');
 await search.click();await search.fill('Кременчук');
 await expect(search).toHaveValue('Кременчук');
});
test('Mobile 320px: no horizontal page overflow with the full day loaded',async({page})=>{
 test.setTimeout(150000);
 await page.setViewportSize({width:320,height:740});
 await page.goto('/uk/panchanga?date='+DAY);
 await rejectAnalyticsIfPrompted(page);
 await expect(page.getByTestId('panchanga-activity').first()).toBeVisible({timeout:90000});
 await expect(page.getByTestId('panchanga-month-day').first()).toBeVisible({timeout:90000});
 await noOverflow(page);
});
test('Protected private election preview never leaks to guest; Swiss public day still verified',async({request})=>{
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
