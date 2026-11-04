import {test,expect} from '@playwright/test';

const eventData=async page=>page.evaluate(
 ()=>Array.from(window.dataLayer||[])
  .filter(a=>a?.[0]==='event')
  .map(a=>({name:a[1],params:a[2]||{}}))
);

test('G3 events require analytics opt-in and never send arbitrary private payloads',async({page})=>{
 await page.route(/googletagmanager\.com|google-analytics\.com/,route=>
  route.fulfill({status:200,contentType:'application/javascript',body:''}));
 await page.goto('/en/tarot?question=PRIVATE_G3_TEST');
 await expect(page.getByRole('button',{name:'Allow analytics'})).toBeVisible();
 expect((await eventData(page)).filter(x=>x.name?.startsWith('public_tool_'))).toHaveLength(0);
 await page.getByRole('button',{name:'Allow analytics'}).click();
 await expect.poll(async()=>(await eventData(page)).some(e=>e.name==='public_tool_viewed'&&e.params.tool==='tarot')).toBe(true);
 const before=(await eventData(page)).length;
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('galaxiora:growth',{
  detail:{name:'public_tool_started',tool:'jyotish',question:'PRIVATE_G3_TEST'}
 })));
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('galaxiora:growth',{
  detail:{name:'public_tool_started',tool:'tarot',question:'PRIVATE_G3_TEST',birth:'PRIVATE_G3_TEST'}
 })));
 const after=await eventData(page);
 expect(after.length).toBe(before+1);
 const last=after.at(-1);
 expect(last.name).toBe('public_tool_started');
 expect(last.params.tool).toBe('tarot');
 expect(last.params.locale).toBe('en');
 expect(Object.keys(last.params).sort()).toEqual(['locale','send_to','tool']);
 const serialized=JSON.stringify(after);
 expect(serialized).not.toContain('PRIVATE_G3_TEST');
});

test('G3 automatic Panchanga day load does not count as explicit user completion',async({page})=>{
 await page.route(/googletagmanager\.com|google-analytics\.com/,route=>
  route.fulfill({status:200,contentType:'application/javascript',body:''}));
 await page.goto('/en/panchanga');
 await page.getByRole('button',{name:'Allow analytics'}).click();
 await expect.poll(async()=>(await eventData(page)).some(e=>e.name==='public_tool_viewed'&&e.params.tool==='panchanga')).toBe(true);
 // Default place/day GET may still emit the old legacy metric, which is NOT a
 // user-completion KPI. It must never be counted as public_tool_completed.
 await page.waitForTimeout(1500);
 const e=await eventData(page);
 expect(e.some(x=>x.name==='public_tool_completed'&&x.params.tool==='panchanga')).toBe(false);
});
