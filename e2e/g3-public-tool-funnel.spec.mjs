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
 expect((await eventData(page)).filter(x=>x.name?.startsWith('public_tool_'))).toHaveLength(0);
 await page.goto('/en/privacy');
 await page.getByRole('button',{name:'Allow analytics'}).click();
 await page.goto('/en/tarot?question=PRIVATE_G3_TEST');
 await expect.poll(async()=>(await eventData(page)).some(e=>e.name==='public_tool_viewed'&&e.params.tool==='tarot')).toBe(true);
 // Count only this funnel event. Background events may legitimately arrive
 // asynchronously on mobile (e.g. Tarot initialization or a page view).
 const started=events=>events.filter(x=>x.name==='public_tool_started');
 const before=started(await eventData(page));
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('galaxiora:growth',{
  detail:{name:'public_tool_started',tool:'jyotish',question:'PRIVATE_G3_TEST'}
 })));
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('galaxiora:growth',{
  detail:{name:'public_tool_started',tool:'tarot',question:'PRIVATE_G3_TEST',birth:'PRIVATE_G3_TEST'}
 })));
 await expect.poll(async()=>started(await eventData(page)).length).toBe(before.length+1);
 const after=await eventData(page);
 const accepted=started(after).slice(before.length);
 expect(accepted).toHaveLength(1);
 expect(accepted[0].name).toBe('public_tool_started');
 expect(accepted[0].params.tool).toBe('tarot');
 expect(accepted[0].params.locale).toBe('en');
 expect(Object.keys(accepted[0].params).sort()).toEqual(['locale','send_to','tool']);
 const serialized=JSON.stringify(after);
 expect(serialized).not.toContain('PRIVATE_G3_TEST');
});

test('G3 automatic Panchanga day load does not count as explicit user completion',async({page})=>{
 await page.route(/googletagmanager\.com|google-analytics\.com/,route=>
  route.fulfill({status:200,contentType:'application/javascript',body:''}));
 await page.goto('/en/privacy');
 await page.getByRole('button',{name:'Allow analytics'}).click();
 await page.goto('/en/panchanga');
 await expect.poll(async()=>(await eventData(page)).some(e=>e.name==='public_tool_viewed'&&e.params.tool==='panchanga')).toBe(true);
 // Default place/day GET may still emit the old legacy metric, which is NOT a
 // user-completion KPI. It must never be counted as public_tool_completed.
 await page.waitForTimeout(1500);
 const e=await eventData(page);
 expect(e.some(x=>x.name==='public_tool_completed'&&x.params.tool==='panchanga')).toBe(false);
});

test('G3.2 GalaxiPedia article CTA is attributed without query or reading data',async({page})=>{
 await page.route(/googletagmanager\.com|google-analytics\.com/,route=>
  route.fulfill({status:200,contentType:'application/javascript',body:''}));
 await page.goto('/en/privacy');
 await page.getByRole('button',{name:'Allow analytics'}).click();
 await page.goto('/en/pedia/panchanga-five-limbs-explained?birthDate=SECRET_BIRTH_DATE');
 await expect.poll(async()=> (await eventData(page)).some(e=>e.name==='page_view')).toBe(true);
 const link=page.locator('a[href="/en/panchanga"]').first();
 await expect(link).toBeVisible();
 // Keep the browser on the article long enough to inspect the queued event.
 await link.evaluate(a=>a.addEventListener('click',e=>e.preventDefault(),{once:true}));
 await link.click();
 await expect.poll(async()=> (await eventData(page)).some(e=>e.name==='article_to_tool_click')).toBe(true);
 const all=await eventData(page);
 const clicked=all.filter(e=>e.name==='article_to_tool_click');
 expect(clicked).toHaveLength(1);
 expect(clicked[0].params).toEqual({from_section:'pedia',tool:'panchanga'});
 expect(JSON.stringify(all)).not.toContain('SECRET_BIRTH_DATE');
 expect(JSON.stringify(all)).not.toContain('/pedia/panchanga-five-limbs-explained');
});

