import {test,expect} from '@playwright/test';

for(const [kind,path,heading] of [
 ['jyotish','/en/astrology/jyotish','Read your Vedic chart'],
 ['panchanga','/en/panchanga','Find today’s Panchanga'],
 ['tarot','/en/tarot','Understand the cards']
]){
 test('G3.2 '+kind+' is centered, bilingual-ready, accessible and has real links',async({page})=>{
  await page.goto(path);
  const section=page.getByTestId('g32-organic-'+kind);
  await expect(section).toBeVisible();
  await expect(section.locator('h2')).toContainText(heading);
  await expect(section.locator('ol > li')).toHaveCount(3);
  await expect(section.getByRole('navigation').getByRole('link')).toHaveCount(2);
  const large=await section.evaluate(e=>{
   const rect=e.getBoundingClientRect(),parent=e.parentElement.getBoundingClientRect();
   return {centerDelta:Math.abs((rect.left+rect.right)/2-(parent.left+parent.right)/2),
    titleAlign:getComputedStyle(e.querySelector('h2')).textAlign,
    links:[...e.querySelectorAll('nav a')].every(a=>a.getAttribute('href')?.startsWith('/en/'))};
  });
  expect(large.centerDelta).toBeLessThanOrEqual(12);
  expect(large.titleAlign).toBe('center');
  expect(large.links).toBe(true);
  await page.setViewportSize({width:320,height:760});
  const narrow=await section.evaluate(e=>{
   const rect=e.getBoundingClientRect();
   return {left:rect.left,right:rect.right,columns:getComputedStyle(e.querySelector('ol')).gridTemplateColumns.split(' ').length,
    align:getComputedStyle(e.querySelector('h2')).textAlign};
  });
  expect(narrow.left).toBeGreaterThanOrEqual(-2);
  expect(narrow.right).toBeLessThanOrEqual(322);
  expect(narrow.columns).toBe(1);
  expect(narrow.align).toBe('center');
 });
}
test('G3.2 Ukrainian guidance preserves localized content and public Pedia links',async({page})=>{
 await page.goto('/uk/panchanga');
 const section=page.getByTestId('g32-organic-panchanga');
 await expect(section.getByRole('heading',{name:/Дізнайся Панчангу/})).toBeVisible();
 await expect(section.locator('a[href="/uk/pedia/panchanga-time-by-city"]')).toBeVisible();
 await expect(section.locator('a[href="/uk/pedia/what-is-tithi-lunar-day"]')).toBeVisible();
});
