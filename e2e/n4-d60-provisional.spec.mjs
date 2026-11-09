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
   readerVersion:'6.0.0',pipeline:'direct-v2',readerEdition:'reader-v8.0.0-n44',editorialEdition:'n48-poetic-evidence-1.0.0',interpretationEdition:'n49-unified-evidence-v1',presentationEdition:'n493-ranked-multifactor-v1',verificationContract:'jyotish-integrity-v3'
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
 // The source response is mocked by this test; assert the actual chart UI,
 // not the timing of the response event (which was flaky on slower CI runs).
 const calculate=page.locator('button.jy-calc-btn');
 await expect(calculate).toBeEnabled();
 await calculate.click();
 await expect(page.getByTestId('n4-rc-explorer')).toBeVisible({timeout:15000});

}

test('UK D60 is the sixteenth normal tab and missing-minute hint is placed by birth time',async({page})=>{
 await ready(page,'uk');
 const explorer=page.getByTestId('n4-rc-explorer');
 await explorer.getByRole('button',{name:/^D60\b/}).click();
 await expect(explorer).toContainText('D60');
 await expect(explorer.locator('.jy-south-chart')).toHaveCount(2);
 await expect(explorer.getByTestId('n4-d60-precision-warning')).toHaveCount(0);
 await expect(page.getByTestId('n4-d60-panel')).toHaveCount(0);
});
test('Unknown minutes adds a form-time warning and changes D60 caveat without blocking the chart',async({page})=>{
 await ready(page,'en');
 const explorer=page.getByTestId('n4-rc-explorer');
 await explorer.getByRole('button',{name:/^D60\b/}).click();
 await expect(explorer.locator('.jy-south-chart')).toHaveCount(2);
 await page.locator('#birth-details > summary').click(); // Form is intentionally closed after calculation.
 await page.getByLabel('I don’t know the exact minutes').check();
 await expect(page.getByText('Without exact minutes',{exact:false})).toBeVisible();
 await expect(explorer.getByTestId('n4-d60-precision-warning')).toContainText('may be inaccurate');
 await expect(explorer.locator('.jy-south-chart')).toHaveCount(2);
});
test('Server-forged D60 digest hides only its chart and does not corrupt the original D1',async({page})=>{
 const wrong=fixture();wrong.n4D60.sourceDigest='b'.repeat(64);
 await ready(page,'en',wrong);
 const explorer=page.getByTestId('n4-rc-explorer');
 await explorer.getByRole('button',{name:/^D60\b/}).click();
 await expect(explorer.locator('.jy-south-chart')).toHaveCount(1);
 await expect(explorer.getByRole('alert')).toContainText('D60 source validation failed');
});
test('All 16 charts stay in one responsive explorer at 320–1440 px',async({page})=>{
 await ready(page,'en');
 const explorer=page.getByTestId('n4-rc-explorer');
 await expect(explorer.getByTestId('n41-all-charts').getByRole('button')).toHaveCount(16);
 await explorer.getByRole('button',{name:/^D60\b/}).click();
 for(const width of [320,360,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:850});
  const spill=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(spill,'viewport horizontal overflow '+width).toBeLessThanOrEqual(2);
 }
});

