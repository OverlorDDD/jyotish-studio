import {test,expect} from '@playwright/test';
const mockReading=(headline,kind)=>({
 headline:{uk:headline,en:headline},description:{uk:'Перевірена тестова порада за власною картою.',en:'Verified mocked chart reading.'},
 goodFor:{uk:'Один наступний крок',en:'One next step'},caution:{uk:'Звір власні можливості',en:'Review available resources'},
 action:{uk:'Заплануй справу',en:'Plan one task'},
 evidence:{kind,method:'Swiss Ephemeris / Lahiri',day:'2026-10-28',sampledAtUtc:'2026-10-28T10:00:00Z',
  natalMoonSign:3,natalLagnaSign:1,house:12,sign:12,nakshatra:'Revati'}
});
for(const locale of ['uk','en']){
 test('release SEO: '+locale+' Moon-sign permalink has original content and valid live sign deep link',async({page})=>{
  await page.goto('/'+locale+'/horoscope/aries');
  await expect(page.getByTestId('moon-sign-guide')).toBeVisible();
  await expect(page.getByRole('heading',{level:1})).toContainText(locale==='uk'?'Овен':'Aries');
  const link=page.locator('a[href="/'+locale+'/horoscope?sign=aries"]');
  await expect(link).toBeVisible();
  await link.click();
  await expect(page.getByRole('button',{name:locale==='uk'?'Овен':'Aries'})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByTestId('lunar-sign-explanation')).toBeVisible();
  await expect(page.getByTestId('horoscope-reading')).toBeVisible();
 });
}
test('a public Aries selection cannot silently override an authenticated Gemini natal Moon',async({page})=>{
 await page.route('**/api/v1/personal/overview',route=>route.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify({
   profile:{currentTimeZone:'Europe/Kyiv'},
   selected:{id:'verified-demo',verified:true,moonSign:3,lagnaSign:1},
   journey:{daily:mockReading('Мій натальний орієнтир','VERIFIED_NATAL_TRANSIT_DASHA'),
    horoscope:mockReading('Мій прогноз за Місяцем','PERSONAL_JANMA_RASHI')}
  })
 }));
 await page.route('**/api/v1/personal/calendar?**',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({horoscopeStatus:'personalized',horoscopes:[]})
 }));
 await page.goto('/uk/horoscope?sign=aries');
 await expect(page.getByTestId('lunar-sign-explanation')).toContainText('Овен');
 await expect(page.getByTestId('lunar-sign-explanation')).toContainText('Близнюки');
 await page.getByRole('button',{name:'Мій персональний'}).click();
 const basis=page.getByTestId('personal-sign-basis');
 await expect(basis).toContainText('Близнюки');
 await expect(basis).toContainText('Овен');
 await expect(page.getByTestId('personal-daily-core')).toContainText('Мій натальний орієнтир');
 await expect(page.getByTestId('personal-moon-reading')).toContainText('Мій прогноз за Місяцем');
 await page.getByRole('button',{name:'Усі 12 знаків'}).click();
 await page.getByRole('button',{name:/Обрати мій місячний знак/}).click();
 await expect(page.getByRole('button',{name:'Близнюки'})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Мій персональний'}).click();
 await expect(page.getByTestId('personal-sign-basis')).toContainText('Близнюки');
});
test('landing pages communicate available services without outdated coming-soon copy',async({page})=>{
 await page.goto('/uk');
 await expect(page.getByRole('heading',{level:1})).toBeVisible();
 await expect(page.getByText('Згодом додамо більше інструментів')).toHaveCount(0);
 await page.goto('/uk/astrology');
 await expect(page.getByText('транзити й місячний календар — у планах')).toHaveCount(0);
});

test('Open Graph share artwork is served as a valid public PNG',async({request})=>{
 const res=await request.get('/opengraph-image');
 expect(res.status()).toBe(200);
 expect(res.headers()['content-type']).toMatch(/image\/png/);
 const data=await res.body();
 expect(data.length).toBeGreaterThan(1500);
 // PNG signature: avoids passing with an HTML error document.
 expect([...data.subarray(0,8)]).toEqual([137,80,78,71,13,10,26,10]);
});
