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
 expect(json.readerV8?.compactCards).toHaveLength(15);
 expect(json.readerV8?.meaningReader?.version).toBe('n492-meaning-first-16-v1');
 expect(json.readerV8?.meaningReader?.cards).toHaveLength(16);
 expect(json.readerV8?.meaningReader?.takeaways).toHaveLength(3);
 expect(json.readerV8?.d60Preview?.allPlanets).toHaveLength(9);
 expect(json.ai?.fallbackReason).toBe('reader_only');
 return json;
}
for(const lang of ['uk','en']){
 test('N4.9.2 '+lang+': real Swiss Reader shows meaningful D1–D60 sequentially and one short final synthesis',async({page},testInfo)=>{
  const report=await createInventedBirth(page,lang);
  const reader=page.getByTestId('reader-v8');
  await expect(reader).toBeVisible();
  await expect(reader.locator('[data-testid^="reader-v8-D"]')).toHaveCount(15);
  await expect(reader.getByTestId('reader-v8-d60')).toHaveCount(1);
  await expect(reader.getByTestId('reader-v8-synthesis')).toHaveCount(0);
  await expect(reader.locator('[data-testid^="reader-n49-thread-"]')).toHaveCount(0);
  await expect(reader.locator('[data-testid^="reader-v8-highlight-"]')).toHaveCount(0);
  await expect(reader.locator('[data-testid^="reader-n491-link-D"]')).toHaveCount(0);
  await expect(reader.getByTestId('reader-n492-d60-nine').locator(':scope > div')).toHaveCount(9);
  await expect(reader.getByTestId('reader-n492-conclusion')).toBeVisible();
  await expect(reader.locator('[data-testid^="reader-n492-takeaway-"]')).toHaveCount(3);
  await expect(page.getByText('Поглиблене астрологічне пояснення — за бажанням')).toHaveCount(0);
  await expect(page.getByText('Optional detailed traditional interpretation')).toHaveCount(0);
  await expect(page.getByTestId('jyotish-direct-consultation')).toHaveCount(0);
  await expect(page.getByTestId('reading-ai-provenance')).toContainText('Jyotish Reader');
  const cards=report.readerV8.meaningReader.cards;
  expect(cards.map(c=>c.division)).toEqual([1,2,3,4,7,9,10,12,16,20,24,27,30,40,45,60]);
  for(const division of [1,2,7,9,10,24,27,30]){
   const card=reader.getByTestId('reader-v8-D'+division);
   await expect(card).toContainText(cards.find(c=>c.division===division).reading);
   await card.locator('details summary').click();
   await expect(card.locator('details code')).toContainText('D1.');
   if(division!==1)await expect(card.locator('details code')).toContainText('D'+division+'.');
  }
  for(const width of [320,360,390,430,768,1024,1440]){
   await page.setViewportSize({width,height:850});
   await expect(reader.getByTestId('reader-v8-D10')).toBeVisible();
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   expect(overflow,'Reader horizontal overflow '+width).toBeLessThanOrEqual(2);
   if([320,430,1440].includes(width)){
    await reader.getByTestId('reader-v8-D10').screenshot({
     path:testInfo.outputPath('n492-career-'+lang+'-'+width+'.png'),
     animations:'disabled',style:'.as-header{visibility:hidden!important}'
    });
    await reader.getByTestId('reader-v8-d60').screenshot({
     path:testInfo.outputPath('n492-d60-'+lang+'-'+width+'.png'),
     animations:'disabled',style:'.as-header{visibility:hidden!important}'
    });
    await reader.getByTestId('reader-n492-conclusion').screenshot({
     path:testInfo.outputPath('n492-conclusion-'+lang+'-'+width+'.png'),
     animations:'disabled',style:'.as-header{visibility:hidden!important}'
    });
   }
  }
 });
}
test('N4.9.2 approximate birth minutes keep all 15 D themes but prohibit D60 personal interpretation',async({page})=>{
 await createInventedBirth(page,'en');
 const reader=page.getByTestId('reader-v8');
 const panel=page.locator('#birth-details');
 if(!(await panel.evaluate(el=>el.open)))await panel.locator(':scope > summary').click();
 await panel.locator('input[type="checkbox"]').check();
 await expect(reader.getByTestId('reader-v8-d60')).toContainText('Birth time is marked approximate');
 await expect(reader.locator('[data-testid^="reader-v8-D"]')).toHaveCount(15);
});