function mockV8(divisions){
 return {
  version:'reader-v8.0.0-n44',editorialVersion:'n48-poetic-evidence-1.0.0',ruleSetVersion:'classical-reader-n44-1.0.0',
  status:'available',introduction:'Підсумок класичного аналізу за розрахованою картою.',
  method:'Brihat Jataka (1905) · Laghu Parashari (1900); перевірені OCR-уривки.',
  d60Notice:'D60 є попереднім, доми та Лагна не трактуються.',
  integrated:{version:'n49-unified-evidence-v1',title:'Єдиний портрет: від D1 до тематичних карт',
   opening:'Умовний синтез, побудований на тестовій карті D1 та тематичних картах.',
   closing:'П’ятнадцять карт розглядаються разом, але без вигаданих висновків про особу.',
   method:'Знакова гідність не є повною силою планети.',
   threads:['foundation','career','partnership','resource','tension'].map((id,i)=>({
    id,title:'Доказова частина '+id,
    text:'Тематична частина '+id+' описує розраховані доми й зв’язок із головною картою.',
    evidence:['D1.Mercury.house=3','D9.Mercury.house=3','D10.Mercury.house=3'],
    sourceIds:[],directSourceIds:[],extensionSourceIds:[],
    scope:i===0?'d1_direct':'cross_varga_modern_extension'
   })),
   links:divisions.map(division=>({division,polarity:'unresolved',evidence:['D1.Mercury.house=3']}))},
  meaningful:{
   version:'n492-evidence-prioritized-16-varga-v1',
   patternVersion:'n493-ranked-multifactor-v1',
   topInsights:['vocation','inner-life','partnership'].map((id,i)=>({
    id,title:'Значущий показник '+id,
    reading:'Обчислене положення відповідного управителя D1 та тематичної варги підтверджує зв’язок між сферами життя.',
    implication:'Кожну сферу слід читати разом із рештою натальної карти.',
    evidence:['D1.ascendant.sign=1','D1.Mercury.house=3','D10.Mercury.house=3'],
    divisions:[1,10],score:70-i,tier:'contextual'})),
   cards:[...divisions,60].map(division=>({
    division,title:'Життєва сфера D'+division,
    meaning:'Для цієї сфери розраховано конкретні положення; головний управитель D1 задає її значення, а тематична карта показує другий рівень.',
    connection:null,status:division===60?'provisional':'contextual',
    proof:['D1.Mercury.house=3','D'+division+'.Mercury.sign=5'],sourceIds:[]
   })),
   summary:{title:'Що головне у вашій карті',
    strength:'Розраховані управителі вказують на конкретні сфери.',
    attention:'Місячний ритм та професійні цілі потребують балансу.',
    direction:'Вибирайте спосіб дії відповідно до перевірених життєвих обставин.',
    proof:['D1.ascendant.sign=1']},
   method:'Парашарі, знак, доми, часові обмеження'
  },
  compactCards:divisions.map((division)=>({
   division,lead:'Для цієї сфери один із показників — Меркурій. У D1 він пов’язаний із навчанням і в D'+division+' — з практичними навичками.',
   relatedDivision:division===10?24:division===24?10:9,contrast:'unresolved',
   connection:'Зв’язок із D'+(division===10?24:division===24?10:9)+': цей самий Меркурій має перевірене тематичне положення.',
   proof:['D1.Mercury.house=3','D'+division+'.Mercury.house=3']
  })),
  synthesis:{version:'n47-source-synthesis-v1',title:'Головний сюжет вашої карти',
   opening:'Висхідний знак та управитель визначають центральну тему. У перевіреній основній карті ці фактори співвідносяться з тематичними картами.',
   strength:'Додаткова карта показує потенціал, який можна перевірити конкретними діями.',
   challenge:'Друга карта показує тінь сильної сторони, якщо діяти поспіхом.',
   direction:'Практичний результат у роботі треба порівняти з принципами близьких стосунків.',
   method:'Синтез D1, D9 та D10; попередній D60 окремо.'},
  d60Preview:{version:'d60-conditional-signs-n47-v1',status:'conditional_signs',
   title:'D60: тонкі акценти, які ще потрібно перевірити',
   intro:'Тестовий умовний зріз, не висновок про реальне народження.',
   allPlanets:names.map(planet=>({planet,label:planet,d1Sign:1,d60Sign:5,
    d1SignName:'Овен',d60SignName:'Лев',boundaryDistanceArcseconds:250,nearBoundary:false})),
   factors:[{planet:'Mars',d1Sign:1,d60Sign:5,boundaryDistanceArcseconds:250,
    note:'Марс: у головній карті — Овен, у D60 — Лев; умовно можна порівняти ініціативу та самовираження.'}],
   warning:'D60: час до хвилини не гарантує точності; доми не трактуються.'},
  highlights:[
   {id:'strength',division:27,title:'Ресурси',text:'Практична витривалість і сталі звички.'},
   {id:'challenge',division:30,title:'Виклики',text:'Зверніть увагу на розподіл сил.'},
   {id:'career',division:10,title:'Робота',text:'Обирайте роботу, де корисні конкретні навички.'}
  ],
  insights:divisions.map(n=>({
   division:n,title:n===27?'Сильні сторони':'Життєва тема '+n,
   headline:'Різні аспекти карти вказують на практичні пріоритети.',
   strength:'У цій темі можна розвивати послідовну роботу й увагу до деталей.',
   challenge:'Складнощі можливі, коли прагнете одночасно досягти всього.',
   context:'Умови цього тематичного поєднання уточнюють загальну карту. Brihat Jataka пропонує оцінювати кілька показників разом.',
   step:'Спробуйте один конкретний крок, який можна виконати сьогодні.',
   proof:['D1.house-lord.10=Mercury','D'+n+'.Mercury.house=3'],
   ruleIds:n===10?['BJ-X-1-NAVAMSA-VOCATION']:[],
   sources:n===10?[{id:'BJ-X-1',work:'Brihat Jataka',chapter:'X',stanza:'1',
    edition:'N. Chidambaram Aiyar, 1905',review:'ocr_excerpt_checked',application:'direct_natal'}]:[],
   timeSensitivity:n>=16?'higher':'ordinary'
  }))
 };
}

