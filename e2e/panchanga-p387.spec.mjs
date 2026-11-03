import {test,expect} from '@playwright/test';
for(const locale of ['uk','en']){
 test('P3.8.7 '+locale+' preserves activity across exact Day / Week / Month without creating unverified personal badges',async({page})=>{
  test.setTimeout(120000);
  await page.goto('/'+locale+'/panchanga?date=2026-11-02');
  await expect(page.getByTestId('p31-my-day')).toBeVisible({timeout:90000});
  await page.getByTestId('p386-activity-select').selectOption('short_journey');
  const nav=page.getByRole('navigation',{name:locale==='uk'?'Період календаря':'Calendar period'});
  await nav.getByRole('button',{name:locale==='uk'?'7 днів':'7 days'}).click();
  const weekly=page.getByTestId('panchanga-calendar-range');
  await expect(weekly.getByTestId('panchanga-day-cell')).toHaveCount(7,{timeout:90000});
  await expect(weekly.getByTestId('p387-activity-select')).toHaveValue('short_journey');
  await expect(weekly.getByTestId('p387-sunrise')).toHaveCount(0);
  await weekly.getByTestId('p387-activity-select').selectOption('foundation');
  await nav.getByRole('button',{name:locale==='uk'?'Місяць':'Month'}).click();
  const monthly=page.getByTestId('panchanga-calendar-range');
  await expect(monthly.getByTestId('panchanga-day-cell')).toHaveCount(30,{timeout:90000});
  await expect(monthly.getByTestId('p387-activity-select')).toHaveValue('foundation');
  await monthly.getByTestId('panchanga-day-cell').nth(3).click();
  await expect(page.getByTestId('p386-activity-select')).toHaveValue('foundation',{timeout:90000});
 });
}
test('P3.8.7 guest: protected personal endpoints are not called automatically and are never rendered as verified',async({page})=>{
 test.setTimeout(120000);
 const requested=[];
 page.on('request',r=>{
  if(r.url().includes('/api/v1/personal/panchanga/calendar')||
     r.url().includes('/api/v1/personal/panchanga/time-finder'))requested.push(r.url());
 });
 await page.goto('/uk/panchanga?date=2026-11-02');
 await page.getByRole('navigation',{name:'Період календаря'}).getByRole('button',{name:'Місяць'}).click();
 await expect(page.getByTestId('panchanga-day-cell')).toHaveCount(30,{timeout:90000});
 expect(requested).toEqual([]);
 await expect(page.getByTestId('p387-exact-windows')).toHaveCount(0);
 await expect(page.getByTestId('p387-sunrise')).toHaveCount(0);
});
test('P3.8.7 mobile 320px: Week and Month toolbars do not overflow page',async({page})=>{
 test.setTimeout(120000);
 await page.setViewportSize({width:320,height:740});
 await page.goto('/uk/panchanga?date=2026-11-02');
 const nav=page.getByRole('navigation',{name:'Період календаря'});
 await nav.getByRole('button',{name:'7 днів'}).click();
 await expect(page.getByTestId('p387-activity-select')).toBeVisible({timeout:90000});
 let dims=await page.evaluate(()=>({width:window.innerWidth,scroll:document.documentElement.scrollWidth}));
 expect(dims.scroll).toBeLessThanOrEqual(dims.width+2);
 await nav.getByRole('button',{name:'Місяць'}).click();
 await expect(page.getByTestId('panchanga-day-cell')).toHaveCount(30,{timeout:90000});
 dims=await page.evaluate(()=>({width:window.innerWidth,scroll:document.documentElement.scrollWidth}));
 expect(dims.scroll).toBeLessThanOrEqual(dims.width+2);
});
