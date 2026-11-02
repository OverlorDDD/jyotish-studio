import {test,expect} from '@playwright/test';
const path='/api/v1/personal/panchanga/timing';
const qs='date=2026-11-02&zone=Europe%2FKyiv&latitude=50.4501&longitude=30.5234';
test('P3.4 private endpoint is unavailable to unauthenticated visitors',async({request})=>{
 const response=await request.get(path+'?'+qs);
 expect(response.status()).toBe(401);
 expect(response.headers()['cache-control']).toContain('no-store');
});
for(const locale of ['uk','en']){
 test('P3.4 '+locale+' shows change-point windows without a duplicate daily verdict',async({page})=>{
  test.setTimeout(150000);
  await page.goto('/'+locale+'/panchanga?date=2026-11-02');
  const card=page.getByTestId('p31-my-day');
  await expect(card.getByTestId('p32-headline')).toHaveCount(1,{timeout:90000});
  const timing=card.getByTestId('p34-timing');
  const button=timing.getByRole('button',{name:locale==='uk'?'Показати години':'Show time windows'});
  await expect(button).toHaveAttribute('aria-expanded','false');
  await button.click();
  await expect(timing.getByTestId('p34-expanded')).toBeVisible();
  await expect(timing.getByTestId('p34-windows').locator('li').first()).toBeVisible();
  await expect(timing.getByTestId('p34-scope')).toContainText(
   locale==='uk'?'Загальна шкала':'General timeline');
  await expect(card.getByTestId('p32-headline')).toHaveCount(1);
  await card.getByRole('button',{name:locale==='uk'?'Поїздки':'Travel'}).click();
  await expect(timing.getByTestId('p34-alternative')).toBeVisible();
 });
}
