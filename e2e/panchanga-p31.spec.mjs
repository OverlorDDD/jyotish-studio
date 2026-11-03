import {test,expect} from '@playwright/test';
for(const locale of ['uk','en']){
 test('P3.7 '+locale+' keeps five cards above the fold, no empty sky or duplicate event guide',async({page})=>{
  test.setTimeout(120000);
  let overview=0,sky=0,legacyPersonal=0;
  page.on('request',req=>{const p=new URL(req.url()).pathname;
   if(p==='/api/v1/vedic-calendar/overview')overview++;
   if(p==='/api/v1/astronomy/eclipses')sky++;
   if(p==='/api/v1/personal/panchanga')legacyPersonal++;
  });
  await page.goto('/'+locale+'/panchanga?date=2026-11-02');
  const mine=page.getByTestId('p31-my-day');
  await expect(mine).toBeVisible({timeout:90000});
  await expect(mine.getByTestId('p31-summary')).toBeVisible();
  await expect(mine.getByTestId('p32-evidence').locator('article')).toHaveCount(5);
  await expect(mine).toContainText(locale==='uk'?'Раху-калам':'Rahu Kalam');
  await expect(mine.getByRole('link',{name:locale==='uk'?/натальну карту/:/birth chart/})).toHaveAttribute('href','/'+locale+'/personal');
  const detail=page.getByTestId('p31-details');
  await expect(detail).not.toHaveAttribute('open');
  expect(overview).toBe(0);expect(sky).toBe(0);expect(legacyPersonal).toBe(0);
  await mine.getByRole('group',{name:locale==='uk'?'Тема поради':'Advice topic'})
   .getByRole('button',{name:locale==='uk'?'Гроші':'Money'}).click();
  await expect(mine.getByTestId('p31-advice')).toContainText(
   locale==='uk'?'фінансову угоду':'financial agreement');
  await detail.locator(':scope > summary').click();
  await expect(detail).toHaveAttribute('open');
  await expect(page.getByTestId('panchanga-five-angas').locator('article')).toHaveCount(5);
  await expect(page.getByTestId('panchanga-integrated-day')).toHaveCount(0);
  await expect(page.getByTestId('panchanga-related')).toHaveCount(0);
  await expect(page.getByTestId('p31-sky')).toHaveCount(0);
 });
}
test('P3.7 mobile 320px retains five source-linked cards without overflow',async({page})=>{
 test.setTimeout(120000);
 await page.setViewportSize({width:320,height:700});
 await page.goto('/uk/panchanga?date=2026-11-02');
 await expect(page.getByTestId('p31-advice')).toBeVisible({timeout:90000});
 await expect(page.getByTestId('p32-evidence').locator('article')).toHaveCount(5);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(322);
});
