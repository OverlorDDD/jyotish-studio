import {test,expect} from '@playwright/test';
for(const locale of ['uk','en']){
 test('P410 '+locale+' 320/390 mobile classical Panchanga and no preliminary election',async({page})=>{
  test.setTimeout(180000);
  await page.setViewportSize({width:390,height:844});
  await page.goto('/'+locale+'/panchanga?date=2026-11-03');
  const hub=page.getByTestId('panchanga-hub');
  await expect(hub.getByTestId('p410-opportunities')).toBeVisible({timeout:90000});
  await expect(hub.getByTestId('p410-advanced')).toHaveCount(0);
  await expect(hub.getByTestId('p31-my-day')).toHaveCount(0);
  await expect(hub.getByTestId('panchanga-five-angas')).toBeVisible({timeout:90000});
  await expect(hub.getByTestId('panchanga-five-angas').locator('article')).toHaveCount(5);
  await expect(hub.getByTestId('panchanga-daily-timeline')).toBeVisible();
  await expect(hub.getByRole('heading',{name:locale==='uk'?'Класична Панчанга':'Classical Panchanga'})).toBeVisible();
  for(const width of [390,320]){
   await page.setViewportSize({width,height:740});
   expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth))
    .toBeLessThanOrEqual(2);
  }
 });

}
