import {test,expect} from '@playwright/test';

const birth={date:'2000-03-20',time:'12:00'};
for(const locale of ['uk','en']){
 for(const variant of ['short','steps']){
  test(`natal pilot ${locale} ${variant} calculates, explains and edits in place`,async({page})=>{
   const isUk=locale==='uk';
   const base='/'+locale+'/astrology/jyotish';
   const calculations=[],cloudCalls=[];
   await page.emulateMedia({reducedMotion:'reduce'});
   page.on('request',req=>{
    if(req.url().endsWith('/charts/calculate'))calculations.push(req.method());
    if(req.url().endsWith('/reports')&&req.postDataJSON()?.preferred==='auto')cloudCalls.push(req.url());
   });
   // The external place directory is outside this scenario. All calculations and classical readings use the local API.
   await page.route('**/api/v1/panchanga/cities?**',route=>route.fulfill({json:{items:[{id:'ldn',name:'London',region:'',country:'UK',timeZone:'Europe/London',latitude:51.5074,longitude:-0.1278}]}}));
   const response=await page.goto(base+'/try/'+variant);
   expect(response.status()).toBe(200);
   await expect(page.locator('meta[name=robots]')).toHaveAttribute('content',/noindex/);
   await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href',new RegExp(base+'$'));
   await expect(page.getByTestId('natal-pilot-sample')).toBeVisible();
   await expect(page.getByTestId('natal-pilot-sample')).toContainText(isUk?'Місяць у Діві':'Moon in Virgo');
   expect(calculations).toHaveLength(0);
   const primary=page.getByTestId('natal-pilot-start');
   const box=await primary.boundingBox();expect(box.y+box.height).toBeLessThanOrEqual(page.viewportSize().height);
   await primary.click();
   const date=page.locator('#natal-birth-date');
   await expect(date).toBeFocused();
   await date.fill(birth.date);await page.locator('input[type=time]').fill(birth.time);
   const next=page.getByTestId('natal-pilot-next');
   if(variant==='steps'){
    await next.click();await page.getByTestId('natal-pilot-back').click();await expect(date).toHaveValue(birth.date);
    await next.click();
   }
   if(variant==='short'){
    const city=page.locator('#birth-details [role=combobox]');
    await city.fill('London');
    await expect(page.getByRole('option',{name:/London/})).toBeVisible();
    await city.press('ArrowDown');await city.press('Enter');
   }else{
    const manual=page.locator('.jy-n4-advanced');await manual.locator('summary').click();
    await manual.locator('input').nth(0).fill('51.5074');await manual.locator('input').nth(1).fill('-0.1278');
    await manual.locator('input').nth(2).fill('Europe/London');
   }
   await page.locator('.jy-calc-btn').click();
   const result=page.getByTestId('natal-pilot-result');
   await expect(result).toBeVisible({timeout:20000});
   await expect(result.getByRole('heading',{level:1})).toBeFocused();
   await expect(result).toContainText(isUk?'Рак':'Cancer');await expect(result).toContainText(isUk?'Діва':'Virgo');
   const lagna=result.getByTestId('natal-pilot-lagna');
   await lagna.focus();await page.keyboard.press('Enter');
   await expect(lagna).toHaveAttribute('aria-expanded','true');
   expect(await result.locator('.jy-south-lagna').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
   await result.getByTestId('natal-pilot-reading').click();
   await expect(page.locator('#natal-reading-options')).toBeFocused();
   await expect(page.getByTestId('reader10')).toBeVisible({timeout:25000});
   await result.getByTestId('natal-pilot-edit').click();
   await expect(date).toBeFocused();await expect(date).toHaveValue(birth.date);
   await expect(page.locator('input[type=time]')).toHaveValue(birth.time);
   await page.goForward();await expect(result).toBeVisible();await page.goBack();await expect(date).toHaveValue(birth.date);
   expect(calculations).toEqual(['POST']);expect(cloudCalls).toHaveLength(0);
   expect(page.url()).not.toMatch(/2000|12:00|London|51\.5/);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width+1);
  });
 }
}

test('failed calculation keeps input, accepts a retry, and counts a double submit once',async({page})=>{
 const events=[];
 await page.exposeFunction('observeNatalEvent',detail=>events.push(detail));
 await page.addInitScript(()=>window.addEventListener('galaxiora:growth',event=>window.observeNatalEvent(event.detail)));
 const route='/en/astrology/jyotish/try/short';
 await page.goto(route+'#chart-result');
 await expect(page.getByTestId('natal-pilot-result')).toHaveCount(0);
 await page.getByTestId('natal-pilot-start').click();
 await page.locator('#natal-birth-date').fill(birth.date);
 await page.locator('input[type=time]').fill(birth.time);
 const manual=page.locator('.jy-n4-advanced');await manual.locator('summary').click();
 await manual.locator('input').nth(0).fill('51.5074');await manual.locator('input').nth(1).fill('-0.1278');
 await manual.locator('input').nth(2).fill('Europe/London');
 let attempts=0;
 await page.route('**/api/v1/charts/calculate',async call=>{
  attempts++;
  if(attempts===1)await call.fulfill({status:503,json:{message:'Temporary test outage'}});
  else await call.continue();
 });
 await page.locator('.jy-calc-btn').click();
 await expect(page.locator('#birth-details .error')).toBeVisible();
 await expect(page.locator('#natal-birth-date')).toHaveValue(birth.date);
 await page.locator('#birth-details form').evaluate(form=>{form.requestSubmit();form.requestSubmit()});
 await expect(page.getByTestId('natal-pilot-result')).toBeVisible({timeout:20000});
 expect(attempts).toBe(2);
 expect(events.filter(e=>e.name.startsWith('public_tool_'))).toEqual([
  {name:'public_tool_started',tool:'jyotish'},{name:'public_tool_failed',tool:'jyotish'},
  {name:'public_tool_started',tool:'jyotish'},{name:'public_tool_completed',tool:'jyotish'}
 ]);
 await page.reload();
 await expect(page.getByTestId('natal-pilot-sample')).toBeVisible();
 await expect(page.locator('#natal-birth-date')).toHaveValue('');
 await expect(page).not.toHaveURL(/#chart-result/);
});
