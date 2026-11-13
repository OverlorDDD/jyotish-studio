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

for(const locale of ['uk','en']){
 test('Panchanga Today '+locale+' mobile 390/320: full page, explanation block and FAQ',async({page})=>{
  test.setTimeout(180000);
  await page.setViewportSize({width:390,height:844});
  await page.goto('/'+locale+'/panchanga?date=2026-11-03');
  await rejectAnalyticsIfPrompted(page);
  const hub=page.getByTestId('panchanga-hub');
  await expect(hub.locator('#pt-verdict')).toBeVisible({timeout:90000});
  await expect(hub.getByTestId('panchanga-activity')).toHaveCount(9,{timeout:90000});
  await expect(page.getByTestId('g32-organic-panchanga')).toBeVisible();
  const faq=page.getByTestId('panchanga-faq');
  await expect(faq.locator('details')).toHaveCount(5);
  await faq.locator('summary').first().click();
  await expect(faq.locator('details').first().locator('p')).toBeVisible();
  const ld=await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(ld.some(x=>x.includes('"FAQPage"'))).toBe(true);
  for(const width of [390,320]){
   await page.setViewportSize({width,height:740});
   await noOverflow(page);
  }
 });
}

test('Panchanga page blocks share one column on desktop',async({page})=>{
 test.setTimeout(150000);
 await page.setViewportSize({width:1536,height:900});
 await page.goto('/uk/panchanga?date=2026-11-03');
 await rejectAnalyticsIfPrompted(page);
 await expect(page.locator('#pt-verdict')).toBeVisible({timeout:90000});
 const edges=await page.evaluate(()=>['panchanga-quick-links','panchanga-hub','g32-organic-panchanga','panchanga-faq','panchanga-city-index']
  .map(id=>{const b=document.querySelector('[data-testid="'+id+'"]').getBoundingClientRect();return [Math.round(b.left),Math.round(b.width)];}));
 for(const [left,width] of edges){expect(Math.abs(left-edges[1][0])).toBeLessThanOrEqual(2);expect(Math.abs(width-edges[1][1])).toBeLessThanOrEqual(2);}
});
