import {test,expect} from '@playwright/test';
const parameters='zone=Europe%2FKyiv&latitude=50.4501&longitude=30.5234';
test('P2.2 Swiss-backed periods cover every limb without fabricated 24-hour cutoffs',async({request})=>{
 test.setTimeout(120000);
 const res=await request.get('/api/v1/panchanga/day?date=2026-11-02&'+parameters);
 expect(res.status(),await res.text()).toBe(200);
 const day=await res.json();
 for(const kind of ['tithi','nakshatra','yoga','karana']){
  const parts=day.periods?.[kind];
  expect(parts?.length).toBeGreaterThan(0);
  expect(Date.parse(parts[0].startUtc)).toBeLessThanOrEqual(Date.parse(day.sunriseUtc));
  expect(Date.parse(parts.at(-1).endUtc)).toBeGreaterThanOrEqual(Date.parse(day.nextSunriseUtc));
  for(let i=1;i<parts.length;i++){
   expect(parts[i].startUtc).toBe(parts[i-1].endUtc);
   expect(parts[i].index).toBeGreaterThan(0);
  }
  const transitions=day.changes.filter(e=>e.kind===kind);
  expect(parts.length).toBe(transitions.length+1);
  for(let i=0;i<transitions.length;i++){
   expect(transitions[i].atUtc).toBe(parts[i+1].startUtc);
   expect(transitions[i].nextIndex).toBe(parts[i+1].index);
  }
 }
});
for(const locale of ['uk','en']){
 test('P2.2 '+locale+' exposes named transitions and all four chronological tracks',async({page})=>{
  test.setTimeout(120000);
  await page.goto('/'+locale+'/panchanga');
  await page.getByLabel(locale==='uk'?'Дата':'Date').fill('2026-11-02');
  await page.getByRole('button',{name:locale==='uk'?'Розрахувати день':'Calculate day'}).click();
  await expect(page.getByTestId('panchanga-five-angas').locator('article')).toHaveCount(5,{timeout:90000});
  for(const kind of ['tithi','nakshatra','yoga','karana'])
   await expect(page.getByTestId('panchanga-lane-'+kind)).toBeVisible();
  const list=page.getByTestId('panchanga-named-transitions');
  await expect(list).toBeVisible();
  expect(await list.locator('li').count()).toBeGreaterThan(0);
  await expect(list).not.toContainText(/#\d+/);
  await page.getByRole('button',{name:locale==='uk'?'Сховати всі переходи':'Hide all transitions'}).click();
  await expect(list).toHaveCount(0);
  await page.getByRole('button',{name:locale==='uk'?'Показати всі переходи':'Show all transitions'}).click();
  await expect(list).toBeVisible();
 });
}
