import {test,expect} from '@playwright/test';
import {PrismaClient} from '@prisma/client';
const Chrome='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36';
async function total(metric='public_html_request'){
 const prisma=new PrismaClient();
 try{const rows=await prisma.visitorAggregate.findMany({where:{metric}});return rows.reduce((n,r)=>n+r.count,0);}
 finally{await prisma.$disconnect();}
}
test('HTTP HTML requests aggregate without consent, bots and private paths excluded',async({request})=>{
 const headers={Accept:'text/html,application/xhtml+xml','User-Agent':Chrome,'Sec-Fetch-Dest':'document'};
 const before=await total();
 const hit=await request.get('/en/panchanga',{headers});
 expect(hit.ok()).toBeTruthy();
 await expect.poll(async()=>await total()).toBeGreaterThanOrEqual(before+1);
 const counted=await total();
 const bot=await request.get('/en/panchanga',{headers:{...headers,'User-Agent':'Googlebot/2.1'}});
 expect(bot.ok()).toBeTruthy();
 await request.get('/en/account',{headers});
 await expect.poll(async()=>await total()).toBe(counted);
 // Domain root is served as a real English landing document and must be counted.
 const home=await request.get('/',{headers});
 expect(home.ok()).toBeTruthy();
 await expect.poll(async()=>await total()).toBeGreaterThanOrEqual(counted+1);
 const withHome=await total();
 await request.get('/en/panchanga',{headers:{...headers,Purpose:'prefetch'}});
 await expect.poll(async()=>await total()).toBe(withHome);
});
test('Anonymous source buckets count public HTML without duplicate users or private referrer storage',async({request})=>{
 const headers={Accept:'text/html,application/xhtml+xml',
  'User-Agent':Chrome,'Sec-Fetch-Dest':'document'};
 const before=await total('ref_google');
 const response=await request.get('/en/astrology/jyotish',{
  headers:{...headers,Referer:'https://www.google.com/search?q=PRIVATE_BIRTH_INPUT'}});
 expect(response.ok()).toBeTruthy();
 await expect.poll(async()=>await total('ref_google')).toBeGreaterThanOrEqual(before+1);
 const counted=await total('ref_google');
 const bot=await request.get('/en/astrology/jyotish',{
  headers:{...headers,'User-Agent':'Googlebot/2.1',Referer:'https://www.google.com/search?q=private'}});
 expect(bot.ok()).toBeTruthy();
 await expect.poll(async()=>await total('ref_google')).toBe(counted);
});

test('Consented page_view triggers one collector request with correct Measurement ID, no private params',async({page})=>{
 const outgoing=[];
 await page.route(/google-analytics\.com\/g\/collect/,async route=>{
  outgoing.push(route.request().url());
  await route.fulfill({status:204,body:''});
 });
 // A strict Google tag transport shim: model the native gtag Arguments
 // contract. Old array-based code must not pass this test. This still does
 // NOT prove Google accepted a real request.
 const js=`(()=>{const q=window.dataLayer||[];const emit=(a)=>{
  if(Object.prototype.toString.call(a)!=='[object Arguments]'||a[0]!=='event')return;const u=new URL('https://www.google-analytics.com/g/collect');
  u.searchParams.set('v','2');u.searchParams.set('tid','G-TEST123456');
  u.searchParams.set('en',a[1]);
  u.searchParams.set('dl',a[2]?.page_location||'https://galaxiora.com/en');
  fetch(u.toString(),{mode:'no-cors',keepalive:true}).catch(()=>{});
 };q.filter(a=>Object.prototype.toString.call(a)==='[object Arguments]').forEach(emit);const push=q.push.bind(q);
 q.push=(...args)=>{for(const a of args)emit(a);return push(...args);};})();`;
 await page.route(/googletagmanager\.com\/gtag\/js/,route=>route.fulfill({status:200,contentType:'application/javascript',body:js}));
 await page.goto('/en/privacy');
 await page.getByRole('button',{name:'Allow analytics'}).click();
 await page.goto('/en?ga4_debug=1&birthDate=private');
 await expect.poll(()=>outgoing.filter(x=>new URL(x).searchParams.get('en')==='page_view').length).toBe(1);
 await expect.poll(()=>outgoing.some(x=>new URL(x).searchParams.get('en')==='galaxiora_debug_ping')).toBe(true);
 expect(outgoing.every(x=>new URL(x).searchParams.get('tid')==='G-TEST123456')).toBe(true);
 expect(JSON.stringify(outgoing)).not.toContain('private');
 const queueTypes=await page.evaluate(()=>window.dataLayer.map(item=>Object.prototype.toString.call(item)));
 expect(queueTypes.every(type=>type==='[object Arguments]')).toBe(true);
 await expect.poll(()=>page.evaluate(()=>window.__galaxioraTagStatus)).toBe('request_observed');
 await page.evaluate(()=>window.dispatchEvent(new Event('galaxiora:analytics-choice')));
 await expect.poll(()=>outgoing.filter(x=>new URL(x).searchParams.get('en')==='page_view').length).toBe(1);
});
test('Rejection emits no real tracking and cannot be bypassed by tool event',async({page})=>{
 const calls=[];
 await page.route(/googletagmanager\.com|google-analytics\.com/,route=>{
  calls.push(route.request().url());return route.abort();
 });
 await page.goto('/uk/privacy');
 await page.getByRole('button',{name:'Залишити вимкненою'}).click();
 await page.goto('/uk');
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('galaxiora:growth',{detail:{name:'jyotish_chart_completed'}})));
 expect(calls).toHaveLength(0);
});
