import {test,expect} from '@playwright/test';
// Wait for the hydrated consent prompt before interacting with mobile UI.
// Reject via the actual button; R4.2 independently tests opt-in and revocation.
async function rejectAnalyticsIfPrompted(page){
 const dialog=page.getByRole('dialog',{name:/Аналітика відвідувань|Visitor analytics/});
 try { await dialog.waitFor({state:'visible',timeout:8000}); }
 catch { return; } // Previously decided consent or prompt intentionally absent.
 await dialog.getByRole('button',{name:/Відхилити|Reject/}).click();
 await expect(dialog).toHaveCount(0);
}
const noOverflow=async page=>{
 const d=await page.evaluate(()=>({w:window.innerWidth,s:document.documentElement.scrollWidth}));
 expect(d.s).toBeLessThanOrEqual(d.w+2);
};

// Panchanga Today: verdict, hours of the day, activity cards, no calendar-file download.
const DAY='2026-11-05';
for(const locale of ['uk','en']){
 for(const width of [320,390]){
  test('Panchanga Today '+locale+' '+width+'px: verdict, hours and nine activity cards',async({page})=>{
   test.setTimeout(180000);
   await page.setViewportSize({width,height:800});
   await page.goto('/'+locale+'/panchanga?date='+DAY);
   await rejectAnalyticsIfPrompted(page);
   const hub=page.getByTestId('panchanga-hub');
   await expect(hub.getByRole('heading',{level:1})).toHaveText(locale==='uk'?'Панчанга на сьогодні':'Panchang today');
   await expect(hub.locator('#pt-verdict')).toBeVisible({timeout:90000});
   const hours=hub.getByTestId('panchanga-hours');
   await expect(hours.getByRole('tab')).toHaveCount(2,{timeout:90000});
   expect(await hours.locator('ol li').count()).toBeGreaterThan(3);
   await hours.getByRole('tab').nth(1).click();
   await expect(hours.getByRole('tab').nth(1)).toHaveAttribute('aria-selected','true');
   await expect(hub.getByTestId('panchanga-activity')).toHaveCount(9);
   await expect(hub).not.toContainText('.ics');
   await expect(hub.locator('a[download]')).toHaveCount(0);
   await expect(hub.getByTestId('p390-favorability-ring')).toHaveCount(0);
   await noOverflow(page);
  });
 }
}
test('Panchanga Today has no duplicate personal calendar block and the private API stays protected',async({page,request})=>{
 test.setTimeout(120000);
 await page.goto('/en/panchanga?date='+DAY);
 await rejectAnalyticsIfPrompted(page);
 await expect(page.locator('#pt-verdict')).toBeVisible({timeout:90000});
 await expect(page.getByTestId('p410-personal')).toHaveCount(0);
 await expect(page.getByTestId('panchanga-day-cell')).toHaveCount(0);
 const q=new URLSearchParams({date:DAY,zone:'Europe/Kyiv',latitude:'50.4501',
  longitude:'30.5234',at:'2026-11-05T10:00:00.000Z'});
 const privateResponse=await request.get('/api/v1/personal/panchanga/resonance?'+q);
 expect(privateResponse.status()).toBe(401);
});
