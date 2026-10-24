import {test,expect} from '@playwright/test';

const makePlanet=(name,house,sign,deg=12.3)=>({
 name,house,sign,longitude:(sign-1)*30+deg,signName:'',degreesInSign:deg,
 nakshatra:'Ashwini',pada:1,retrograde:name==='Saturn'
});
const LAGNA=makePlanet('Ascendant',1,4,17.2);
const FIXTURE_VERIFICATION={version:'jyotish-integrity-v1',status:'verified_internal',digest:'a'.repeat(64),checks:['d1_longitudes_houses'],externalReferenceChecked:false};
const CHART={
 verification:FIXTURE_VERIFICATION,id:'geometry-e2e',input:{date:'1996-03-27',time:'12:58',timeZone:'Europe/Kyiv',latitude:47.9105,longitude:33.3918},
 utc:'1996-03-27T10:58:00.000Z',ayanamsa:23.8,ephemeris:'Swiss Ephemeris',
 ascendant:LAGNA,lagnaD9:makePlanet('Ascendant',1,9,5.5),lagnaD10:makePlanet('Ascendant',1,5,6.1),
 d1:[makePlanet('Sun',9,12,13.2),makePlanet('Moon',12,3,17.3),makePlanet('Mars',9,12,8.2),
     makePlanet('Mercury',9,12,12.4),makePlanet('Jupiter',6,9,21.6),makePlanet('Venus',10,1,29.1),
     makePlanet('Saturn',9,12,4.9),makePlanet('Rahu',3,6,24.1),makePlanet('Ketu',9,12,24.1)],
 d9:['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'].map((name,i)=>makePlanet(name,i%12+1,i%12+1)),
 d10:['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'].map((name,i)=>makePlanet(name,i%12+1,i%12+1)),
 dasha:[{lord:'Saturn',start:'2020-01-01',end:'2039-01-01',antardashas:[{lord:'Moon',start:'2025-01-01',end:'2029-01-01'}]}],
};
const CHAPTERS=['portrait','configuration','tensions','relationships','career','resources','timing','conclusion'];
function fixture(lang){
 return {readerVersion:'6.0.0',verification:FIXTURE_VERIFICATION,language:lang,ai:{source:'local',provider:'local',text:'',fallbackReason:'no_provider'},
  editorial:{
   highlights:[
    lang==='uk'?'Головний акцент: зв’язок між навчанням, волею та відповідальністю':'Central theme: learning and responsibility',
    lang==='uk'?'Особистий ключ: Місяць потребує простору для відновлення':'Personal key: the Moon needs room for reflection',
    lang==='uk'?'Професійний ключ: Марс додає практичної сили задумам':'Career key: Mars connects ideas to practice'
   ],chapters:CHAPTERS.map(id=>({id,title:id,paragraphs:['The chart connects several areas of life in one coherent reading.'],evidence:[]})),
   elements:[],findings:[],method:'Lahiri'},
  sections:[{id:'portrait',heading:'Profile',eyebrow:'JYOTISH',lead:'Chart reading',paragraphs:['Verified data from the chart.'],facts:[]}],
  };
}
for(const lang of ['uk','en']){
 test('Jyotish '+lang+' keeps all twelve sign cells inside their frame and presents one reading document',async({page})=>{
  await page.route('**/api/v1/charts/calculate',r=>r.fulfill({
   status:200,contentType:'application/json',body:JSON.stringify(CHART)}));
  await page.route('**/api/v1/reports',r=>r.fulfill({
   status:200,contentType:'application/json',body:JSON.stringify(fixture(lang))}));
  await page.goto('/'+lang+'/astrology/jyotish');
  await page.getByRole('button',{name:lang==='uk'?'Розрахувати карту':'Calculate birth chart'}).click();
  const mainChart=page.locator('.jy-primary-chart .jy-south-chart');
  await expect(mainChart).toBeVisible();
  await expect(mainChart.locator('.jy-south-sign')).toHaveCount(12);
  for(const view of ['d1','d9','d10']){
   await page.getByRole('button',{name:view.toUpperCase(),exact:true}).click();
   const varga=page.locator('.jy-varga-chart .jy-south-chart');
   await expect(varga).toBeVisible();
   await expect(varga.locator('.jy-south-sign')).toHaveCount(12);
   const inside=await varga.evaluate(svg=>{
    const bounds=svg.getBoundingClientRect();
    return [...svg.querySelectorAll('.jy-south-sign')].every(g=>{
     const r=g.getBoundingClientRect();
     return r.left>=bounds.left-2&&r.right<=bounds.right+2&&r.top>=bounds.top-2&&r.bottom<=bounds.bottom+2;
    });
   });
   expect(inside,'House numbers, glyphs and degrees must remain within '+view+' frame').toBe(true);
  }
  await page.getByRole('button',{name:lang==='uk'?'Читати без AI — Reader v6':'Read without AI — Reader v6'}).click();
  const document=page.locator('.reading-editorial');
  await expect(document).toBeVisible();
  await expect(document.locator('.reading-principle')).toHaveCount(3);
  await expect(document.locator('.reading-editorial-chapter')).toHaveCount(8);
  await expect(document.locator('.reading-editorial-highlights')).toHaveCount(0);
  const layout=await document.locator('.reading-principle').first().evaluate(element=>{
   const r=element.querySelector('.reading-principle-content').getBoundingClientRect();
   const n=element.querySelector('.reading-principle-number').getBoundingClientRect();
   return {separate:n.right<r.left,readable:r.width>150};
  });
  expect(layout.separate&&layout.readable).toBe(true);
 });
}