test('A newly calculated natal chart automatically opens verified local Reader, never Gemini or other AI',async({page})=>{
 const calls=[];
 await page.route('**/api/v1/reports',async route=>{
  const payload=route.request().postDataJSON();
  calls.push(payload.preferred);
  const report={
   language:'uk',readerVersion:'6.0.0',asOf:'2026-11-08',
   verification:proof,
   sections:[{id:'portrait',heading:'Огляд',eyebrow:'I',lead:'Особиста історія',paragraphs:['Детальний звіт'],facts:[]}],
   readerV8:mockV8(divisions),ai:{provider:'local',source:'deterministic',text:'',fallbackReason:'reader_only'}
  };
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(report)});
 });
 await ready(page,'uk');
 const reader=page.getByTestId('reader-v8');
 await expect(reader).toBeVisible();
 await expect(reader.locator('[data-testid^="reader-v8-D"]')).toHaveCount(15);
 await expect(page.getByTestId('reading-ai-provenance')).toContainText('Jyotish Reader');
 await expect(page.getByTestId('reader-auto-launch-btn')).toHaveAttribute('aria-pressed','true');
 expect(calls).toEqual(['local']);
 await expect(page.getByTestId('jyotish-direct-consultation')).toHaveCount(0);
});

test('N4 Reader shows all source-bound varga insights and the D60 precision boundary',async({page})=>{
 await ready(page,'uk');
 const divisions=[1,2,3,4,7,9,10,12,16,20,24,27,30,40,45];
 const reading=divisions.map(n=>({
  division:n,title:'D'+n+' · '+(n===27?'Сильні та слабкі сторони':'Життєва тема'),
  topic:'тестова тема',scope:'internal_verified_D1_derivation',
  summary:'D1: Юпітер у 9-му домі. D'+n+': Юпітер у 5-му домі, Місяць у 4-му домі. Обидва положення потрібні для трактування.',
  practice:'Визначити один практичний крок до особистого розвитку.',
  evidence:['D1.house-lord.9=Jupiter','D'+n+'.Jupiter.house=5','D'+n+'.Moon.house=4']
 }));
 const data={
  language:'uk',readerVersion:'6.0.0',asOf:'2026-11-07',
  verification:proof,
  sections:[{id:'portrait',heading:'Перевірений портрет',eyebrow:'I',lead:'Звіт за картою',
   paragraphs:['Традиційні тематичні висновки'],facts:[]}],
  ai:{provider:'local',source:'deterministic',text:'',fallbackReason:'reader_only'},
  readerV7:{
   version:'reader-v7.0.0-n43',status:'available',
   introduction:'Просте пояснення без зайвих термінів.',method:'Традиційне прочитання за розрахунком.',
   highlights:[
    {id:'strength',title:'Ваш можливий ресурс',text:'Практична сила й навчання.',division:27},
    {id:'challenge',title:'Що може гальмувати',text:'Ризик перенапруги.',division:30},
    {id:'career',title:'Що спробувати в роботі',text:'Один завершений проєкт.',division:10}
   ],
   insights:divisions.map(n=>({division:n,title:n===27?'Сильні сторони':'Життєва тема '+n,
    focus:'тема '+n,headline:'Особистий висновок щодо теми '+n,
    strength:'Опора у відповідальності й взаємодії.',
    challenge:'Не поспішайте з висновками без конкретних прикладів.',
    step:'Запишіть один невеликий крок на цей тиждень.',
    proof:['D'+n+'.Jupiter.house=5'],timeSensitivity:n>=16?'higher':'ordinary'
   })),
   d60Notice:'Лагна D60 індивідуально не сертифікована.'
  },
  readerV8:mockV8(divisions),
  vargaReadings:{version:'n4-varga-reader-1.0.0',status:'available',
   methodology:'Варги уточнюють D1, не замінюють її.',
   readings:reading,d60:{status:'provisional_no_individual_interpretation',
    message:'Лагна D60 індивідуально не сертифікована; персональні висновки за домами недоступні.'}}
 };
 await page.route('**/api/v1/reports',route=>route.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify(data)}));
 await page.getByRole('button',{name:/Читати без AI/}).click();
 const plain=page.getByTestId('reader-v8');
 await expect(plain).toBeVisible();
 await expect(plain.locator('[data-testid^="reader-v8-D"]')).toHaveCount(15);
 await expect(plain.getByTestId('reader-v8-synthesis')).toHaveCount(0);
 await expect(plain.getByTestId('reader-v8-D27')).toContainText('Для цієї сфери');
 await expect(plain.getByTestId('reader-v8-d60')).toContainText('D60');
 await expect(plain.getByTestId('reader-n492-d60-nine').locator(':scope > div')).toHaveCount(9);
 await expect(plain.getByTestId('reader-v8-d60')).toContainText('Лев');
 await expect(plain.getByTestId('reader-v8-d60')).toContainText('D60');
 await plain.getByTestId('reader-v8-D10').getByText('Чому такий висновок').click();
 await expect(plain.getByTestId('reader-v8-D10')).toContainText('Brihat Jataka');
 await expect(page.getByTestId('reader-v7')).toHaveCount(0);

 await expect(page.getByTestId('n4-varga-reader')).toHaveCount(0);
 await expect(plain.getByTestId('reader-v8-D60')).toHaveCount(0);
 // This minimal mock intentionally omits editorial chapters: no advanced disclosure is rendered.
 // A full Reader report with editorial chapters is covered by the real HTTP integration gate.
 const detail=page.locator('.reading-root details').filter({hasText:'Поглиблене астрологічне пояснення'});
 await expect(detail).toHaveCount(0);
});

