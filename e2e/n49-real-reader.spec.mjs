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
 expect(json.readerV8?.meaningful?.cards[0]?.division).toBe(1);
 expect(json.readerV8?.meaningful?.cards[15]?.division).toBe(60);
 expect(json.readerV8?.d60Preview?.allPlanets).toHaveLength(9);
 expect(json.ai?.fallbackReason).toBe('reader_only');
 return json;
}
for(const lang of ['uk','en']){
 test('N4.9.6 '+lang+': five distinct life stories, sixteen optional charts, no raw keys or books',async({page},testInfo)=>{
  const report=await createInventedBirth(page,lang);
  expect(report.readerV8.meaningful.portrait?.version).toBe('n496-human-portrait-1.0.0');
  const reader=page.getByTestId('reader-v8');
  await expect(reader).toBeVisible();
  const areas=reader.getByTestId('reader-n496-five-themes');
  await expect(areas.locator(':scope > article')).toHaveCount(5);
  for(const id of ['identity','money','career','relationships','roots']){
   await expect(reader.getByTestId('reader-n496-area-'+id)).toBeVisible();
   const area=report.readerV8.meaningful.portrait.areas.find(x=>x.id===id);
   await expect(reader.getByTestId('reader-n496-story-'+id)).toHaveText(area.story);
   await expect(reader.getByTestId('reader-n496-area-'+id)).toContainText(area.action);
  }
  await expect(reader.getByTestId('reader-n493-top-insights')).toHaveCount(0);
  await expect(reader.getByTestId('reader-n492-final')).toHaveCount(0);
  const visibleText=await areas.innerText();
  expect(visibleText).not.toMatch(/D1\\.|house-lord|Brihat Jataka|Laghu Parashari|Астрологічна основа:|Astrological basis:/i);
  const deep=reader.getByTestId('reader-n492-all-16-details');
  await expect(deep).not.toHaveAttribute('open','');
  await expect(reader.getByTestId('reader-v8-d60')).not.toBeVisible();
  await deep.locator(':scope > summary').click();
  await expect(deep).toHaveAttribute('open','');
  const cards=reader.getByTestId('reader-n492-16-cards');
  await expect(cards.locator(':scope > article')).toHaveCount(16);
  await expect(reader.locator('[data-testid^="reader-v8-D"]')).toHaveCount(15);
  await expect(reader.getByTestId('reader-v8-d60')).toBeVisible();
  await expect(reader.getByTestId('reader-n492-meaning-D60')).toContainText(lang==='uk'?'Практичний крок:':'Practical step:');
  const d60=reader.getByTestId('reader-v8-d60');
  await d60.getByText(lang==='uk'?'Дев’ять положень планет':'Nine planetary placements').click();
  await expect(reader.getByTestId('reader-n492-d60-nine').locator(':scope > div')).toHaveCount(9);
  await expect(reader.locator('code')).toHaveCount(0);
  expect(await reader.innerText()).not.toMatch(/D1\\.house-lord/);
  await expect(page.getByTestId('reading-ai-provenance')).toContainText('Jyotish Reader');
  const ordered=report.readerV8.meaningful.cards.map(c=>c.division);
  expect(ordered).toEqual([1,2,3,4,7,9,10,12,16,20,24,27,30,40,45,60]);
  for(const width of [320,360,390,430,768,1024,1440]){
   await page.setViewportSize({width,height:850});
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   expect(overflow,'horizontal overflow at '+width).toBeLessThanOrEqual(2);
   await expect(reader.getByTestId('reader-n496-area-money')).toBeVisible();
   if([320,430,1440].includes(width)){
    await reader.getByTestId('reader-n496-area-money').screenshot({
     path:testInfo.outputPath('n496-life-money-'+lang+'-'+width+'.png'),
     animations:'disabled',style:'.as-header{visibility:hidden!important}'
    });
   }
  }
 });
}
test('N4.9.2 time precision warning without removing 16 cards',async({page})=>{
 await createInventedBirth(page,'en');
 const reader=page.getByTestId('reader-v8');
 const details=page.locator('#birth-details');
 if(!(await details.evaluate(el=>el.open)))await details.locator(':scope > summary').click();
 await details.locator('input[type="checkbox"]').check();
 await expect(reader.getByRole('note')).toContainText('Birth time is marked approximate');
 await expect(reader.getByTestId('reader-n496-five-themes').locator(':scope > article')).toHaveCount(5);
 await reader.getByTestId('reader-n492-all-16-details').locator(':scope > summary').click();
 await expect(reader.getByTestId('reader-v8-d60').getByTestId('reader-n492-meaning-D60')).toContainText('Practical step:');
 await expect(reader.getByTestId('reader-v8-d60')).not.toContainText('entered instant');
 await expect(reader.getByTestId('reader-n492-16-cards').locator(':scope > article')).toHaveCount(16);
});
