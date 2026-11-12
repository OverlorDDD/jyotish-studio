import {test,expect} from '@playwright/test';
/** Synthetic UI/transport fixture, NOT a JHora astronomical oracle. */
const names=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const divisions=[1,2,3,4,7,9,10,12,16,20,24,27,30,40,45];
const d1=names.map((name,i)=>{const longitude=(i*31.1+8.4)%360,sign=Math.floor(longitude/30)+1;
 return {name,longitude,sign,signName:'',degreesInSign:longitude%30,house:sign,nakshatra:'Ashwini',pada:1,retrograde:false};
});
function sample(){
 const digest='a'.repeat(64);
 return {
  input:{date:'2000-01-01',time:'12:00',latitude:50.45,longitude:30.5234,timeZone:'Europe/Kyiv',place:'Kyiv, Ukraine'},
  verification:{version:'jyotish-integrity-v3',status:'verified_internal',digest,checks:[],externalReferenceChecked:false},
  config:{dashaYearDays:365.25636,dashaYearMode:'true-sidereal-solar-longitude'},
  utc:'2000-01-01T10:00:00.000Z',ayanamsa:23.85,ephemeris:'verified-SWIEPH',
  ascendant:{name:'Ascendant',longitude:11,sign:1,degreesInSign:11,house:1},
  lagnaD9:{name:'Ascendant',sign:1},lagnaD10:{name:'Ascendant',sign:1},
  d1,d9:d1.map(p=>({...p})),d10:d1.map(p=>({...p})),dasha:[],
  n4:{version:'n4-rc-server-bound-15-v1',sourceVerificationVersion:'jyotish-integrity-v3',
   sourceDigest:digest,status:'INTERNALLY_VERIFIED_D1_DERIVATION_NOT_EXTERNAL_LAHIRI_CERTIFICATE',
   method:'parashari-sunmoon-hora-unequal-trimsamsa-jhora-style-d60-v1',
   ruleVersion:'n4-parashari-v1.0.0',d2Method:'Sun/Moon Hora',d60Excluded:true,
   externalJhoraPerBirthCertified:false,
   charts:divisions.map(division=>({division,lagnaSign:1,lagnaBoundaryArcseconds:330,
    planets:d1.map(p=>({name:p.name,sign:p.sign,house:p.house,retrograde:false,boundaryDistanceArcseconds:1000}))}))}
 };
}
async function load(page,lang='uk',data=sample()){
 await page.route('**/api/v1/jyotish/runtime',r=>r.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify({
   readerVersion:'6.0.0',pipeline:'direct-v2',verificationContract:'jyotish-integrity-v3'
  })}));
 await page.route('**/api/v1/panchanga/cities?*',r=>r.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({items:[{id:'kyiv',name:'Kyiv',region:'',country:'Ukraine',
   latitude:50.45,longitude:30.5234,timeZone:'Europe/Kyiv'}]})}));
 await page.route('**/api/v1/charts/calculate',r=>r.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify(data)}));
 const hydration=page.waitForResponse(r=>r.url().includes('/api/v1/jyotish/runtime'),{timeout:20000});
 await page.goto('/'+lang+'/astrology/jyotish');
 await hydration;
 await expect(page.locator('input[type=date]')).toHaveValue('');
 await expect(page.locator('input[type=time]')).toHaveValue('');
 await page.locator('input[type=date]').fill('2000-01-01');
 await page.locator('input[type=time]').fill('12:00');
 await page.getByTestId('global-city-search').getByRole('combobox').fill('Kyiv');
 await page.getByRole('option',{name:/Kyiv/}).click();
 await expect(page.locator('.jy-selected-city')).toContainText('Kyiv');
 // The chosen city must transfer coordinates and its IANA time zone atomically.
 const advanced=page.locator('details.jy-n4-advanced');
 await expect(advanced.locator('input[type=number]').nth(0)).toHaveValue('50.45');
 await expect(advanced.locator('input[type=number]').nth(1)).toHaveValue('30.5234');
 await expect(advanced.locator('input:not([type=number])')).toHaveValue('Europe/Kyiv');
 await expect(page.locator('button.jy-calc-btn')).toBeEnabled();
 await Promise.all([
  page.waitForResponse(r=>r.url().includes('/api/v1/charts/calculate')),
  page.locator('button.jy-calc-btn').click()
 ]);
}
test('UA unified 16 tab charts, D1 not duplicated, D9 and D24 navigation',async({page})=>{
 await load(page);
 const section=page.getByTestId('n4-rc-explorer');
 await expect(section).toBeVisible();
 await page.getByTestId('n4-rc-explorer').getByRole('button',{name:/^D1\b/}).click();
 await expect(section.locator('.jy-south-chart')).toHaveCount(1);
 await page.getByRole('button',{name:/D9/}).click();
 await expect(section.locator('.jy-south-chart')).toHaveCount(2);
 await expect(section.getByTestId('n41-all-charts').getByRole('button')).toHaveCount(16);
 await expect(section.getByTestId('n4-rc-additional')).toHaveCount(0);
 await expect(section.getByRole('button',{name:/D60/})).toHaveCount(1);
 await page.getByRole('button',{name:/D24/}).click();
 await expect(section).toContainText('D24');
 const sizes=await section.locator('.jy-south-chart').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return Math.abs(r.width-r.height)}));
 expect(sizes).toHaveLength(2);
 for(const difference of sizes)expect(difference,'chart must be square').toBeLessThanOrEqual(3);
});
test('EN mobile 320-1440px no horizontal overflow',async({page})=>{
 await load(page,'en');
 await expect(page.getByTestId('n4-rc-explorer').locator('.jy-south-chart')).toHaveCount(2);
 for(const width of [320,360,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:840});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow,'horizontal overflow at '+width+'px').toBeLessThanOrEqual(2);
 }
});
test('forged source digest blocks UI instead of exposing misleading 15 charts',async({page})=>{
 const altered=sample();altered.n4.sourceDigest='b'.repeat(64);
 await load(page,'en',altered);
 await expect(page.locator('.status.error')).toContainText('N4_RC_CLIENT_CONTRACT_REJECTED',{timeout:20000});
 await expect(page.getByTestId('n4-rc-explorer').locator('.jy-south-chart')).toHaveCount(0);
});

test('N4 RC warns when a newly added varga placement is <=1 arcsecond from a sector boundary',async({page})=>{
 const edge=sample();
 const chart=edge.n4.charts.find(v=>v.division===24);
 chart.planets[0].boundaryDistanceArcseconds=0.4;
 await load(page,'en',edge);
 await page.getByTestId('n4-rc-explorer').getByRole('button',{name:/D24/}).click();
 await expect(page.getByTestId('n4-near-boundary-warning')).toContainText('within 1 arcsecond');
});
