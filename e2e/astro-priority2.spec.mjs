import {test,expect} from '@playwright/test';
for(const locale of ['uk','en']){
 test('Panchanga '+locale+' finds an arbitrary worldwide city and updates coordinates/IANA zone in one action',async({page})=>{
  await page.route('**/api/v1/panchanga/cities?**',async route=>{
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
    source:'Open-Meteo Geocoding',items:[{
     id:'987654',name:'Kremenchuk',region:'Poltava',country:'Ukraine',
     latitude:49.0665,longitude:33.4139,timeZone:'Europe/Kyiv'}]
   })});
  });
  await page.goto('/'+locale+'/panchanga');
  const box=page.getByTestId('global-city-search');
  await expect(box).toBeVisible();
  await box.getByRole('searchbox').fill('Kremenchuk');
  // Clean observer intentionally omits raw coordinate controls. Assert the real API contract.
  const calculation=page.waitForRequest(request=>{
   if(!request.url().includes('/api/v1/panchanga/day?'))return false;
   const params=new URL(request.url()).searchParams;
   return params.get('latitude')==='49.0665'&&
    params.get('longitude')==='33.4139'&&params.get('zone')==='Europe/Kyiv';
  },{timeout:30000});
  await box.getByRole('option',{name:/Kremenchuk/}).click();
  await calculation;
  await expect(box.getByRole('searchbox')).toHaveValue(/Kremenchuk/);
 });
 test('Astronomical events '+locale+' teach the physical meaning and a practical tradition-separated suggestion',async({page})=>{
  await page.goto('/'+locale+'/panchanga');
  const panel=page.getByTestId('astronomical-events-panel');
  await expect(panel.locator('li').first()).toBeVisible({timeout:90000});
  await panel.locator('li details summary').first().click();
  await expect(panel.locator('li details').first()).toHaveAttribute('open','');
  await expect(panel.locator('li details').first().locator('p').first()).toBeVisible();
 });
 test('Yoga '+locale+' offers a lunar practice calendar based on actual Swiss phase API',async({page})=>{
  await page.goto('/'+locale+'/yoga');
  const p=page.getByTestId('yoga-lunar-guide');
  await expect(p).toBeVisible();
  await expect(p.locator('a[href*="/yoga/"]').first()).toBeVisible({timeout:90000});
 });
}
