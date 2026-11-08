'use client';
import {useState,useEffect} from 'react';
import dynamic from 'next/dynamic';
import {readApiJson} from '../../../lib/api-response';
import {reportGrowthEvent,reportPublicToolEvent} from '../../../lib/growth-metrics';
import type {ReadingReport} from '../../components/DetailedReport';
// A large report editor/render tree is not needed until the user requests a full reading.
const DetailedReport=dynamic(()=>import('../../components/DetailedReport'),{loading:()=>null});
const AccountPortal=dynamic(()=>import('../../components/AccountPortal'),{loading:()=>null});
import N4RcExplorer from '../../components/N4RcExplorer';
import NatalSkyLayers from '../../components/NatalSkyLayers';
import landing from './NatalLanding.module.css';
import {assertN4RcView,hasN4RcView,type N4RcView} from '../../../lib/n4-rc-view';
import {hasD60Provisional,type N4D60UI} from '../../../lib/n4-d60-view';
import CitySearch from '../../components/CitySearch';
import {SIGN_GLYPHS,PLANET_GLYPHS} from '../../../lib/north-indian-layout';
import {Compass,Orbit,Clock3,Sparkles,BookOpen,Activity,ArrowUpRight,ShieldCheck} from 'lucide-react';
type Graha={name:string;longitude:number;sign:number;signName:string;degreesInSign:number;house:number;nakshatra:string;pada:number;retrograde:boolean};
type Period={lord:string;start:string;end:string;antardashas:{lord:string;start:string;end:string}[]};
type Chart={n4?:N4RcView;n4D60?:N4D60UI;config?:{dashaYearDays:number;dashaYearMode?:string};verification?:{version:string;status:'verified_internal';digest:string;checks:string[];externalReferenceChecked:false};id?:string;input:{date:string;time:string;timeZone:string;latitude:number;longitude:number;place?:string};utc:string;ayanamsa:number;ascendant:Graha;lagnaD9:Graha;lagnaD10:Graha;ephemeris:string;d1:Graha[];d9:Graha[];d10:Graha[];dasha:Period[]};
type Form={date:string;time:string;latitude:string;longitude:string;timeZone:string;place?:string};
const EMPTY_FORM:Form={date:'',time:'',latitude:'',longitude:'',timeZone:'',place:undefined};
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
 const lang=initialLang; const [minutesUncertain,setMinutesUncertain]=useState(false),[form,setForm]=useState<Form>(EMPTY_FORM),[cityReset,setCityReset]=useState(0),[manualMode,setManualMode]=useState(false),[chart,setChart]=useState<Chart|null>(null),[busy,setBusy]=useState(false),[status,setStatus]=useState(''),[error,setError]=useState(false),[interpretation,setInterpretation]=useState(''),[aiBusy,setAiBusy]=useState(false);
 const [report,setReport]=useState<ReadingReport|null>(null);
 const [runtimeMismatch,setRuntimeMismatch]=useState('');
 const [jhoraReference,setJhoraReference]=useState<{cases:number;d1SignMatches:number;d1Total:number;d9SignMatches:number;d9Total:number;d10SignMatches:number;d10Total:number;perUserJhoraVerified:false}|null>(null);
 useEffect(()=>{
  let live=true;
  fetch('/api/v1/jyotish/runtime',{cache:'no-store'}).then(async res=>{
   const data=res.ok?await res.json():null;
   if(!live)return;
   setJhoraReference(data?.referenceBenchmark?.version==='jhora8-same-profile-v2'?data.referenceBenchmark:null);
   if(data?.readerVersion!=='6.0.0'||data?.pipeline!=='direct-v2'||data?.readerEdition!=='reader-v8.0.0-n44'||data?.editorialEdition!=='n46-balanced-portrait-1.0.0'||data?.verificationContract!=='jyotish-integrity-v3')
    setRuntimeMismatch(lang==='uk'?'Сайт і API запущені з різних версій. Перезапустіть обидва сервери з цієї гілки.':'Web and API versions differ. Restart both servers from this branch.');
   else setRuntimeMismatch('');
  }).catch(()=>{if(live)setRuntimeMismatch(lang==='uk'?'API недоступне або працює стара версія.':'API unavailable or outdated.');});
  return ()=>{live=false;};
 },[lang]);
 const verified=(value:Chart|null|undefined)=>value?.verification?.version==='jyotish-integrity-v3'&&
  value.verification.status==='verified_internal'&&/^[a-f0-9]{64}$/.test(value.verification.digest);
 const loadSaved=async(loaded:unknown,saved:ReadingReport|null)=>{
  const incoming=loaded as Chart;
  if(!incoming?.input||!Array.isArray(incoming.d1))return;
  setForm({...incoming.input,latitude:String(incoming.input.latitude),longitude:String(incoming.input.longitude)});
  setManualMode(!Boolean(incoming.input.place));
  setMinutesUncertain(false); // provenance is never inferred from an old stored HH:MM clock value
  // Legacy records never become visible without a fresh server-side integrity check.
  let ready=incoming;
  if(!verified(incoming)||!hasN4RcView(incoming)||!hasD60Provisional(incoming)){
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
  if(!verified(ready)||!hasN4RcView(ready)){
   setError(true);setStatus(lang==='uk'?'Перевірка натальної карти не пройдена.':'Natal chart integrity verification failed.');return;
  }
  setChart(ready);
  const compatibleSaved=saved?.language===lang&&saved?.readerVersion==='6.0.0'&&
   saved?.verification?.digest===ready.verification?.digest&&
    saved?.vargaReadings?.version==='n4-varga-reader-1.0.0'&&
    saved?.readerV7?.version==='reader-v7.0.0-n43'&&
    saved?.readerV8?.version==='reader-v8.0.0-n44'&&
    saved?.readerV8?.editorialVersion==='n46-balanced-portrait-1.0.0'?saved:null;
  setReport(compatibleSaved);
  setInterpretation(lang==='uk'?'Перевірену карту відкрито з кабінету.':'Verified saved chart loaded.');
  if(!compatibleSaved)void interpret('local',ready);
  setError(false);
  setStatus(lang==='uk'?'Розрахунок перевірено.':'Calculation integrity verified.');
 };

 useEffect(()=>{if(report)document.getElementById('full-reading')?.scrollIntoView({behavior:'smooth',block:'start'});},[report]);
 const i=t[lang];const api=''; // Same-origin /api proxy protects remote demo visitors
 const edit=(key:keyof Form,value:string)=>{
  setForm(old=>({...old,[key]:value,...(['latitude','longitude','timeZone'].includes(key)?{place:undefined}:{})}));
  if(['latitude','longitude','timeZone'].includes(key))setCityReset(count=>count+1);
 };
 const chooseCity=(city:{name:string;region:string;country:string;latitude:number;longitude:number;timeZone:string})=>{
  setManualMode(false);
  // Preserve the user's birth date/time; only location fields change.
  setForm(old=>({...old,latitude:String(city.latitude),longitude:String(city.longitude),
   timeZone:city.timeZone,place:[city.name,city.region,city.country].filter(Boolean).join(', ')}));
  setStatus('');
 };
 async function calculate(e:React.FormEvent){e.preventDefault();
  if(!form.date||!form.time||(!form.place&&!manualMode)||!form.timeZone||!form.latitude||!form.longitude){
   setError(true);setStatus(lang==='uk'?'Заповни дату й час та обери місто зі списку або введи ручні координати.':'Enter date and time, then select a city or enter manual coordinates.');return;
  }
  reportPublicToolEvent('public_tool_started','jyotish');setBusy(true);setError(false);setChart(null);setReport(null);setStatus(i.working);try{const response=await fetch(`${api}/api/v1/charts/calculate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,latitude:Number(form.latitude),longitude:Number(form.longitude)})});const data=await readApiJson<Chart>(response);if(!verified(data))throw Error(lang==='uk'?'API повернуло карту без чинного підтвердження цілісності (потрібен jyotish-integrity-v3). Перезапустіть Next.js і NestJS з однієї оновленої гілки, потім повторіть розрахунок.':'API returned a chart without the current jyotish-integrity-v3 proof. Restart Next.js and NestJS from the same updated branch, then retry.');assertN4RcView(data);setChart(data);setReport(null);setInterpretation('');setStatus(`${i.completed} UTC: ${data.utc}`);reportGrowthEvent('jyotish_chart_completed');reportPublicToolEvent('public_tool_completed','jyotish');
   // Run verified local Reader by default; calling AI always requires an explicit click.
   void interpret('local',data);}catch(e){reportPublicToolEvent('public_tool_failed','jyotish');setError(true);setStatus(e instanceof Error?e.message:String(e));}finally{setBusy(false)}}
 async function interpret(mode:'auto'|'local'='auto',freshChart:Chart|null=chart){
  if(!freshChart)return;
  setAiBusy(true);setInterpretation(lang==='uk'?'Створюємо детальний звіт…':'Preparing a detailed report…');
  try{
   const response=await fetch(api+'/api/v1/reports',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({...freshChart.input,lang,preferred:mode,asOf:new Date().toISOString().slice(0,10)})
   });
   const data=await readApiJson<ReadingReport>(response);
   if(data.readerVersion!=='6.0.0')throw Error(lang==='uk'?'API повернуло застарілий Reader. Перезапустіть сервер.':'The API returned an outdated Reader. Restart the server.');
   if(data.readerV8?.version!=='reader-v8.0.0-n44'||data.readerV8.status!=='available'||data.readerV8.editorialVersion!=='n46-balanced-portrait-1.0.0')throw Error(lang==='uk'?'API ще не підтримує Classical Reader 8. Оновіть локальний сервер API з цієї гілки.':'The API does not support Classical Reader 8 yet. Update the local API to this branch.');
   if(!data.verification||data.verification?.status!=='verified_internal'||data.verification.digest!==freshChart.verification?.digest)throw Error(lang==='uk'?'Дані звіту не збігаються з перевіреною картою.':'Report facts differ from the verified natal chart.');
   if(!Array.isArray(data.sections)||!data.sections.length)throw Error('Report chapters missing');
   setReport(data);
   setInterpretation(lang==='uk'?'Звіт готовий ↓ Прокрутіть нижче':'Report ready ↓ Scroll below');
  }catch(error){
   setInterpretation(error instanceof Error?error.message:String(error));
  }finally{setAiBusy(false);}
 }

 const moon=chart?.d1.find(x=>x.name==='Moon');
 const now=Date.now();
 const activeDasha=chart?.dasha.find(d=>Date.parse(d.start)<=now&&Date.parse(d.end)>now);
 const activeAntar=activeDasha?.antardashas.find(a=>Date.parse(a.start)<=now&&Date.parse(a.end)>now);
 return <div className={'jy-workbench jy-portal-workbench '+landing.canvas}>
  <div className="main">
   <div className="content" id="calculator">
    <div className="jy-portal-toolbar"><span>GalaxiAstro <b>/</b> JYOTISH</span><AccountPortal birth={chart?.input||null} report={report} lang={lang} onOpenSaved={loadSaved}/></div>
    <section className={landing.hero} aria-labelledby="natal-page-title">
     <div className={landing.heroCopy}>
      <div className={landing.eyebrow}>{lang==='uk'?'ВЕДИЧНА НАТАЛЬНА КАРТА · БЕЗКОШТОВНО':'FREE VEDIC BIRTH CHART · JYOTISH'}</div>
      <h1 id="natal-page-title">{lang==='uk'?'16 карт життя. Досліди свої сильні й слабкі сторони.':'16 life charts. Explore your strengths and blind spots.'}</h1>
      <p className={landing.lead}>{lang==='uk'?
       'У чому твої природні здібності? Що може тебе стримувати? Як традиція Джйотіш пояснює стосунки, кар’єру та розвиток? Побудуй натальні карти за датою, часом і містом народження й порівняй усі 16 сфер життя.':
       'What comes naturally to you? Which patterns may hold you back? Explore how Jyotish interprets strengths, relationships, career and personal growth through 16 Vedic birth charts.'}</p>
      <div className={landing.chips}>
       <span>{lang==='uk'?'Сильні сторони й виклики':'Strengths & challenges'}</span>
       <span>{lang==='uk'?'Стосунки та кар’єра':'Relationships & career'}</span>
       <span>{lang==='uk'?'16 карт · без реєстрації':'16 charts · no signup'}</span>
      </div>
      <div className={landing.heroActions}>
       <a className={landing.heroCta} href="#birth-details">{lang==='uk'?'Створити мої 16 карт життя':'Create my 16 life charts'} <ArrowUpRight size={18}/></a>
       <a className={landing.heroSecondary} href="#varga-explorer">{lang==='uk'?'Дослідити всі карти':'Explore all 16 charts'}</a>
      </div>
      <small className={landing.miniDisclaimer}>{lang==='uk'?'Трактування традиції Джйотіш, а не психологічний діагноз. Астрономічний розрахунок: Swiss Ephemeris.':
       'Traditional Jyotish interpretation, not a psychological diagnosis. Astronomical calculation: Swiss Ephemeris.'}</small>
     </div>
     <div className={landing.heroArt}><NatalSkyLayers lang={lang}/></div>
    </section>
    <div className={landing.roadmap} aria-label={lang==='uk'?'Три кроки до натальної карти':'Three steps to your birth chart'}>
     <div><b>01</b><span>{lang==='uk'?'Введи дані народження':'Enter birth details'}</span></div>
     <div><b>02</b><span>{lang==='uk'?'Отримай персональні карти':'Get your personal charts'}</span></div>
     <div><b>03</b><span>{lang==='uk'?'Досліджуй значення':'Explore their meaning'}</span></div>
    </div>

    <details id="birth-details" className={"jy-input-panel panel "+landing.birthForm} open={!chart}>
     <summary><span><BookOpen size={17}/><strong>{lang==='uk'?'Створи безкоштовну натальну карту':'Create your free birth chart'}</strong></span><small>{chart?(lang==='uk'?'Змінити вихідні дані':'Edit source data'):(lang==='uk'?'Заповніть для розрахунку':'Enter details to calculate')}</small></summary>
     <form onSubmit={calculate} className="jy-input-grid">
      <label>{i.date}<input type="date" value={form.date} onChange={e=>edit('date',e.target.value)} required/></label>
      <div className={landing.timeField}>
       <label>{i.time}<input type="time" value={form.time} onChange={e=>edit('time',e.target.value)} required/></label>
       <label className={landing.minuteOption}>
        <input type="checkbox" checked={minutesUncertain} onChange={e=>setMinutesUncertain(e.target.checked)}/>
        {lang==='uk'?'Не знаю точних хвилин':'I don’t know the exact minutes'}
       </label>
       {(!form.time||minutesUncertain)&&<p className={landing.timeHint} role="status">
        {lang==='uk'?'Без точних хвилин результат може бути неточним, особливо D60. Якщо хвилини невідомі, введи приблизний час (наприклад, 14:00) і познач це вище.':
         'Without exact minutes, some placements may be inaccurate, especially D60. If you only know the hour, enter an approximate time (for example 14:00) and mark it above.'}
       </p>}
      </div>
      <div className="jy-city-search-field">
       <CitySearch locale={lang} onChoose={chooseCity} resetToken={cityReset} selectedPlace={form.place||''}
         onClear={()=>setForm(old=>({...old,place:undefined,latitude:'',longitude:'',timeZone:''}))}/>
       {form.place&&<small className="jy-selected-city" role="status">{lang==='uk'?'Обрано місце народження: ':'Birthplace selected: '}{form.place}</small>}
      </div>
      <details className="jy-n4-advanced" onToggle={e=>{if(e.currentTarget.open)setManualMode(true)}}>
       <summary>{lang==='uk'?'Ручні координати та часовий пояс (додатково)':'Manual coordinates and time zone (advanced)'}</summary>
       <p>{lang==='uk'?'Вказуй координати й IANA-часовий пояс лише за перевіреними даними. Невизначений перехід літнього часу відхиляється.':'Only use verified coordinates and IANA timezone. Ambiguous daylight saving transitions are rejected.'}</p>
       <label>{lang==='uk'?'Широта':'Latitude'}<input type="number" step="any" min="-90" max="90" value={form.latitude} onChange={e=>edit('latitude',e.target.value)} required={manualMode}/></label>
       <label>{lang==='uk'?'Довгота':'Longitude'}<input type="number" step="any" min="-180" max="180" value={form.longitude} onChange={e=>edit('longitude',e.target.value)} required={manualMode}/></label>
       <label>{lang==='uk'?'Часовий пояс (Europe/Kyiv)':'IANA time zone (Europe/Kyiv)'}<input value={form.timeZone} onChange={e=>edit('timeZone',e.target.value)} required={manualMode}/></label>
      </details>
      {form.date&&form.date<'1970-01-01'&&
       <p role="status" style={{fontSize:12,color:'#d5ba8c',lineHeight:1.5,gridColumn:'1/-1'}}>
        {lang==='uk'?'Увага: історичні часові пояси до 1970 року не завжди підтверджені незалежними місцевими документами. Точні доми та дати потребують додаткової перевірки.':
         'Note: pre-1970 local time-zone history is not always independently attested for each birthplace. Exact houses and dates need additional verification.'}
       </p>}
      <button className="primary-btn jy-calc-btn" disabled={busy||!form.date||!form.time||
        (!form.place&&!manualMode)||!form.latitude||!form.longitude||!form.timeZone}>{busy?i.working:i.calculate}<ArrowUpRight size={16}/></button>
     </form>
     <p className={`status ${error?'error':''}`} role="status">{status}</p>
    </details>

    {!chart&&<section className={landing.discovery} aria-labelledby="natal-value">
     <h2 id="natal-value">{lang==='uk'?'Навіщо досліджувати 16 карт життя?':'What can 16 life charts help you explore?'}</h2>
     <div className={landing.discoveryGrid}>
      <article><span>✦</span><h3>{lang==='uk'?'Де твоя сила, а де слабкі місця?':'Where are your strengths and blind spots?'}</h3><p>{lang==='uk'?'Порівняй карти витривалості та життєвих викликів D27 і D30: які риси традиція описує як опору, а які — як зони розвитку.':'Compare the traditional lenses of resilience and challenges (D27, D30): supportive traits and areas for growth.'}</p></article>
      <article><span>♡</span><h3>{lang==='uk'?'Які закономірності є у стосунках?':'What patterns shape your relationships?'}</h3><p>{lang==='uk'?'Досліди партнерство й цінності через D9, а родинні теми — через D12. Порівнюй кожну з основною D1.':'Explore partnerships and values with D9, family themes with D12, and compare each with the foundational D1 chart.'}</p></article>
      <article><span>✧</span><h3>{lang==='uk'?'Як розкривається потенціал у роботі?':'How might your potential unfold at work?'}</h3><p>{lang==='uk'?'Подивись на професійну роль у D10 й освіту в D24: кожна карта висвітлює іншу сторону розвитку.':'Explore vocation in D10 and education in D24 — two distinct traditional perspectives on development.'}</p></article>
     </div>
    </section>}
    <N4RcExplorer chart={chart} lang={lang} minutesUncertain={minutesUncertain}/>

    <section className="jy-ai-launch">
     <button className="jy-ai-launch-btn" disabled={!chart||aiBusy||Boolean(runtimeMismatch)} onClick={()=>interpret('auto')}><span className="jy-ai-orbit"><Sparkles size={22}/></span><span><strong>{aiBusy?(lang==='uk'?'Готуємо персональне трактування…':'Preparing your consultation…'):(lang==='uk'?'Створити AI-трактування':'Generate AI consultation')}</strong><small>{lang==='uk'?'AI пояснює перевірені факти простою мовою. Reader 8 працює окремо й без AI.':'AI explains verified chart themes in plain language. Reader 8 also works without AI.'}</small></span><ArrowUpRight size={20}/></button>
     <button className="jy-reader-launch-btn" data-testid="reader-auto-launch-btn"
       aria-pressed={report?.ai?.fallbackReason==='reader_only'}
       style={report?.ai?.fallbackReason==='reader_only'?{borderColor:'#dbb77c',boxShadow:'0 0 0 1px rgba(219,183,124,.27)'}:undefined}
       disabled={!chart||aiBusy||Boolean(runtimeMismatch)} onClick={()=>interpret('local')}>{lang==='uk'?'Читати без AI — Reader 8':'Read without AI — Reader 8'}</button>
     {runtimeMismatch&&<p role="alert" className="jy-version-warning">{runtimeMismatch}</p>}
     {interpretation&&<div className="jy-ai-status" aria-live="polite">{interpretation}</div>}
    </section>

    <div id="interpretation" className="jy-reading-result-anchor">
     {report&&report.language===lang?<DetailedReport report={report} lang={lang}/>:null}
    </div>

    <section className="panel jy-data-workspace" id="chart-data">
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
       {jhoraReference&&<p>{lang==='uk'?'Незалежний корпус JHora 8.0:':'Independent JHora 8.0 corpus:'} {jhoraReference.cases} {lang==='uk'?'карт з однаковою методикою':'same-method charts'}. D1 {jhoraReference.d1SignMatches}/{jhoraReference.d1Total}, D9 {jhoraReference.d9SignMatches}/{jhoraReference.d9Total}, D10 {jhoraReference.d10SignMatches}/{jhoraReference.d10Total}. {lang==='uk'?'Збіг знаків підтверджено. Точність довгот до 1″ та календарні дати Vimshottari перевіряються окремо.':'Sign parity is certified. One-arcsecond longitude precision and Vimshottari calendar dates have separate pending checks.'}</p>}
       <p>{lang==='uk'?'Це незалежна звірка еталонних карт за узгодженим профілем, а не індивідуальна перевірка вашої карти в JHora.':'This is an independent same-profile reference check, not direct JHora verification of your individual chart.'}</p>
      </details>}
     </aside>
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

     <div className="jy-section-rule" id="timeline"/>
     <p style={{fontSize:12,color:'#b8c7de',margin:'12px 0'}}>
      {lang==='uk'?'Календарний режим Вімшоттарі: '+(chart?.config?.dashaYearMode||'очікуємо розрахунок')+
       '. Це не незалежний сертифікат дат JHora.':
       'Vimshottari year mode: '+(chart?.config?.dashaYearMode||'awaiting calculation')+
       '. Not an independent JHora date certificate.'}
     </p>
     <div className="jy-subhead"><div><span>{lang==='uk'?'ЧАСОВІ ЦИКЛИ':'TIMING CYCLES'}</span><h3>{lang==='uk'?'Вімшоттарі-даша':'Vimshottari dasha'}</h3></div>{activeDasha&&<small>{lang==='uk'?'Активно зараз':'Active now'}: {grahaFull(activeDasha.lord,lang)}{activeAntar?' / '+grahaFull(activeAntar.lord,lang):''}</small>}</div>
     <div className="jy-dasha-strip">{chart?chart.dasha.map((d,ix)=>{const active=Date.parse(d.start)<=now&&Date.parse(d.end)>now;return <div className={'jy-dasha-cell '+(active?'current':'')} key={ix}><span>{GRAHA_SYMBOL[d.lord]||'•'}</span><strong>{grahaFull(d.lord,lang)}</strong><small>{d.start.slice(0,4)}–{d.end.slice(0,4)}</small>{active&&<b>{lang==='uk'?'ЗАРАЗ':'NOW'}</b>}</div>}):<div className="jy-dasha-empty">{i.waiting}</div>}</div>
    </section>


    <section className={landing.faq} aria-labelledby="natal-faq-title">
     <div className={landing.faqHeader}>
      <div><span className={landing.eyebrow}>{lang==='uk'?'ЗАПИТАННЯ ТА ВІДПОВІДІ':'GOOD TO KNOW'}</span>
      <h2 id="natal-faq-title">{lang==='uk'?'Натальна карта — це просто':'Birth charts, explained simply'}</h2></div>
      <a href={'/'+lang+'/panchanga'}>{lang==='uk'?'Подивитися Панчангу на сьогодні':'Explore today’s Panchanga'}</a>
     </div>
     <details><summary>{lang==='uk'?'Що таке натальна карта?':'What is a birth chart?'}</summary><p>{lang==='uk'?'Це астрологічна схема положень планет і домів для заданого моменту та місця народження. Galaxiora використовує сидеричний підхід Джйотіш. Трактування описують ведичну традицію, а не науково підтверджене передбачення майбутнього.':'A birth chart maps planetary positions and houses for a specified birth time and location. Galaxiora uses the sidereal Jyotish tradition. Interpretations reflect this tradition rather than scientifically established predictions.'}</p></details>
     <details><summary>{lang==='uk'?'Чим ведична карта відрізняється від західного гороскопа?':'How is a Vedic chart different from a Western horoscope?'}</summary><p>{lang==='uk'?'У Джйотіш застосовується сидеричний зодіак і аянамша Лахірі. Тому знак Сонця або Місяця може відрізнятися від популярного західного тропічного гороскопа.':'Jyotish uses a sidereal zodiac and Lahiri ayanamsa. Your Sun or Moon sign can therefore differ from a familiar Western tropical horoscope.'}</p></details>
     <details><summary>{lang==='uk'?'Чи потрібен точний час народження?':'Do I need an exact birth time?'}</summary><p>{lang==='uk'?'Дата, час і місце потрібні для розрахунку Лагни та домів. За приблизного часу ці показники можуть змінюватися. Особливо чутлива D60: навіть документально записані хвилини не гарантують стабільності її Лагни.':'Date, time and place are used to calculate the ascendant and houses. Approximate times can change these placements. D60 is especially sensitive: even documented minutes cannot guarantee a stable D60 ascendant.'}</p></details>
     <details><summary>{lang==='uk'?'Що означають D1, D9, D10 і D60?':'What do D1, D9, D10 and D60 mean?'}</summary><p>{lang==='uk'?'D1 — основна натальна схема. D9 традиційно аналізує партнерство і дхарму, D10 — професійні теми, а D60 — тонкі кармічні значення. У Galaxiora доступні всі 16 карт Шодашаварги.':'D1 is the foundation. D9 traditionally explores partnership and dharma, D10 vocational themes, and D60 subtle karmic themes. Galaxiora includes all 16 Shodashavarga charts.'}</p></details>
    </section>

    {chart&&<a className="as-button as-button-secondary jy-journal-link" href={'/'+lang+'/account#personal-journal'}>{lang==='uk'?'Мій особистий журнал — у кабінеті':'My personal journal — open account'}</a>}

   </div>
  </div>
 </div>;
}
