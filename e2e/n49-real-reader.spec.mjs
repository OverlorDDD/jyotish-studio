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
 test('N4.9.6 '+lang+': five readable life themes with all sixteen opt-in readings, live Swiss and mobile layout',async({page},testInfo)=>{
  const report=await createInventedBirth(page,lang);
  const reader=page.getByTestId('reader-v8');
  await expect(reader).toBeVisible();
  const guide=reader.getByTestId('reader-n497-varga-map');
  await expect(guide).toBeVisible();
  await expect(guide.locator(':scope > ol > li')).toHaveCount(16);
  for(const div of [1,2,3,4,7,9,10,12,16,20,24,27,30,40,45,60]){
   await expect(guide.getByTestId('reader-n497-varga-D'+div)).toContainText('D'+div);
  }
  for(const [topic,div] of [['money',2],['relationships',9],['career',10]]){
   await expect(reader.getByTestId('reader-n496-topic-'+topic).getByTestId('reader-v8-D'+div)).toContainText('D'+div);
  }
  const topics=reader.getByTestId('reader-n496-life-topics');
  await expect(topics.locator(':scope > section')).toHaveCount(5);
  for(const id of ['identity','money','career','relationships','roots']){
   const section=reader.getByTestId('reader-n496-topic-'+id);
   await expect(section).toBeVisible();
   await expect(section.locator(':scope > h3')).not.toBeEmpty();
   await expect(section.locator('article').first().locator('p').first()).not.toBeEmpty();
  }
  await expect(reader.getByTestId('reader-n496-topic-money')).toContainText(lang==='uk'?'Гроші й ресурси':'Money and resources');
  await expect(reader.getByTestId('reader-n496-topic-career')).toContainText(lang==='uk'?'Робота й покликання':'Career and purpose');
  // Raw proof keys, bibliography and D-indices never appear in the first-screen life narrative.
  const visible=await topics.locator(':scope > section').allTextContents();
  const initial=visible.map(x=>x.split(lang==='uk'?'Детальніше про цю сферу':'Explore this area')[0]).join(' ');
  expect(initial).not.toMatch(/D1\.ascendant|house-lord\.\d|Brihat Jataka|Laghu Parashari/);
  await expect(reader.locator('code')).toHaveCount(0);
  await expect(reader.getByTestId('reader-n492-final')).toBeVisible();
  expect(report.readerV8.meaningful.cards.map(c=>c.division)).toEqual([1,2,3,4,7,9,10,12,16,20,24,27,30,40,45,60]);
  // The eleven supplementary readings stay accessible but do not overwhelm a newcomer.
  for(const section of await topics.locator(':scope > section').all()){
   const expand=section.locator('details').filter({has:page.getByText(lang==='uk'?'Детальніше про цю сферу':'Explore this area')});
   if(await expand.count())await expand.locator(':scope > summary').click();
  }
  await expect(reader.locator('[data-testid^="reader-v8-D"]')).toHaveCount(15);
  await expect(reader.getByTestId('reader-v8-d60')).toBeVisible();
  await expect(reader.getByTestId('reader-v8-d60')).toContainText(lang==='uk'?'Що можна спробувати':'A practical step');
  await reader.getByTestId('reader-v8-d60').locator('details > summary').first().click();
  await reader.getByTestId('reader-v8-d60').locator('details details > summary').click();
  await expect(reader.getByTestId('reader-n492-d60-nine').locator(':scope > div')).toHaveCount(9);
  for(const width of [320,360,390,430,768,1024,1440]){
   await page.setViewportSize({width,height:850});
   await expect(reader.getByTestId('reader-n496-topic-career')).toBeVisible();
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   expect(overflow,'horizontal overflow at '+width).toBeLessThanOrEqual(2);
   if([320,1440].includes(width))await reader.getByTestId('reader-n496-topic-career').screenshot({
    path:testInfo.outputPath('n496-career-'+lang+'-'+width+'.png'),animations:'disabled'
   });
  }
 });
}
test('N4.9.6 approximate birth time keeps five life themes without repeated warnings',async({page})=>{
 await createInventedBirth(page,'en');
 const reader=page.getByTestId('reader-v8');
 const details=page.locator('#birth-details');
 if(!(await details.evaluate(el=>el.open)))await details.locator(':scope > summary').click();
 await details.locator('input[type="checkbox"]').check();
 await expect(reader.getByRole('note')).toContainText('Your birth time is marked approximate');
 await expect(reader.getByTestId('reader-n496-life-topics').locator(':scope > section')).toHaveCount(5);
 await expect(reader.locator('code')).toHaveCount(0);
});
