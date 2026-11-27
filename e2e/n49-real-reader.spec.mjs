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
const CHAPTERS=['self','money','work','love','home','path','timing','summary'];
for(const lang of ['uk','en']){
 test('Reader 10 '+lang+': plain reading first, astrology one tap away, every divisional chart used, mobile layout',async({page},testInfo)=>{
  const report=await createInventedBirth(page,lang);
  expect(report.reader10?.version).toBe('reader10-plain-1');
  expect(report.reader10.chapters.map(c=>c.id)).toEqual(CHAPTERS);
  const reader=page.getByTestId('reader10');
  await expect(reader).toBeVisible();
  await expect(reader.locator(':scope > h2')).toHaveText(lang==='uk'?'Трактування вашої карти':'Your chart reading');
  await expect(reader.locator(':scope > article')).toHaveCount(8);
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
  // N6.4 compact proof is the actual visible contract, not just the retained
  // legacy details. Verify every chapter against the real API, in both locales.
  for(const c of report.reader10.chapters.filter(c=>c.details)){
   expect(c.details.compact,'compact proof for '+c.id).toBeDefined();
   const compact=c.details.compact;
   expect(compact.length).toBeGreaterThan(0);
   expect(new Set(compact).size).toBe(compact.length);
   const block=reader.getByTestId('reader10-'+c.id+'-details');
   const rendered=await block.locator(':scope > p').allTextContents();
   // Links occupy their own trailing paragraph; no repeated basis paragraph.
   expect(rendered.slice(0,compact.length)).toEqual(compact);
   expect(rendered.length).toBe(compact.length+(c.details.links.length?1:0));
  }
  const money=report.reader10.chapters.find(c=>c.id==='money').details.compact;
  const hora=money.filter(row=>row.startsWith('D2 ('));
  expect(hora).toHaveLength(1);
  expect(hora[0]).not.toMatch(/чужій|своїй|own hora|other hora|\d+-й дім|\bH\d+\b/iu);
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
 await page.getByRole('link',{name:'Edit birth details'}).click();
 const refreshed=page.waitForResponse(r=>r.url().includes('/api/v1/reports')&&r.request().method()==='POST'&&r.request().postDataJSON().minutesUncertain===true);
 await details.locator('input[type="checkbox"]').check();
 const response=await refreshed;expect(response.ok()).toBe(true);
 const report=await response.json();expect(report.ai.fallbackReason).toBe('reader_only');expect(report.minutesUncertain).toBe(true);
 expect(report.reader10.chapters.flatMap(c=>[c.lead,...c.paragraphs,...(c.details?.paragraphs||[]),...(c.details?.compact||[]),c.details?.basis||'']).join(' ')).not.toMatch(/D60(?=[: ])|Shashtiamsha/i);
 // Returning to the result uses the refreshed reading for this same chart.
 await page.goForward();
 await expect(reader.getByRole('note')).toContainText('Your birth time is marked approximate');
 await expect(reader.getByRole('note')).toHaveCount(1);
 // Generic educational links can name the full D2–D60 range; only
 // personalized prose and proof must omit D60 when time is approximate.
 const personalText=await reader.locator(':scope > article > p, :scope > article > details > p:not(:has(a))').allTextContents();
 expect(personalText.join(' ')).not.toMatch(/D60(?=[: (])|Shashtiamsha/i);
 await expect(reader.locator(':scope > article')).toHaveCount(8);
});
