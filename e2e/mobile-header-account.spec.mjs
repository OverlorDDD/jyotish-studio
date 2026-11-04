import {test,expect} from '@playwright/test';
// These scenarios exercise navigation/layout, not analytics consent. Reject tracking
// through the real UI; dedicated R4.2 tests assert the consent gate itself.
async function rejectAnalyticsIfPrompted(page){
 const dialog=page.getByRole('dialog',{name:/Аналітика відвідувань|Visitor analytics/});
 if(await dialog.isVisible()){
  await dialog.getByRole('button',{name:/Відхилити|Reject/}).click();
  await expect(dialog).toHaveCount(0);
 }
}


const phones=[
 {label:'narrow-android',width:320,height:640},
 {label:'android-chrome',width:360,height:800},
 {label:'pixel-sized',width:393,height:851},
 {label:'oneplus-11r-css',width:412,height:915},
];
for(const phone of phones){
 test('global login stays fully inside '+phone.label+' viewport',async({page})=>{
  await page.setViewportSize({width:phone.width,height:phone.height});
  await page.goto('/uk');
  await rejectAnalyticsIfPrompted(page);
  const button=page.locator('.as-account-trigger');
  await expect(button).toBeVisible();
  const header=page.locator('.as-header');
  const bounds=await header.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(-1);
  expect(bounds.x+bounds.width).toBeLessThanOrEqual(phone.width+1);
  const trigger=await button.boundingBox();
  expect(trigger.x).toBeGreaterThanOrEqual(-1);
  expect(trigger.x+trigger.width).toBeLessThanOrEqual(phone.width+1);
  // Nav scrolls within its own row, never makes the WHOLE document wide.
  const widths=await page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:window.innerWidth}));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport+1);
  await button.click();
  const dialog=page.getByRole('dialog',{name:'Обліковий запис'});
  await expect(dialog).toBeVisible();
  const popup=await dialog.boundingBox();
  expect(popup.x).toBeGreaterThanOrEqual(0);
  expect(popup.x+popup.width).toBeLessThanOrEqual(phone.width+1);
  expect(popup.y).toBeGreaterThanOrEqual(-1);
  expect(popup.y+popup.height).toBeLessThanOrEqual(phone.height+1);
  await expect(dialog.locator('#global-email')).toBeVisible();
  await expect(dialog.locator('#global-password')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(button).toBeFocused();
  await button.click();
  await dialog.getByRole('button',{name:'Створити акаунт'}).click();
  await expect(dialog.getByRole('heading',{name:'Реєстрація'})).toBeVisible();
  const after=await dialog.boundingBox();
  expect(after.x).toBeGreaterThanOrEqual(0);
  expect(after.x+after.width).toBeLessThanOrEqual(phone.width+1);
  await dialog.getByRole('button',{name:'Закрити вікно'}).click();
  await expect(dialog).toHaveCount(0);
 });
}
test('desktop account dialog opens next to the button and never clips left viewport',async({page})=>{
 await page.setViewportSize({width:1280,height:800});
 await page.goto('/en');
  await rejectAnalyticsIfPrompted(page);
 const trigger=page.locator('.as-account-trigger');
 await trigger.click();
 const dialog=page.getByRole('dialog',{name:'Account'});
 await expect(dialog).toBeVisible();
 const bounds=await dialog.boundingBox(),button=await trigger.boundingBox();
 expect(bounds.x).toBeGreaterThanOrEqual(0);
 expect(bounds.x+bounds.width).toBeLessThanOrEqual(1281);
 expect(bounds.y).toBeGreaterThanOrEqual(button.y);
 await page.mouse.click(4,4);
 await expect(dialog).toHaveCount(0);
});
