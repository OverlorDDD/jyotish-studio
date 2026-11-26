import {test,expect} from '@playwright/test';
import {enterSyntheticBirthFields} from './n4-rc-legacy-compat.mjs';

// Genuine Next/Nest/Swiss calculation + deterministic Reader. Stub ONLY the
// outbound AI report response; no paid cloud calls, secrets or personal charts.
const sampleBirth={date:'2000-01-01',time:'12:00',timeZone:'Asia/Kolkata',latitude:28.6139,longitude:77.209};
const aiProse='## Verified consultation\n\n'+('A specific placement can support reflection on work and relationships without guaranteeing an outcome. ').repeat(17)+'\n\nA balanced decision belongs to the reader.';
async function ready(page,locale){
 await page.goto('/'+locale+'/astrology/jyotish');
 await enterSyntheticBirthFields(page);
 await page.locator('.jy-calc-btn').click();
 await expect(page.getByTestId('reader10')).toBeVisible({timeout:30000});
 await expect(page.getByTestId('reading-ai-provenance')).toBeVisible();
}
for(const locale of ['uk','en']){
 test('explicit '+locale+' AI click clears stale Reader and visibly renders returned Groq fallback',async({page,request})=>{
  const local=await request.post('/api/v1/reports',{data:{...sampleBirth,lang:locale,preferred:'local'}});
  expect(local.status()).toBe(201);
  const report=await local.json();
  expect(report.ai.fallbackReason).toBe('reader_only');
  await ready(page,locale);
  let resolveCall;
  const gate=new Promise(resolve=>{resolveCall=resolve;});
  const calls=[];
  await page.route('**/api/v1/reports',async route=>{
   const payload=route.request().postDataJSON();
   calls.push(payload.preferred);
   expect(payload.preferred).toBe('auto');
   expect(payload.expectedChartDigest).toMatch(/^[a-f0-9]{64}$/);
   await gate;
   await route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({
    ...report,ai:{provider:'groq',model:'openai/gpt-oss-120b',text:aiProse,source:'llm',cached:false}
   })});
  });
  await page.locator('.jy-ai-launch-btn').click();
  await expect(page.getByTestId('reader10')).toHaveCount(0);
  await expect(page.getByTestId('reading-ai-provenance')).toHaveCount(0);
  await expect.poll(()=>calls.length).toBe(1);
  expect(calls).toEqual(['auto']);
  resolveCall();
  await expect(page.getByTestId('jyotish-direct-consultation')).toBeVisible({timeout:15000});
  await expect(page.getByTestId('jyotish-direct-consultation')).toContainText('Verified consultation');
  await expect(page.getByTestId('reading-ai-provenance')).toContainText('Groq');
  await expect(page.locator('.jy-ai-status')).toContainText('groq');
  await expect(page.getByTestId('reading-ai-provenance')).not.toContainText('Reader');
 });
}
test('AI transport failure is explicit; stale local result never masquerades as completed AI',async({page})=>{
 await ready(page,'uk');
 await page.route('**/api/v1/reports',route=>{
  expect(route.request().postDataJSON().preferred).toBe('auto');
  return route.fulfill({status:503,json:{statusCode:503,message:'Temporary test outage'}});
 });
 await page.locator('.jy-ai-launch-btn').click();
 await expect(page.locator('.jy-ai-status')).toContainText('AI-запит завершився помилкою');
 await expect(page.getByTestId('reader10')).toHaveCount(0);
 await expect(page.getByTestId('reading-ai-provenance')).toHaveCount(0);
 await expect(page.locator('.jy-ai-launch-btn')).toBeEnabled();
});
test('server reader_only on an explicit auto request is an error, never false AI completion',async({page,request})=>{
 const local=await request.post('/api/v1/reports',{data:{...sampleBirth,lang:'uk',preferred:'local'}});
 const report=await local.json();
 await ready(page,'uk');
 await page.route('**/api/v1/reports',route=>route.fulfill({status:201,json:report}));
 await page.locator('.jy-ai-launch-btn').click();
 await expect(page.locator('.jy-ai-status')).toContainText('Сервер помилково повернув локальний Reader');
 await expect(page.getByTestId('reader10')).toHaveCount(0);
});

test('browser rejects mismatched AI report without its exact verified recomputed source',async({page,request})=>{
 const local=await request.post('/api/v1/reports',{data:{...sampleBirth,lang:'uk',preferred:'local'}});
 const source=await local.json();
 await ready(page,'uk');
 await page.route('**/api/v1/reports',route=>{
  const birth=route.request().postDataJSON();
  expect(birth.preferred).toBe('auto');
  expect(birth.expectedChartDigest).toMatch(/^[a-f0-9]{64}$/);
  return route.fulfill({status:201,json:{
   ...source,verification:{...source.verification,digest:'f'.repeat(64)},
   ai:{provider:'groq',model:'test',source:'llm',text:aiProse,cached:false}
  }});
 });
 await page.locator('.jy-ai-launch-btn').click();
 await expect(page.locator('.jy-ai-status')).toContainText('Дані звіту не збігаються з перевіреною картою');
 await expect(page.getByTestId('jyotish-direct-consultation')).toHaveCount(0);
});
