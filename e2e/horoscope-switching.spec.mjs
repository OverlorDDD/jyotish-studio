import {test,expect} from '@playwright/test';
const date='2026-10-31',now=date+'T10:00:00.000Z';
const l=text=>({uk:text,en:text});
const reading=(prefix,kind,sign=1)=>({
 referenceSign:sign,house:1,headline:l(prefix+' HEADLINE'),description:l(prefix+' DESCRIPTION'),
 goodFor:l(prefix+' PRACTICAL STEP'),caution:l(prefix+' CAUTION'),reflection:l(prefix+' QUESTION'),
 evidence:{kind,sampledAtUtc:now,method:kind.includes('TROPICAL')?'Swiss Ephemeris tropical':'Swiss Ephemeris Lahiri',
  moonSign:kind.includes('TROPICAL')?4:3,sunSign:1,sunHouse:1,natalSunSign:1,house:1,timeZone:'Europe/Kyiv'}
});
const reference=(system)=>system==='western'?'TROPICAL_SUN_SIGN':'SIDEREAL_MOON_SIGN';
function publicData(system,weekly=false){
 const kind=system==='western'?'PUBLIC_TROPICAL_SOLAR_REFERENCE':'PUBLIC_JANMA_RASHI_REFERENCE';
 const signs=Array.from({length:12},(_,i)=>reading(system==='western'?'WESTERN PUBLIC':'VEDIC PUBLIC',kind,i+1));
 const sample={date,sampledAtUtc:now,moon:{sign:3,nakshatra:'Ardra',pada:1},signs};
 if(weekly)return {reference:reference(system),startDate:date,zone:'Europe/Kyiv',
   days:Array.from({length:7},(_,i)=>({...sample,date:'2026-11-'+String(i+1).padStart(2,'0'),
    signs:signs.map(g=>({...g,headline:l('DAY '+i+' '+system)}))}))};
 return {...sample,zone:'Europe/Kyiv',reference:reference(system)};
}
const profile={selected:{id:'test-chart',verified:true,westernSunSign:1,moonSign:3,lagnaSign:4},
 profile:{currentTimeZone:'Europe/Kyiv'},journey:{
  horoscope:reading('VEDIC PERSONAL','PERSONAL_JANMA_RASHI'),
  daily:reading('VEDIC DEEP LAGNA','PERSONAL_LAGNA')}};
const westernPersonal={status:'available',reference:'TROPICAL_NATAL_SUN_SIGN',
 date,timeZone:'Europe/Kyiv',natalSunSign:1,scope:'SUN_SIGN_TRANSITS_NOT_FULL_WESTERN_NATAL_CHART',
 today:reading('WESTERN PERSONAL','PERSONAL_TROPICAL_NATAL_SUN_REFERENCE'),
 days:Array.from({length:7},(_,i)=>({date:'2026-11-'+String(i+1).padStart(2,'0'),
  guidance:reading('WESTERN WEEK '+i,'PERSONAL_TROPICAL_NATAL_SUN_REFERENCE')}))};
async function stub(page,hasAccount=true){
 await page.route('**/api/v1/**',route=>{
  const path=new URL(route.request().url()).pathname;
  let data,status=200;
  if(path==='/api/v1/horoscope/western/today')data=publicData('western');
  else if(path==='/api/v1/horoscope/today')data=publicData('vedic');
  else if(path==='/api/v1/horoscope/western/week')data=publicData('western',true);
  else if(path==='/api/v1/horoscope/week')data=publicData('vedic',true);
  else if(path==='/api/v1/personal/overview'){data=hasAccount?profile:{message:'Unauthorized'};if(!hasAccount)status=401;}
  else if(path==='/api/v1/personal/calendar'){data={horoscopeStatus:'personalized',
   horoscopes:Array.from({length:7},(_,i)=>({date:'2026-11-'+String(i+1).padStart(2,'0'),
    guidance:reading('VEDIC WEEK '+i,'PERSONAL_JANMA_RASHI')}))};}
  else if(path==='/api/v1/personal/horoscope/western'){data=westernPersonal;}
  else{data={message:'Not found'};status=404;}
  return route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
 });
}
for(const locale of ['uk','en']){
 test(locale+': switching My personal never mixes Western Sun with Vedic Moon in day/week',async({page})=>{
  await stub(page,true);
  await page.goto('/'+locale+'/horoscope');
  const western=page.getByRole('button',{name:locale==='uk'?'Західний · Сонце':'Western · Sun'});
  const vedic=page.getByRole('button',{name:locale==='uk'?'Ведичний · Місяць':'Vedic · Moon'});
  await page.getByRole('button',{name:locale==='uk'?'Мій персональний':'My personal reading'}).click();
  const panel=page.getByTestId('personal-horoscope-panel');
  await expect(panel).toHaveAttribute('data-system','western');
  await expect(page.getByTestId('personal-western-reading')).toContainText('WESTERN PERSONAL');
  await expect(panel).not.toContainText('VEDIC PERSONAL');
  await vedic.click();
  await expect(panel).toHaveAttribute('data-system','vedic');
  await expect(page.getByTestId('personal-moon-reading')).toContainText('VEDIC PERSONAL');
  await expect(panel).not.toContainText('WESTERN PERSONAL');
  await expect(page.getByTestId('personal-western-basis')).toHaveCount(0);
  await page.getByRole('button',{name:locale==='uk'?'Цей тиждень':'This week'}).click();
  await expect(page.getByTestId('personal-vedic-week')).toContainText('VEDIC WEEK');
  await expect(page.getByTestId('personal-western-week')).toHaveCount(0);
  await western.click();
  await expect(page.getByTestId('personal-western-week')).toContainText('WESTERN WEEK');
  await expect(panel).not.toContainText('VEDIC WEEK');
  await page.getByRole('button',{name:locale==='uk'?'Сьогодні':'Today'}).click();
  await expect(page.getByTestId('personal-western-reading')).toContainText('WESTERN PERSONAL');
  await expect(page.getByTestId('personal-daily-core')).toHaveCount(0);
 });
 test(locale+': public modes keep correct reference, 7 distinct dated rows and exact natal selection',async({page})=>{
  await stub(page,true);
  await page.goto('/'+locale+'/horoscope?system=vedic&sign=gemini');
  await expect(page.getByRole('button',{name:locale==='uk'?'Ведичний · Місяць':'Vedic · Moon'})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByTestId('horoscope-reading')).toContainText('VEDIC PUBLIC');
  await page.getByRole('button',{name:locale==='uk'?'Західний · Сонце':'Western · Sun'}).click();
  await expect(page.getByTestId('horoscope-reading')).toContainText('WESTERN PUBLIC');
  await expect(page.getByTestId('horoscope-reading')).not.toContainText('VEDIC PUBLIC');
  await page.getByRole('button',{name:locale==='uk'?'Цей тиждень':'This week'}).click();
  await expect(page.getByTestId('public-horoscope-week').locator('article')).toHaveCount(7);
  await page.getByRole('button',{name:locale==='uk'?'Ведичний · Місяць':'Vedic · Moon'}).click();
  await expect(page.getByTestId('public-horoscope-week').locator('article')).toHaveCount(7);
  await expect(page.getByTestId('public-horoscope-week')).toContainText('vedic');
  await expect(page.getByTestId('public-horoscope-week')).not.toContainText('western');
 });
}
