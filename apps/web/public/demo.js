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
const ukGrahas = {Sun:'Сонце',Moon:'Місяць',Mars:'Марс',Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн',Rahu:'Раху',Ketu:'Кету',Ascendant:'Висхідний знак'};
const ukNakshatras = {'Ashwini':'Ашвіні','Bharani':'Бхарані','Krittika':'Кріттіка','Rohini':'Рохіні','Mrigashira':'Мрігашіра','Ardra':'Ардра','Punarvasu':'Пунарвасу','Pushya':'Пушʼя','Ashlesha':'Ашлеша','Magha':'Магха','Purva Phalguni':'Пурва Пхалгуні','Uttara Phalguni':'Уттара Пхалгуні','Hasta':'Хаста','Chitra':'Чітра','Swati':'Сваті','Vishakha':'Вішакха','Anuradha':'Анурадха','Jyeshtha':'Джʼєштха','Mula':'Мула','Purva Ashadha':'Пурва Ашадха','Uttara Ashadha':'Уттара Ашадха','Shravana':'Шравана','Dhanishta':'Дханіштха','Shatabhisha':'Шатабхіша','Purva Bhadrapada':'Пурва Бхадрапада','Uttara Bhadrapada':'Уттара Бхадрапада','Revati':'Реваті'};
const copy = {
 en: {brandTag:'VEDIC ASTROLOGY ENGINE',workspace:'WORKSPACE',navChart:'Birth chart',navAnalysis:'Chart analysis',navDasha:'Life cycles',navAI:'Chart reading',engine:'Deterministic Jyotish Core',platform:'VEDIC BIRTH CHART',title:'Your cosmic blueprint<span class="gold">.</span>',subtitle:'Sidereal planetary positions, divisional charts and traditional symbolic interpretations.',stepInput:'01 / INPUT',stepVisualization:'02 / VISUALIZATION',stepCoordinates:'03 / POSITIONS',stepDasha:'04 / TIME CYCLES',stepAI:'05 / INTERPRETATION',birthDetails:'Birth details',formDesc:'Enter the date, precise local time and location of birth.',dateLabel:'Date of birth',timeLabel:'Local birth time',cityLabel:'Place of birth',cityDelhi:'New Delhi, India',cityKryvyi:'Kryvyi Rih, Ukraine',cityKyiv:'Kyiv, Ukraine',cityLondon:'London, UK',cityCustom:'Custom coordinates',latitude:'LATITUDE',longitude:'LONGITUDE',timezone:'IANA TIME ZONE',sidereal:'Sidereal zodiac',active:'ACTIVE',calculate:'Calculate birth chart',ascMetric:'RISING SIGN',moonMetric:'MOON SIGN',ayanLabel:'ZODIAC OFFSET (LAHIRI)',siderealOffset:'Sidereal offset',natalChart:'Vedic birth chart',emptyChart:'Calculate a chart to begin',chartOverview:'CHART DETAILS',chartD1:'Main chart / D1',chartD9:'Relationships & values / D9',chartD10:'Work & purpose / D10',descD1:'Main chart showing planetary positions across twelve areas of life.',descD9:'A supplementary chart traditionally used to explore relationships and personal values.',descD10:'A supplementary chart for reflecting on work and public role.',sunMoon:'Sun / Moon',otherGrahas:'Other planets / nodes',ephemeris:'Ephemeris',houses:'Life-area system',wholeSign:'Sign-based',positions:'Planetary positions',grahasCount:'9 PLANETS / NODES',colGraha:'PLANET / NODE',colSign:'SIGN',colDegree:'DEGREE',colHouse:'LIFE AREA',colNakshatra:'LUNAR SECTOR',awaiting:'Awaiting calculation...',dashaTitle:'Life cycles',dashaDesc:'Traditional symbolic timing cycles, not guaranteed predictions.',aiTitle:'Chart reading',aiDesc:'A plain-language explanation of the calculated chart, without invented placements.',science:'Jyotish tradition',scienceDesc:'A symbolic reading grounded in your calculated birth chart.',interpret:'Generate interpretation',footer:'REPRODUCIBLE CALCULATIONS + RESPONSIBLE AI',house:'Life area',pada:'Part',activePeriod:'Active',antardasha:'Sub-period',working:'Calculating astronomical positions…',success:'Chart calculated. UTC: ',error:'Calculation failed',offline:'Local explanation',unknown:'Unable to generate the explanation'},
 uk: {brandTag:'РУШІЙ ВЕДИЧНОЇ АСТРОЛОГІЇ',workspace:'РОБОЧА ОБЛАСТЬ',navChart:'Натальна карта',navAnalysis:'Аналіз карти',navDasha:'Життєві цикли',navAI:'Пояснення карти',engine:'Обчислювальне ядро Джйотіш',platform:'ВЕДИЧНА НАТАЛЬНА КАРТА',title:'Твоя ведична натальна карта<span class="gold">.</span>',subtitle:'Сидеричні положення планет, дробові карти та традиційні символічні трактування.',stepInput:'01 / ВВЕДЕННЯ',stepVisualization:'02 / ВІЗУАЛІЗАЦІЯ',stepCoordinates:'03 / ПОЛОЖЕННЯ',stepDasha:'04 / ЧАСОВІ ПЕРІОДИ',stepAI:'05 / ТРАКТУВАННЯ',birthDetails:'Дані народження',formDesc:'Вкажи дату, точний місцевий час і місце народження.',dateLabel:'Дата народження',timeLabel:'Місцевий час народження',cityLabel:'Місце народження',cityDelhi:'Нью-Делі, Індія',cityKryvyi:'Кривий Ріг, Україна',cityKyiv:'Київ, Україна',cityLondon:'Лондон, Велика Британія',cityCustom:'Власні координати',latitude:'ШИРОТА',longitude:'ДОВГОТА',timezone:'ЧАСОВИЙ ПОЯС (IANA)',sidereal:'Сидеричний зодіак',active:'УВІМКНЕНО',calculate:'Розрахувати натальну карту',ascMetric:'ВИСХІДНИЙ ЗНАК',moonMetric:'ЗНАК МІСЯЦЯ',ayanLabel:'ЗОДІАКАЛЬНЕ ЗМІЩЕННЯ',siderealOffset:'Сидеричне зміщення',natalChart:'Ведична натальна карта',emptyChart:'Спочатку розрахуй карту',chartOverview:'ВІДОМОСТІ ПРО КАРТУ',chartD1:'Основна карта / D1',chartD9:'Стосунки й цінності / D9',chartD10:'Робота й покликання / D10',descD1:'Основна карта: положення планет і дванадцять сфер життя.',descD9:'Допоміжна карта, яку традиційно пов’язують зі стосунками та особистими цінностями.',descD10:'Допоміжна карта для символічного розгляду роботи й суспільної ролі.',sunMoon:'Сонце / Місяць',otherGrahas:'Інші планети / вузли',ephemeris:'Ефемериди',houses:'Система сфер життя',wholeSign:'За знаками',positions:'Положення планет',grahasCount:'9 ПЛАНЕТ І ВУЗЛІВ',colGraha:'ПЛАНЕТА / ВУЗОЛ',colSign:'ЗНАК',colDegree:'ГРАДУС',colHouse:'СФЕРА',colNakshatra:'ЗІРКОВИЙ СЕКТОР',awaiting:'Очікування розрахунку…',dashaTitle:'Життєві цикли',dashaDesc:'Традиційні символічні періоди часу, а не гарантований прогноз.',aiTitle:'Пояснення карти',aiDesc:'Зрозуміле пояснення головних тем карти без вигаданих астрономічних фактів.',science:'Традиція Джйотіш',scienceDesc:'Символічне трактування на основі розрахованої натальної карти.',interpret:'Створити трактування',footer:'ВІДТВОРЮВАНІ ОБЧИСЛЕННЯ + ВІДПОВІДАЛЬНИЙ ШІ',house:'Сфера',pada:'Частина',activePeriod:'Активний',antardasha:'Підперіод',working:'Обчислюємо положення небесних тіл…',success:'Карту розраховано. UTC: ',error:'Помилка розрахунку',offline:'Локальне пояснення',unknown:'Не вдалося сформувати пояснення'}
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
const houseCenters = [[180,90],[90,40],[45,90],[90,180],[45,270],[90,315],[180,270],[270,315],[315,270],[270,180],[315,90],[270,40]];
function fitTextAttrs(text,x,size){
  const maxWidth=x<=50||x>=310?76:x<=95||x>=265?96:145;
  return text.length*size*0.58>maxWidth?' textLength="'+maxWidth+'" lengthAdjust="spacingAndGlyphs"':'';
}
function svgChart(planets,lagna){
  const signs=language==='uk'?ukSigns:enSigns;
  let content=`<svg xmlns="http://www.w3.org/2000/svg" class="chart-svg" width="520" height="520" viewBox="0 0 360 360" role="img" aria-label="${xml(tr('natalChart'))}: ${chartType.toUpperCase()}, 12 ${xml(tr('houses'))}"><rect x="1" y="1" width="358" height="358" rx="4" fill="#101b2b" stroke="#c6a66d" stroke-width="2"/><path d="M0 0 L360 360 M360 0 L0 360 M180 0 L360 180 L180 360 L0 180 Z" fill="none" stroke="#7d725d" stroke-width="1.4"/>`;
  for(let i=0;i<12;i++){
    const [x,y]=houseCenters[i], items=planets.filter(p=>p.house===i+1);
    const rashi=(lagna.sign-1+i)%12;
    const names=items.map(g=>grahaName(g.name)+(g.retrograde?' ℞':''));
    // Triangle sectors fit at most two grahas; central diamonds can fit three.
    // Vertically centre the *entire* stack (sign label + each name + overflow).
    const isTriangle=[1,2,4,5,7,8,10,11].includes(i);
    const maxVisible=(y<=42||y>=300)?2:isTriangle?2:3;
    const crowded=names.length>maxVisible;
    const visible=names.slice(0,maxVisible);
    const label=`${i+1} · ${signs[rashi]}`;
    const lines=1+visible.length+(crowded?1:0);
    const firstBaseline=y-(lines-1)*7+3;
    content+=`<g class="vedic-house" data-house="${i+1}"><title>${xml(`${label}: ${names.join(', ') || (language==='uk'?'немає планет':'no planets')}`)}</title><text x="${x}" y="${firstBaseline}" text-anchor="middle" font-size="${label.length>13?9:10}"${fitTextAttrs(label,x,label.length>13?9:10)} fill="#d8b875" font-weight="700">${xml(label)}</text>`;
    visible.forEach((word,row)=>{
      const size=word.length>11?9:word.length>9?10:11;
      const color=items[row]?.name==='Sun'||items[row]?.name==='Moon'?'#f4d493':'#e2e8f2';
      content+=`<text x="${x}" y="${firstBaseline+(row+1)*14}" text-anchor="middle" font-size="${size}"${fitTextAttrs(word,x,size)} fill="${color}" font-weight="600">${xml(word)}</text>`;
    });
    if(crowded) content+=`<text x="${x}" y="${firstBaseline+(visible.length+1)*14}" text-anchor="middle" font-size="9"${fitTextAttrs(language==='uk'?`ще ${names.length-visible.length} ↓`:`+${names.length-visible.length} below`,x,9)} fill="#d8b875">${xml(language==='uk'?`ще ${names.length-visible.length} ↓`:`+${names.length-visible.length} below`)}</text>`;
    content+='</g>';
  }
  return content+'</svg>';
}
function houseIndex(planets,lagna){
  const all=[];
  for(let i=0;i<12;i++){
    const items=planets.filter(g=>g.house===i+1);
    if(!items.length)continue;
    const signName=sign((lagna.sign-1+i)%12+1);
    all.push(`<div class="house-item"><strong>${i+1}. ${xml(signName)}</strong><span>${items.map(g=>xml(grahaName(g.name))+(g.retrograde?' ℞':'')).join(' · ')}</span></div>`);
  }
  return all.join('');
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
  const index=$('#houseIndex');index.hidden=false;index.querySelector('.house-index-title').textContent=language==='uk'?'Планети за домами (повні назви)':'Planets by house (full names)';
  index.querySelector('.house-index-grid').innerHTML=houseIndex([...chart[chartType],asc],asc);
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
