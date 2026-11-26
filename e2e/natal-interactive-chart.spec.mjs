import {test,expect} from '@playwright/test';
import {enterSyntheticBirthFields} from './n4-rc-legacy-compat.mjs';

const birth={date:'2000-03-20',time:'12:00',latitude:51.5074,longitude:-0.1278,timeZone:'Europe/London'};
for(const locale of ['uk','en']){
 const path='/'+locale+'/astrology/jyotish';
 test('old pilot links redirect to the main calculator '+locale,async({request})=>{
  for(const variant of ['short','steps']){
   const response=await request.get(path+'/try/'+variant,{maxRedirects:0});
   expect(response.status()).toBe(308);
   expect(new URL(response.headers().location,'https://galaxiora.com').pathname).toBe(path);
  }
  expect((await request.get(path+'/try/unknown',{maxRedirects:0})).status()).toBe(404);
 });
 test('the public chart explains twelve real houses '+locale,async({page,isMobile})=>{
  const uk=locale==='uk',calls=[],cloud=[];
  page.on('request',req=>{
   if(req.url().endsWith('/charts/calculate'))calls.push(req.method());
   if(req.url().endsWith('/reports')&&req.postDataJSON()?.preferred==='auto')cloud.push(req.url());
  });
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(path);
  const preview=page.getByTestId('natal-chart-sample');
  await expect(preview).toBeVisible();
  await expect(preview).toContainText(uk?'Зразок':'Example');
  await expect(page.locator('#natal-birth-date')).toBeVisible();
  await expect(page.getByTestId('n4-rc-explorer')).toHaveCount(0);
  expect(calls).toHaveLength(0);
  await enterSyntheticBirthFields(page,birth);
  await page.locator('.jy-calc-btn').click();
  const result=page.getByTestId('natal-chart-result'),hint=result.getByTestId('house-detail');
  await expect(result).toBeVisible({timeout:20000});
  await expect(result.getByRole('heading',{level:1})).toBeFocused();
  await expect(result.locator('.jy-south-lagna')).toContainText(uk?'Лагна':'Lagna');
  await expect(hint).toContainText(uk?'Рак':'Cancer');
  const houses=result.locator('button[data-house]');
  await expect(houses).toHaveCount(12);
  const meanings=new Set();
  for(let h=1;h<=12;h++){
   const cell=result.locator('button[data-house="'+h+'"]');
   if(isMobile)await cell.tap();else await cell.hover();
   await expect(hint).toHaveAttribute('data-house',String(h));
   meanings.add(await hint.locator('p').first().innerText());
  }
  expect(meanings.size).toBe(12);
  const third=result.locator('[data-house="3"]').first();
  await third.focus();await page.keyboard.press('Enter');
  await expect(hint).toContainText(uk?'Місяць':'Moon');
  await expect(hint).toContainText(uk?'Діва':'Virgo');
  await expect(third).toHaveAttribute('aria-pressed','true');
  expect(await third.evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
  await expect(page.getByTestId('reader10')).toBeVisible({timeout:25000});
  const sections=['chart-result','varga-explorer','natal-reading-options','interpretation','chart-data'];
  expect(await page.evaluate(ids=>ids.every((id,i)=>i===0||!!(document.getElementById(ids[i-1]).compareDocumentPosition(document.getElementById(id))&Node.DOCUMENT_POSITION_FOLLOWING)),sections)).toBe(true);
  const table=page.getByTestId('natal-positions');
  await expect(table.getByRole('row')).toHaveCount(11);
  await expect(table).toContainText(uk?'Лагна':'Lagna');
  await expect(page.getByTestId('n503-birthplace-coordinates')).toBeVisible();
  await expect(page.locator('#chart-data')).toHaveAttribute('data-access','public');
  await page.locator('#chart-data select').first().selectOption('d9');
  await expect(table.locator('caption')).toContainText('D9');
  await expect(page.locator('#timeline tbody tr')).toHaveCount(9);
  await expect(page.locator('[data-natal-related]')).toBeHidden();
  await expect(page.locator('#reading-details')).toHaveCount(0);
  await result.getByRole('link',{name:uk?'Змінити дані народження':'Edit birth details'}).click();
  await expect(page.locator('#natal-birth-date')).toBeFocused();
  await expect(page.locator('#natal-birth-date')).toHaveValue(birth.date);
  await page.goForward();await expect(result).toBeVisible();
  await page.goBack();await expect(page.locator('#natal-birth-date')).toHaveValue(birth.date);
  expect(calls).toEqual(['POST']);expect(cloud).toHaveLength(0);
  expect(page.url()).not.toMatch(/2000|London|51\.5/);
 });
}

test('failed calculation keeps input, accepts a retry, and counts a double submit once',async({page})=>{
 const events=[];
 await page.exposeFunction('observeNatalEvent',detail=>events.push(detail));
 await page.addInitScript(()=>window.addEventListener('galaxiora:growth',event=>window.observeNatalEvent(event.detail)));
 const route='/en/astrology/jyotish';
 await page.goto(route+'#chart-result');
 await expect(page.getByTestId('natal-chart-result')).toHaveCount(0);
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
 await expect(page.getByTestId('natal-chart-result')).toBeVisible({timeout:20000});
 expect(attempts).toBe(2);
 expect(events.filter(e=>e.name.startsWith('public_tool_'))).toEqual([
  {name:'public_tool_started',tool:'jyotish'},{name:'public_tool_failed',tool:'jyotish'},
  {name:'public_tool_started',tool:'jyotish'},{name:'public_tool_completed',tool:'jyotish'}
 ]);
 await page.reload();
 await expect(page.getByTestId('natal-chart-sample')).toBeVisible();
 await expect(page.locator('#natal-birth-date')).toHaveValue('');
 await expect(page).not.toHaveURL(/#chart-result/);
});

test('birth details typed before hydration survive the first interactive edit',async({page})=>{
 let resume;
 const scripts=new Promise(resolve=>{resume=resolve;});
 await page.route('**/_next/static/chunks/**',async route=>{
  if(route.request().resourceType()==='script')await scripts;
  await route.continue();
 });
 await page.goto('/en/astrology/jyotish',{waitUntil:'commit'});
 const date=page.locator('#natal-birth-date'),time=page.locator('#birth-details input[type=time]');
 await date.fill(birth.date);await time.fill(birth.time);
 const ready=page.waitForRequest('**/api/v1/jyotish/runtime');
 resume();await ready;
 const advanced=page.locator('.jy-n4-advanced');
 await advanced.locator('summary').click();
 await advanced.locator('input').nth(0).fill('51.5074');
 await advanced.locator('input').nth(1).fill('-0.1278');
 await advanced.locator('input').nth(2).fill('Europe/London');
 await expect(date).toHaveValue(birth.date);await expect(time).toHaveValue(birth.time);
 await expect(page.locator('.jy-calc-btn')).toBeEnabled();
});
