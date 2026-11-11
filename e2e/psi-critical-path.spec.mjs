import {test,expect} from '@playwright/test';

// Regression for PSI's agent accessibility violation on the shared city picker.
// Stub geocoding so keyboard semantics are deterministic and need no external API.
for(const locale of ['en','uk']){
 test('PSI city combobox supports arrow keys and Enter in '+locale,async({page})=>{
  await page.route('**/api/v1/panchanga/cities?**',async route=>{
   await route.fulfill({status:200,contentType:'application/json',
    body:JSON.stringify({items:[
     {id:'london-test',name:'London',region:'England',country:'United Kingdom',latitude:51.5,longitude:-0.12,timeZone:'Europe/London'},
     {id:'londonderry-test',name:'Londonderry',region:'Northern Ireland',country:'United Kingdom',latitude:55,longitude:-7.3,timeZone:'Europe/London'}
    ]})});
  });
  await page.goto('/'+locale+'/astrology/jyotish');
  const input=page.locator('input[role="combobox"]#global-city-input');
  await expect(input).toBeVisible();
  await expect(input).toHaveAttribute('aria-expanded','false');
  await input.fill('Lon');
  const list=page.getByRole('listbox');
  await expect(list).toBeVisible();
  await expect(list.getByRole('option')).toHaveCount(2);
  await expect(input).toHaveAttribute('aria-expanded','true');
  await input.press('ArrowDown');
  await expect(list.getByRole('option').first()).toHaveAttribute('aria-selected','true');
  await expect(input).toHaveAttribute('aria-activedescendant',/option-0$/);
  await input.press('Enter');
  await expect(input).toHaveValue(/London, England, United Kingdom/);
  await expect(input).toHaveAttribute('aria-expanded','false');
  await expect(list).toHaveCount(0);
 });
}
