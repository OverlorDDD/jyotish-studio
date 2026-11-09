import {test,expect} from '@playwright/test';
/**
 * E2E with REAL native Swiss → loopback no-DB report API → built Next UI.
 * No mocked Reader, no external AI, no user birth records.
 * Test screenshots prove rendering; they are not human visual approval.
 */
async function createInventedBirth(page,lang){
 await page.goto('/'+lang+'/astrology/jyotish');
 await expect(page.locator('#birth-details')).toBeVisible();
 await page.locator('#birth-details input[type="date"]').fill('1995-09-04');
 await page.locator('#birth-details input[type="time"]').fill('17:53');
 await page.locator('details.jy-n4-advanced > summary').click();
 const advanced=page.locator('details.jy-n4-advanced');
 await advanced.locator('input[type="number"]').nth(0).fill('50.45');
 await advanced.locator('input[type="number"]').nth(1).fill('30.523');
 await advanced.locator('input:not([type="number"])').fill('Europe/Kyiv');
 const result=page.waitForResponse(res=>res.url().includes('/api/v1/reports')&&res.request().method()==='POST',{timeout:45000});
 await page.locator('button.jy-calc-btn').click();
 const response=await result;
 expect(response.status(),'real Reader API must be healthy').toBe(200);
 const json=await response.json();
 expect(json.readerV8?.integrated?.version).toBe('n49-unified-evidence-v1');
 expect(json.readerV8?.integrated?.links).toHaveLength(15);
 expect(json.readerV8?.integrated?.threads).toHaveLength(5);
 expect(json.ai?.fallbackReason).toBe('reader_only');
 return json;
}
for(const lang of ['uk','en']){
 test('N4.9 real-Swiss '+lang+': one coherent reading, evidence disclosures, 7 widths and screenshots',async({page},testInfo)=>{
  const report=await createInventedBirth(page,lang);
  const reader=page.getByTestId('reader-v8');
  const story=page.getByTestId('reader-v8-synthesis');
  await expect(reader).toBeVisible();
  await expect(story).toBeVisible();
  await expect(story).toContainText(lang==='uk'?'Єдиний портрет':'One portrait');
  await expect(story.locator('[data-testid^="reader-n49-thread-"]')).toHaveCount(5);
  await expect(reader.locator('[data-testid^="reader-v8-D"]')).toHaveCount(15);
  await expect(reader.getByTestId('reader-v8-d60')).toHaveCount(1);
  await expect(reader.locator('[data-testid="reader-v8-synthesis"]')).toHaveCount(1);
  await expect(page.getByTestId('jyotish-direct-consultation')).toHaveCount(0);
  await expect(page.getByTestId('reading-ai-provenance')).toContainText('Jyotish Reader');
  const career=page.getByTestId('reader-n49-thread-career');
  await expect(career).toContainText(lang==='uk'?'D10':'D10');
  await career.locator('summary').click();
  const careerCode=career.locator('code');
  await expect(careerCode).toContainText('D9.');
  await expect(careerCode).toContainText('D10.');
  await expect(career.locator('details')).toHaveAttribute('open','');
  const partnership=page.getByTestId('reader-n49-thread-partnership');
  await partnership.locator('summary').click();
  await expect(partnership.locator('code')).toContainText('D9.');
  const threads=report.readerV8.integrated.threads;
  const text=threads.map(t=>t.text).join(' ');
  expect(text).not.toMatch(/guaranteed destiny|scientifically proven personality|гарантовано станеться/iu);
  expect(new Set(threads.map(t=>t.text)).size).toBe(5);
  for(const width of [320,360,390,430,768,1024,1440]){
   await page.setViewportSize({width,height:850});
   await expect(story).toBeVisible();
   const sizes=await page.evaluate(()=>{
    const root=document.documentElement;
    const story=document.querySelector('[data-testid="reader-v8-synthesis"]');
    if(!story)return {overflow:999,storyWidth:0};
    return {overflow:root.scrollWidth-root.clientWidth,
      storyWidth:story.getBoundingClientRect().width};
   });
   expect(sizes.overflow,'document overflow at '+width).toBeLessThanOrEqual(2);
   expect(sizes.storyWidth,'narrative visible at '+width).toBeGreaterThan(220);
   if([320,430,1440].includes(width)){
    await story.screenshot({path:testInfo.outputPath('n49-real-'+lang+'-'+width+'.png'),animations:'disabled',
     style:'.as-header{visibility:hidden!important}'});
   }
  }
 });
}
test('N4.9 uncertain minutes: warnings never certify fine D60 and reading remains accessible',async({page})=>{
 await createInventedBirth(page,'en');
 const story=page.getByTestId('reader-v8-synthesis');
 await expect(story).toBeVisible();
 // The birth details disclosure may collapse after the result; reopen it.
 const panel=page.locator('#birth-details');
 if(!(await panel.evaluate(el=>el.open)))await panel.locator(':scope > summary').click();
 await panel.locator('input[type="checkbox"]').check();
 await expect(story.getByRole('note')).toContainText('Birth time is approximate');
 const d60=page.getByTestId('reader-v8-d60');
 await expect(d60).toContainText('reliable birth time');
 await expect(page.getByTestId('reader-n49-thread-career')).toBeVisible();
});
