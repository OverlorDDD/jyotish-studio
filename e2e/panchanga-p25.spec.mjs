import {test,expect} from '@playwright/test';
for(const locale of ['uk','en']){
 test('P2.5 '+locale+' measured descriptions replace vague slogans in one Panchanga hub',async({page})=>{
  test.setTimeout(120000);
  await page.goto('/'+locale+'/panchanga?date=2026-11-02');
  const hub=page.getByTestId('panchanga-hub');
  await expect(hub.getByTestId('panchanga-five-angas').locator('article')).toHaveCount(5,{timeout:90000});
  const expected=locale==='uk'?
   ['Кожні 12° між Місяцем і Сонцем','Сектор Місяця серед 27','Половина тітхі: кожні 6°']:
   ['Every 12° of Moon–Sun separation','Moon’s sector among 27','Half a tithi: every 6°'];
  for(const phrase of expected)await expect(hub).toContainText(phrase);
  await expect(hub.getByTestId('panchanga-integrated-day')).toBeVisible();
  await expect(hub).not.toContainText(locale==='uk'?'Дослідити глибше':'Explore in depth');
  await hub.getByRole('navigation',{name:locale==='uk'?'Період календаря':'Calendar period'})
   .getByRole('button',{name:locale==='uk'?'Місяць':'Month'}).click();
  await expect(hub.getByTestId('panchanga-calendar-range').getByTestId('panchanga-day-cell'))
   .toHaveCount(30,{timeout:90000});
  await expect(hub.getByTestId('panchanga-calendar-range')).toContainText(
   locale==='uk'?'Дати свят попередні':'Festival dates are provisional');
 });
}
test('P2.5 R4.3 SEO guide retained alongside Panchanga',async({request})=>{
 const pages=['/uk/astrology/moon-sign-vs-sun-sign','/en/astrology/moon-sign-vs-sun-sign'];
 for(const path of pages){
  const r=await request.get(path);
  expect(r.status(),path+': '+r.status()).toBe(200);
  expect(await r.text()).toContain('Galaxiora');
 }
});
