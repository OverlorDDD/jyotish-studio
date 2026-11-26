'use client';
import {useState,useEffect,useRef} from 'react';
import dynamic from 'next/dynamic';
import {readApiJson} from '../../../lib/api-response';
import {isJyotishRuntimeCompatible} from '../../../lib/jyotish-runtime-contract';
import {resolveVerifiedReportChart} from '../../../lib/natal-report-binding';
import {reportGrowthEvent,reportPublicToolEvent} from '../../../lib/growth-metrics';
import type {ReadingReport} from '../../components/DetailedReport';
// A large report editor/render tree is not needed until the user requests a full reading.
const DetailedReport=dynamic(()=>import('../../components/DetailedReport'),{loading:()=>null});
const AccountPortal=dynamic(()=>import('../../components/AccountPortal'),{loading:()=>null});
import N4RcExplorer from '../../components/N4RcExplorer';
import NatalSkyLayers from '../../components/NatalSkyLayers';
import {NatalSample,NatalFirstResult,type NatalFormVariant} from '../../components/NatalFirstLook';
import landing from './NatalLanding.module.css';
import {assertN4RcView,hasN4RcView,type N4RcView} from '../../../lib/n4-rc-view';
import {hasD60Provisional,type N4D60UI} from '../../../lib/n4-d60-view';
import CitySearch from '../../components/CitySearch';
import {SIGN_GLYPHS,PLANET_GLYPHS} from '../../../lib/north-indian-layout';
import {Compass,Orbit,Clock3,Sparkles,BookOpen,Activity,ArrowUpRight,ShieldCheck} from 'lucide-react';
import {nakshatraSlugByName} from '../../../lib/nakshatra-slugs';
import {loadMySigns} from '../../../lib/my-signs';
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
// Opens the guide in a new tab so a calculated chart is never lost by following the link.
const nakshatraGuideLink=(name:string,lang:'en'|'uk',text:string)=>{
 const slug=nakshatraSlugByName(name);
 return slug?<a href={'/'+lang+'/nakshatra/'+slug} target="_blank" rel="noopener" data-testid="jy-nakshatra-guide"
  title={lang==='uk'?'Відкрити довідник про цю накшатру':'Open the guide to this nakshatra'}
  style={{color:'inherit',textDecoration:'underline dotted',textUnderlineOffset:'3px'}}>{text}</a>:text;
};
const grahaFull=(name:string,lang:'en'|'uk')=>lang==='uk'?(GRAHA_UK[name]||name):name;
const signFull=(sign:number,lang:'en'|'uk')=>(lang==='uk'?SIGN_UK:SIGN_EN)[sign-1];
export default function Page({initialLang='uk',variant}:{initialLang?:'en'|'uk';variant?:NatalFormVariant}){
 const lang=initialLang; const [minutesUncertain,setMinutesUncertain]=useState(false),[form,setForm]=useState<Form>(EMPTY_FORM),[cityReset,setCityReset]=useState(0),[manualMode,setManualMode]=useState(false),[chart,setChart]=useState<Chart|null>(null),[busy,setBusy]=useState(false),[status,setStatus]=useState(''),[error,setError]=useState(false),[interpretation,setInterpretation]=useState(''),[aiBusy,setAiBusy]=useState(false);
 const [report,setReport]=useState<ReadingReport|null>(null);
 const [runtimeMismatch,setRuntimeMismatch]=useState('');
 const birthDetails=useRef<HTMLDetailsElement>(null);
 const calculating=useRef(false);
 const [step,setStep]=useState<1|2>(1);
 const [editing,setEditing]=useState(false);
 const twoSteps=variant==='steps';
 const showResult=Boolean(chart)&&(!variant||!editing);
 function focusDate(){
  requestAnimationFrame(()=>{
   if(birthDetails.current)birthDetails.current.open=true;
   document.getElementById('natal-birth-date')?.focus();
  });
 }
 function openForm(){
  setStep(1);setEditing(true);focusDate();
 }
 function editPilotResult(){
  if(history.state?.natalPilotResult&&location.hash==='#chart-result')history.back();
  else openForm();
 }
 function nextStep(){
  setStep(2);
  requestAnimationFrame(()=>document.querySelector<HTMLInputElement>('#birth-details .jy-city-search-field input')?.focus());
 }
 useEffect(()=>{
  if(!variant)return;
  // A chart exists only in this tab's React state. A reloaded or shared URL starts at the empty form.
  if(location.hash==='#chart-result')history.replaceState({...history.state,natalPilotResult:false},'',location.pathname+location.search);
  const followHistory=()=>{
   if(history.state?.natalPilotResult&&location.hash==='#chart-result'){
    setEditing(false);
   }else openForm();
  };
  window.addEventListener('popstate',followHistory);
  return ()=>window.removeEventListener('popstate',followHistory);
 },[variant]);

 const readingRequestId=useRef(0); // ignore stale Reader/AI responses
 const [jhoraReference,setJhoraReference]=useState<{cases:number;d1SignMatches:number;d1Total:number;d9SignMatches:number;d9Total:number;d10SignMatches:number;d10Total:number;perUserJhoraVerified:false}|null>(null);
 useEffect(()=>{
  let live=true;
  fetch('/api/v1/jyotish/runtime',{cache:'no-store'}).then(async res=>{
   const data=res.ok?await res.json():null;
   if(!live)return;
   setJhoraReference(data?.referenceBenchmark?.version==='jhora8-same-profile-v2'?data.referenceBenchmark:null);
   // AI writer pipeline versions (direct-v2, direct-v3, ...) are NOT a Reader ABI.
   if(!isJyotishRuntimeCompatible(data))
    setRuntimeMismatch(lang==='uk'?'API повернуло несумісний формат Reader. Оновіть вебсайт і API до сумісних версій.':'The API returned an incompatible Reader contract. Update web and API to compatible versions.');
   else setRuntimeMismatch('');
  }).catch(()=>{if(live)setRuntimeMismatch(lang==='uk'?'API недоступне або працює стара версія.':'API unavailable or outdated.');});
  return ()=>{live=false;};
 },[lang]);
 const verified=(value:Chart|null|undefined)=>value?.verification?.version==='jyotish-integrity-v3'&&
  value.verification.status==='verified_internal'&&/^[a-f0-9]{64}$/.test(value.verification.digest);
 const loadSaved=async(loaded:unknown,saved:ReadingReport|null)=>{
  const incoming=loaded as Chart;
  if(!incoming?.input||!Array.isArray(incoming.d1))return;
  readingRequestId.current++;setAiBusy(false);
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
    saved?.readerFormat==='n6-reader-v1'&&saved.readerQuality==='n6-quality-2'&&saved.minutesUncertain===minutesUncertain&&saved?.reader10?.chapters.some(c=>c.id==='timing')&&saved.asOf===new Date().toISOString().slice(0,10)&&
    (saved.ai?.source!=='llm'||saved.ai.readerFormat==='n6-reader-v1')&&
    saved?.vargaReadings?.version==='n4-varga-reader-1.0.0'&&
    saved?.readerV7?.version==='reader-v7.0.0-n43'&&
    saved?.readerV8?.version==='reader-v8.0.0-n44'&&
    saved?.readerV8?.editorialVersion==='n48-poetic-evidence-1.0.0'&&
    saved?.readerV8?.integrated?.version==='n49-unified-evidence-v1'&&
    saved?.readerV8?.compactCards?.length===15&&saved?.readerV8?.meaningful?.cards?.length===16&&saved?.readerV8?.meaningful?.discoveries?.version==='n493-ranked-patterns-1.0.0'&&
    (saved?.readerV8?.d60Preview?.status!=='conditional_signs'||saved?.readerV8?.d60Preview?.allPlanets?.length===9)?saved:null;
  setReport(compatibleSaved);
  setInterpretation(lang==='uk'?'Перевірену карту відкрито з кабінету.':'Verified saved chart loaded.');
  if(!compatibleSaved)void interpret('local',ready);
  setError(false);
  setStatus(lang==='uk'?'Розрахунок перевірено.':'Calculation integrity verified.');
 };

 const quietOpen=useRef(false); // no auto-scroll when the profile chart opens by itself
 useEffect(()=>{if(report&&!quietOpen.current)document.getElementById('full-reading')?.scrollIntoView({behavior:'smooth',block:'start'});quietOpen.current=false;},[report]);
 // A signed-in owner sees their primary (or only/newest) saved natal chart straight away.
 // ?new opens the empty calculator; anything the visitor starts meanwhile wins.
 const [profileChart,setProfileChart]=useState<{date:string;place:string}|null>(null);
 useEffect(()=>{
  if(new URLSearchParams(window.location.search).has('new'))return;
  let live=true;
  void loadMySigns().then(async mine=>{
   const own=mine?.chart;
   if(!live||!own||readingRequestId.current!==0)return;
   try{
    const r=await fetch('/api/v1/account/charts/'+encodeURIComponent(own.id),{credentials:'same-origin',cache:'no-store'});
    const data=await readApiJson<{chart:unknown;report:ReadingReport|null}>(r);
    if(!live||readingRequestId.current!==0)return;
    quietOpen.current=true;
    setProfileChart({date:own.date,place:own.place});
    await loadSaved(data.chart,data.report);
   }catch{/* the empty calculator stays available */}
  });
  return ()=>{live=false;};
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 const startNewChart=()=>{
  readingRequestId.current++;setProfileChart(null);setChart(null);setReport(null);setInterpretation('');setStatus('');setError(false);
  setForm(EMPTY_FORM);setManualMode(false);setCityReset(c=>c+1);
  if(variant){history.replaceState({...history.state,natalPilotResult:false},'',location.pathname+location.search);openForm();return;}
  setTimeout(()=>document.getElementById('birth-details')?.scrollIntoView({behavior:'smooth',block:'start'}),50);
 };
 const i=t[lang];const api=''; // Same-origin /api proxy protects remote demo visitors
 const edit=(key:keyof Form,value:string)=>{
  const manual=['latitude','longitude','timeZone'].includes(key);
  // An explicit coordinate edit is sufficient to enable manual birthplace
  // entry, even when the browser has not delivered the details toggle event.
  if(manual)setManualMode(true);
  setForm(old=>({...old,[key]:value,...(manual?{place:undefined}:{})}));
  if(manual)setCityReset(count=>count+1);
 };
 const chooseCity=(city:{name:string;region:string;country:string;latitude:number;longitude:number;timeZone:string})=>{
  setManualMode(false);
  // Preserve the user's birth date/time; only location fields change.
  setForm(old=>({...old,latitude:String(city.latitude),longitude:String(city.longitude),
   timeZone:city.timeZone,place:[city.name,city.region,city.country].filter(Boolean).join(', ')}));
  setStatus('');
 };
 async function calculate(e:React.FormEvent){e.preventDefault();
  if(calculating.current)return;
  if(twoSteps&&step===1){if(form.date&&form.time)nextStep();return;}
  if(!form.date||!form.time||(!form.place&&!manualMode)||!form.timeZone||!form.latitude||!form.longitude){
   setError(true);setStatus(lang==='uk'?'Заповни дату й час та обери місто зі списку або введи ручні координати.':'Enter date and time, then select a city or enter manual coordinates.');return;
  }
  calculating.current=true;
  reportPublicToolEvent('public_tool_started','jyotish');readingRequestId.current++;setAiBusy(false);setBusy(true);setError(false);setChart(null);setReport(null);setStatus(i.working);try{const response=await fetch(`${api}/api/v1/charts/calculate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,latitude:Number(form.latitude),longitude:Number(form.longitude)})});const data=await readApiJson<Chart>(response);if(!verified(data))throw Error(lang==='uk'?'API повернуло карту без чинного підтвердження цілісності (потрібен jyotish-integrity-v3). Перезапустіть Next.js і NestJS з однієї оновленої гілки, потім повторіть розрахунок.':'API returned a chart without the current jyotish-integrity-v3 proof. Restart Next.js and NestJS from the same updated branch, then retry.');assertN4RcView(data);setChart(data);setReport(null);setInterpretation('');setStatus(`${i.completed} UTC: ${data.utc}`);reportGrowthEvent('jyotish_chart_completed');reportPublicToolEvent('public_tool_completed','jyotish');
   // Run verified local Reader by default; calling AI always requires an explicit click.
   if(variant){
    setEditing(false);
    if(!history.state?.natalPilotResult||location.hash!=='#chart-result'){
     history.pushState({...history.state,natalPilotResult:true},'',location.pathname+location.search+'#chart-result');
    }
   }
   void interpret('local',data);}catch(e){reportPublicToolEvent('public_tool_failed','jyotish');setError(true);setStatus(e instanceof Error?e.message:String(e));}finally{calculating.current=false;setBusy(false)}}
 async function interpret(mode:'auto'|'local'='auto',freshChart:Chart|null=chart,uncertain=minutesUncertain){
  if(!freshChart)return;
  const requestId=++readingRequestId.current;
  // The default Reader runs automatically. When AI is explicitly requested,
  // hide that old local result so a failed/stale AI fetch cannot masquerade as
  // the result of the user's click.
  if(mode==='auto')setReport(null);
  setAiBusy(true);setInterpretation(mode==='auto'?
   (lang==='uk'?'Запитуємо Gemini, за потреби Groq або OpenRouter…':'Requesting Gemini, with Groq and OpenRouter fallbacks…'):
   (lang==='uk'?'Створюємо класичний звіт…':'Preparing the classic Reader report…'));
  try{
   const response=await fetch(api+'/api/v1/reports',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({...freshChart.input,lang,preferred:mode,minutesUncertain:uncertain,asOf:new Date().toISOString().slice(0,10),expectedChartDigest:freshChart.verification?.digest})
   });
   const data=await readApiJson<ReadingReport & {verifiedChart?:Chart}>(response);
   if(requestId!==readingRequestId.current)return;
   if(data.readerVersion!=='6.0.0')throw Error(lang==='uk'?'API повернуло застарілий Reader. Перезапустіть сервер.':'The API returned an outdated Reader. Restart the server.');
   if(data.readerV8?.version!=='reader-v8.0.0-n44'||data.readerV8.status!=='available'||data.readerV8.editorialVersion!=='n48-poetic-evidence-1.0.0'||data.readerV8.integrated?.version!=='n49-unified-evidence-v1'||data.readerV8.compactCards?.length!==15||data.readerV8.meaningful?.version!=='n492-evidence-prioritized-16-varga-v1'||data.readerV8.meaningful?.cards?.length!==16||data.readerV8.meaningful?.discoveries?.version!=='n493-ranked-patterns-1.0.0'||(data.readerV8.d60Preview?.status==='conditional_signs'&&data.readerV8.d60Preview?.allPlanets?.length!==9))throw Error(lang==='uk'?'API ще не підтримує Classical Reader 8. Оновіть локальний сервер API з цієї гілки.':'The API does not support Classical Reader 8 yet. Update the local API to this branch.');
   let authoritative:{chart:Chart;rebound:boolean};
   try{authoritative=resolveVerifiedReportChart(freshChart,data,verified);}
   catch{throw Error(lang==='uk'?'Дані звіту не збігаються з перевіреною картою. Повторіть розрахунок.':'Report facts differ from the verified natal chart. Recalculate the chart.');}
   if(authoritative.rebound){
    // Old saved chart or pre-release chart was legitimately superseded by
    // this exact server-verified calculation. Update BOTH chart and report.
    assertN4RcView(authoritative.chart);
    setChart(authoritative.chart);
    setStatus(lang==='uk'?'Карту оновлено за перевіреним розрахунком API.':'Chart refreshed from the verified API calculation.');
   }
   if(!Array.isArray(data.sections)||!data.sections.length)throw Error('Report chapters missing');
   if(mode==='auto'&&['reader_only','local_only'].includes(data.ai?.fallbackReason||''))throw Error(lang==='uk'?
    'Сервер помилково повернув локальний Reader на запит AI. Перевірте налаштування API та повторіть запит.':
    'The server unexpectedly returned local Reader for an AI request. Check API configuration and retry.');
   setReport(data);
   setInterpretation(mode==='auto'&&data.ai?.source==='llm'&&data.ai.readerFormat==='n6-reader-v1'&&Boolean(data.ai?.text)?
    (lang==='uk'?'AI-консультація готова · '+data.ai.provider+' ↓':'AI consultation ready · '+data.ai.provider+' ↓'):
    mode==='auto'?
     (lang==='uk'?'AI-моделі не надали перевіреного тексту; показано Reader. Причина: '+(data.ai?.fallbackReason||'невідома'):
      'AI models did not return a verified consultation; showing Reader. Reason: '+(data.ai?.fallbackReason||'unknown')):
     (lang==='uk'?'Класичний звіт Reader готовий ↓':'Classic Reader report ready ↓'));
  }catch(error){
   if(requestId===readingRequestId.current)setInterpretation((mode==='auto'?(lang==='uk'?'AI-запит завершився помилкою: ':'AI request failed: '):'')+
    (error instanceof Error?error.message:String(error)));
  }finally{if(requestId===readingRequestId.current)setAiBusy(false);}
 }

 const moon=chart?.d1.find(x=>x.name==='Moon');
 const now=Date.now();
 const activeDasha=chart?.dasha.find(d=>Date.parse(d.start)<=now&&Date.parse(d.end)>now);
 const activeAntar=activeDasha?.antardashas.find(a=>Date.parse(a.start)<=now&&Date.parse(a.end)>now);
 return <div className={'jy-workbench jy-portal-workbench '+landing.canvas}>
  <div className="main">
   <div className="content" id="calculator">
    <div className="jy-portal-toolbar"><span>GalaxiAstro <b>/</b> JYOTISH</span><AccountPortal birth={chart?.input||null} report={report} lang={lang} onOpenSaved={loadSaved}/></div>
    {profileChart&&chart&&<div className="jy-profile-open" role="status" style={{display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:12,margin:'0 0 16px',padding:'12px 16px',borderRadius:12,border:'1px solid rgba(231,189,114,.35)',background:'rgba(231,189,114,.08)',color:'#E4E8F1',fontSize:14}}>
     <span>{lang==='uk'?'Відкрито вашу натальну карту з профілю':'Your natal chart from your profile is open'}{profileChart.date?' · '+profileChart.date.split('-').reverse().join('.'):''}{profileChart.place?' · '+profileChart.place:''}</span>
     <button type="button" className="secondary-btn" style={{margin:0,width:'auto',padding:'9px 14px'}} onClick={startNewChart}>{lang==='uk'?'Розрахувати нову карту':'Calculate a new chart'}</button>
    </div>}
    {variant&&!showResult&&<NatalSample lang={lang} onStart={openForm}/>}
    {variant&&showResult&&chart&&<NatalFirstResult lang={lang} chart={chart} rising={signFull(chart.ascendant.sign,lang)} moon={moon?signFull(moon.sign,lang):undefined} onEdit={editPilotResult}/>}
    {!variant&&!chart&&<><section className={landing.hero} aria-labelledby="natal-page-title">
     <div className={landing.heroCopy}>
      <div className={landing.eyebrow}>{lang==='uk'?'ВЕДИЧНА НАТАЛЬНА КАРТА · БЕЗКОШТОВНО':'FREE VEDIC BIRTH CHART · JYOTISH'}</div>
      <h1 id="natal-page-title">{lang==='uk'?'Безкоштовний калькулятор натальної карти Джйотіш':'Free Vedic Birth Chart Calculator'}</h1>
      <p className={landing.lead}>{lang==='uk'?
       'Побудуй безкоштовну ведичну карту за датою, точним місцевим часом і містом народження.':
       'Calculate your free Kundli from your birth date, exact local time and city.'}</p>
      <div className={landing.heroActions}>
       <a className={landing.heroCta} href="#birth-details">{lang==='uk'?'Розрахувати натальну карту безкоштовно':'Calculate my free birth chart'} <ArrowUpRight size={18}/></a>
       <a className={landing.heroSecondary} href="#varga-explorer">{lang==='uk'?'Дослідити всі карти':'Explore all 16 charts'}</a>
      </div>
      <div className={landing.chips}>
       <span>{lang==='uk'?'Сильні сторони й виклики':'Strengths & challenges'}</span>
       <span>{lang==='uk'?'Стосунки та кар’єра':'Relationships & career'}</span>
       <span>{lang==='uk'?'16 карт · без реєстрації':'16 charts · no signup'}</span>
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
    </div></>}
    {!variant&&chart&&<header className={landing.resultHead} data-testid="natal-result-head">
     <div>
      <div className={landing.eyebrow}>{lang==='uk'?'ВЕДИЧНА НАТАЛЬНА КАРТА':'VEDIC BIRTH CHART'}</div>
      <h1 id="natal-page-title">{lang==='uk'?'Твоя натальна карта':'Your birth chart'}</h1>
      <p>{chart.input.date} · {chart.input.time} · {chart.input.place||(lang==='uk'?'ручні координати':'manual coordinates')}</p>
     </div>
     <a className={landing.heroSecondary} href="#natal-birth-date" onClick={()=>{
      if(birthDetails.current)birthDetails.current.open=true;
     }}>{lang==='uk'?'Змінити дані народження':'Edit birth details'}</a>
    </header>}
    {!variant&&chart&&<div className="jy-key-facts">
      <div><span className="jy-fact-icon">Lg</span><small>{lang==='uk'?'Лагна':'Lagna'}</small><strong>{chart?signFull(chart.ascendant.sign,lang)+' · '+degreeLabel(chart.ascendant.degreesInSign):'—'}</strong></div>
      <div><span className="jy-fact-icon">★</span><small>{lang==='uk'?'Накшатра лагни':'Lagna nakshatra'}</small><strong>{chart?nakshatraGuideLink(chart.ascendant.nakshatra,lang,nakshatraName(chart.ascendant.nakshatra,lang)):'—'}</strong></div>
      <div><span className="jy-fact-icon">☉</span><small>{lang==='uk'?'Сонце':'Sun'}</small><strong>{chart?signFull(chart.d1.find(g=>g.name==='Sun')?.sign||1,lang):'—'}</strong></div>
      <div><span className="jy-fact-icon">☽</span><small>{lang==='uk'?'Місяць':'Moon'}</small><strong>{moon?signFull(moon.sign,lang):'—'}</strong></div>
      <div><span className="jy-fact-icon">✦</span><small>{lang==='uk'?'Накшатра Місяця':'Moon nakshatra'}</small><strong>{moon?nakshatraGuideLink(moon.nakshatra,lang,nakshatraName(moon.nakshatra,lang)):'—'}</strong></div>
      <div><span className="jy-fact-icon">◴</span><small>{lang==='uk'?'Поточна даша':'Current dasha'}</small><strong>{activeDasha?(lang==='uk'?GRAHA_UK[activeDasha.lord]||activeDasha.lord:activeDasha.lord):'—'}</strong></div>
     </div>}

    <div hidden={Boolean(variant)&&showResult}><details ref={birthDetails} id="birth-details" className={"jy-input-panel panel "+landing.birthForm} open={!chart||Boolean(variant)}>
     <summary><span><BookOpen size={17}/><strong>{chart?i.details:(lang==='uk'?'Створи безкоштовну натальну карту':'Create your free birth chart')}</strong></span><small>{chart?(lang==='uk'?'Змінити вихідні дані':'Edit source data'):(lang==='uk'?'Заповніть для розрахунку':'Enter details to calculate')}</small></summary>
     <form onSubmit={calculate} className="jy-input-grid">
      {twoSteps&&<p className={landing.formStep} aria-live="polite">{lang==='uk'?
       (step===1?'Крок 1 із 2 · Дата й час':'Крок 2 із 2 · Місце народження'):
       (step===1?'Step 1 of 2 · Date and time':'Step 2 of 2 · Birthplace')}</p>}
      {(!twoSteps||step===1)&&<>
      <label>{i.date}<input id="natal-birth-date" type="date" value={form.date} onChange={e=>edit('date',e.target.value)} required/></label>
      <div className={landing.timeField}>
       <label>{i.time}<input type="time" value={form.time} onChange={e=>edit('time',e.target.value)} required/></label>
       <label className={landing.minuteOption}>
        <input type="checkbox" checked={minutesUncertain} onChange={e=>{const uncertain=e.target.checked;readingRequestId.current++;setAiBusy(false);setReport(null);setInterpretation('');setMinutesUncertain(uncertain);if(chart)void interpret('local',chart,uncertain);}}/>
        {lang==='uk'?'Не знаю точних хвилин':'I don’t know the exact minutes'}
       </label>
       {(!form.time||minutesUncertain)&&<p className={landing.timeHint} role="status">
        {lang==='uk'?'Без точних хвилин результат може бути неточним, особливо D60. Якщо хвилини невідомі, введи приблизний час (наприклад, 14:00) і познач це вище.':
         'Without exact minutes, some placements may be inaccurate, especially D60. If you only know the hour, enter an approximate time (for example 14:00) and mark it above.'}
       </p>}
      </div>
      </>}
      {twoSteps&&step===1&&<button type="submit" className="primary-btn" data-testid="natal-pilot-next" disabled={!form.date||!form.time}>
       {lang==='uk'?'Далі · Місце народження':'Next · Birthplace'}</button>}
      {(!twoSteps||step===2)&&<>
      {twoSteps&&<button type="button" className={landing.stepBack} data-testid="natal-pilot-back" onClick={openForm}>{lang==='uk'?'← До дати й часу':'← Back to date and time'}</button>}
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
      </>}
     </form>
     <p className={`status ${error?'error':''}`} role="status">{status}</p>
    </details></div>

    {!variant&&!chart&&<section className={landing.discovery} aria-labelledby="natal-value">
     <h2 id="natal-value">{lang==='uk'?'Навіщо досліджувати 16 карт життя?':'What can 16 life charts help you explore?'}</h2>
     <div className={landing.discoveryGrid}>
      <article><span>✦</span><h3>{lang==='uk'?'Де твоя сила, а де слабкі місця?':'Where are your strengths and blind spots?'}</h3><p>{lang==='uk'?'Порівняй карти витривалості та життєвих викликів D27 і D30: які риси традиція описує як опору, а які — як зони розвитку.':'Compare the traditional lenses of resilience and challenges (D27, D30): supportive traits and areas for growth.'}</p></article>
      <article><span>♡</span><h3>{lang==='uk'?'Які закономірності є у стосунках?':'What patterns shape your relationships?'}</h3><p>{lang==='uk'?'Досліди партнерство й цінності через D9, а родинні теми — через D12. Порівнюй кожну з основною D1.':'Explore partnerships and values with D9, family themes with D12, and compare each with the foundational D1 chart.'}</p></article>
      <article><span>✧</span><h3>{lang==='uk'?'Як розкривається потенціал у роботі?':'How might your potential unfold at work?'}</h3><p>{lang==='uk'?'Подивись на професійну роль у D10 й освіту в D24: кожна карта висвітлює іншу сторону розвитку.':'Explore vocation in D10 and education in D24 — two distinct traditional perspectives on development.'}</p></article>
     </div>
    </section>}
    <div hidden={Boolean(variant)&&!showResult}>
    <N4RcExplorer chart={chart} lang={lang} minutesUncertain={minutesUncertain}/>

    {chart&&<section className="jy-ai-launch" id="natal-reading-options" tabIndex={-1}>
     <button className="jy-ai-launch-btn" disabled={!chart||aiBusy||Boolean(runtimeMismatch)} onClick={()=>interpret('auto')}><span className="jy-ai-orbit"><Sparkles size={22}/></span><span><strong>{aiBusy?(lang==='uk'?'Готуємо персональне трактування…':'Preparing your consultation…'):(lang==='uk'?'Створити AI-трактування':'Generate AI consultation')}</strong><small>{lang==='uk'?'AI пояснює перевірені факти твоєї карти простою мовою.':'AI explains the verified facts of your chart in plain language.'}</small></span><ArrowUpRight size={20}/></button>
     <button className="jy-reader-launch-btn" data-testid="reader-auto-launch-btn"
       aria-pressed={report?.ai?.fallbackReason==='reader_only'}
       style={report?.ai?.fallbackReason==='reader_only'?{borderColor:'#dbb77c',boxShadow:'0 0 0 1px rgba(219,183,124,.27)'}:undefined}
       disabled={!chart||aiBusy||Boolean(runtimeMismatch)} onClick={()=>interpret('local')}>{lang==='uk'?'Читати без AI — класичне трактування':'Read without AI — classic reading'}</button>
     {runtimeMismatch&&<p role="alert" className="jy-version-warning">{runtimeMismatch}</p>}
     {interpretation&&<div className="jy-ai-status" aria-live="polite">{interpretation}</div>}
    </section>}

    <div id="interpretation" className="jy-reading-result-anchor">
     {report&&report.language===lang?<DetailedReport report={report} lang={lang} minutesUncertain={minutesUncertain}/>:null}
    </div>

    {chart&&<section className="panel jy-data-workspace" id="chart-data">
     <div className="jy-workspace-head"><div><div className="eyebrow">{lang==='uk'?'ДАНІ КАРТИ':'CHART DATA'}</div><h2>{lang==='uk'?'Планети й періоди життя':'Planets and life periods'}</h2></div></div>


     <div className="jy-subhead"><div><span>{lang==='uk'?'ПЛАНЕТИ':'PLANETS'}</span><h3>{lang==='uk'?'Зведена таблиця':'Summary table'}</h3></div><small>{lang==='uk'?'D1 · знаки · доми · накшатри':'D1 · signs · houses · nakshatras'}</small></div>
     <div className="table-scroll jy-planet-table"><table><thead><tr><th>{lang==='uk'?'Планета':'Planet'}</th><th>{lang==='uk'?'Знак':'Sign'}</th><th>{lang==='uk'?'Градус':'Degree'}</th><th>{lang==='uk'?'Дім':'House'}</th><th>{lang==='uk'?'Накшатра':'Nakshatra'}</th><th>{lang==='uk'?'Рух':'Motion'}</th></tr></thead><tbody>{chart?chart.d1.map(p=><tr key={p.name}><td><span className="jy-table-symbol">{GRAHA_SYMBOL[p.name]||'•'}</span><strong>{grahaFull(p.name,lang)}</strong></td><td><span className="jy-sign-cell">{SIGN_SYMBOL[p.sign-1]}</span>{signFull(p.sign,lang)}</td><td>{degreeLabel(p.degreesInSign)}</td><td><span className="jy-house-badge">{p.house}</span></td><td>{nakshatraName(p.nakshatra,lang)} <small>· {lang==='uk'?'пада':'pada'} {p.pada}</small></td><td>{p.retrograde?<span className="jy-retro">℞ {lang==='uk'?'ретро':'retro'}</span>:<span className="jy-direct">{lang==='uk'?'прямий':'direct'}</span>}</td></tr>):<tr><td colSpan={6} className="empty-table">{i.waiting}</td></tr>}</tbody></table></div>

     <div className="jy-section-rule" id="timeline"/>
     <div className="jy-subhead"><div><span>{lang==='uk'?'ЧАСОВІ ЦИКЛИ':'TIMING CYCLES'}</span><h3>{lang==='uk'?'Вімшоттарі-даша':'Vimshottari dasha'}</h3></div>{activeDasha&&<small>{lang==='uk'?'Активно зараз':'Active now'}: {grahaFull(activeDasha.lord,lang)}{activeAntar?' / '+grahaFull(activeAntar.lord,lang):''}</small>}</div>
     <div className="jy-dasha-strip">{chart?chart.dasha.map((d,ix)=>{const active=Date.parse(d.start)<=now&&Date.parse(d.end)>now;return <div className={'jy-dasha-cell '+(active?'current':'')} key={ix}><span>{GRAHA_SYMBOL[d.lord]||'•'}</span><strong>{grahaFull(d.lord,lang)}</strong><small>{d.start.slice(0,4)}–{d.end.slice(0,4)}</small>{active&&<b>{lang==='uk'?'ЗАРАЗ':'NOW'}</b>}</div>}):<div className="jy-dasha-empty">{i.waiting}</div>}</div>
     {chart&&<details className="jy-reference-details">
      <summary>{lang==='uk'?'Технічні дані та перевірка розрахунку':'Technical data and calculation verification'}</summary>
      <div className="jy-data-list">
       <div><span>{lang==='uk'?'Аянамша':'Ayanamsha'}</span><strong>{chart?chart.ayanamsa.toFixed(3)+'° · Lahiri':'—'}</strong></div>
       <div><span>UTC</span><strong>{chart?chart.utc.replace('T',' ').slice(0,19):'—'}</strong></div>
       <div><span>{lang==='uk'?'Часовий пояс':'Time zone'}</span><strong>{chart?.input.timeZone||'—'}</strong></div>
       <div data-testid="n503-birthplace-name"><span>{lang==='uk'?'Місце народження':'Birthplace'}</span><strong>{chart?(chart.input.place||(lang==='uk'?'Ручні координати':'Manual coordinates')):'—'}</strong></div>
       <div data-testid="n503-birthplace-coordinates"><span>{lang==='uk'?'Координати народження':'Birth coordinates'}</span><strong>{chart?
        Math.abs(chart.input.latitude).toFixed(5)+'° '+(chart.input.latitude<0?'S':'N')+' · '+
        Math.abs(chart.input.longitude).toFixed(5)+'° '+(chart.input.longitude<0?'W':'E'):'—'}</strong></div>
       <div><span>{lang==='uk'?'Ефемериди':'Ephemeris'}</span><strong>{chart?.ephemeris?.includes('pyswisseph')?'PySwissEph':chart?'Swiss Ephemeris':'—'}</strong></div>
       <div><span>{lang==='uk'?'Режим років Вімшоттарі':'Vimshottari year mode'}</span><strong>{chart.config?.dashaYearMode||'—'}</strong></div>
      </div>
      <p>{lang==='uk'?'Дати даш розраховано за вказаним режимом років; це не незалежний сертифікат дат JHora.':'Dasha dates use the year mode shown above; this is not an independent JHora date certificate.'}</p>
      {chart.verification?.status==='verified_internal'&&<>
       <p>{lang==='uk'?'Внутрішні перевірки D1, D9, D10, управителів і даш пройдено.':'Internal D1, D9, D10, house-lord and dasha consistency checks passed.'}</p>
       <p>{lang==='uk'?'Широта й довгота визначають асцендент (лагну), а від нього — доми та висхідні знаки дробових карт. Часовий пояс переводить час народження в UTC для положень планет і даш. Назва міста — лише підпис.':'Birth latitude/longitude determine the ascendant, which anchors whole-sign houses and divisional ascendants. The time zone converts birth time into UTC for planetary positions and dashas. The city name is only a label.'}</p>
       {jhoraReference&&<p>{lang==='uk'?'Незалежний корпус JHora 8.0:':'Independent JHora 8.0 corpus:'} {jhoraReference.cases} {lang==='uk'?'карт з однаковою методикою':'same-method charts'}. D1 {jhoraReference.d1SignMatches}/{jhoraReference.d1Total}, D9 {jhoraReference.d9SignMatches}/{jhoraReference.d9Total}, D10 {jhoraReference.d10SignMatches}/{jhoraReference.d10Total}. {lang==='uk'?'Збіг знаків підтверджено. Точність довгот до 1″ та календарні дати Vimshottari перевіряються окремо.':'Sign parity is certified. One-arcsecond longitude precision and Vimshottari calendar dates have separate pending checks.'}</p>}
       <p>{lang==='uk'?'Це незалежна звірка еталонних карт за узгодженим профілем, а не індивідуальна перевірка вашої карти в JHora.':'This is an independent same-profile reference check, not direct JHora verification of your individual chart.'}</p>
      </>}
     </details>}
    </section>}

    </div>
    <section className={landing.faq} aria-labelledby="natal-faq-title">
     <div className={landing.faqHeader}>
      <div><span className={landing.eyebrow}>{lang==='uk'?'ЗАПИТАННЯ ТА ВІДПОВІДІ':'GOOD TO KNOW'}</span>
      <h2 id="natal-faq-title">{lang==='uk'?'Натальна карта — це просто':'Birth charts, explained simply'}</h2></div>
      <a href={'/'+lang+'/panchanga'}>{lang==='uk'?'Подивитися Панчангу на сьогодні':'Explore today’s Panchanga'}</a>
     </div>
     <details><summary>{lang==='uk'?'Що таке натальна карта?':'What is a birth chart?'}</summary><p>{lang==='uk'?'Це астрологічна схема положень планет і домів для заданого моменту та місця народження. Galaxiora використовує сидеричний підхід Джйотіш. Трактування описують ведичну традицію, а не науково підтверджене передбачення майбутнього.':'A birth chart maps planetary positions and houses for a specified birth time and location. Galaxiora uses the sidereal Jyotish tradition. Interpretations reflect this tradition rather than scientifically established predictions.'}</p></details>
     <details><summary>{lang==='uk'?'Чим ведична карта відрізняється від західного гороскопа?':'How is a Vedic chart different from a Western horoscope?'}</summary><p>{lang==='uk'?'У Джйотіш застосовується сидеричний зодіак і аянамша Лахірі. Тому знак Сонця або Місяця може відрізнятися від популярного західного тропічного гороскопа.':'Jyotish uses a sidereal zodiac and Lahiri ayanamsa. Your Sun or Moon sign can therefore differ from a familiar Western tropical horoscope.'}</p></details>
     <details><summary>{lang==='uk'?'Чи потрібен точний час народження?':'Do I need an exact birth time?'}</summary><p>{lang==='uk'?'Дата, час і місце потрібні для розрахунку Лагни та домів. За приблизного часу ці показники можуть змінюватися. Особливо чутлива D60: навіть документально записані хвилини не гарантують стабільності її Лагни.':'Date, time and place are used to calculate the ascendant and houses. Approximate times can change these placements. D60 is especially sensitive: even documented minutes cannot guarantee a stable D60 ascendant.'}</p></details>
     <details><summary>{lang==='uk'?'Що означають D1, D9, D10 і D60?':'What do D1, D9, D10 and D60 mean?'}</summary><p>{lang==='uk'?'D1 (Раші) показує карту народження в цілому. D9 (Навамша) допомагає дослідити партнерство й дхарму, а D10 — професійну діяльність. Доступні всі 16 карт Шодашаварги. Для D60 навіть невелика похибка в часі народження може змінити результат.':'D1 (Rashi) gives an overview of your birth chart. You can explore D9 (Navamsa), D10 (career) and all 16 Shodashavarga charts. D9 focuses on partnership and dharma. D60 has special birth-time sensitivity limits.'}</p></details>
    </section>


   </div>
  </div>
 </div>;
}