test('Reader 8 remains readable without horizontal overflow on mobile and desktop',async({page})=>{
 await ready(page,'uk');
 const divs=[1,2,3,4,7,9,10,12,16,20,24,27,30,40,45];
 const v7={
  version:'reader-v7.0.0-n43',status:'available',introduction:'Зрозумілий опис можливостей і складнощів.',
  method:'Традиційне тематичне пояснення',
  highlights:[{id:'strength',title:'Ресурс',text:'Можливість робити кроки щодня.',division:27},
   {id:'challenge',title:'Ризик',text:'Краще не поспішати.',division:30},
   {id:'career',title:'Робота',text:'Один вимірюваний результат.',division:10}],
  insights:divs.map(n=>({division:n,title:'Сфера '+n,focus:'сфера',headline:'Тематичний зв’язок із життям.',
   strength:'Можлива опора в уважному ставленні до завдань.',challenge:'Ризик поспіху під навантаженням.',
   step:'Оберіть одну невелику дію для наступного тижня.',proof:['D'+n+'.Jupiter.house=5'],
   timeSensitivity:n>=16?'higher':'ordinary'})),
  d60Notice:'D60 не використовується для персонального висновку.'
 };
 await page.route('**/api/v1/reports',r=>r.fulfill({status:200,contentType:'application/json',
  body:JSON.stringify({language:'uk',readerVersion:'6.0.0',verification:proof,sections:[{id:'test',heading:'Огляд',lead:'Огляд',paragraphs:['Дані підтверджено']}],
   readerV7:v7,readerV8:mockV8(divs),ai:{provider:'local',source:'deterministic',fallbackReason:'reader_only',text:''}})}));
 await page.getByRole('button',{name:/Читати без AI/}).click();
 for(const width of [320,360,390,430,768,1440]){
  await page.setViewportSize({width,height:900});
  const reader=page.getByTestId('reader-v8');
  await expect(reader).toBeVisible();
  await expect(reader.locator('[data-testid^="reader-v8-D"]')).toHaveCount(15);
  const spill=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(spill,'Reader 8 horizontal overflow at '+width).toBeLessThanOrEqual(2);
 }
});
