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
 expect(json.readerV8?.meaningful?.cards).toHaveLength(16);
 expect(json.readerV8?.quality?.version).toBe('n493-ranked-evidence-16-varga-v1');
 expect(json.readerV8?.quality?.cards).toHaveLength(16);
 expect(json.readerV8?.quality?.patterns?.length).toBeGreaterThanOrEqual(3);
 expect(json.readerV8?.meaningful?.cards[0]?.division).toBe(1);
 expect(json.readerV8?.meaningful?.cards[15]?.division).toBe(60);
 expect(json.readerV8?.d60Preview?.allPlanets).toHaveLength(9);
 expect(json.ai?.fallbackReason).toBe('reader_only');
 return json;
}
for(const lang of ['uk','en']){
 test('N4.9.3 '+lang+': 3–5 ranked evidence findings and sixteen cards plus final synthesis',async({page},testInfo)=>{
  const report=await createInventedBirth(page,lang);
  const reader=page.getByTestId('reader-v8');
  await expect(reader).toBeVisible();
  const patterns=reader.getByTestId('reader-n493-patterns').locator(':scope > article');
  const quality=report.readerV8.quality;
  await expect(patterns).toHaveCount(quality.patterns.length);
  expect(quality.patterns.length).toBeGreaterThanOrEqual(3);
  expect(quality.patterns.length).toBeLessThanOrEqual(5);
  await expect(reader.getByTestId('reader-n493-16-cards').locator(':scope > article')).toHaveCount(16);
  await expect(reader.locator('[data-testid^="reader-v8-D"]')).toHaveCount(15);
  await expect(reader.getByTestId('reader-v8-d60')).toBeVisible();
  await expect(reader.getByTestId('reader-n493-d60-nine').locator(':scope > div')).toHaveCount(9);
  await expect(reader.getByTestId('reader-n493-final')).toBeVisible();
  await expect(reader.getByTestId('reader-v8-synthesis')).toHaveCount(0);
  await expect(page.getByText('Поглиблене астрологічне пояснення — за бажанням')).toHaveCount(0);
  await expect(page.getByText('Optional detailed traditional interpretation')).toHaveCount(0);
  await expect(page.getByTestId('reading-ai-provenance')).toContainText('Jyotish Reader');
  const ordered=quality.cards.map(c=>c.division);
  expect(ordered).toEqual([1,2,3,4,7,9,10,12,16,20,24,27,30,40,45,60]);
  for(const d of [1,2,9,10,24,60]){
   const card=d===60?reader.getByTestId('reader-v8-d60'):reader.getByTestId('reader-v8-D'+d);
   const obj=quality.cards.find(x=>x.division===d);
   await expect(card).toContainText(obj.title);
   await expect(card).toContainText(obj.meaning.slice(0,60));
   await card.locator('details summary').click();
   await expect(card.locator('details code')).toContainText('D1.');
  }
  await expect(reader.getByTestId('reader-n493-final')).toContainText(quality.summary.portrait.slice(0,60));
  for(const width of [320,360,390,430,768,1024,1440]){
   await page.setViewportSize({width,height:850});
   await expect(reader.getByTestId('reader-v8-D10')).toBeVisible();
   const spill=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   expect(spill,'horizontal overflow '+width).toBeLessThanOrEqual(2);
   if([320,430,1440].includes(width)){
    for(const id of ['reader-n493-patterns','reader-v8-D10','reader-v8-d60','reader-n493-final']){
     await reader.getByTestId(id).screenshot({
      path:testInfo.outputPath('n493-'+id+'-'+lang+'-'+width+'.png'),
      animations:'disabled',style:'.as-header{visibility:hidden!important}'
     });
    }
   }
  }
 });
}
test('N4.9.3 unknown exact minutes retains D1–D45 and shows conditional D60',async({page})=>{
 await createInventedBirth(page,'en');
 const reader=page.getByTestId('reader-v8');
 const details=page.locator('#birth-details');
 if(!(await details.evaluate(el=>el.open)))await details.locator(':scope > summary').click();
 await details.locator('input[type="checkbox"]').check();
 await expect(reader.getByRole('note')).toContainText('Birth time is marked approximate');
 await expect(reader.getByTestId('reader-v8-d60')).toBeVisible();
 await expect(reader.getByTestId('reader-n493-16-cards').locator(':scope > article')).toHaveCount(16);
});
