const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const cities = {
  delhi: { latitude: 28.6139, longitude: 77.209, timeZone: 'Asia/Kolkata' },
  kryvyi: { latitude: 47.9105, longitude: 33.3918, timeZone: 'Europe/Kyiv' },
  kyiv: { latitude: 50.4501, longitude: 30.5234, timeZone: 'Europe/Kyiv' },
  london: { latitude: 51.5074, longitude: -0.1278, timeZone: 'Europe/London' }
};
const ukSigns = ['Овен','Телець','Близнюки','Рак','Лев','Діва','Терези','Скорпіон','Стрілець','Козоріг','Водолій','Риби'];
const enSigns = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const ukGrahas = {Sun:'Сонце',Moon:'Місяць',Mars:'Марс',Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн',Rahu:'Раху',Ketu:'Кету',Ascendant:'Лагна'};
const abbr = {en:{Sun:'Su',Moon:'Mo',Mars:'Ma',Mercury:'Me',Jupiter:'Ju',Venus:'Ve',Saturn:'Sa',Rahu:'Ra',Ketu:'Ke',Ascendant:'Asc'},uk:{Sun:'Со',Moon:'Мі',Mars:'Ма',Mercury:'Ме',Jupiter:'Юп',Venus:'Ве',Saturn:'Са',Rahu:'Ра',Ketu:'Ке',Ascendant:'Асц'}};
const ukNakshatras = {'Ashwini':'Ашвіні','Bharani':'Бхарані','Krittika':'Кріттіка','Rohini':'Рохіні','Mrigashira':'Мрігашіра','Ardra':'Ардра','Punarvasu':'Пунарвасу','Pushya':'Пушʼя','Ashlesha':'Ашлеша','Magha':'Магха','Purva Phalguni':'Пурва Пхалгуні','Uttara Phalguni':'Уттара Пхалгуні','Hasta':'Хаста','Chitra':'Чітра','Swati':'Сваті','Vishakha':'Вішакха','Anuradha':'Анурадха','Jyeshtha':'Джʼєштха','Mula':'Мула','Purva Ashadha':'Пурва Ашадха','Uttara Ashadha':'Уттара Ашадха','Shravana':'Шравана','Dhanishta':'Дханіштха','Shatabhisha':'Шатабхіша','Purva Bhadrapada':'Пурва Бхадрапада','Uttara Bhadrapada':'Уттара Бхадрапада','Revati':'Реваті'};
const copy = {
 en: {brandTag:'VEDIC ASTROLOGY ENGINE',workspace:'WORKSPACE',navChart:'Birth chart',navAnalysis:'Chart analysis',navDasha:'Dasha periods',navAI:'AI interpretation',engine:'Deterministic Jyotish Core',platform:'JYOTISH CALCULATION PLATFORM',title:'Your cosmic blueprint<span class="gold">.</span>',subtitle:'Sidereal planetary positions, divisional charts and traditional symbolic interpretations.',stepInput:'01 / INPUT',stepVisualization:'02 / VISUALIZATION',stepCoordinates:'03 / POSITIONS',stepDasha:'04 / TIME CYCLES',stepAI:'05 / INTERPRETATION',birthDetails:'Birth details',formDesc:'Enter the date, precise local time and location of birth.',dateLabel:'Date of birth',timeLabel:'Local birth time',cityLabel:'Place of birth',cityDelhi:'New Delhi, India',cityKryvyi:'Kryvyi Rih, Ukraine',cityKyiv:'Kyiv, Ukraine',cityLondon:'London, UK',cityCustom:'Custom coordinates',latitude:'LATITUDE',longitude:'LONGITUDE',timezone:'IANA TIME ZONE',sidereal:'Sidereal zodiac',active:'ACTIVE',calculate:'Calculate birth chart',ascMetric:'ASCENDANT',moonMetric:'MOON SIGN',ayanLabel:'AYANAMSHA (LAHIRI)',siderealOffset:'Sidereal offset',natalChart:'Vedic birth chart',emptyChart:'Calculate a chart to begin',chartOverview:'CHART DETAILS',chartD1:'Rashi / D1',chartD9:'Navamsa / D9',chartD10:'Dashamsa / D10',descD1:'Whole-sign sidereal chart. The first house is at the top.',descD9:'Nine-part divisional chart. Houses are counted from D9 Lagna.',descD10:'Ten-part divisional chart. Houses are counted from D10 Lagna.',sunMoon:'Sun / Moon',otherGrahas:'Other grahas',ephemeris:'Ephemeris',houses:'Houses',wholeSign:'Whole sign',positions:'Planetary positions',grahasCount:'9 GRAHAS',colGraha:'GRAHA',colSign:'SIGN',colDegree:'DEGREE',colHouse:'HOUSE',colNakshatra:'NAKSHATRA',awaiting:'Awaiting calculation...',dashaTitle:'Vimshottari Dasha',dashaDesc:'Mahadashas and their Antardashas. Dates use the documented year convention.',aiTitle:'AI interpretation',aiDesc:'Optional OpenAI explanation of calculated positions; no invented placements.',science:'Tradition, not prediction',scienceDesc:'Astrological interpretation is cultural tradition, not a scientifically verified forecast.',interpret:'Generate interpretation',footer:'REPRODUCIBLE CALCULATIONS + RESPONSIBLE AI',house:'House',pada:'Pada',activePeriod:'Active',antardasha:'Antardasha',working:'Calculating astronomical positions…',success:'Chart calculated. UTC: ',error:'Calculation failed',offline:'Local explanation',unknown:'Unable to generate the explanation'},
 uk: {brandTag:'РУШІЙ ВЕДИЧНОЇ АСТРОЛОГІЇ',workspace:'РОБОЧА ОБЛАСТЬ',navChart:'Натальна карта',navAnalysis:'Аналіз карти',navDasha:'Періоди даш',navAI:'ШІ-трактування',engine:'Обчислювальне ядро Джйотіш',platform:'ПЛАТФОРМА РОЗРАХУНКІВ ДЖЙОТІШ',title:'Твоя ведична натальна карта<span class="gold">.</span>',subtitle:'Сидеричні положення планет, дробові карти та традиційні символічні трактування.',stepInput:'01 / ВВЕДЕННЯ',stepVisualization:'02 / ВІЗУАЛІЗАЦІЯ',stepCoordinates:'03 / ПОЛОЖЕННЯ',stepDasha:'04 / ЧАСОВІ ПЕРІОДИ',stepAI:'05 / ТРАКТУВАННЯ',birthDetails:'Дані народження',formDesc:'Вкажи дату, точний місцевий час і місце народження.',dateLabel:'Дата народження',timeLabel:'Місцевий час народження',cityLabel:'Місце народження',cityDelhi:'Нью-Делі, Індія',cityKryvyi:'Кривий Ріг, Україна',cityKyiv:'Київ, Україна',cityLondon:'Лондон, Велика Британія',cityCustom:'Власні координати',latitude:'ШИРОТА',longitude:'ДОВГОТА',timezone:'ЧАСОВИЙ ПОЯС (IANA)',sidereal:'Сидеричний зодіак',active:'УВІМКНЕНО',calculate:'Розрахувати натальну карту',ascMetric:'АСЦЕНДЕНТ',moonMetric:'ЗНАК МІСЯЦЯ',ayanLabel:'АЙАНАМША (ЛАХІРІ)',siderealOffset:'Сидеричне зміщення',natalChart:'Ведична натальна карта',emptyChart:'Спочатку розрахуй карту',chartOverview:'ВІДОМОСТІ ПРО КАРТУ',chartD1:'Раші / D1',chartD9:'Навамша / D9',chartD10:'Дашамша / D10',descD1:'Сидерична карта з цілознаковими домами. Перший дім угорі.',descD9:'Дробова карта з дев’яти частин. Доми відраховуються від Лагни D9.',descD10:'Дробова карта з десяти частин. Доми відраховуються від Лагни D10.',sunMoon:'Сонце / Місяць',otherGrahas:'Інші грахи',ephemeris:'Ефемериди',houses:'Система домів',wholeSign:'Цілознакові',positions:'Положення планет',grahasCount:'9 ГРАХ',colGraha:'ГРАХА',colSign:'ЗНАК',colDegree:'ГРАДУС',colHouse:'ДІМ',colNakshatra:'НАКШАТРА',awaiting:'Очікування розрахунку…',dashaTitle:'Вімшоттарі-даша',dashaDesc:'Махадаші та їхні антардаші. Дати залежать від обраної конвенції року.',aiTitle:'ШІ-трактування',aiDesc:'Пояснення розрахованих положень через OpenAI без вигадування астрономічних фактів.',science:'Традиція, а не прогноз',scienceDesc:'Астрологічні трактування — культурна традиція, а не науково підтверджені передбачення.',interpret:'Створити трактування',footer:'ВІДТВОРЮВАНІ ОБЧИСЛЕННЯ + ВІДПОВІДАЛЬНИЙ ШІ',house:'Дім',pada:'Пада',activePeriod:'Активний',antardasha:'Антардаша',working:'Обчислюємо положення небесних тіл…',success:'Карту розраховано. UTC: ',error:'Помилка розрахунку',offline:'Локальне пояснення',unknown:'Не вдалося сформувати пояснення'}
};
let language = navigator.language?.toLowerCase().startsWith('uk') ? 'uk' : 'en';
let chart = null;
let chartType = 'd1';
const tr = (key) => copy[language][key] || copy.en[key] || key;
const sign = num => language === 'uk' ? ukSigns[num - 1] : enSigns[num - 1];
const grahaName = name => language === 'uk' ? ukGrahas[name] || name : name;
const nakName = name => language === 'uk' ? ukNakshatras[name] || name : name;
const setStatus = (message, error = false) => { const el = $('#formStatus'); el.textContent = message; el.classList.toggle('error',error); };
function applyLang(){
 document.documentElement.lang = language;
 $$('[data-i18n]').forEach(el => { const key = el.dataset.i18n; if(copy[language][key]) el.innerHTML=tr(key); });
 $('#langToggle').innerHTML=language==='en'?'<b>EN</b> / УКР':'EN / <b>УКР</b>';
 if(chart) render();
}
$('#langToggle').addEventListener('click',()=>{language=language==='en'?'uk':'en';applyLang()});
$('#preset').addEventListener('change', e => { const city=cities[e.target.value];if(!city)return;for(const key of ['latitude','longitude','timeZone'])$('#'+key).value=city[key]; });
$$('.chart-tab').forEach(button => button.addEventListener('click',()=>{chartType=button.dataset.chart;$$('.chart-tab').forEach(x=>x.classList.toggle('selected',x===button));if(chart)render();}));
const xml = v=>String(v).replace(/[&<>"']/g, x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[x]));
// Conventional North Indian fixed-house layout: house 1 top, then anti-clockwise.
const houseCenters = [[180,79],[88,43],[43,88],[81,180],[43,272],[88,317],[180,280],[272,317],[317,272],[279,180],[317,88],[272,43]];
function svgChart(planets,lagna){
 const signs=language==='uk'?['Ов','Тл','Бл','Рк','Лв','Дв','Тр','Ск','Ст','Кз','Вд','Рб']:['Ar','Ta','Ge','Cn','Le','Vi','Li','Sc','Sg','Cp','Aq','Pi'];
 let content=`<svg xmlns="http://www.w3.org/2000/svg" width="360" height="360" viewBox="0 0 360 360" role="img" aria-label="${xml(tr('natalChart'))}: ${chartType.toUpperCase()}, 12 ${xml(tr('houses'))}"><rect x="1" y="1" width="358" height="358" rx="4" fill="#101b2b" stroke="#c6a66d" stroke-width="2"/><path d="M0 0 L360 360 M360 0 L0 360 M180 0 L360 180 L180 360 L0 180 Z" fill="none" stroke="#7d725d" stroke-width="1.4"/>`;
 for(let i=0;i<12;i++){
  const [x,y]=houseCenters[i]; const items=planets.filter(p=>p.house===i+1);
  const rashi=(lagna.sign-1+i)%12;
  // Three separate lines to prevent conjunctions from becoming illegible.
  const words=items.map(g=>abbr[language][g.name]||g.name.slice(0,2));
  const chunks=[];for(let n=0;n<words.length;n+=3)chunks.push(words.slice(n,n+3).join('  '));
  content+=`<text x="${x}" y="${y-17}" text-anchor="middle" font-size="10" fill="#d8b875" font-weight="700">${i+1} · ${signs[rashi]}</text>`;
  chunks.slice(0,3).forEach((word,row)=>{const featured=items.some(p=>p.name==='Sun'||p.name==='Moon');content+=`<text x="${x}" y="${y+row*13}" text-anchor="middle" font-size="${word.length>11?9:11}" fill="${featured?'#f4d493':'#e2e8f2'}" font-weight="600">${xml(word)}</text>`;});
 }
 return content+'</svg>';
}
function render(){
 const moon=chart.d1.find(p=>p.name==='Moon');const asc=chartType==='d1'?chart.ascendant:chartType==='d9'?chart.lagnaD9:chart.lagnaD10;
 $('#ascMetric').textContent=sign(chart.ascendant.sign);
 $('#ascDetail').textContent=`${chart.ascendant.degreesInSign.toFixed(2)}° · ${tr('house')} 1`;
 $('#moonMetric').textContent=sign(moon.sign);
 $('#nakMetric').textContent=`${nakName(moon.nakshatra)} · ${tr('pada')} ${moon.pada}`;
 $('#ayanMetric').textContent=`${chart.ayanamsa.toFixed(3)}°`;
 $('#chartHeading').textContent=tr('chart'+chartType.toUpperCase());
 $('#chartDescription').textContent=tr('desc'+chartType.toUpperCase());
 $('#backendName').textContent=chart.ephemeris.includes('pyswisseph')?'PySwissEph':'Swiss Ephemeris';
 const el=$('#wheel');el.classList.remove('wheel-placeholder');el.classList.add('wheel-ready');el.innerHTML=svgChart([...chart[chartType],asc],asc);
 $('#planetsTable').innerHTML=chart[chartType].map(p=>`<tr><td>${xml(grahaName(p.name))}${p.retrograde?' ℞':''}</td><td>${xml(sign(p.sign))}</td><td>${p.degreesInSign.toFixed(2)}°</td><td>${p.house}</td><td>${p.pada?`${xml(nakName(p.nakshatra))} · ${p.pada}`:'—'}</td></tr>`).join('');
 const now=Date.now();
 $('#dashaTimeline').innerHTML=chart.dasha.map(d=>{
  const active=Date.parse(d.start)<=now && Date.parse(d.end)>now;
  const ad=d.antardashas?.find(a=>Date.parse(a.start)<=now && Date.parse(a.end)>now);
  return `<div class="dasha-item ${active?'current':''}"><div class="dasha-row"><strong>${active?'✦ ':''}${xml(grahaName(d.lord))}</strong><span>${d.start.slice(0,10)} — ${d.end.slice(0,10)}</span></div>${active?`<small>● ${tr('activePeriod')} · ${xml(grahaName(ad?.lord||'—'))} (${tr('antardasha')})</small>`:''}</div>`;
 }).join('');
}
$('#birthForm').addEventListener('submit',async event=>{
 event.preventDefault();const button=$('#calculateBtn');button.disabled=true;setStatus(tr('working'));
 try{
  const payload={date:$('#date').value,time:$('#time').value,timeZone:$('#timeZone').value,latitude:Number($('#latitude').value),longitude:Number($('#longitude').value)};
  const res=await fetch('/api/v1/charts/calculate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const data=await res.json();if(!res.ok)throw new Error(data.error||tr('error'));
  chart=data;$('#interpretBtn').disabled=false;$('#interpretationText').textContent='';render();setStatus(tr('success')+chart.utc);
 }catch(error){setStatus(error.message,true);}finally{button.disabled=false;}
});
$('#interpretBtn').addEventListener('click',async()=>{
 if(!chart)return;const button=$('#interpretBtn');button.disabled=true;$('#interpretationText').textContent=tr('working');
 try{const res=await fetch('/api/v1/interpretations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:chart.id,lang:language})});const data=await res.json();if(!res.ok)throw Error(data.error||tr('unknown'));$('#interpretationText').textContent=`${data.provider==='local'?tr('offline'):'OpenAI'}\n\n${data.text}`;}catch(error){$('#interpretationText').textContent=error.message;}finally{button.disabled=false;}
});
applyLang();
