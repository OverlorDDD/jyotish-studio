import {test,expect} from '@playwright/test';
const l=s=>({uk:s,en:s});
const signal=(system)=>({id:system+':1',source:system+'_SWISS_TEST_REFERENCE',planet:'Mercury',title:l(system+' PLANET'),
 detail:l(system+' CALCULATION'),topic:'communication',transitLongitude:72.55,natalLongitude:7.1,
 sampledAtUtc:'2026-10-31T10:00:00.000Z',house:3,orbDegrees:1});
const snapshot=(date)=>({version:'ASE_V1',date,zone:'Europe/Kyiv',
 status:'convergence',headline:l('SHARED CONVERGENCE'),description:l('INDEPENDENT INTERPRETATIONS'),
 advice:l('PRACTICAL SYNTHESIS'),reflection:l('QUESTION'),
 commonTopics:[{key:'communication',title:l('COMMUNICATION')}],
 western:{reference:'TROPICAL_NATAL_SUN_AND_MOON',signals:[signal('WESTERN')],matchedCount:1},
 vedic:{reference:'SIDEREAL_NATAL_MOON_AND_LAGNA',signals:[signal('VEDIC')]},
 provenance:{sampledAtUtc:'2026-10-31T10:00:00.000Z'}});
const profile={selected:{id:'chart-1',verified:true,westernSunSign:1,moonSign:3,lagnaSign:4},
 profile:{currentTimeZone:'Europe/Kyiv'},journey:{horoscope:null,daily:null}};
async function routeApi(page,guest=false){
 await page.route('**/api/v1/**',route=>{
  const path=new URL(route.request().url()).pathname;
  const days=new URL(route.request().url()).searchParams.get('days')==='7'?7:1;
  let status=200,data={};
  if(path==='/api/v1/personal/overview'){
   if(guest)status=401;else data=profile;
  }else if(path==='/api/v1/personal/horoscope/synthesis'){
   if(guest)status=401;
   else data={status:'available',reference:'ASTROLOGICAL_SYNTHESIS_V1',
    days:Array.from({length:days},(_,i)=>snapshot('2026-11-'+String(i+1).padStart(2,'0')))};
  }else if(path==='/api/v1/personal/horoscope/western'){
   data={status:'requires_verified_tropical_sun',reference:'TROPICAL_NATAL_SUN_SIGN',days:[]};
  }else if(path==='/api/v1/horoscope/western/today'||path==='/api/v1/horoscope/today'){
   const western=path.includes('western');
   data={reference:western?'TROPICAL_SUN_SIGN':'SIDEREAL_MOON_SIGN',date:'2026-10-31',
    zone:'Europe/Kyiv',moon:{sign:3},signs:Array.from({length:12},(_,i)=>({
     referenceSign:i+1,house:3,headline:l('GENERAL SIGN'),description:l('GENERAL READING'),
     goodFor:l('SOME GUIDANCE'),caution:l('BE CAREFUL'),
     evidence:{kind:western?'PUBLIC_TROPICAL_SOLAR_REFERENCE':'PUBLIC_JANMA_RASHI_REFERENCE',
      sampledAtUtc:'2026-10-31T10:00:00.000Z',method:'SWISS'}}))};
  }else if(path==='/api/v1/personal/calendar')data={horoscopeStatus:'personalized',horoscopes:[]};
  else{status=404;data={message:'Not found'};}
  return route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
 });
}
for(const locale of ['uk','en']){
 test(locale+': synthesis day/week has both source-specific signals and no mixing on switch',async({page})=>{
  await routeApi(page);
  await page.goto('/'+locale+'/horoscope');
  await page.getByRole('button',{name:locale==='uk'?'Мій персональний':'My personal reading'}).click();
  const synthesis=page.getByTestId('synthesis-switch');
  await expect(synthesis).toBeVisible();
  await synthesis.click();
  await expect(page.getByTestId('synthesis-panel')).toBeVisible();
  await expect(page.getByTestId('synthesis-day')).toHaveCount(1);
  await expect(page.getByTestId('synthesis-day')).toContainText('SHARED CONVERGENCE');
  const western=page.getByTestId('synthesis-evidence-western');
  const vedic=page.getByTestId('synthesis-evidence-vedic');
  await western.locator('summary').click();
  await expect(western).toContainText('WESTERN PLANET');
  await expect(western).not.toContainText('VEDIC PLANET');
  await vedic.locator('summary').click();
  await expect(vedic).toContainText('VEDIC PLANET');
  await expect(vedic).not.toContainText('WESTERN PLANET');
  await page.getByRole('button',{name:locale==='uk'?'Цей тиждень':'This week'}).click();
  await expect(page.getByTestId('synthesis-day')).toHaveCount(7);
  await page.getByRole('button',{name:locale==='uk'?'Ведичний · Місяць':'Vedic · Moon'}).click();
  await expect(page.getByTestId('synthesis-panel')).toHaveCount(0);
  await expect(page.getByTestId('personal-vedic-basis')).toBeVisible();
  await page.getByRole('button',{name:locale==='uk'?'Синтез карти':'Chart synthesis'}).click();
  await expect(page.getByTestId('synthesis-day')).toHaveCount(7);
  await page.getByRole('button',{name:locale==='uk'?'Усі 12 знаків':'All 12 signs'}).click();
  await expect(page.getByTestId('synthesis-panel')).toHaveCount(0);
 });
 test(locale+': guests cannot see a synthesized private natal reading',async({page})=>{
  await routeApi(page,true);
  await page.goto('/'+locale+'/horoscope');
  await page.getByRole('button',{name:locale==='uk'?'Мій персональний':'My personal reading'}).click();
  await page.getByTestId('synthesis-switch').click();
  await expect(page.getByTestId('synthesis-day')).toHaveCount(0);
  await expect(page.getByTestId('synthesis-panel').getByRole('alert')).toContainText(locale==='uk'?'увійти':'Sign in');
 });
}
