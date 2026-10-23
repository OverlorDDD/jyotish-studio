'use client';
import {useState,useEffect} from 'react';
import dynamic from 'next/dynamic';
import {readApiJson} from '../../../lib/api-response';
import type {ReadingReport} from '../../components/DetailedReport';
// A large report editor/render tree is not needed until the user requests a full reading.
const DetailedReport=dynamic(()=>import('../../components/DetailedReport'),{loading:()=>null});
import AccountPortal from '../../components/AccountPortal';
import NorthIndianChart from '../../components/NorthIndianChart';
import {SIGN_GLYPHS,PLANET_GLYPHS} from '../../../lib/north-indian-layout';
import {Compass,Orbit,Clock3,Sparkles,BookOpen,Activity,ArrowUpRight,ShieldCheck} from 'lucide-react';
type Graha={name:string;longitude:number;sign:number;signName:string;degreesInSign:number;house:number;nakshatra:string;pada:number;retrograde:boolean};
type Period={lord:string;start:string;end:string;antardashas:{lord:string;start:string;end:string}[]};
type Chart={verification?:{version:string;status:'verified_internal';digest:string;checks:string[];externalReferenceChecked:false};id?:string;input:{date:string;time:string;timeZone:string;latitude:number;longitude:number;place?:string};utc:string;ayanamsa:number;ascendant:Graha;lagnaD9:Graha;lagnaD10:Graha;ephemeris:string;d1:Graha[];d9:Graha[];d10:Graha[];dasha:Period[]};
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
const SIGN_EN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_UK=['Овен','Телець','Близнюки','Рак','Лев','Діва','Терези','Скорпіон','Стрілець','Козоріг','Водолій','Риби'];
const GRAHA_UK:Record<string,string>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн',Rahu:'Раху',Ketu:'Кету',Ascendant:'Висхідний знак'};
const SIGN_SYMBOL=SIGN_GLYPHS;
const GRAHA_SYMBOL=PLANET_GLYPHS;
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
const grahaFull=(name:string,lang:'en'|'uk')=>lang==='uk'?(GRAHA_UK[name]||name):name;
const signFull=(sign:number,lang:'en'|'uk')=>(lang==='uk'?SIGN_UK:SIGN_EN)[sign-1];
export default function Page({initialLang='uk'}:{initialLang?:'en'|'uk'}){
 const [lang,setLang]=useState<'en'|'uk'>(initialLang),[form,setForm]=useState<Form>(CITY.delhi),[preset,setPreset]=useState('delhi'),[chart,setChart]=useState<Chart|null>(null),[tab,setTab]=useState<'d1'|'d9'|'d10'>('d1'),[busy,setBusy]=useState(false),[status,setStatus]=useState(''),[error,setError]=useState(false),[interpretation,setInterpretation]=useState(''),[aiBusy,setAiBusy]=useState(false);
 const [report,setReport]=useState<ReadingReport|null>(null);
 const [runtimeMismatch,setRuntimeMismatch]=useState('');
 const [jhoraReference,setJhoraReference]=useState<{cases:number;d1SignMatches:number;d1Total:number;d9SignMatches:number;d9Total:number;d10SignMatches:number;d10Total:number;perUserJhoraVerified:false}|null>(null);
 useEffect(()=>{
  let live=true;
  fetch('/api/v1/jyotish/runtime',{cache:'no-store'}).then(async res=>{
   const data=res.ok?await res.json():null;
   if(!live)return;
   setJhoraReference(data?.referenceBenchmark?.version==='jhora8-public-v1'?data.referenceBenchmark:null);
   if(data?.readerVersion!=='6.0.0'||data?.pipeline!=='direct-v2')
    setRuntimeMismatch(lang==='uk'?'Сайт і API запущені з різних версій. Перезапустіть обидва сервери з цієї гілки.':'Web and API versions differ. Restart both servers from this branch.');
   else setRuntimeMismatch('');
  }).catch(()=>{if(live)setRuntimeMismatch(lang==='uk'?'API недоступне або працює стара версія.':'API unavailable or outdated.');});
  return ()=>{live=false;};
 },[lang]);
 const verified=(value:Chart|null|undefined)=>value?.verification?.version==='jyotish-integrity-v1'&&
  value.verification.status==='verified_internal'&&/^[a-f0-9]{64}$/.test(value.verification.digest);
 const loadSaved=async(loaded:unknown,saved:ReadingReport|null)=>{
  const incoming=loaded as Chart;
  if(!incoming?.input||!Array.isArray(incoming.d1))return;
  setForm({...incoming.input,latitude:String(incoming.input.latitude),longitude:String(incoming.input.longitude)});
  // Legacy records never become visible without a fresh server-side integrity check.
  let ready=incoming;
  if(!verified(incoming)){
   setBusy(true);
   setReport(null);setChart(null);
   setStatus(lang==='uk'?'Перевіряємо старий збережений розрахунок…':'Revalidating an older saved calculation…');
   try{
    const response=await fetch('/api/v1/charts/calculate',{method:'POST',
     headers:{'Content-Type':'application/json'},body:JSON.stringify(incoming.input)});
    ready=await readApiJson<Chart>(response);
   }catch(error){
    setError(true);setStatus(error instanceof Error?error.message:String(error));setBusy(false);return;
   }finally{setBusy(false);}
  }
  if(!verified(ready)){
   setError(true);setStatus(lang==='uk'?'Перевірка натальної карти не пройдена.':'Natal chart integrity verification failed.');return;
  }
  setChart(ready);
  setReport(saved?.language===lang&&saved?.readerVersion==='6.0.0'&&
   saved?.verification?.digest===ready.verification?.digest?saved:null);
  setInterpretation(lang==='uk'?'Перевірену карту відкрито з кабінету.':'Verified saved chart loaded.');
  setError(false);
  setStatus(lang==='uk'?'Розрахунок перевірено.':'Calculation integrity verified.');
 };

 useEffect(()=>{if(report)document.getElementById('full-reading')?.scrollIntoView({behavior:'smooth',block:'start'});},[report]);
 const i=t[lang];const api=''; // Same-origin /api proxy protects remote demo visitors
 const edit=(key:keyof Form,value:string)=>setForm(old=>({...old,[key]:value}));
 async function calculate(e:React.FormEvent){e.preventDefault();setBusy(true);setError(false);setStatus(i.working);try{const response=await fetch(`${api}/api/v1/charts/calculate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,latitude:Number(form.latitude),longitude:Number(form.longitude)})});const data=await readApiJson<Chart>(response);if(!verified(data))throw Error(lang==='uk'?'Сервер не підтвердив перевірку всіх даних карти.':'Server did not verify all chart calculations.');setChart(data);setReport(null);setInterpretation('');setStatus(`${i.completed} UTC: ${data.utc}`);}catch(e){setError(true);setStatus(e instanceof Error?e.message:String(e));}finally{setBusy(false)}}
 async function interpret(mode:'auto'|'local'='auto'){
  if(!chart)return;
  setAiBusy(true);setInterpretation(lang==='uk'?'Створюємо детальний звіт…':'Preparing a detailed report…');
  try{
   const response=await fetch(api+'/api/v1/reports',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({...chart.input,lang,preferred:mode,asOf:new Date().toISOString().slice(0,10)})
   });
   const data=await readApiJson<ReadingReport>(response);
   if(data.readerVersion!=='6.0.0')throw Error(lang==='uk'?'API повернуло застарілий Reader. Перезапустіть сервер.':'The API returned an outdated Reader. Restart the server.');
   if(!data.verification||data.verification?.status!=='verified_internal'||data.verification.digest!==chart.verification?.digest)throw Error(lang==='uk'?'Дані звіту не збігаються з перевіреною картою.':'Report facts differ from the verified natal chart.');
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
      <div className="jy-primary-chart">{chart?<NorthIndianChart planets={chart.d1} division="d1" lang={lang} lagna={chart.ascendant}/>:<div className="jy-empty-chart"><span>☉</span><strong>{i.waiting}</strong><small>{lang==='uk'?'Після розрахунку тут зʼявиться D1':'Your D1 chart will appear here'}</small></div>}</div>
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
      {chart?.verification?.status==='verified_internal'&&<details className="jy-reference-details">
       <summary>{lang==='uk'?'Перевірка розрахунків':'Calculation verification'}</summary>
       <p>{lang==='uk'?'Внутрішні перевірки D1, D9, D10, управителів і даш пройдено.':'Internal D1, D9, D10, house-lord and dasha consistency checks passed.'}</p>
       {jhoraReference&&<p>{lang==='uk'?'Незалежний архів JHora 8.0:':'Recorded JHora 8.0 reference:'} {jhoraReference.cases} {lang==='uk'?'історична карта':'historical chart'}. D1 {jhoraReference.d1SignMatches}/{jhoraReference.d1Total}, D9 {jhoraReference.d9SignMatches}/{jhoraReference.d9Total}, D10 {jhoraReference.d10SignMatches}/{jhoraReference.d10Total}. {lang==='uk'?'Відмінності пояснюються різними аянамшами, типами вузлів і способом побудови D10.':'Differences reflect distinct ayanamsa, node and D10 methods.'}</p>}
       <p>{lang==='uk'?'Це тестова звірка одного незалежно збереженого еталона, а не перевірка вашої особистої карти безпосередньо у JHora.':'This benchmarks one separately captured reference, not a direct JHora verification of your personal chart.'}</p>
      </details>
     </aside>
    </section>

    <section className="jy-ai-launch" id="interpretation">
     <button className="jy-ai-launch-btn" disabled={!chart||aiBusy||Boolean(runtimeMismatch)} onClick={()=>interpret('auto')}><span className="jy-ai-orbit"><Sparkles size={22}/></span><span><strong>{aiBusy?(lang==='uk'?'Готуємо персональне трактування…':'Preparing your consultation…'):(lang==='uk'?'Створити AI-трактування':'Generate AI consultation')}</strong><small>{lang==='uk'?'Одна хмарна консультація за точно обчисленою картою. Якщо модель недоступна, Reader v6 залишається доступним.':'One cloud consultation grounded in the calculated chart. Reader v6 remains available if the provider is offline.'}</small></span><ArrowUpRight size={20}/></button>
     <button className="jy-reader-launch-btn" disabled={!chart||aiBusy||Boolean(runtimeMismatch)} onClick={()=>interpret('local')}>{lang==='uk'?'Читати без AI — Reader v6':'Read without AI — Reader v6'}</button>
     {runtimeMismatch&&<p role="alert" className="jy-version-warning">{runtimeMismatch}</p>}
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
      <div className="jy-varga-chart">{chart&&tabLagna?<NorthIndianChart planets={placements} division={tab} lang={lang} lagna={tabLagna}/>:<div className="jy-empty-chart small">{i.waiting}</div>}</div>
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
