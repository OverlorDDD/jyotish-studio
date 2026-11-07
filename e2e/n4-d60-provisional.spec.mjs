import {test,expect} from '@playwright/test';
/** UI synthetic transport only; numerical D60 is checked separately using real external PyJHora. */
const names=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const divisions=[1,2,3,4,7,9,10,12,16,20,24,27,30,40,45];
const grahas=names.map((name,i)=>{
 const longitude=8+i*31,sign=Math.floor(longitude/30)+1;
 return {name,longitude,sign,house:sign,signName:'',degreesInSign:longitude%30,retrograde:false,nakshatra:'Ashwini',pada:1};
});
const proof={version:'jyotish-integrity-v3',status:'verified_internal',digest:'a'.repeat(64),checks:[],externalReferenceChecked:false};
function fixture(){
 const part=(p)=>({name:p.name,sign:p.sign,house:p.house,part:2,boundaryDistanceArcseconds:400,retrograde:false});
 return {
  input:{date:'2000-01-01',time:'12:00',latitude:50.45,longitude:30.5234,timeZone:'Europe/Kyiv',place:'Kyiv, Ukraine'},
  verification:proof,config:{dashaYearMode:'true-sidereal-solar-longitude',dashaYearDays:365.25636},
  utc:'2000-01-01T10:00:00Z',ayanamsa:23.8,ephemeris:'verified-SWIEPH',
  ascendant:{name:'Ascendant',longitude:10,sign:1,degreesInSign:10,house:1},
  lagnaD9:{name:'Ascendant',sign:1},lagnaD10:{name:'Ascendant',sign:1},
  d1:grahas,d9:grahas,d10:grahas,dasha:[],
  n4:{version:'n4-rc-server-bound-15-v1',sourceVerificationVersion:'jyotish-integrity-v3',sourceDigest:proof.digest,
   status:'INTERNALLY_VERIFIED_D1_DERIVATION_NOT_EXTERNAL_LAHIRI_CERTIFICATE',
   method:'parashari-sunmoon-hora-unequal-trimsamsa-jhora-style-d60-v1',ruleVersion:'n4-parashari-v1.0.0',
   d2Method:'Sun/Moon Hora',d60Excluded:true,externalJhoraPerBirthCertified:false,
   charts:divisions.map(division=>({division,lagnaSign:1,lagnaBoundaryArcseconds:450,
    planets:grahas.map(p=>({name:p.name,sign:p.sign,house:p.house,retrograde:false,boundaryDistanceArcseconds:450}))}))},
  n4D60:{version:'n4-d60-symbolic-reference-20261107-v1',
   sourceVerificationVersion:'jyotish-integrity-v3',sourceDigest:proof.digest,
   sourceMethod:'parashari-sunmoon-hora-unequal-trimsamsa-jhora-style-d60-v1',
   rulesVersion:'n4-parashari-v1.0.0',
   method:'JHora8-Traditional-own-rashi-inclusive-D60',division:60,
   lagna:{name:'Ascendant',sign:1,house:1,part:2,boundaryDistanceArcseconds:350,retrograde:false},
   planets:grahas.map(part),
   symbolicFormulaIndependentReference:'original-JHora8-50-same-method-and-PyJHora',
   symbolicMathScope:'VERIFIED_FOR_PINNED_INPUT_LONGITUDES_ONLY',
   birthTimePrecision:'NOT_INFERRED_FROM_HH_MM',
   continuousTimeStabilityCertified:false,d60HouseInterpretationEligible:false,
   astronomicalCoordinatesPerBirthExternallyCertified:false,status:'PROVISIONAL_D60_INDIVIDUAL_BIRTH'}
 };
}
async function ready(page,lang,data=fixture()){
 await page.route('**/api/v1/jyotish/runtime',r=>r.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify({
   readerVersion:'6.0.0',pipeline:'direct-v2',verificationContract:'jyotish-integrity-v3'
  })}));
 await page.route('**/api/v1/panchanga/cities?*',r=>r.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({items:[{id:'kyiv',name:'Kyiv',country:'Ukraine',region:'',latitude:50.45,longitude:30.5234,timeZone:'Europe/Kyiv'}]})
 }));
 await page.route('**/api/v1/charts/calculate',r=>r.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify(data)
 }));
 await page.goto('/'+lang+'/astrology/jyotish');
 await page.locator('input[type=date]').fill('2000-01-01');
 await page.locator('input[type=time]').fill('12:00');
 await page.getByTestId('global-city-search').getByRole('searchbox').fill('Kyiv');
 await page.getByRole('option',{name:/Kyiv/}).click();
 await Promise.all([
  page.waitForResponse(r=>r.url().includes('/api/v1/charts/calculate')),
  page.locator('button.jy-calc-btn').click()
 ]);
 await expect(page.getByTestId('n4-rc-explorer')).toBeVisible();

}

test('UK D60 is the sixteenth normal tab and missing-minute hint is placed by birth time',async({page})=>{
 await ready(page,'uk');
 const explorer=page.getByTestId('n4-rc-explorer');
 await explorer.getByTestId('n4-rc-additional').locator('summary').click();
 await explorer.getByRole('button',{name:/^D60\\b/}).click();
 await expect(explorer).toContainText('D60');
 await expect(explorer.locator('.jy-south-chart')).toHaveCount(2);
 await expect(explorer.getByTestId('n4-d60-precision-warning')).toHaveCount(0);
 await expect(page.getByTestId('n4-d60-panel')).toHaveCount(0);
});
test('Unknown minutes adds a form-time warning and changes D60 caveat without blocking the chart',async({page})=>{
 await ready(page,'en');
 const explorer=page.getByTestId('n4-rc-explorer');
 await explorer.getByTestId('n4-rc-additional').locator('summary').click();
 await explorer.getByRole('button',{name:/^D60\\b/}).click();
 await expect(explorer.locator('.jy-south-chart')).toHaveCount(2);
 await page.getByLabel('I don’t know the exact minutes').check();
 await expect(page.getByText('Without exact minutes',{exact:false})).toBeVisible();
 await expect(explorer.getByTestId('n4-d60-precision-warning')).toContainText('may be inaccurate');
 await expect(explorer.locator('.jy-south-chart')).toHaveCount(2);
});
test('Server-forged D60 digest hides only its chart and does not corrupt the original D1',async({page})=>{
 const wrong=fixture();wrong.n4D60.sourceDigest='b'.repeat(64);
 await ready(page,'en',wrong);
 const explorer=page.getByTestId('n4-rc-explorer');
 await explorer.getByTestId('n4-rc-additional').locator('summary').click();
 await explorer.getByRole('button',{name:/^D60\\b/}).click();
 await expect(explorer.locator('.jy-south-chart')).toHaveCount(1);
 await expect(explorer.getByRole('alert')).toContainText('D60 source validation failed');
});
test('All 16 charts stay in one responsive explorer at 320–1440 px',async({page})=>{
 await ready(page,'en');
 const explorer=page.getByTestId('n4-rc-explorer');
 await explorer.getByTestId('n4-rc-additional').locator('summary').click();
 await expect(explorer.locator('button')).toHaveCount(16);
 await explorer.getByRole('button',{name:/^D60\\b/}).click();
 for(const width of [320,360,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:850});
  const spill=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(spill,'viewport horizontal overflow '+width).toBeLessThanOrEqual(2);
 }
});