test('G3 guest Daily Tarot completion is counted once only after a fresh draw',async({page})=>{
 await page.route(/googletagmanager|google-analytics/,route=>
  route.fulfill({status:200,contentType:'application/javascript',body:''}));
 await page.route('**/api/v1/tarot/readings',route=>route.fulfill({status:401,json:{message:'Unauthorized'}}));
 await page.goto('/en/privacy');
 await page.getByRole('button',{name:'Allow analytics'}).click();
 await page.goto('/en/tarot');
 await expect.poll(async()=>(await eventData(page)).some(e=>e.name==='public_tool_viewed'&&e.params.tool==='tarot')).toBe(true);
 await expect(page.getByText('Without an account: 3 readings a day.',{exact:false})).toBeVisible();
 const authEvents=async()=> (await eventData(page)).filter(e=>e.name==='public_tool_auth_required');
 expect(await authEvents()).toHaveLength(0);
 const completions=async()=> (await eventData(page)).filter(e=>e.name==='public_tool_completed'&&e.params.tool==='tarot');
 expect(await completions()).toHaveLength(0);
 await page.clock.install();
 await page.clock.pauseAt(new Date(Date.now()+1000));
 await page.getByTestId('tarot-daily-draw').click();
 const starts=(await eventData(page)).filter(e=>e.name==='public_tool_started'&&e.params.tool==='tarot');
 expect(starts).toHaveLength(1);
 expect(await completions()).toHaveLength(0);
 await page.clock.runFor(900);
 await expect(page.getByTestId('tarot-daily-result')).toBeVisible();
 await page.clock.resume();
 await expect.poll(async()=>(await completions()).length).toBe(1);
 expect(Object.keys((await completions())[0].params).sort()).toEqual(['locale','send_to','tool']);
 await page.reload();
 await expect(page.getByTestId('tarot-daily-result')).toBeVisible({timeout:10000});
 await page.waitForTimeout(1000);
 expect(await completions()).toHaveLength(0);
 await expect(page.getByText('Without an account: 3 readings a day.',{exact:false})).toBeVisible();
 expect(await authEvents()).toHaveLength(0);
});

test('G3 an expired session signals authentication only for a submitted private Tarot spread',async({page})=>{
 await page.route(/googletagmanager|google-analytics/,route=>
  route.fulfill({status:200,contentType:'application/javascript',body:''}));
 await page.route('**/api/v1/tarot/readings',route=>{
  if(route.request().method()==='GET')return route.fulfill({json:{readings:[],remaining:3,limit:3,aiAvailable:false}});
  return route.fulfill({status:401,json:{message:'Session expired'}});
 });
 await page.goto('/en/privacy');
 await page.getByRole('button',{name:'Allow analytics'}).click();
 await page.goto('/en/tarot');
 await expect(page.getByText('Readings left today: 3',{exact:true})).toBeVisible();
 await expect.poll(async()=>(await eventData(page)).some(e=>e.name==='public_tool_viewed')).toBe(true);
 await page.getByRole('button',{name:'Draw the cards',exact:true}).click();
 await expect(page.getByText(/API HTTP 401: Session expired/)).toBeVisible();
 const funnel=(await eventData(page)).filter(e=>e.params.tool==='tarot').map(e=>e.name);
 expect(funnel).toEqual(['public_tool_viewed','public_tool_started','public_tool_auth_required','public_tool_failed']);
});

test('GalaxiNews contextual CTA tracks a coarse section and the canonical tool',async({page})=>{
 await page.route(/googletagmanager\.com|google-analytics\.com/,route=>
  route.fulfill({status:200,contentType:'application/javascript',body:''}));
 await page.goto('/en/privacy');
 await page.getByRole('button',{name:'Allow analytics'}).click();
 await page.goto('/en/news/jyotish?question=PRIVATE_NEWS_TEST');
 await expect.poll(async()=>(await eventData(page)).some(e=>e.name==='page_view')).toBe(true);
 const link=page.locator('main a[href*="/en/panchanga"]').first();
 await expect(link).toBeVisible();
 await link.evaluate(a=>a.addEventListener('click',e=>e.preventDefault(),{once:true}));
 await link.click();
 const events=await eventData(page);
 expect(events.filter(e=>e.name==='article_to_tool_click').map(e=>e.params))
  .toEqual([{from_section:'news',tool:'panchanga'}]);
 expect(JSON.stringify(events)).not.toContain('PRIVATE_NEWS_TEST');
 expect(events.find(e=>e.name==='page_view').params.page_path).toBe('/en/news');
});
