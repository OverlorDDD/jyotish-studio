import {test,expect} from '@playwright/test';

// Deliberately NO page.route('/api/v1/reports') and NO chart JSON fixtures.
// CI runs the full Next.js reverse proxy, NestJS, Swiss Ephemeris, and Reader.
test('real frontend → NestJS report: runtime v6, calculation, Reader, and offline AI fallback',async({page,request})=>{
 const runtime=await request.get('/api/v1/jyotish/runtime');
 expect(runtime.status()).toBe(200);
 const version=await runtime.json();
 expect(version.readerVersion).toBe('6.0.0');
 expect(version.pipeline).toBe('direct-v2');
 expect(version.referenceBenchmark?.version).toBe('jhora8-same-profile-v2');
 expect(version.referenceBenchmark?.cases).toBe(20);
 expect(version.referenceBenchmark?.perUserJhoraVerified).toBe(false);
 await page.goto('/uk/astrology/jyotish');
 await expect(page.locator('.jy-version-warning')).toHaveCount(0);
 await page.getByRole('button',{name:'Розрахувати карту'}).click();
 await expect(page.locator('.jy-primary-chart .jy-south-chart')).toBeVisible();
 await expect(page.locator('.jy-reference-details')).toBeVisible();
 await page.locator('.jy-reference-details summary').click();
 await expect(page.locator('.jy-reference-details')).toContainText('JHora 8.0');
 await expect(page.locator('.jy-reference-details')).toContainText('200/200');
 const actualChart=await (await page.request.post('/api/v1/charts/calculate',{data:{date:'2000-01-01',time:'12:00',timeZone:'Asia/Kolkata',latitude:28.6139,longitude:77.209}})).json();
 expect(actualChart.verification?.status).toBe('verified_internal');
 expect(actualChart.verification?.version).toBe('jyotish-integrity-v3');
 expect(actualChart.verification?.checks?.length).toBe(10);
 expect(actualChart.verification?.externalReferenceChecked).toBe(false);
 const chartResponse=await page.request.post('/api/v1/reports',{
  data:{date:'2000-01-01',time:'12:00',timeZone:'Asia/Kolkata',latitude:28.6139,longitude:77.209,
   asOf:'2026-10-22',lang:'uk',preferred:'local'}
 });
 expect(chartResponse.status()).toBe(201);
 const data=await chartResponse.json();
 expect(data.readerVersion).toBe('6.0.0');
 expect(data.verification?.status).toBe('verified_internal');
 expect(data.verification?.digest).toBe(actualChart.verification.digest);
 expect(data.editorial?.version).toBe('6.0.0');
 expect(data.editorial?.chapters?.length).toBe(8);
 expect(data.ai?.fallbackReason).toBe('reader_only');
 await page.getByRole('button',{name:'Читати без AI — Reader v6'}).click();
 const document=page.locator('.reading-editorial');
 await expect(document).toBeVisible();
 await expect(document.locator('.reading-editorial-chapter')).toHaveCount(8);
 await expect(page.getByTestId('reading-ai-provenance')).toContainText('Reader v6');
 expect(await page.locator('.reading-root').innerText()).not.toContain('Reader v5');
 // In CI AI_MODE=local, so AI is deliberately unavailable but Reader remains fully usable.
 await page.getByRole('button',{name:'Створити AI-трактування'}).click();
 await expect(page.locator('.reading-editorial')).toBeVisible();
 await expect(page.getByTestId('reading-ai-provenance')).toContainText('Reader v6');
});
test('real EN route → full Reader English and matching runtime handshake',async({page,request})=>{
 const runtime=await request.get('/api/v1/jyotish/runtime');
 expect((await runtime.json()).readerVersion).toBe('6.0.0');
 await page.goto('/en/astrology/jyotish');
 await expect(page.locator('.jy-version-warning')).toHaveCount(0);
 await page.getByRole('button',{name:'Calculate birth chart'}).click();
 await expect(page.locator('.jy-primary-chart .jy-south-chart')).toBeVisible();
 await page.getByRole('button',{name:'Read without AI — Reader v6'}).click();
 await expect(page.locator('.reading-editorial-chapter')).toHaveCount(8);
 await expect(page.getByTestId('reading-ai-provenance')).toContainText('Reader v6');
});
