'use client';
import {useState,useEffect} from 'react';
import dynamic from 'next/dynamic';
import {readApiJson} from '../../../lib/api-response';
import type {ReadingReport} from '../../components/DetailedReport';
// A large report editor/render tree is not needed until the user requests a full reading.
const DetailedReport=dynamic(()=>import('../../components/DetailedReport'),{loading:()=>null});
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
const SIGN_SYMBOL=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const GRAHA_SYMBOL:Record<string,string>={Sun:'☉',Moon:'☽',Mars:'♂',Mercury:'☿',Jupiter:'♃',Venus:'♀',Saturn:'♄',Rahu:'☊',Ketu:'☋',Ascendant:'Lg'};
const two=(value:number)=>String(value).padStart(2,'0');
const degreeLabel=(value:number)=>{const d=Math.floor(value),m=Math.floor((value-d)*60);return d+'°'+two(m)+'′';};
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
 return <svg viewBox="0 0 360 360" className="chart-svg jy-rashi-svg" role="img" aria-label={`${which.toUpperCase()} · 12 ${lang==='uk'?'домів':'houses'}`}>
  <rect x="1" y="1" width="358" height="358" rx="10" fill="#111b2a" stroke="#c6a66d" strokeWidth="1.6"/>
  <path d="M0 0 L360 360 M360 0 L0 360 M180 0 L360 180 L180 360 L0 180 Z" fill="none" stroke="#586577" strokeWidth="1"/>
  <text x="180" y="173" textAnchor="middle" fill="#d7ba82" fontFamily="Playfair Display,Georgia,serif" fontSize="28" letterSpacing="5">{which.toUpperCase()}</text>
  <text x="180" y="193" textAnchor="middle" fill="#78879a" fontSize="8" letterSpacing="2">{which==='d1'?'RASHI':which==='d9'?'NAVAMSA':'DASHAMSA'}</text>
  {HOUSE_CENTERS.map(([x,y],i)=>{
   const sign=(lagna.sign-1+i)%12+1,bodies=grahas.filter(p=>p.house===i+1&&p.name!=='Ascendant');
   const maxVisible=(y<=42||y>=300)?3:4,shown=bodies.slice(0,maxVisible),extra=bodies.length-shown.length;
   const top=y-(shown.length?13:2);
   return <g key={i} className="vedic-house" data-house={i+1}>
    <title>{i+1}. {signFull(sign,lang)}: {bodies.map(p=>grahaFull(p.name,lang)).join(', ')||(lang==='uk'?'немає планет':'no planets')}</title>
    <text x={x} y={top} textAnchor="middle" fill="#8e9cad" fontSize="8" fontWeight="700">{i+1}</text>
    <text x={x+17} y={top} textAnchor="middle" fill="#d8b875" fontSize="13">{SIGN_SYMBOL[sign-1]}</text>
    {shown.map((body,j)=><g key={body.name}>
      <text x={x-14} y={top+15+j*13} textAnchor="middle" fill={body.name==='Sun'||body.name==='Moon'?'#f1d391':'#dce3ec'} fontSize="12" fontWeight="700">{GRAHA_SYMBOL[body.name]||body.name.slice(0,2)}</text>
      <text x={x+11} y={top+15+j*13} textAnchor="middle" fill="#b9c3cf" fontSize="7.5">{degreeLabel(body.degreesInSign)}{body.retrograde?' ℞':''}</text>
    </g>)}
    {extra>0&&<text x={x} y={top+15+shown.length*13} textAnchor="middle" fill="#d8b875" fontSize="7">+{extra}</text>}
    {i===0&&<g><rect x={x-15} y={top-31} width="30" height="15" rx="7.5" fill="#2d3441" stroke="#aa8b59"/><text x={x} y={top-20} textAnchor="middle" fill="#e6ca91" fontSize="8" fontWeight="700">Lg</text></g>}
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
 const placements=chart?.[tab]||[];
 const moon=chart?.d1.find(x=>x.name==='Moon');
 const now=Date.now();
 const activeDasha=chart?.dasha.find(d=>Date.parse(d.start)<=now&&Date.parse(d.end)>now);
 const activeAntar=activeDasha?.antardashas.find(a=>Date.parse(a.start)<=now&&Date.parse(a.end)>now);
 const tabLagna=tab==='d1'?chart?.ascendant:tab==='d9'?chart?.lagnaD9:chart?.lagnaD10;
 return <div className="app-shell jy-workbench">
  <aside className="sidebar">
   <div className="logo"><span className="logo-mark">✧</span><span>GALAXI<span className="logo-light">ORA</span><small>{lang==='uk'?'РУШІЙ ВЕДИЧНОЇ АСТРОЛОГІЇ':'VEDIC ASTROLOGY ENGINE'}</small></span></div>
   <a className="as-back-link" href={"/"+lang}>← {lang==='uk'?'Головна Galaxiora':'Galaxiora home'}</a>
   <div className="side-section">{lang==='uk'?'ДЖЙОТІШ':'JYOTISH'}</div>
   <nav className="side-nav">
    <a href="#calculator" className="active"><Compass size={17}/> {lang==='uk'?'Карта D1':'D1 chart'}</a>
    <a href="#chart-data"><Orbit size={17}/> {lang==='uk'?'Дані карти':'Chart data'}</a>
    <a href="#timeline"><Clock3 size={17}/> {lang==='uk'?'Даші':'Dashas'}</a>
    <a href="#interpretation"><Sparkles size={17}/> {lang==='uk'?'AI-трактування':'AI reading'}</a>
   </nav>
   <div className="side-bottom"><span className="live-dot"/>{lang==='uk'?'Обчислювальне ядро Джйотіш':'Deterministic Jyotish Core'}<p>LAHIRI · D1 / D9 / D10</p></div>
  </aside>
  <main className="main">
   <header className="topbar">
    <span className="breadcrumbs">GALAXIORA <b>/</b> <strong>JYOTISH</strong></span>
    <div className="top-actions"><button className="lang-button" onClick={()=>setLang(lang==='en'?'uk':'en')}>{lang==='en'?<><b>EN</b> / УКР</>:<>EN / <b>УКР</b></>}</button><AccountPortal birth={chart?.input||null} report={report} lang={lang} onOpenSaved={loadSaved}/></div>
   </header>
   <div className="content" id="calculator">
    <div className="jy-title-row">
     <div><div className="eyebrow"><span className="accent-line"/> {lang==='uk'?'НАТАЛЬНИЙ РОЗРАХУНОК ДЖЙОТІШ':'JYOTISH NATAL CALCULATION'}</div><h1>{lang==='uk'?'Натальна карта':'Natal chart'}<span className="gold">.</span></h1><p>{lang==='uk'?'Сидеричний розрахунок Лахірі, дробові карти та Вімшоттарі-даша в одному робочому просторі.':'Lahiri sidereal chart, divisional charts and Vimshottari dasha in one workspace.'}</p></div>
     <div className="jy-title-symbol">☉</div>
    </div>

    <details className="jy-input-panel panel" open={!chart}>
     <summary><span><BookOpen size={17}/><strong>{i.details}</strong></span><small>{chart?(lang==='uk'?'Змінити вихідні дані':'Edit source data'):(lang==='uk'?'Заповніть для розрахунку':'Enter details to calculate')}</small></summary>
     <form onSubmit={calculate} className="jy-input-grid">
      <label>{i.date}<input type="date" value={form.date} onChange={e=>edit('date',e.target.value)} required/></label>
      <label>{i.time}<input type="time" value={form.time} onChange={e=>edit('time',e.target.value)} required/></label>
      <label>{i.place}<select value={preset} onChange={e=>{setPreset(e.target.value);if(CITY[e.target.value])setForm(old=>({...old,...Object.fromEntries(['latitude','longitude','timeZone'].map(k=>[k,CITY[e.target.value][k as keyof Form]]))}))}}><option value="delhi">{lang==='uk'?'Нью-Делі, Індія':'New Delhi, India'}</option><option value="kryvyi">{lang==='uk'?'Кривий Ріг, Україна':'Kryvyi Rih, Ukraine'}</option><option value="kyiv">{lang==='uk'?'Київ, Україна':'Kyiv, Ukraine'}</option><option value="london">{lang==='uk'?'Лондон, Велика Британія':'London, UK'}</option><option value="custom">{lang==='uk'?'Власні координати':'Custom coordinates'}</option></select></label>
      <label>{lang==='uk'?'Широта':'Latitude'}<input type="number" step="any" min="-90" max="90" value={form.latitude} onChange={e=>edit('latitude',e.target.value)} required/></label>
      <label>{lang==='uk'?'Довгота':'Longitude'}<input type="number" step="any" min="-180" max="180" value={form.longitude} onChange={e=>edit('longitude',e.target.value)} required/></label>
      <label>{lang==='uk'?'Часовий пояс':'Time zone'}<input value={form.timeZone} onChange={e=>edit('timeZone',e.target.value)} required/></label>
      <button className="primary-btn jy-calc-btn" disabled={busy}>{busy?i.working:i.calculate}<ArrowUpRight size={16}/></button>
     </form>
     <p className={`status ${error?'error':''}`} role="status">{status}</p>
    </details>

    <section className="jy-primary-grid">
     <div className="panel jy-rashi-card">
      <div className="jy-card-head"><div><span>{lang==='uk'?'РАШІ · ОСНОВНА КАРТА':'RASHI · MAIN CHART'}</span><h2>D1</h2></div>{chart&&<div className="jy-lagna-chip"><span>Lg</span><strong>{SIGN_SYMBOL[chart.ascendant.sign-1]} {signFull(chart.ascendant.sign,lang)}</strong><small>{degreeLabel(chart.ascendant.degreesInSign)}</small></div>}</div>
      <div className="jy-primary-chart">{chart?<Wheel grahas={[...chart.d1,chart.ascendant]} which="d1" lang={lang} lagna={chart.ascendant}/>:<div className="jy-empty-chart"><span>☉</span><strong>{i.waiting}</strong><small>{lang==='uk'?'Після розрахунку тут зʼявиться D1':'Your D1 chart will appear here'}</small></div>}</div>
     </div>
     <aside className="panel jy-calc-data">
      <div className="jy-card-head"><div><span>{lang==='uk'?'РОЗРАХУНОК':'CALCULATION'}</span><h2>{lang==='uk'?'Ключові дані':'Key data'}</h2></div><span className="small-pill">D1</span></div>
      <div className="jy-data-list">
       <div><span>{lang==='uk'?'Лагна':'Lagna'}</span><strong>{chart?<>{SIGN_SYMBOL[chart.ascendant.sign-1]} {signFull(chart.ascendant.sign,lang)} · {degreeLabel(chart.ascendant.degreesInSign)}</>:'—'}</strong></div>
       <div><span>{lang==='uk'?'Місяць':'Moon'}</span><strong>{moon?<>{GRAHA_SYMBOL.Moon} {signFull(moon.sign,lang)} · {degreeLabel(moon.degreesInSign)}</>:'—'}</strong></div>
       <div><span>{lang==='uk'?'Накшатра Місяця':'Moon nakshatra'}</span><strong>{moon?nakshatraName(moon.nakshatra,lang)+' · '+(lang==='uk'?'пада ':'pada ')+moon.pada:'—'}</strong></div>
       <div><span>{lang==='uk'?'Аянамша':'Ayanamsha'}</span><strong>{chart?chart.ayanamsa.toFixed(3)+'° · Lahiri':'—'}</strong></div>
       <div><span>UTC</span><strong>{chart?chart.utc.replace('T',' ').slice(0,19):'—'}</strong></div>
       <div><span>{lang==='uk'?'Часовий пояс':'Time zone'}</span><strong>{chart?.input.timeZone||'—'}</strong></div>
       <div><span>{lang==='uk'?'Ефемериди':'Ephemeris'}</span><strong>{chart?.ephemeris?.includes('pyswisseph')?'PySwissEph':chart?'Swiss Ephemeris':'—'}</strong></div>
      </div>
      <div className="jy-mini-legend"><span><b>☉</b>{lang==='uk'?'Сонце':'Sun'}</span><span><b>☽</b>{lang==='uk'?'Місяць':'Moon'}</span><span><b>♂</b>{lang==='uk'?'Марс':'Mars'}</span><span><b>♃</b>{lang==='uk'?'Юпітер':'Jupiter'}</span><span><b>☊</b>{lang==='uk'?'Раху':'Rahu'}</span></div>
     </aside>
    </section>

    <section className="jy-ai-launch" id="interpretation">
     <button className="jy-ai-launch-btn" disabled={!chart||aiBusy} onClick={interpret}><span className="jy-ai-orbit"><Sparkles size={22}/></span><span><strong>{aiBusy?(lang==='uk'?'Формуємо трактування…':'Generating reading…'):(lang==='uk'?'Створити AI-трактування':'Generate AI reading')}</strong><small>{lang==='uk'?'Окремий персональний розбір на основі цієї карти':'A separate personalized interpretation based on this chart'}</small></span><ArrowUpRight size={20}/></button>
     {interpretation&&<div className="jy-ai-status" aria-live="polite">{interpretation}</div>}
    </section>

    <section className="panel jy-data-workspace" id="chart-data">
     <div className="jy-workspace-head"><div><div className="eyebrow">{lang==='uk'?'ДАНІ НАТАЛЬНОЇ КАРТИ':'NATAL CHART DATA'}</div><h2>{lang==='uk'?'Усі основні показники':'All core indicators'}</h2><p>{lang==='uk'?'Один блок для положень планет, дробових карт і часових циклів.':'One workspace for planetary positions, divisional charts and timing cycles.'}</p></div>{chart&&<div className="jy-zodiac-strip">{SIGN_SYMBOL.map((symbol,idx)=><span key={symbol} className={chart.ascendant.sign===idx+1?'active':''} title={signFull(idx+1,lang)}>{symbol}</span>)}</div>}</div>

     <div className="jy-key-facts">
      <div><span className="jy-fact-icon">Lg</span><small>{lang==='uk'?'Лагна':'Lagna'}</small><strong>{chart?signFull(chart.ascendant.sign,lang):'—'}</strong></div>
      <div><span className="jy-fact-icon">★</span><small>{lang==='uk'?'Накшатра лагни':'Lagna nakshatra'}</small><strong>{chart?nakshatraName(chart.ascendant.nakshatra,lang):'—'}</strong></div>
      <div><span className="jy-fact-icon">☉</span><small>{lang==='uk'?'Сонце':'Sun'}</small><strong>{chart?signFull(chart.d1.find(g=>g.name==='Sun')?.sign||1,lang):'—'}</strong></div>
      <div><span className="jy-fact-icon">☽</span><small>{lang==='uk'?'Місяць':'Moon'}</small><strong>{moon?signFull(moon.sign,lang):'—'}</strong></div>
      <div><span className="jy-fact-icon">✦</span><small>{lang==='uk'?'Накшатра Місяця':'Moon nakshatra'}</small><strong>{moon?nakshatraName(moon.nakshatra,lang):'—'}</strong></div>
      <div><span className="jy-fact-icon">◴</span><small>{lang==='uk'?'Поточна даша':'Current dasha'}</small><strong>{activeDasha?(lang==='uk'?GRAHA_UK[activeDasha.lord]||activeDasha.lord:activeDasha.lord):'—'}</strong></div>
     </div>

     <div className="jy-section-rule"/>
     <div className="jy-subhead"><div><span>{lang==='uk'?'ПЛАНЕТИ':'PLANETS'}</span><h3>{lang==='uk'?'Зведена таблиця':'Summary table'}</h3></div><small>{lang==='uk'?'D1 · знаки · доми · накшатри':'D1 · signs · houses · nakshatras'}</small></div>
     <div className="table-scroll jy-planet-table"><table><thead><tr><th>{lang==='uk'?'Планета':'Planet'}</th><th>{lang==='uk'?'Знак':'Sign'}</th><th>{lang==='uk'?'Градус':'Degree'}</th><th>{lang==='uk'?'Дім':'House'}</th><th>{lang==='uk'?'Накшатра':'Nakshatra'}</th><th>{lang==='uk'?'Рух':'Motion'}</th></tr></thead><tbody>{chart?chart.d1.map(p=><tr key={p.name}><td><span className="jy-table-symbol">{GRAHA_SYMBOL[p.name]||'•'}</span><strong>{grahaFull(p.name,lang)}</strong></td><td><span className="jy-sign-cell">{SIGN_SYMBOL[p.sign-1]}</span>{signFull(p.sign,lang)}</td><td>{degreeLabel(p.degreesInSign)}</td><td><span className="jy-house-badge">{p.house}</span></td><td>{nakshatraName(p.nakshatra,lang)} <small>· {lang==='uk'?'пада':'pada'} {p.pada}</small></td><td>{p.retrograde?<span className="jy-retro">℞ {lang==='uk'?'ретро':'retro'}</span>:<span className="jy-direct">{lang==='uk'?'прямий':'direct'}</span>}</td></tr>):<tr><td colSpan={6} className="empty-table">{i.waiting}</td></tr>}</tbody></table></div>

     <div className="jy-section-rule"/>
     <div className="jy-subhead"><div><span>{lang==='uk'?'ДРОБОВІ КАРТИ':'DIVISIONAL CHARTS'}</span><h3>{lang==='uk'?'Варги':'Vargas'}</h3></div><div className="tab-group jy-varga-tabs">{(['d1','d9','d10'] as const).map(type=><button key={type} className={'chart-tab '+(tab===type?'selected':'')} onClick={()=>setTab(type)}>{type.toUpperCase()}</button>)}</div></div>
     <div className="jy-varga-grid">
      <div className="jy-varga-chart">{chart&&tabLagna?<Wheel grahas={[...placements,tabLagna]} which={tab} lang={lang} lagna={tabLagna}/>:<div className="jy-empty-chart small">{i.waiting}</div>}</div>
      <div className="jy-varga-data">
       <h4>{tab==='d1'?(lang==='uk'?'D1 · Раші':'D1 · Rashi'):tab==='d9'?(lang==='uk'?'D9 · Навамша':'D9 · Navamsa'):(lang==='uk'?'D10 · Дашамша':'D10 · Dashamsa')}</h4>
       <p>{tab==='d1'?(lang==='uk'?'Основна натальна карта та система дванадцяти домів.':'Primary natal chart and twelve-house structure.'):tab==='d9'?(lang==='uk'?'Додатковий зріз для зрілості цінностей, партнерства та внутрішньої сили планет.':'A divisional perspective used for values, partnership and maturation of planetary themes.'):(lang==='uk'?'Додатковий зріз професійної реалізації, відповідальності та ролі у світі.':'A divisional perspective used for vocation, responsibility and public contribution.')}</p>
       <div className="jy-varga-list">{chart&&tabLagna&&<>
        <div><span>{lang==='uk'?'Лагна варги':'Varga lagna'}</span><strong>{SIGN_SYMBOL[tabLagna.sign-1]} {signFull(tabLagna.sign,lang)}</strong></div>
        {placements.slice(0,9).map(p=><div key={p.name}><span>{GRAHA_SYMBOL[p.name]} {grahaFull(p.name,lang)}</span><strong>{SIGN_SYMBOL[p.sign-1]} {signFull(p.sign,lang)} · {lang==='uk'?'дім':'house'} {p.house}</strong></div>)}
       </>}</div>
      </div>
     </div>

     <div className="jy-section-rule" id="timeline"/>
     <div className="jy-subhead"><div><span>{lang==='uk'?'ЧАСОВІ ЦИКЛИ':'TIMING CYCLES'}</span><h3>{lang==='uk'?'Вімшоттарі-даша':'Vimshottari dasha'}</h3></div>{activeDasha&&<small>{lang==='uk'?'Активно зараз':'Active now'}: {grahaFull(activeDasha.lord,lang)}{activeAntar?' / '+grahaFull(activeAntar.lord,lang):''}</small>}</div>
     <div className="jy-dasha-strip">{chart?chart.dasha.map((d,ix)=>{const active=Date.parse(d.start)<=now&&Date.parse(d.end)>now;return <div className={'jy-dasha-cell '+(active?'current':'')} key={ix}><span>{GRAHA_SYMBOL[d.lord]||'•'}</span><strong>{grahaFull(d.lord,lang)}</strong><small>{d.start.slice(0,4)}–{d.end.slice(0,4)}</small>{active&&<b>{lang==='uk'?'ЗАРАЗ':'NOW'}</b>}</div>}):<div className="jy-dasha-empty">{i.waiting}</div>}</div>
    </section>

    {report&&report.language===lang?<DetailedReport report={report} lang={lang}/>:null}
    <footer>GALAXIORA · JYOTISH <span>•</span> {lang==='uk'?'СИДЕРИЧНИЙ РОЗРАХУНОК · LAHIRI':'SIDEREAL CALCULATION · LAHIRI'} <span>•</span> D1 / D9 / D10</footer>
   </div>
  </main>
 </div>;
}
