import {test,expect} from '@playwright/test';
for(const locale of ['uk','en']){
 test('P3.1 '+locale+' puts a clear verified snapshot, topical action and local astronomy first',async({page})=>{
  test.setTimeout(120000);
  let eclipseCalls=0,overviewCalls=0,personalCalls=0;
  page.on('request',req=>{
   const path=new URL(req.url()).pathname;
   if(path==='/api/v1/astronomy/eclipses')eclipseCalls++;
   if(path==='/api/v1/vedic-calendar/overview')overviewCalls++;
   if(path==='/api/v1/personal/panchanga')personalCalls++;
  });
  await page.goto('/'+locale+'/panchanga?date=2026-11-02');
  const mine=page.getByTestId('p31-my-day');
  await expect(mine).toBeVisible({timeout:90000});
  await expect(mine.getByTestId('p31-summary')).toBeVisible();
  await expect(mine).toContainText(locale==='uk'?'Раху-калам':'Rahu Kalam');
  await expect(mine).toContainText(locale==='uk'?'Місяць спадає':'Waning Moon');
  await expect(mine.getByRole('link',{name:locale==='uk'?/натальну карту/:/birth chart/})).toHaveAttribute('href','/'+locale+'/personal');
  const detail=page.getByTestId('p31-details');
  await expect(detail).not.toHaveAttribute('open');
  await expect(page.getByTestId('panchanga-five-angas')).toHaveCount(0);
  expect(eclipseCalls).toBe(0);
  expect(overviewCalls).toBe(0);
  expect(personalCalls).toBe(0);
  await mine.getByRole('group',{name:locale==='uk'?'Тема поради':'Advice topic'})
   .getByRole('button',{name:locale==='uk'?'Гроші':'Money'}).click();
  await expect(mine.getByTestId('p31-advice')).toContainText(
   locale==='uk'?'фінансову угоду':'financial agreement');
  await detail.locator(':scope > summary').click();
  await expect(detail).toHaveAttribute('open');
  await expect(page.getByTestId('panchanga-five-angas').locator('article')).toHaveCount(5,{timeout:90000});
  await expect(page.getByTestId('panchanga-integrated-day')).toBeVisible();
  await expect.poll(()=>overviewCalls).toBe(1);
  expect(personalCalls).toBe(0);
 });
}
test('P3.1 eclipse visibility is opt-in, locale aware, and only reports verified backend results',async({page})=>{
 test.setTimeout(120000);
 let requests=0;
 await page.route('**/api/v1/astronomy/eclipses?**',async route=>{
  requests++;
  const url=new URL(route.request().url());
  expect(url.searchParams.get('zone')).toBe('Europe/Kyiv');
  expect(url.searchParams.get('days')).toBe('366');
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
   independentVisibilityCertified:false,
   events:[
    {type:'lunar',eclipseKind:'partial',maximumUtc:'2027-02-20T18:00:00.000Z',
     visibleHere:true,localMaximumUtc:'2027-02-20T18:04:00.000Z'},
    {type:'solar',eclipseKind:'partial',maximumUtc:'2027-08-02T11:00:00.000Z',
     visibleHere:false,localMaximumUtc:null}
   ]
  })});
 });
 await page.goto('/uk/panchanga?date=2026-11-02');
 const sky=page.getByTestId('p31-sky');
 await expect(sky).toBeVisible({timeout:90000});
 expect(requests).toBe(0);
 await sky.getByRole('button',{name:'Перевірити затемнення'}).click();
 await expect(sky).toContainText('Місячне');
 await expect(sky).not.toContainText('Сонячне ·');
 await expect(sky).toContainText('погода не врахована');
 expect(requests).toBe(1);
});
test('P3.1 small screen exposes advice without requiring opening technical tables',async({page})=>{
 test.setTimeout(120000);
 await page.setViewportSize({width:320,height:700});
 await page.goto('/uk/panchanga?date=2026-11-02');
 await expect(page.getByTestId('p31-advice')).toBeVisible({timeout:90000});
 await expect(page.getByTestId('p31-details')).not.toHaveAttribute('open');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(322);
});
