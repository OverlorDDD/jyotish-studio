import {test,expect} from '@playwright/test';
for(const lang of ['en','uk']){
 test(lang+' natal page: user-first heading, SEO canonical, free tool and inline minute accuracy',async({page})=>{
  await page.goto('/'+lang+'/astrology/jyotish');
  await expect(page.getByRole('heading',{level:1})).toHaveCount(1);
  await expect(page.getByRole('heading',{level:1})).toContainText(lang==='uk'?'Безкоштовний калькулятор натальної карти Джйотіш':'Free Vedic Birth Chart Calculator',{ignoreCase:true});
  // The search promise must be visibly explained, not merely placed in hidden metadata.
  await expect(page.getByText(lang==='uk'?'Побудуй безкоштовну ведичну карту':'Calculate your free Kundli',{exact:false})).toBeVisible();
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href',new RegExp('/'+lang+'/astrology/jyotish$'));
  await expect(page.locator('meta[name=description]')).toHaveAttribute('content',/16|birth chart|натальн/);
  await expect(page.locator('input[type=date]')).toHaveValue('');
  await expect(page.locator('input[type=time]')).toHaveValue('');
  const sample=page.getByTestId('natal-chart-sample');
  await expect(sample.getByRole('button')).toHaveCount(12);
  await expect(page.getByTestId('n4-rc-explorer')).toHaveCount(0);
  await expect(page.locator('.as-brand-icon img')).toHaveCount(1);
  expect(await page.locator('.as-brand-icon img').evaluate(img=>img.complete&&img.naturalWidth>0)).toBeTruthy();
  await expect(page.locator('#natal-faq-title')).toBeVisible();
  await expect(page.locator('input[type=checkbox]')).toHaveCount(1);
  await page.locator('input[type=checkbox]').check();
  await expect(page.getByText(lang==='uk'?'Без точних хвилин':'Without exact minutes',{exact:false})).toBeVisible();
 });
}
test('natal landing responds without horizontal overflow from 320 to 1440px',async({page})=>{
 await page.goto('/en/astrology/jyotish');
 for(const width of [320,360,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:850});
  const spill=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(spill,'natal landing viewport overflow '+width+'px').toBeLessThanOrEqual(2);
 }
});


test('Save-chart toolbar scrolls underneath sticky navigation instead of covering Login',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto('/uk/astrology/jyotish');
 const header=page.locator('.as-header');
 const account=page.locator('.jy-portal-toolbar .account-trigger');
 await expect(header).toBeVisible();
 await expect(account).toBeVisible();
 const layers=await page.evaluate(()=>{
  const toolbar=document.querySelector('.jy-portal-toolbar');
  const sticky=document.querySelector('.as-header');
  return {isolated:toolbar?getComputedStyle(toolbar).isolation==='isolate':false,
    toolbarZ:toolbar?Number(getComputedStyle(toolbar).zIndex):NaN,
    headerZ:sticky?Number(getComputedStyle(sticky).zIndex):NaN};
 });
 expect(layers.isolated).toBeTruthy();
 expect(layers.toolbarZ).toBeLessThan(layers.headerZ);
 await page.evaluate(()=>{
  document.documentElement.style.scrollBehavior='auto';
  window.scrollTo(0,160);
 });
 const hit=await account.evaluate(button=>{
  const sticky=document.querySelector('.as-header');
  if(!sticky)return false;
  const r=button.getBoundingClientRect(),h=sticky.getBoundingClientRect();
  const x=Math.max(r.left+2,Math.min(r.right-2,(r.left+r.right)/2));
  const y=Math.max(r.top+2,Math.min(r.bottom-2,(r.top+r.bottom)/2));
  if(y<h.top||y>h.bottom)return true;
  const front=document.elementFromPoint(x,y);
  return front===sticky||sticky.contains(front);
 });
 expect(hit,'save chart must not paint on top of the sticky site header').toBeTruthy();
});
