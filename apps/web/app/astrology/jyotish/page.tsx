'use client';
import {useState,useEffect} from 'react';
import {readApiJson} from '../../../lib/api-response';
import DetailedReport,{type ReadingReport} from '../../components/DetailedReport';
import AccountPortal from '../../components/AccountPortal';
import {Compass,Orbit,Clock3,Sparkles,BookOpen,Activity,ArrowUpRight,ShieldCheck} from 'lucide-react';
type Graha={name:string;longitude:number;sign:number;signName:string;degreesInSign:number;house:number;nakshatra:string;pada:number;retrograde:boolean};
type Period={lord:string;start:string;end:string;antardashas:{lord:string;start:string;end:string}[]};
type Chart={id?:string;input:{date:string;time:string;timeZone:string;latitude:number;longitude:number;place?:string};utc:string;ayanamsa:number;ascendant:Graha;lagnaD9:Graha;lagnaD10:Graha;ephemeris:string;d1:Graha[];d9:Graha[];d10:Graha[];dasha:Period[]};
type Form={date:string;time:string;latitude:string;longitude:string;timeZone:string};
const CITY:Record<string,Form>={delhi:{date:'2000-01-01',time:'12:00',latitude:'28.6139',longitude:'77.209',timeZone:'Asia/Kolkata'},kryvyi:{date:'2000-01-01',time:'12:00',latitude:'47.9105',longitude:'33.3918',timeZone:'Europe/Kyiv'},kyiv:{date:'2000-01-01',time:'12:00',latitude:'50.4501',longitude:'30.5234',timeZone:'Europe/Kyiv'},london:{date:'2000-01-01',time:'12:00',latitude:'51.5074',longitude:'-0.1278',timeZone:'Europe/London'}};
const t={en:{title:'Your cosmic blueprint',subtitle:'Precision Vedic calculations. From planetary positions to symbolic interpretations — all in one place.',details:'Birth details',detail:'Enter date, exact local time and geographic coordinates.',date:'Date of birth',time:'Local time of birth',place:'Location preset',calculate:'Calculate birth chart',asc:'RISING SIGN',moon:'MOON SIGN',chart:'Natal chart',grahas:'Planetary positions',dasha:'Life cycles',dashadesc:'Traditional symbolic time cycles, not guaranteed predictions.',ai:'Chart reading',aidesc:'A clear explanation of the main themes in everyday language, followed by a detailed report.',aiButton:'Generate full reading',note:'Jyotish tradition',noteDesc:'A symbolic reading grounded in your calculated birth chart.',waiting:'Calculate a chart to begin.',working:'Calculating Swiss Ephemeris...',completed:'Calculated successfully.'},uk:{title:'Твоя космічна карта',subtitle:'Точні ведичні обчислення: від положень планет до символічних інтерпретацій.',details:'Дані народження',detail:'Введи дату, точний місцевий час і географічні координати.',date:'Дата народження',time:'Місцевий час',place:'Місце народження',calculate:'Розрахувати карту',asc:'ВИСХІДНИЙ ЗНАК',moon:'ЗНАК МІСЯЦЯ',chart:'Натальна карта',grahas:'Положення планет',dasha:'Життєві цикли',dashadesc:'Традиційні символічні періоди часу, а не гарантований прогноз.',ai:'Пояснення карти',aidesc:'Зрозуміле пояснення головних тем звичайною мовою, а нижче — детальний розбір карти.',aiButton:'Створити повне трактування',note:'Традиція Джйотіш',noteDesc:'Символічне трактування на основі розрахованої натальної карти.',waiting:'Спочатку розрахуй карту.',working:'Обчислюємо ефемериди...',completed:'Карту обчислено.'}};
const FREE_AI_FALLBACK_UK:Record<string,string>={
 hourly_limit:'Досягнуто локального погодинного ліміту безкоштовних AI-запитів.',
 no_provider:'Безкоштовна хмарна або локальна AI-модель не налаштована.',
 rate_limited:'Безкоштовний провайдер обмежив кількість запитів (HTTP 429).',
 provider_rejected:'Безкоштовний провайдер відхилив запит. Перевір ключ або доступ до моделі.',
 provider_unavailable:'Безкоштовний провайдер тимчасово недоступний.',
 invalid_response:'Безкоштовна модель повернула некоректний формат трактування.',
 timeout:'Безкоштовна модель не встигла відповісти за відведений час.',
 network:'Не вдалося підключитися до безкоштовного AI-провайдера.'
};
const FREE_AI_FALLBACK_EN:Record<string,string>={
 hourly_limit:'The local free AI hourly request limit was reached.',
 no_provider:'No free cloud or local AI model is configured.',
 rate_limited:'The free provider rate-limited requests (HTTP 429).',
 provider_rejected:'The free provider rejected the request. Check key or model access.',
 provider_unavailable:'The free provider is temporarily unavailable.',
 invalid_response:'The free model returned an invalid interpretation format.',
 timeout:'The free model did not respond before the timeout.',
 network:'The free AI provider could not be reached.'
};
const HOUSE_CENTERS:[number,number][]=[[180,90],[90,40],[45,90],[90,180],[45,270],[90,315],[180,270],[270,315],[315,270],[270,180],[315,90],[270,40]];
const SIGN_EN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_UK=['Овен','Телець','Близнюки','Рак','Лев','Діва','Терези','Скорпіон','Стрілець','Козоріг','Водолій','Риби'];
const GRAHA_UK:Record<string,string>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн',Rahu:'Раху',Ketu:'Кету',Ascendant:'Висхідний знак'};
const NAKSHATRA_UK:Record<string,string>={
 Ashwini:'Ашвіні',Bharani:'Бхарані',Krittika:'Кріттіка',Rohini:'Рохіні',Mrigashira:'Мрігашіра',Ardra:'Ардра',
 Punarvasu:'Пунарвасу',Pushya:'Пушʼя',Ashlesha:'Ашлеша',Magha:'Магха','Purva Phalguni':'Пурва Пхалгуні',
 'Uttara Phalguni':'Уттара Пхалгуні',Hasta:'Хаста',Chitra:'Чітра',Swati:'Сваті',Vishakha:'Вішакха',
 Anuradha:'Анурадха',Jyeshtha:'Джʼєштха',Mula:'Мула','Purva Ashadha':'Пурва Ашадха',
 'Uttara Ashadha':'Уттара Ашадха',Shravana:'Шравана',Dhanishta:'Дханіштха',Shatabhisha:'Шатабхіша',
 'Purva Bhadrapada':'Пурва Бхадрапада','Uttara Bhadrapada':'Уттара Бхадрапада',Revati:'Реваті'
};
const nakshatraName=(name:string,lang:'en'|'uk')=>lang==='uk'?(NAKSHATRA_UK[name]||name):name;
function fitText(text:string,x:number,size:number){
 const maxWidth=x<=50||x>=310?76:x<=95||x>=265?96:145;
 return text.length*size*0.58>maxWidth?{textLength:maxWidth,lengthAdjust:'spacingAndGlyphs' as const}:{};
}
const grahaFull=(name:string,lang:'en'|'uk')=>lang==='uk'?(GRAHA_UK[name]||name):name;
const signFull=(sign:number,lang:'en'|'uk')=>(lang==='uk'?SIGN_UK:SIGN_EN)[sign-1];
function HouseIndex({grahas,lang,lagna}:{grahas:Graha[],lang:'en'|'uk',lagna:Graha}){
 return <section className="house-index" aria-label={lang==='uk'?'Планети та сфери життя':'Planets and life areas'}>
 <h3 className="house-index-title">{lang==='uk'?'Планети та сфери життя':'Planets and life areas'}</h3>
 <div className="house-index-grid">{HOUSE_CENTERS.map((_,i)=>{
   const items=grahas.filter(g=>g.house===i+1); if(!items.length)return null;
   return <div className="house-item" key={i}><strong>{i+1}. {signFull((lagna.sign-1+i)%12+1,lang)}</strong><span>{items.map(g=>grahaFull(g.name,lang)+(g.retrograde?' ℞':'')).join(' · ')}</span></div>;
 })}</div></section>;
}
function Wheel({grahas,which,lang,lagna}:{grahas:Graha[],which:string,lang:'en'|'uk',lagna:Graha}){
 return <svg viewBox="0 0 360 360" width="520" height="520" className="chart-svg" role="img" aria-label={`${which.toUpperCase()} · 12 ${lang==='uk'?'сфер життя':'life areas'}`}>
  <rect x="1" y="1" width="358" height="358" rx="4" fill="#101b2b" stroke="#c6a66d" strokeWidth="2"/>
  <path d="M0 0 L360 360 M360 0 L0 360 M180 0 L360 180 L180 360 L0 180 Z" fill="none" stroke="#7d725d" strokeWidth="1.4"/>
  {HOUSE_CENTERS.map(([x,y],i)=>{
   const sign=(lagna.sign-1+i)%12+1,bodies=grahas.filter(p=>p.house===i+1);
   const names=bodies.map(p=>grahaFull(p.name,lang)+(p.retrograde?' ℞':''));
   const isTriangle=[1,2,4,5,7,8,10,11].includes(i);
   const maxVisible=(y<=42||y>=300)?2:isTriangle?2:3;
   const crowded=names.length>maxVisible, shown=names.slice(0,maxVisible);
   const label=`${i+1} · ${signFull(sign,lang)}`;
   const lines=1+shown.length+(crowded?1:0);
   const firstBaseline=y-(lines-1)*7+3;
   return <g key={i} className="vedic-house" data-house={i+1}>
    <title>{label}: {names.join(', ')||(lang==='uk'?'немає планет':'no planets')}</title>
    <text x={x} y={firstBaseline} textAnchor="middle" fill="#d8b875" fontSize={label.length>13?9:10} {...fitText(label,x,label.length>13?9:10)} fontWeight="700">{label}</text>
    {shown.map((word,j)=><text key={j} x={x} y={firstBaseline+(j+1)*14} textAnchor="middle" fill={bodies[j]?.name==='Sun'||bodies[j]?.name==='Moon'?'#f4d493':'#e2e8f2'} fontSize={word.length>11?9:word.length>9?10:11} {...fitText(word,x,word.length>11?9:word.length>9?10:11)} fontWeight="600">{word}</text>)}
    {crowded&&<text x={x} y={firstBaseline+(shown.length+1)*14} textAnchor="middle" fill="#d8b875" fontSize="9" {...fitText(lang==='uk'?`ще ${names.length-shown.length} ↓`:`+${names.length-shown.length} below`,x,9)}>{lang==='uk'?`ще ${names.length-shown.length} ↓`:`+${names.length-shown.length} below`}</text>}
   </g>;
  })}
 </svg>;
}
export default function Page({initialLang='uk'}:{initialLang?:'en'|'uk'}){
 const [lang,setLang]=useState<'en'|'uk'>(initialLang),[form,setForm]=useState<Form>(CITY.delhi),[preset,setPreset]=useState('delhi'),[chart,setChart]=useState<Chart|null>(null),[tab,setTab]=useState<'d1'|'d9'|'d10'>('d1'),[busy,setBusy]=useState(false),[status,setStatus]=useState(''),[error,setError]=useState(false),[interpretation,setInterpretation]=useState(''),[aiBusy,setAiBusy]=useState(false);
 const [report,setReport]=useState<ReadingReport|null>(null);
 const loadSaved=(loaded:unknown,saved:ReadingReport|null)=>{
  const incoming=loaded as Chart;
  if(!incoming?.input||!Array.isArray(incoming.d1))return;
  setChart(incoming);
  setForm({...incoming.input,latitude:String(incoming.input.latitude),longitude:String(incoming.input.longitude)});
  setReport(saved?.language===lang?saved:null);
  setInterpretation(lang==='uk'?'Збережену карту відкрито з кабінету.':'Saved chart opened from your account.');
  setError(false);
  setStatus(lang==='uk'?'Завантажено попередній розрахунок.':'Previous calculation restored.');
 };

 useEffect(()=>{if(report)document.getElementById('full-reading')?.scrollIntoView({behavior:'smooth',block:'start'});},[report]);
 const i=t[lang];const api=''; // Same-origin /api proxy protects remote demo visitors
 const edit=(key:keyof Form,value:string)=>setForm(old=>({...old,[key]:value}));
 async function calculate(e:React.FormEvent){e.preventDefault();setBusy(true);setError(false);setStatus(i.working);try{const response=await fetch(`${api}/api/v1/charts/calculate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,latitude:Number(form.latitude),longitude:Number(form.longitude)})});const data=await readApiJson<Chart>(response);setChart(data);setReport(null);setInterpretation('');setStatus(`${i.completed} UTC: ${data.utc}`);}catch(e){setError(true);setStatus(e instanceof Error?e.message:String(e));}finally{setBusy(false)}}
 async function interpret(){
  if(!chart)return;
  setAiBusy(true);setInterpretation(lang==='uk'?'Створюємо детальний звіт…':'Preparing a detailed report…');
  try{
   const response=await fetch(api+'/api/v1/reports',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({...chart.input,lang,asOf:new Date().toISOString().slice(0,10)})
   });
   const data=await readApiJson<ReadingReport>(response);
   if(!Array.isArray(data.sections)||!data.sections.length)throw Error('Report chapters missing');
   setReport(data);
   setInterpretation(lang==='uk'?'Звіт готовий ↓ Прокрутіть нижче':'Report ready ↓ Scroll below');
  }catch(error){
   setInterpretation(error instanceof Error?error.message:String(error));
  }finally{setAiBusy(false);}
 }
 const placements=chart?.[tab]||[];const moon=chart?.d1.find(x=>x.name==='Moon');const now=Date.now();
 return <div className="app-shell"><aside className="sidebar"><div className="logo"><span className="logo-mark">✧</span><span>GALAXI<span className="logo-light">ORA</span><small>{lang==='uk'?'РУШІЙ ВЕДИЧНОЇ АСТРОЛОГІЇ':'VEDIC ASTROLOGY ENGINE'}</small></span></div><a className="as-back-link" href={"/"+lang}>← {lang==='uk'?'Головна Galaxiora':'Galaxiora home'}</a><div className="side-section">{lang==='uk'?'РОБОЧА ОБЛАСТЬ':'WORKSPACE'}</div><nav className="side-nav"><a href="#calculator" className="active"><Compass size={17}/> {lang==='uk'?'Натальна карта':'Birth chart'}</a><a href="#overview"><Orbit size={17}/> {lang==='uk'?'Аналіз карти':'Chart analysis'}</a><a href="#timeline"><Clock3 size={17}/> {lang==='uk'?'Життєві цикли':'Life cycles'}</a><a href="#interpretation"><Sparkles size={17}/> {i.ai}</a></nav><div className="side-bottom"><span className="live-dot"/>{lang==='uk'?'Обчислювальне ядро Джйотіш':'Deterministic Jyotish Core'}<p>LAHIRI · D1 / D9 / D10</p></div></aside><main className="main"><header className="topbar"><span className="breadcrumbs">{lang==='uk'?'РОБОЧА ОБЛАСТЬ':'WORKSPACE'} <b>/</b> <strong>{lang==='uk'?'АНАЛІЗ КАРТИ':'CHART ANALYSIS'}</strong></span><div className="top-actions"><button className="lang-button" onClick={()=>setLang(lang==='en'?'uk':'en')}>{lang==='en'?<><b>EN</b> / УКР</>:<>EN / <b>УКР</b></>}</button><AccountPortal birth={chart?.input||null} report={report} lang={lang} onOpenSaved={loadSaved}/></div></header><div className="content" id="calculator"><div className="eyebrow"><span className="accent-line"/> {lang==='uk'?'ПЛАТФОРМА РОЗРАХУНКІВ ДЖЙОТІШ':'JYOTISH CALCULATION PLATFORM'}</div><div className="hero"><div><h1>{i.title}<span className="gold">.</span></h1><p>{i.subtitle}</p></div><div className="hero-decoration">☼</div></div><div className="app-grid"><section className="entry-panel panel"><div className="panel-heading"><div><div className="eyebrow">{lang==='uk'?'01 / ВВЕДЕННЯ':'01 / INPUT'}</div><h2>{i.details}</h2></div><BookOpen className="panel-icon"/></div><p className="panel-description">{i.detail}</p><form onSubmit={calculate}><label>{i.date}</label><input type="date" value={form.date} onChange={e=>edit('date',e.target.value)} required/><label>{i.time}</label><input type="time" value={form.time} onChange={e=>edit('time',e.target.value)} required/><label>{i.place}</label><select value={preset} onChange={e=>{setPreset(e.target.value);if(CITY[e.target.value])setForm(old=>({...old,...Object.fromEntries(['latitude','longitude','timeZone'].map(k=>[k,CITY[e.target.value][k as keyof Form]]))}))}}><option value="delhi">{lang==='uk'?'Нью-Делі, Індія':'New Delhi, India'}</option><option value="kryvyi">{lang==='uk'?'Кривий Ріг, Україна':'Kryvyi Rih, Ukraine'}</option><option value="kyiv">{lang==='uk'?'Київ, Україна':'Kyiv, Ukraine'}</option><option value="london">{lang==='uk'?'Лондон, Велика Британія':'London, UK'}</option><option value="custom">{lang==='uk'?'Власні координати':'Custom coordinates'}</option></select><div className="row-inputs"><div><label>{lang==='uk'?'ШИРОТА':'LATITUDE'}</label><input type="number" step="any" min="-90" max="90" value={form.latitude} onChange={e=>edit('latitude',e.target.value)} required/></div><div><label>{lang==='uk'?'ДОВГОТА':'LONGITUDE'}</label><input type="number" step="any" min="-180" max="180" value={form.longitude} onChange={e=>edit('longitude',e.target.value)} required/></div></div><label>{lang==='uk'?'ЧАСОВИЙ ПОЯС IANA':'IANA TIME ZONE'}</label><input value={form.timeZone} onChange={e=>edit('timeZone',e.target.value)} required/><div className="setting-item"><div><strong>{lang==='uk'?'Сидеричний зодіак':'Sidereal zodiac'}</strong><small>Lahiri / Chitrapaksha</small></div><span className="setting-pill">{lang==='uk'?'УВІМКНЕНО':'ACTIVE'}</span></div><button className="primary-btn" disabled={busy}>{busy?i.working:i.calculate} <ArrowUpRight size={16}/></button></form><p className={`status ${error?'error':''}`} role="status">{status}</p></section><div className="results" id="overview"><div className="metric-row"><div className="metric panel"><span>{i.asc}</span><strong>{chart?(lang==='uk'?SIGN_UK[chart.ascendant.sign-1]:chart.ascendant.signName):'—'}</strong><small>{chart?chart.ascendant.degreesInSign.toFixed(2)+'° · '+(lang==='uk'?'Сфера 1':'Life area 1'):'—'}</small></div><div className="metric panel"><span>{i.moon}</span><strong>{moon?(lang==='uk'?SIGN_UK[moon.sign-1]:moon.signName):'—'}</strong><small>{moon?`${nakshatraName(moon.nakshatra,lang)} · ${lang==='uk'?`частина ${moon.pada}`:`part ${moon.pada}`}`:'—'}</small></div><div className="metric panel"><span>{lang==='uk'?'ЗОДІАКАЛЬНЕ ЗМІЩЕННЯ':'ZODIAC OFFSET (LAHIRI)'}</span><strong>{chart?chart.ayanamsa.toFixed(3)+'°':'—'}</strong><small>{lang==='uk'?'Корекція за Лахірі':'Lahiri correction'}</small></div></div><section className="chart-panel panel"><div className="panel-title-row"><div><div className="eyebrow">{lang==='uk'?'02 / ВІЗУАЛІЗАЦІЯ':'02 / VISUALIZATION'}</div><h2>{i.chart}</h2></div><div className="tab-group">{(['d1','d9','d10'] as const).map(type=><button key={type} className={'chart-tab '+(tab===type?'selected':'')} onClick={()=>setTab(type)}>{type.toUpperCase()}</button>)}</div></div><div className="chart-layout"><div className="wheel-wrap"><div id="wheel">{chart?<Wheel grahas={[...placements,tab==='d1'?chart.ascendant:tab==='d9'?chart.lagnaD9:chart.lagnaD10]} which={tab} lang={lang} lagna={tab==='d1'?chart.ascendant:tab==='d9'?chart.lagnaD9:chart.lagnaD10}/>:<div className="wheel-placeholder"><span>☼</span><p>{i.waiting}</p></div>}</div></div><div className="chart-summary"><div className="tiny-label">{lang==='uk'?'ВІДОМОСТІ ПРО КАРТУ':'CHART OVERVIEW'}</div><h3>{tab==='d1'?(lang==='uk'?'Основна карта / D1':'Rashi / D1'):tab==='d9'?(lang==='uk'?'Стосунки й цінності / D9':'Navamsa / D9'):(lang==='uk'?'Робота й покликання / D10':'Dashamsa / D10')}</h3><p>{tab==='d1'?(lang==='uk'?'Основна карта: положення планет і дванадцять сфер життя.':'Sidereal chart and whole-sign houses.'):tab==='d9'?(lang==='uk'?'Допоміжна карта, яку традиційно пов’язують зі стосунками та особистими цінностями.':'Ninefold divisional chart used in relationship interpretation.'):(lang==='uk'?'Допоміжна карта для символічного розгляду роботи й суспільної ролі.':'Tenfold divisional chart used in vocational interpretation.')}</p><div className="legend"><span><i className="dot gold-dot"/> {lang==='uk'?'Сонце / Місяць':'Sun / Moon'}</span><span><i className="dot violet-dot"/> {lang==='uk'?'Інші планети / вузли':'Other planets / nodes'}</span></div><div className="meta"><div><span>{lang==='uk'?'Ефемериди':'Ephemeris'}</span><strong>{chart?.ephemeris?.includes('pyswisseph')?'PySwissEph':chart?'Swiss Ephemeris':'—'}</strong></div><div><span>{lang==='uk'?'Розподіл сфер':'Life-area system'}</span><strong>{lang==='uk'?'За знаками':'Sign-based'}</strong></div></div></div></div>{chart&&<HouseIndex grahas={[...placements,tab==='d1'?chart.ascendant:tab==='d9'?chart.lagnaD9:chart.lagnaD10]} lang={lang} lagna={tab==='d1'?chart.ascendant:tab==='d9'?chart.lagnaD9:chart.lagnaD10}/>}</section><section className="table-panel panel"><div className="panel-title-row"><div><div className="eyebrow">{lang==='uk'?'03 / ПОЛОЖЕННЯ':'03 / COORDINATES'}</div><h2>{i.grahas}</h2></div><span className="small-pill">{lang==='uk'?'9 ПЛАНЕТ І ВУЗЛІВ':'9 PLANETS / NODES'}</span></div><div className="table-scroll"><table><thead><tr><th>{lang==='uk'?'ПЛАНЕТА / ВУЗОЛ':'PLANET / NODE'}</th><th>{lang==='uk'?'ЗНАК':'SIGN'}</th><th>{lang==='uk'?'ГРАДУС':'DEGREE'}</th><th>{lang==='uk'?'СФЕРА':'LIFE AREA'}</th><th>{lang==='uk'?'ЗІРКОВИЙ СЕКТОР':'LUNAR SECTOR'}</th></tr></thead><tbody>{chart?placements.map(p=><tr key={p.name}><td>{lang==='uk'?GRAHA_UK[p.name]||p.name:p.name}{p.retrograde?' ℞':''}</td><td>{lang==='uk'?SIGN_UK[p.sign-1]:p.signName}</td><td>{p.degreesInSign.toFixed(2)}°</td><td>{p.house}</td><td>{p.pada?`${nakshatraName(p.nakshatra,lang)} · ${lang==='uk'?`частина ${p.pada}`:`part ${p.pada}`}`:'—'}</td></tr>):<tr><td colSpan={5} className="empty-table">{i.waiting}</td></tr>}</tbody></table></div></section></div></div><section className="bottom-grid"><section className="panel dashas" id="timeline"><div className="eyebrow">{lang==='uk'?'04 / ЧАСОВІ ПЕРІОДИ':'04 / TIME CYCLES'}</div><h2>{i.dasha}</h2><p className="panel-description">{i.dashadesc}</p><div className="dashas-list">{chart?chart.dasha.map((d,ix)=>{const active=Date.parse(d.start)<=now&&Date.parse(d.end)>now;const ad=d.antardashas.find(a=>Date.parse(a.start)<=now&&Date.parse(a.end)>now);return <div className={'dasha-item '+(active?'current':'')} key={ix}><div className="dasha-row"><strong>{active?'✦ ':''}{lang==='uk'?GRAHA_UK[d.lord]||d.lord:d.lord}</strong><span>{d.start.slice(0,10)} — {d.end.slice(0,10)}</span></div>{active&&<small>● {lang==='uk'?'Активний період':'Current period'} · {lang==='uk'?GRAHA_UK[ad?.lord||'']||ad?.lord:ad?.lord} {lang==='uk'?'Підперіод':'Sub-period'}</small>}</div>}):<><div className="placeholder-line"/><div className="placeholder-line short"/></>}</div></section><section className="panel ai-panel" id="interpretation"><div className="eyebrow">{lang==='uk'?'05 / ТРАКТУВАННЯ':'05 / INTELLIGENCE'}</div><h2><Sparkles size={20} className="ai-icon"/> {i.ai}</h2><p className="panel-description">{i.aidesc}</p><div className="ai-callout"><ShieldCheck color="#d6bd88" size={26}/><div><strong>{i.note}</strong><p>{i.noteDesc}</p></div></div><button className="secondary-btn" disabled={!chart||aiBusy} onClick={interpret}>{aiBusy?'...':i.aiButton} <ArrowUpRight size={16}/></button><div className="ai-output" aria-live="polite">{interpretation}</div></section></section>{report&&report.language===lang?<DetailedReport report={report} lang={lang}/>:null}<footer>GALAXIORA · JYOTISH <span>•</span> {lang==='uk'?'ВІДТВОРЮВАНІ ОБЧИСЛЕННЯ + ВІДПОВІДАЛЬНИЙ ШІ':'DETERMINISTIC CALCULATIONS + RESPONSIBLE AI'} <span>•</span> BUILD 0.7.0</footer></div></main></div>
}
