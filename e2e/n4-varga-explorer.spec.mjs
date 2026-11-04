import {test,expect} from '@playwright/test';
const names=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const d1=names.map((name,i)=>({
 name,longitude:(i*35.731+11.2)%360,sign:Math.floor(((i*35.731+11.2)%360)/30)+1,
 signName:'',degreesInSign:(i*35.731+11.2)%30,
 house:Math.floor(((i*35.731+11.2)%360)/30)+1,
 nakshatra:'Ashwini',pada:1,retrograde:false
}));
const d9=d1.map(p=>({...p,sign:((p.sign*9+1)%12)+1,house:1}));
const d10=d1.map(p=>({...p,sign:((p.sign*10+1)%12)+1,house:1}));
const sample={
 input:{date:'2000-01-01',time:'12:00',timeZone:'Asia/Kolkata',latitude:28.6139,longitude:77.209},
 utc:'2000-01-01T06:30:00.000Z',ayanamsa:23.853214,ephemeris:'pyswisseph',
 verification:{version:'jyotish-integrity-v3',status:'verified_internal',digest:'a'.repeat(64),checks:[],externalReferenceChecked:false},
 ascendant:{name:'Ascendant',longitude:11.7,sign:1,signName:'Aries',degreesInSign:11.7,house:1,nakshatra:'Ashwini',pada:4,retrograde:false},
 lagnaD9:{name:'Ascendant',sign:1,longitude:0,degreesInSign:0,house:1,nakshatra:'',pada:1,retrograde:false},
 lagnaD10:{name:'Ascendant',sign:1,longitude:0,degreesInSign:0,house:1,nakshatra:'',pada:1,retrograde:false},
 d1,d9,d10,dasha:[]
};
test('N4: verified chart places D1 beside the selected D chart BEFORE Reader, switch 16 methods',async({page})=>{
 await page.route('**/api/v1/charts/calculate',route=>route.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify(sample)
 }));
 await page.goto('/uk/astrology/jyotish');
 await page.locator('button.jy-calc-btn').click();
 await expect(page.locator('.n4-comparison article')).toHaveCount(2);
 await expect(page.locator('.n4-tabs button')).toHaveCount(16);
 await expect(page.locator('.n4-explorer')).toBeVisible();
 const ids=await page.locator('main').evaluate(el=>({
  explorer:el.querySelector('#varga-explorer')?.getBoundingClientRect().top||0,
  report:el.querySelector('.jy-ai-launch')?.getBoundingClientRect().top||0
 }));
 expect(ids.explorer).toBeLessThan(ids.report);
 await page.locator('.n4-tabs button').filter({hasText:'D24'}).click();
 await expect(page.locator('.n4-chart-head h3')).toContainText('D24');
 await expect(page.locator('.n4-placements>div')).toHaveCount(9);
 await page.locator('.n4-matrix-toggle').click();
 await expect(page.locator('.n4-matrix tbody tr')).toHaveCount(16);
 await page.locator('.n4-tabs button').filter({hasText:'D60'}).click();
 await expect(page.locator('.n4-caution')).toBeVisible();
 await expect(page.getByTestId('n4-angular-boundary-note')).toBeVisible();
});
test('N4: 360px chart pairing has no document horizontal overflow',async({page})=>{
 await page.setViewportSize({width:360,height:780});
 await page.route('**/api/v1/charts/calculate',route=>route.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify(sample)
 }));
 await page.goto('/en/astrology/jyotish');
 await page.locator('button.jy-calc-btn').click();
 await expect(page.locator('.n4-comparison article')).toHaveCount(2);
 const diff=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 expect(diff).toBeLessThanOrEqual(2);
});

test('N4 no-AI reader: five evidence-linked sections render clearly on 360px mobile',async({page})=>{
 await page.setViewportSize({width:360,height:780});
 await page.route('**/api/v1/jyotish/runtime',route=>route.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify({
   readerVersion:'6.0.0',pipeline:'direct-v2',verificationContract:'jyotish-integrity-v3'
  })
 }));
 await page.route('**/api/v1/charts/calculate',route=>route.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify(sample)
 }));
 const offlineChapters=[9,10,2,4,24].map((division,i)=>({
  id:'n4-'+division,division,heading:'D'+division+' thematic reading',
  lead:'In D1 the verified placement grounds this interpretive comparison.',
  analysis:'The specialized D'+division+' chart puts the same planet in a domain with distinct practical considerations.',
  example:'Imagine deciding how to allocate time to a demanding responsibility.',
  action:'Make one practical note about your available time.',
  evidence:['D1 Venus sign=2 house=3','D'+division+' Venus sign=5 house=4','D'+division+' lagna sign=3']
 }));
 const report={
  language:'en',readerVersion:'6.0.0',verification:sample.verification,
  generatedAt:'2026-11-04T00:00:00.000Z',asOf:'2026-11-04',chartSummary:'Synthetic preview',
  sections:[{id:'portrait',heading:'Main portrait',eyebrow:'D1',lead:'Verified birth-chart themes',paragraphs:['A source-based interpretation.']}],
  ai:{provider:'local',source:'deterministic',fallbackReason:'reader_only',text:''},
  editorial:{version:'6.0.0',findings:[],chapters:[{
   id:'portrait',title:'Your synthetic portrait',paragraphs:['First grounded theme.','Second grounded theme.'],
   insights:[],evidence:[]}],elements:[],highlights:[],method:'Deterministic synthetic preview'},
  n4Offline:{version:'n4-offline-editorial-v1',language:'en',
   certification:'independent_jhora8_original_reference_pending',
   method:'Standalone deterministic test content, not a user reading.',chapters:offlineChapters}
 };
 await page.route('**/api/v1/reports',route=>route.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify(report)
 }));
 await page.goto('/en/astrology/jyotish');
 await page.locator('button.jy-calc-btn').click();
 await page.locator('.jy-reader-launch-btn').click();
 await expect(page.getByTestId('n4-offline-reading')).toBeVisible();
 await expect(page.locator('.n4-offline-chapter')).toHaveCount(5);
 await expect(page.locator('.n4-offline-chapter').first()).toContainText('D9');
 await page.locator('.n4-offline-chapter summary').first().click();
 await expect(page.locator('.n4-offline-chapter details code').first()).toBeVisible();
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 expect(overflow).toBeLessThanOrEqual(2);
});
