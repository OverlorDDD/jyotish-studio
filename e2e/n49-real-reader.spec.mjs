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
const CHAPTERS=['self','money','work','love','home','path','summary'];
for(const lang of ['uk','en']){
 test('Reader 10 '+lang+': plain reading first, astrology one tap away, every divisional chart used, mobile layout',async({page},testInfo)=>{
  const report=await createInventedBirth(page,lang);
  expect(report.reader10?.version).toBe('reader10-plain-1');
  expect(report.reader10.chapters.map(c=>c.id)).toEqual(CHAPTERS);
  const reader=page.getByTestId('reader10');
  await expect(reader).toBeVisible();
  await expect(reader.locator(':scope > h2')).toHaveText(lang==='uk'?'Трактування вашої карти':'Your chart reading');
  await expect(reader.locator(':scope > article')).toHaveCount(7);
  // The previous Reader view is no longer rendered next to the complete reading.
  await expect(page.getByTestId('reader-v8')).toHaveCount(0);
  for(const id of CHAPTERS){
   const chapter=reader.getByTestId('reader10-'+id);
   await expect(chapter.locator(':scope > h3')).not.toBeEmpty();
   expect(await chapter.locator(':scope > p').count()).toBeGreaterThanOrEqual(2);
  }
  const self=reader.getByTestId('reader10-self');
  await expect(self.locator('h3')).toHaveText(lang==='uk'?'Хто ви':'Who you are');
  await expect(self.locator(':scope > p').first()).toContainText(lang==='uk'?'Головна тема вашого життя':'The main theme of your life');
  // The visible plain layer carries no astrological terms; they live in the collapsed details.
  const plain=(await reader.locator(':scope > article > p').allInnerTexts()).join(' ');
  expect(plain).not.toMatch(lang==='uk'?/лагн|накшатр|управител|D\d/i:/lagna|nakshatra|\blord\b|D\d/i);
  const details=self.getByTestId('reader10-self-details');
  expect(await details.evaluate(el=>el.open)).toBe(false);
  await details.locator(':scope > summary').click();
  await expect(details).toContainText(lang==='uk'?'Лагна, тобто знак':'The lagna, the sign');
  await expect(details.locator('a[href^="/'+lang+'/nakshatra/"]')).toHaveCount(1);
  // Every supporting divisional chart is named somewhere in the single reading block.
  const text=await reader.evaluate(el=>el.textContent||'');
  for(const div of [2,3,4,7,9,10,12,16,20,24,27,30,40,45])expect(text,'D'+div+' is used').toContain('D'+div+' (');
  expect(text).not.toMatch(/undefined|NaN|D1\.ascendant|house-lord\.\d/);
  await expect(reader.locator('code')).toHaveCount(0);
  for(const width of [320,360,390,430,768,1024,1440]){
   await page.setViewportSize({width,height:850});
   if(width>=768){
    // D1 and the selected D9 must start at the same physical Y coordinate.
    const chartPair=page.getByTestId('n4-rc-explorer').locator('.jy-south-chart');
    await expect(chartPair).toHaveCount(2);
    const left=await chartPair.nth(0).boundingBox();
    const right=await chartPair.nth(1).boundingBox();
    expect(left&&right,'both charts have bounding boxes').toBeTruthy();
    expect(Math.abs(left.y-right.y),'D1/D9 chart top alignment at '+width).toBeLessThanOrEqual(2);
   }
   await expect(reader.getByTestId('reader10-work')).toBeVisible();
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   expect(overflow,'horizontal overflow at '+width).toBeLessThanOrEqual(2);
   if([320,1440].includes(width))await reader.getByTestId('reader10-work').screenshot({
    path:testInfo.outputPath('reader10-work-'+lang+'-'+width+'.png'),animations:'disabled'
   });
  }
 });
}
test('Reader 10 approximate birth time shows one note and keeps the full reading',async({page})=>{
 await createInventedBirth(page,'en');
 const reader=page.getByTestId('reader10');
 const details=page.locator('#birth-details');
 if(!(await details.evaluate(el=>el.open)))await details.locator(':scope > summary').click();
 await details.locator('input[type="checkbox"]').check();
 await expect(reader.getByRole('note')).toContainText('Your birth time is marked approximate');
 await expect(reader.getByRole('note')).toHaveCount(1);
 await expect(reader.locator(':scope > article')).toHaveCount(7);
});
